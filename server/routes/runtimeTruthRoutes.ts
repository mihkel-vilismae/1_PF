/*
 * Owns persisted runtime-truth HTTP handlers and pipeline lock maintenance routes.
 * The module preserves the existing conf/runtime-truth.json API envelopes.
 * It keeps file IO and normalization out of the central server route table.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { RouteHandler } from '../index.ts';
import { attachSafeAuthRuntimeTruth } from '../auth/authRuntimeTruth.ts';
import {
  clearStalePipelineLocks,
  detectStalePipelineLockIssues,
  resolvePipelineLockStaleThresholdSeconds,
} from '../runtimePipelineLocks.ts';

type JsonObject = Record<string, unknown>;
type RuntimeTruthSource = 'file' | 'request';

interface RuntimeTruthNormalizeOptions {
  source?: RuntimeTruthSource;
}

export interface RuntimeTruthRouteDependencies {
  runtimeTruthFilePath: string;
  runtimeTruthRelativePath: string;
  createHttpError: (statusCode: number, code: string, message: string, details?: unknown) => Error;
}

// Creates the runtime-truth and pipeline-lock route handlers with shared file dependencies.
export function createRuntimeTruthRoutes(dependencies: RuntimeTruthRouteDependencies): Record<string, RouteHandler> {
  const readRuntimeTruthFile = createRuntimeTruthReader(dependencies);
  const writeRuntimeTruthFile = createRuntimeTruthWriter(dependencies);

  // Returns persisted runtime-truth with the safe auth projection attached.
  const getRuntimeTruthHandler: RouteHandler = async () => {
    const truth = attachSafeAuthRuntimeTruth(await readRuntimeTruthFile());
    return {
      statusCode: 200,
      payload: {
        status: 'ok',
        sourcePath: dependencies.runtimeTruthRelativePath,
        truth,
        schemaVersion: 1,
        persistedAt: new Date().toISOString(),
      },
    };
  };

  // Persists request runtime-truth after normalization and safe auth projection.
  const updateRuntimeTruthHandler: RouteHandler = async ({ body }) => {
    const truth = attachSafeAuthRuntimeTruth(normalizeRuntimeTruthPayload(body?.truth, dependencies, { source: 'request' }));
    await writeRuntimeTruthFile(truth);
    return {
      statusCode: 200,
      payload: {
        status: 'ok',
        sourcePath: dependencies.runtimeTruthRelativePath,
        truth,
        schemaVersion: 1,
        persistedAt: new Date().toISOString(),
      },
    };
  };

  // Reports persisted pipeline lock issues without changing runtime-truth state.
  const runtimePipelineIssuesDetectHandler: RouteHandler = async ({ context }) => {
    const truth = attachSafeAuthRuntimeTruth(await readRuntimeTruthFile());
    const staleThresholdSeconds = resolvePipelineLockStaleThresholdSeconds(context.envValues);
    const issues = detectStalePipelineLockIssues(truth, { staleThresholdSeconds });
    return buildRuntimePipelineIssueResponse({
      truth,
      issues,
      staleThresholdSeconds,
      action: 'detect',
      cleared: false,
    });
  };

  // Clears stale persisted pipeline locks while preserving fresh active locks.
  const runtimePipelineStaleLocksClearHandler: RouteHandler = async ({ context }) => {
    const truth = attachSafeAuthRuntimeTruth(await readRuntimeTruthFile());
    const staleThresholdSeconds = resolvePipelineLockStaleThresholdSeconds(context.envValues);
    const result = clearStalePipelineLocks(truth, { staleThresholdSeconds });
    const nextTruth = attachSafeAuthRuntimeTruth(result.truth);
    if (result.cleared) {
      await writeRuntimeTruthFile(nextTruth);
    }
    return buildRuntimePipelineIssueResponse({
      truth: nextTruth,
      issues: result.issues,
      staleThresholdSeconds,
      action: 'clear',
      cleared: result.cleared,
    });
  };

  return {
    'GET /api/runtime-truth': getRuntimeTruthHandler,
    'POST /api/runtime-truth': updateRuntimeTruthHandler,
    'POST /api/runtime/pipeline/issues/detect': runtimePipelineIssuesDetectHandler,
    'POST /api/runtime/pipeline/stale-locks/clear': runtimePipelineStaleLocksClearHandler,
  };
}

// Builds a runtime-truth reader that preserves existing missing/read/JSON errors.
function createRuntimeTruthReader(dependencies: RuntimeTruthRouteDependencies): () => Promise<JsonObject> {
  return async () => {
    if (!(await fileExists(dependencies.runtimeTruthFilePath))) {
      throw dependencies.createHttpError(404, 'runtime_truth_missing', 'Runtime truth file does not exist yet.', {
        sourcePath: dependencies.runtimeTruthRelativePath,
      });
    }

    let raw;
    try {
      raw = await fs.readFile(dependencies.runtimeTruthFilePath, 'utf8');
    } catch (error) {
      throw dependencies.createHttpError(500, 'runtime_truth_read_failed', 'Failed to read runtime truth file.', {
        sourcePath: dependencies.runtimeTruthRelativePath,
        message: getErrorMessage(error),
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw dependencies.createHttpError(500, 'runtime_truth_invalid_json', 'Runtime truth file contains invalid JSON.', {
        sourcePath: dependencies.runtimeTruthRelativePath,
        message: getErrorMessage(error),
      });
    }

    return normalizeRuntimeTruthPayload(parsed, dependencies, { source: 'file' });
  };
}

// Builds a runtime-truth writer that preserves the existing formatted JSON output.
function createRuntimeTruthWriter(dependencies: RuntimeTruthRouteDependencies): (truth: JsonObject) => Promise<void> {
  return async (truth) => {
    try {
      await fs.mkdir(path.dirname(dependencies.runtimeTruthFilePath), { recursive: true });
      const serialized = `${JSON.stringify(truth, null, 2)}\n`;
      await fs.writeFile(dependencies.runtimeTruthFilePath, serialized, 'utf8');
    } catch (error) {
      throw dependencies.createHttpError(500, 'runtime_truth_write_failed', 'Failed to write runtime truth file.', {
        sourcePath: dependencies.runtimeTruthRelativePath,
        message: getErrorMessage(error),
      });
    }
  };
}

// Normalizes file/request runtime-truth payloads and preserves existing error codes.
export function normalizeRuntimeTruthPayload(
  value: unknown,
  dependencies: RuntimeTruthRouteDependencies,
  options: RuntimeTruthNormalizeOptions = {},
): JsonObject {
  const source = options.source === 'file' ? 'file' : 'request';
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    if (source === 'file') {
      throw dependencies.createHttpError(500, 'runtime_truth_invalid_payload', 'Runtime truth file must contain a JSON object.', {
        sourcePath: dependencies.runtimeTruthRelativePath,
      });
    }
    throw dependencies.createHttpError(400, 'invalid_runtime_truth_payload', 'Runtime truth payload must be a JSON object.', {
      expected: { truth: { sourceOfTruth: dependencies.runtimeTruthRelativePath } },
    });
  }

  const truth = structuredClone(value) as JsonObject;
  truth.sourceOfTruth = dependencies.runtimeTruthRelativePath;
  return truth;
}

// Builds the shared response envelope for pipeline issue maintenance endpoints.
function buildRuntimePipelineIssueResponse({
  truth,
  issues,
  staleThresholdSeconds,
  action,
  cleared,
}: {
  truth: JsonObject;
  issues: ReturnType<typeof detectStalePipelineLockIssues>;
  staleThresholdSeconds: number;
  action: 'detect' | 'clear';
  cleared: boolean;
}) {
  const issueCount = issues.length;
  const status = issueCount > 0 && action === 'detect' ? 'warning' : 'ok';
  const messages = action === 'clear'
    ? [
        cleared
          ? `Cleared ${issueCount} stale pipeline lock issue(s).`
          : 'No stale pipeline locks were cleared.',
      ]
    : [
        issueCount
          ? `Detected ${issueCount} stale pipeline lock issue(s).`
          : 'No stale pipeline lock issues detected.',
      ];

  return {
    statusCode: 200,
    payload: {
      status,
      messages,
      pipeline: {
        issueCount,
        issues,
        staleLockDetected: issueCount > 0,
        staleThresholdSeconds,
        cleared,
      },
      truth,
      schemaVersion: 1,
      executedAt: new Date().toISOString(),
    },
  };
}

// Checks whether a file exists without leaking filesystem errors into route responses.
async function fileExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

// Converts unknown thrown values into stable diagnostic strings.
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
