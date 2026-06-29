import { promises as fs } from 'node:fs';
import path from 'node:path';

export type V2WorkerTruthMode = 'test' | 'real' | 'demo';
export type V2WorkerTruthStatus = 'started' | 'finished' | 'error' | 'interrupted' | 'state';
export type V2WorkerId = 'regular-worker' | 'playback-worker' | 'screen-worker';

export interface V2WorkerTruthEvent {
  schemaVersion: 1;
  mode: V2WorkerTruthMode;
  worker: V2WorkerId;
  stage: string;
  status: V2WorkerTruthStatus;
  timestamp: string;
  processId?: string | number | null;
  logId?: string | null;
  message?: string | null;
  counts?: Record<string, number>;
  error?: string | null;
  meta?: Record<string, unknown>;
  sourceFile?: string;
  sourceLine?: number;
  raw?: unknown;
}

export interface V2WorkerTruthFileSummary {
  worker: V2WorkerId;
  path: string;
  exists: boolean;
  parsedCount: number;
  malformedCount: number;
}

export interface V2WorkerTruthReadResult {
  schemaVersion: 1;
  mode: V2WorkerTruthMode;
  status: 'ok' | 'warning';
  events: V2WorkerTruthEvent[];
  files: V2WorkerTruthFileSummary[];
  malformed: Array<{ path: string; line: number; error: string; raw: string }>;
  readAt: string;
}

interface V2WorkerTruthServiceOptions {
  repoRoot: string;
  envValues?: Record<string, string | undefined>;
}

const workerFiles: Record<V2WorkerId, string> = {
  'regular-worker': 'regular-worker.truth.jsonl',
  'playback-worker': 'playback-worker.truth.jsonl',
  'screen-worker': 'screen-worker.truth.jsonl',
};

export function normalizeV2WorkerTruthMode(value: unknown): V2WorkerTruthMode {
  if (value === 'real') return 'real';
  if (value === 'demo') return 'demo';
  return 'test';
}

export function normalizeV2WorkerId(value: unknown): V2WorkerId {
  if (value === 'playback-worker' || value === 'screen-worker' || value === 'regular-worker') {
    return value;
  }
  return 'regular-worker';
}

export function createV2WorkerTruthService(options: V2WorkerTruthServiceOptions) {
  function resolveModeDirectory(mode: V2WorkerTruthMode): string {
    const envKey = mode === 'real' ? 'V2_WORKER_TRUTH_DIR' : mode === 'demo' ? 'DEMO_V2_WORKER_TRUTH_DIR' : 'TEST_V2_WORKER_TRUTH_DIR';
    const configured = options.envValues?.[envKey]?.trim();
    if (configured) {
      return path.isAbsolute(configured) ? configured : path.resolve(options.repoRoot, configured);
    }
    return path.join(options.repoRoot, 'runtime_data', 'v2_worker_truth', mode);
  }

  function resolveWorkerFilePath(mode: V2WorkerTruthMode, worker: V2WorkerId): string {
    return path.join(resolveModeDirectory(mode), workerFiles[worker]);
  }

  async function readCombined(mode: V2WorkerTruthMode): Promise<V2WorkerTruthReadResult> {
    const files: V2WorkerTruthFileSummary[] = [];
    const events: V2WorkerTruthEvent[] = [];
    const malformed: V2WorkerTruthReadResult['malformed'] = [];

    for (const worker of Object.keys(workerFiles) as V2WorkerId[]) {
      const filePath = resolveWorkerFilePath(mode, worker);
      const fileSummary: V2WorkerTruthFileSummary = {
        worker,
        path: filePath,
        exists: false,
        parsedCount: 0,
        malformedCount: 0,
      };
      try {
        const raw = await fs.readFile(filePath, 'utf8');
        fileSummary.exists = true;
        const lines = raw.split(/\r?\n/).filter((line) => line.trim());
        lines.forEach((line, index) => {
          try {
            const parsed = JSON.parse(line) as Record<string, unknown>;
            const normalized = normalizeEvent(mode, worker, parsed, filePath, index + 1);
            events.push(normalized);
            fileSummary.parsedCount += 1;
          } catch (error) {
            fileSummary.malformedCount += 1;
            malformed.push({
              path: filePath,
              line: index + 1,
              error: error instanceof Error ? error.message : String(error),
              raw: line,
            });
          }
        });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          fileSummary.malformedCount += 1;
          malformed.push({
            path: filePath,
            line: 0,
            error: error instanceof Error ? error.message : String(error),
            raw: '',
          });
        }
      }
      files.push(fileSummary);
    }

    events.sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
    return {
      schemaVersion: 1,
      mode,
      status: malformed.length ? 'warning' : 'ok',
      events,
      files,
      malformed,
      readAt: new Date().toISOString(),
    };
  }

  async function appendEvent(mode: V2WorkerTruthMode, event: Partial<V2WorkerTruthEvent>): Promise<V2WorkerTruthEvent> {
    const worker = normalizeV2WorkerId(event.worker);
    const normalized = normalizeEvent(mode, worker, event, resolveWorkerFilePath(mode, worker), null);
    const filePath = resolveWorkerFilePath(mode, worker);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.appendFile(filePath, `${JSON.stringify(stripReadMetadata(normalized))}\n`, 'utf8');
    return normalized;
  }

  return {
    readCombined,
    appendEvent,
    resolveModeDirectory,
    resolveWorkerFilePath,
  };
}

function normalizeEvent(
  mode: V2WorkerTruthMode,
  worker: V2WorkerId,
  value: Record<string, unknown>,
  sourceFile: string,
  sourceLine: number | null,
): V2WorkerTruthEvent {
  const status = normalizeStatus(value.status);
  const timestamp = typeof value.timestamp === 'string' && value.timestamp.trim()
    ? value.timestamp
    : new Date().toISOString();
  const stage = typeof value.stage === 'string' && value.stage.trim()
    ? value.stage.trim()
    : 'unknown';
  const counts = normalizeCounts(value.counts);
  return {
    schemaVersion: 1,
    mode,
    worker: normalizeV2WorkerId(value.worker ?? worker),
    stage,
    status,
    timestamp,
    processId: normalizeNullableStringOrNumber(value.processId),
    logId: normalizeNullableString(value.logId),
    message: normalizeNullableString(value.message),
    counts,
    error: normalizeNullableString(value.error),
    meta: normalizeMeta(value.meta),
    sourceFile,
    sourceLine: sourceLine ?? undefined,
    raw: value,
  };
}

function normalizeMeta(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  return { ...(value as Record<string, unknown>) };
}

function normalizeStatus(value: unknown): V2WorkerTruthStatus {
  return value === 'finished' || value === 'error' || value === 'interrupted' || value === 'state'
    ? value
    : 'started';
}

function normalizeCounts(value: unknown): Record<string, number> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  const result: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value)) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      result[key] = parsed;
    }
  }
  return Object.keys(result).length ? result : undefined;
}

function normalizeNullableString(value: unknown): string | null | undefined {
  if (value === null) return null;
  if (typeof value === 'string') return value;
  return undefined;
}

function normalizeNullableStringOrNumber(value: unknown): string | number | null | undefined {
  if (value === null) return null;
  if (typeof value === 'string' || typeof value === 'number') return value;
  return undefined;
}

function stripReadMetadata(event: V2WorkerTruthEvent): Omit<V2WorkerTruthEvent, 'sourceFile' | 'sourceLine' | 'raw'> {
  const { sourceFile: _sourceFile, sourceLine: _sourceLine, raw: _raw, ...persisted } = event;
  return persisted;
}
