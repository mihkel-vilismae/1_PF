/*
 * Implements the playback_worker entrypoint for backend-owned B4 selection.
 * The worker selects the current playable item and records lock/status evidence.
 * It does not render media, run B3 pipeline stages, or control screen hardware.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { DatabaseService } from '../database/databaseService.ts';
import { selectCurrentPlayableItem, type PlaybackSelectionContext } from '../playback/playbackSelectionService.ts';
import { createV2WorkerTruthService, type V2WorkerTruthMode } from '../v2WorkerTruthService.ts';
import {
  NativePlaybackError,
  shouldAutoStartNativePlaybackFromWorker,
  startNativePlaybackForSelectedAsset,
} from '../nativePlayback/nativePlaybackController.ts';

type WorkerStatus = 'succeeded' | 'skipped' | 'failed';
type JsonObject = Record<string, unknown>;

export interface PlaybackWorkerOptions {
  context: PlaybackSelectionContext;
  databaseService: Pick<DatabaseService, 'runStage6SelectCurrent' | 'buildDatabaseStatus' | 'runPythonJson' | 'getRuntimeState' | 'setRuntimeState'>;
  repoRoot: string;
  now?: () => Date;
  workerId?: string;
  staleLockSeconds?: number;
}

export interface PlaybackWorkerResult {
  worker: 'playback_worker';
  status: WorkerStatus;
  startedAt: string;
  finishedAt: string;
  invocation_observed: boolean;
  last_invocation_at: string;
  same_worker_singleton: {
    first_acquired: boolean;
    duplicate_skipped: boolean;
    source: string;
  };
  cross_worker_independence: boolean;
  stale_lock: {
    reclaimed: boolean;
    source: string;
    current_lock_present: boolean;
    current_lock_owner: string | null;
  };
  lock: {
    path: string;
    acquiredAt: string | null;
    released: boolean;
  };
  statusPath: string;
  selection: unknown | null;
  selectedItemSummary: unknown | null;
  skippedReason: string | null;
  failureReason: string | null;
  rendering: {
    claimed: boolean;
    note: string;
  };
  nativePlayback: unknown | null;
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

interface LockOutcome {
  acquired: boolean;
  duplicateSkipped: boolean;
  staleLockReclaimed: boolean;
  acquiredAt: string | null;
  currentLockPresent: boolean;
  currentLockOwner: string | null;
}

// Starts native playback only when the native worker auto-start gate is explicitly enabled.
async function maybeStartNativePlaybackFromWorker({
  context,
  databaseService,
  repoRoot,
  selectedItemSummary,
}: PlaybackWorkerOptions & { selectedItemSummary: unknown }): Promise<{ claimed: boolean; note: string; nativePlayback: unknown | null; messages: string[] }> {
  const nativeContext = { ...context, platform: process.platform, repoRoot };
  if (!shouldAutoStartNativePlaybackFromWorker(nativeContext)) {
    return {
      claimed: false,
      note: 'playback_worker selected the current playable item only; native fullscreen launch is disabled by config.',
      nativePlayback: null,
      messages: [],
    };
  }

  try {
    const nativePlayback = await startNativePlaybackForSelectedAsset({ context: nativeContext, databaseService, repoRoot, selectedItemSummary });
    return {
      claimed: true,
      note: 'playback_worker selected the current playable item and launched native fullscreen playback because native auto-start is enabled.',
      nativePlayback,
      messages: ['Native playback auto-start completed after playback selection.'],
    };
  } catch (error) {
    const message = error instanceof NativePlaybackError ? error.message : getErrorMessage(error);
    return {
      claimed: false,
      note: `playback_worker selected the current playable item, but native fullscreen launch failed: ${message}`,
      nativePlayback: error instanceof NativePlaybackError ? { code: error.code, message: error.message, details: error.details } : { message },
      messages: [`Native playback auto-start failed: ${message}`],
    };
  }
}

// Runs B4 playback selection once with a single-instance lock and durable status file.
export async function runPlaybackWorker({
  context,
  databaseService,
  repoRoot,
  now = () => new Date(),
  workerId = `playback-worker-${process.pid}`,
  staleLockSeconds = resolveStaleLockSeconds(process.env.PF_RASPBERRY_WORKER_STALE_LOCK_SECONDS),
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
  await appendPlaybackTruth(repoRoot, context, {
    stage: 'playback_worker_started',
    status: 'started',
    timestamp: startedAt,
    processId: process.pid,
    logId: workerId,
    message: 'Playback worker started.',
  });
  const lockOutcome = await acquireOrClassifyWorkerLock({ lockPath, payload: lockPayload, now, staleLockSeconds });

  if (lockOutcome.duplicateSkipped) {
    const result = buildResult({
      status: 'skipped',
      startedAt,
      finishedAt: now().toISOString(),
      lockPath,
      statusPath,
      acquiredAt: null,
      released: false,
      firstAcquired: false,
      duplicateSkipped: true,
      staleLockReclaimed: false,
      currentLockPresent: true,
      currentLockOwner: lockOutcome.currentLockOwner,
      selection: null,
      selectedItemSummary: null,
      skippedReason: 'same_worker_instance_already_running',
      failureReason: null,
      rendering: { claimed: false, note: 'playback_worker duplicate invocation skipped before playback selection because a same-worker lock is active.' },
      nativePlayback: null,
      messages: ['playback_worker duplicate invocation skipped because a same-worker lock is active.'],
    });
    await writeWorkerStatus(statusPath, result);
    await appendPlaybackTruth(repoRoot, context, {
      stage: 'playback_worker_skipped',
      status: 'interrupted',
      timestamp: result.finishedAt,
      processId: process.pid,
      logId: workerId,
      message: 'Playback worker skipped because a same-worker lock is active.',
      error: result.skippedReason,
    });
    return result;
  }

  let result: PlaybackWorkerResult;
  try {
    const selection = await selectCurrentPlayableItem({ context, databaseService });
    const status: WorkerStatus = selection.outcome === 'selected' ? selection.status === 'warning' ? 'succeeded' : 'succeeded' : 'skipped';
    const nativeResult = selection.outcome === 'selected'
      ? await maybeStartNativePlaybackFromWorker({ context, databaseService, repoRoot, now, workerId, selectedItemSummary: selection.selectedItemSummary })
      : {
        claimed: false,
        note: 'playback_worker did not launch native fullscreen playback because no current playable item was selected.',
        nativePlayback: null,
        messages: [],
      };
    result = buildResult({
      status,
      startedAt,
      finishedAt: now().toISOString(),
      lockPath,
      statusPath,
      acquiredAt: lockOutcome.acquiredAt,
      released: false,
      firstAcquired: true,
      duplicateSkipped: false,
      staleLockReclaimed: lockOutcome.staleLockReclaimed,
      currentLockPresent: false,
      currentLockOwner: null,
      selection,
      selectedItemSummary: selection.selectedItemSummary,
      skippedReason: selection.skippedReason,
      failureReason: null,
      rendering: { claimed: nativeResult.claimed, note: nativeResult.note },
      nativePlayback: nativeResult.nativePlayback,
      messages: [...selection.messages, ...nativeResult.messages],
    });
    if (selection.outcome === 'selected') {
      await appendPlaybackTruth(repoRoot, context, {
        stage: 'media_started',
        status: 'started',
        timestamp: startedAt,
        processId: process.pid,
        logId: workerId,
        message: 'Playback worker selected a playable media item.',
        meta: summarizeSelectedPlaybackItem(selection.selectedItemSummary),
      });
      await appendPlaybackTruth(repoRoot, context, {
        stage: 'media_finished',
        status: 'finished',
        timestamp: result.finishedAt,
        processId: process.pid,
        logId: workerId,
        message: nativeResult.claimed ? 'Native playback launch was claimed for the selected item.' : 'Playback selection finished; native display was not claimed by worker config.',
        meta: summarizeSelectedPlaybackItem(selection.selectedItemSummary),
      });
      await appendPlaybackTruth(repoRoot, context, {
        stage: 'queue_advanced',
        status: 'finished',
        timestamp: result.finishedAt,
        processId: process.pid,
        logId: workerId,
        message: 'Playback worker completed one queue selection cycle.',
        counts: { selected: 1 },
      });
    } else {
      await appendPlaybackTruth(repoRoot, context, {
        stage: 'no_playable_media',
        status: 'finished',
        timestamp: result.finishedAt,
        processId: process.pid,
        logId: workerId,
        message: selection.skippedReason ?? 'No playable media item was selected.',
        counts: { selected: 0 },
      });
    }
  } catch (error) {
    result = buildResult({
      status: 'failed',
      startedAt,
      finishedAt: now().toISOString(),
      lockPath,
      statusPath,
      acquiredAt: lockOutcome.acquiredAt,
      released: false,
      firstAcquired: true,
      duplicateSkipped: false,
      staleLockReclaimed: lockOutcome.staleLockReclaimed,
      currentLockPresent: false,
      currentLockOwner: null,
      selection: null,
      selectedItemSummary: null,
      skippedReason: null,
      failureReason: getErrorMessage(error),
      rendering: { claimed: false, note: 'playback_worker failed before selecting a current item and did not perform native fullscreen/screen control.' },
      nativePlayback: null,
      messages: [`playback_worker failed: ${getErrorMessage(error)}`],
    });
    await appendPlaybackTruth(repoRoot, context, {
      stage: 'playback_error',
      status: 'error',
      timestamp: result.finishedAt,
      processId: process.pid,
      logId: workerId,
      message: 'Playback worker failed.',
      error: getErrorMessage(error),
    });
  } finally {
    if (lockOutcome.acquired) await fs.rm(lockPath, { force: true }).catch(() => undefined);
  }

  result.lock.released = true;
  await writeWorkerStatus(statusPath, result);
  await appendPlaybackTruth(repoRoot, context, {
    stage: 'playback_worker_finished',
    status: result.status === 'failed' ? 'error' : 'finished',
    timestamp: result.finishedAt,
    processId: process.pid,
    logId: workerId,
    message: `Playback worker finished with status ${result.status}.`,
    error: result.failureReason,
  });
  return result;
}

async function appendPlaybackTruth(repoRoot: string, context: PlaybackSelectionContext, event: Record<string, unknown>): Promise<void> {
  try {
    const mode = resolvePlaybackTruthMode(context.envValues);
    const service = createV2WorkerTruthService({ repoRoot, envValues: context.envValues });
    await service.appendEvent(mode, { worker: 'playback-worker', ...event });
  } catch {
    // Truth logging must never break playback selection.
  }
}

function resolvePlaybackTruthMode(envValues: Record<string, string | undefined>): V2WorkerTruthMode {
  return envValues.PF_RUNTIME_MODE === 'test' || envValues.RUNTIME_MODE === 'test' ? 'test' : 'real';
}

function summarizeSelectedPlaybackItem(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  const item = value as Record<string, unknown>;
  return {
    filename: item.filename ?? item.name ?? item.path ?? item.id ?? 'selected media',
    mediaKind: item.mediaKind ?? item.kind ?? item.type ?? 'unknown',
    url: item.displayUrl ?? item.url ?? item.path ?? '',
    id: item.id ?? null,
  };
}

function buildResult({
  status,
  startedAt,
  finishedAt,
  lockPath,
  statusPath,
  acquiredAt,
  released,
  firstAcquired,
  duplicateSkipped,
  staleLockReclaimed,
  currentLockPresent,
  currentLockOwner,
  selection,
  selectedItemSummary,
  skippedReason,
  failureReason,
  rendering,
  nativePlayback,
  messages,
}: {
  status: WorkerStatus;
  startedAt: string;
  finishedAt: string;
  lockPath: string;
  statusPath: string;
  acquiredAt: string | null;
  released: boolean;
  firstAcquired: boolean;
  duplicateSkipped: boolean;
  staleLockReclaimed: boolean;
  currentLockPresent: boolean;
  currentLockOwner: string | null;
  selection: unknown | null;
  selectedItemSummary: unknown | null;
  skippedReason: string | null;
  failureReason: string | null;
  rendering: PlaybackWorkerResult['rendering'];
  nativePlayback: unknown | null;
  messages: string[];
}): PlaybackWorkerResult {
  return {
    worker: 'playback_worker',
    status,
    startedAt,
    finishedAt,
    invocation_observed: true,
    last_invocation_at: finishedAt,
    same_worker_singleton: { first_acquired: firstAcquired, duplicate_skipped: duplicateSkipped, source: 'playback-worker-runtime-lock' },
    cross_worker_independence: true,
    stale_lock: { reclaimed: staleLockReclaimed, source: 'playback-worker-runtime-lock', current_lock_present: currentLockPresent, current_lock_owner: currentLockOwner },
    lock: { path: lockPath, acquiredAt, released },
    statusPath,
    selection,
    selectedItemSummary,
    skippedReason,
    failureReason,
    rendering,
    nativePlayback,
    pipelineStagesRun: [],
    messages,
    schemaVersion: 1,
  };
}

async function acquireOrClassifyWorkerLock({ lockPath, payload, now, staleLockSeconds }: { lockPath: string; payload: WorkerLockFile; now: () => Date; staleLockSeconds: number; }): Promise<LockOutcome> {
  try {
    await fs.writeFile(lockPath, `${JSON.stringify(payload, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
    return { acquired: true, duplicateSkipped: false, staleLockReclaimed: false, acquiredAt: payload.acquiredAt, currentLockPresent: false, currentLockOwner: null };
  } catch (error) {
    if (!isNodeErrorWithCode(error, 'EEXIST')) throw error;
    const existing = await readJsonObject(lockPath);
    const currentLockOwner = formatLockOwner(existing);
    if (isStaleLock(existing, now, staleLockSeconds)) {
      await fs.rm(lockPath, { force: true });
      await fs.writeFile(lockPath, `${JSON.stringify(payload, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
      return { acquired: true, duplicateSkipped: false, staleLockReclaimed: true, acquiredAt: payload.acquiredAt, currentLockPresent: false, currentLockOwner };
    }
    return { acquired: false, duplicateSkipped: true, staleLockReclaimed: false, acquiredAt: null, currentLockPresent: true, currentLockOwner };
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

function isStaleLock(existing: JsonObject | null, now: () => Date, staleLockSeconds: number): boolean {
  const acquiredAt = typeof existing?.acquiredAt === 'string' ? existing.acquiredAt : null;
  if (!acquiredAt) return false;
  const acquiredMs = Date.parse(acquiredAt);
  if (!Number.isFinite(acquiredMs)) return false;
  return Math.floor((now().getTime() - acquiredMs) / 1000) > staleLockSeconds;
}

// Formats existing lock evidence without exposing unrelated file contents.
function formatLockOwner(existing: JsonObject | null): string | null {
  const workerId = typeof existing?.workerId === 'string' ? existing.workerId : null;
  const pid = typeof existing?.pid === 'number' ? String(existing.pid) : null;
  return workerId ?? pid;
}

function resolveStaleLockSeconds(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 900;
}

// Checks Node filesystem errors by code.
function isNodeErrorWithCode(error: unknown, code: string): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === code;
}

// Produces a stable string from thrown values.
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
