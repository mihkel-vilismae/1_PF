/*
 * Implements the playback_worker entrypoint for backend-owned B4 selection.
 * The worker selects the current playable item and records lock/status evidence.
 * It does not render media, run B3 pipeline stages, or control screen hardware.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { DatabaseService } from '../database/databaseService.ts';
import { selectCurrentPlayableItem, type PlaybackSelectionContext } from '../playback/playbackSelectionService.ts';

type WorkerStatus = 'succeeded' | 'skipped' | 'failed';
type JsonObject = Record<string, unknown>;

export interface PlaybackWorkerOptions {
  context: PlaybackSelectionContext;
  databaseService: Pick<DatabaseService, 'runStage6SelectCurrent'>;
  repoRoot: string;
  now?: () => Date;
  workerId?: string;
}

export interface PlaybackWorkerResult {
  worker: 'playback_worker';
  status: WorkerStatus;
  startedAt: string;
  finishedAt: string;
  lock: {
    path: string;
    acquiredAt: string;
    released: boolean;
  };
  statusPath: string;
  selection: unknown | null;
  selectedItemSummary: unknown | null;
  skippedReason: string | null;
  failureReason: string | null;
  rendering: {
    claimed: false;
    note: string;
  };
  pipelineStagesRun: [];
  messages: string[];
  schemaVersion: 1;
}

interface WorkerLockFile {
  worker: 'playback_worker';
  acquiredAt: string;
  pid: number;
  workerId: string;
}

// Runs B4 playback selection once with a single-instance lock and durable status file.
export async function runPlaybackWorker({
  context,
  databaseService,
  repoRoot,
  now = () => new Date(),
  workerId = `playback-worker-${process.pid}`,
}: PlaybackWorkerOptions): Promise<PlaybackWorkerResult> {
  const runtimeDirectory = path.join(repoRoot, 'runtime_data', 'scheduler');
  const lockPath = path.join(runtimeDirectory, 'playback-worker-lock.json');
  const statusPath = path.join(runtimeDirectory, 'playback-worker-status.json');
  const startedAt = now().toISOString();
  const lockPayload: WorkerLockFile = {
    worker: 'playback_worker',
    acquiredAt: startedAt,
    pid: process.pid,
    workerId,
  };

  await fs.mkdir(runtimeDirectory, { recursive: true });
  await acquireWorkerLock(lockPath, lockPayload);

  let result: PlaybackWorkerResult;
  try {
    const selection = await selectCurrentPlayableItem({ context, databaseService });
    const status: WorkerStatus = selection.outcome === 'selected' ? selection.status === 'warning' ? 'succeeded' : 'succeeded' : 'skipped';
    result = {
      worker: 'playback_worker',
      status,
      startedAt,
      finishedAt: now().toISOString(),
      lock: {
        path: lockPath,
        acquiredAt: startedAt,
        released: false,
      },
      statusPath,
      selection,
      selectedItemSummary: selection.selectedItemSummary,
      skippedReason: selection.skippedReason,
      failureReason: null,
      rendering: {
        claimed: false,
        note: 'playback_worker selects the current playable item only; rendering/fullscreen/screen control is outside this worker.',
      },
      pipelineStagesRun: [],
      messages: selection.messages,
      schemaVersion: 1,
    };
  } catch (error) {
    result = {
      worker: 'playback_worker',
      status: 'failed',
      startedAt,
      finishedAt: now().toISOString(),
      lock: {
        path: lockPath,
        acquiredAt: startedAt,
        released: false,
      },
      statusPath,
      selection: null,
      selectedItemSummary: null,
      skippedReason: null,
      failureReason: getErrorMessage(error),
      rendering: {
        claimed: false,
        note: 'playback_worker failed before selecting a current item and still did not perform rendering/fullscreen/screen control.',
      },
      pipelineStagesRun: [],
      messages: [`playback_worker failed: ${getErrorMessage(error)}`],
      schemaVersion: 1,
    };
  } finally {
    await fs.rm(lockPath, { force: true }).catch(() => undefined);
  }

  result.lock.released = true;
  await writeWorkerStatus(statusPath, result);
  return result;
}

// Acquires the worker lock and rejects concurrent playback_worker executions.
async function acquireWorkerLock(lockPath: string, payload: WorkerLockFile): Promise<void> {
  try {
    await fs.writeFile(lockPath, `${JSON.stringify(payload, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
  } catch (error) {
    if (isNodeErrorWithCode(error, 'EEXIST')) {
      const existing = await readJsonObject(lockPath);
      throw new Error(`playback_worker is already running${formatExistingLock(existing)}.`);
    }
    throw error;
  }
}

// Writes the latest worker result for scheduler/dashboard inspection.
async function writeWorkerStatus(statusPath: string, result: PlaybackWorkerResult): Promise<void> {
  await fs.writeFile(statusPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
}

// Reads a best-effort JSON lock payload for clearer conflict messages.
async function readJsonObject(filePath: string): Promise<JsonObject | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed as JsonObject : null;
  } catch {
    return null;
  }
}

// Formats existing lock evidence without exposing unrelated file contents.
function formatExistingLock(existing: JsonObject | null): string {
  const acquiredAt = typeof existing?.acquiredAt === 'string' ? existing.acquiredAt : null;
  const pid = typeof existing?.pid === 'number' ? existing.pid : null;
  const details = [pid ? `pid ${pid}` : null, acquiredAt ? `acquired at ${acquiredAt}` : null].filter(Boolean).join(', ');
  return details ? ` (${details})` : '';
}

// Checks Node filesystem errors by code.
function isNodeErrorWithCode(error: unknown, code: string): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === code;
}

// Produces a stable string from thrown values.
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
