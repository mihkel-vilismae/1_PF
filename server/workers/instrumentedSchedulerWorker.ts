/*
 * Shared status/lock instrumentation for scheduler worker lanes that do not yet
 * own product work. This records honest runtime evidence without pretending the
 * regular pipeline or screen hardware behavior has been implemented.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { SCHEDULER_WORKER_NAMES, type SchedulerWorkerName } from '../../shared/schedulerWorkerCommands.ts';
import { resolveSchedulerRuntimeDirectory } from './schedulerRuntimeDirectory.ts';

type InstrumentedWorkerStatus = 'succeeded' | 'skipped' | 'failed';
type JsonObject = Record<string, unknown>;

export interface InstrumentedSchedulerWorkerResult {
  worker: 'regular_stage_worker' | 'screen_on_off_worker';
  schedulerWorkerName: SchedulerWorkerName;
  status: InstrumentedWorkerStatus;
  implementationStatus: 'instrumentation_only';
  startedAt: string;
  finishedAt: string;
  invocation_observed: boolean;
  last_invocation_at: string;
  lock: {
    path: string;
    acquiredAt: string | null;
    released: boolean;
  };
  statusPath: string;
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
  productWork: {
    claimed: false;
    note: string;
  };
  skippedReason: string | null;
  failureReason: string | null;
  messages: string[];
  schemaVersion: 1;
}

interface WorkerDefinition {
  worker: InstrumentedSchedulerWorkerResult['worker'];
  statusFileName: string;
  lockFileName: string;
  productNote: string;
}

interface WorkerLockFile {
  worker: InstrumentedSchedulerWorkerResult['worker'];
  acquiredAt: string;
  pid: number;
  workerId: string;
}

export interface InstrumentedSchedulerWorkerOptions {
  workerName: SchedulerWorkerName;
  repoRoot: string;
  now?: () => Date;
  workerId?: string;
  staleLockSeconds?: number;
}

const WORKER_DEFINITIONS: Record<string, WorkerDefinition> = {
  [SCHEDULER_WORKER_NAMES.regularStage]: {
    worker: 'regular_stage_worker',
    statusFileName: 'regular-stage-worker-status.json',
    lockFileName: 'regular-stage-worker-lock.json',
    productNote: 'regular_stage_worker runtime status/lock instrumentation ran; download/index/GPS/geocode/queue product work remains outside this slice.',
  },
  [SCHEDULER_WORKER_NAMES.screenOnOff]: {
    worker: 'screen_on_off_worker',
    statusFileName: 'screen-on-off-worker-status.json',
    lockFileName: 'screen-on-off-worker-lock.json',
    productNote: 'screen_on_off_worker runtime status/lock instrumentation ran; physical screen on/off hardware control remains outside this slice.',
  },
};

export function getInstrumentedWorkerDefinition(workerName: SchedulerWorkerName): WorkerDefinition | null {
  return WORKER_DEFINITIONS[workerName] ?? null;
}

export async function runInstrumentedSchedulerWorker({
  workerName,
  repoRoot,
  now = () => new Date(),
  workerId = `${workerName}-${process.pid}`,
  staleLockSeconds = resolveStaleLockSeconds(process.env.PF_RASPBERRY_WORKER_STALE_LOCK_SECONDS),
}: InstrumentedSchedulerWorkerOptions): Promise<InstrumentedSchedulerWorkerResult> {
  const definition = getInstrumentedWorkerDefinition(workerName);
  if (!definition) throw new Error(`No instrumentation-only worker definition exists for ${workerName}.`);

  const runtimeDirectory = resolveSchedulerRuntimeDirectory(repoRoot);
  const lockPath = path.join(runtimeDirectory, definition.lockFileName);
  const statusPath = path.join(runtimeDirectory, definition.statusFileName);
  const startedAt = now().toISOString();
  await fs.mkdir(runtimeDirectory, { recursive: true });

  const lockPayload: WorkerLockFile = { worker: definition.worker, acquiredAt: startedAt, pid: process.pid, workerId };
  const lockOutcome = await acquireOrClassifyWorkerLock({ lockPath, payload: lockPayload, now, staleLockSeconds });

  if (lockOutcome.duplicateSkipped) {
    const result = buildResult({
      definition,
      workerName,
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
      skippedReason: 'same_worker_instance_already_running',
      failureReason: null,
      messages: [`${definition.worker} duplicate invocation skipped because a same-worker lock is active.`],
    });
    await writeWorkerStatus(statusPath, result);
    return result;
  }

  const result = buildResult({
    definition,
    workerName,
    status: 'succeeded',
    startedAt,
    finishedAt: now().toISOString(),
    lockPath,
    statusPath,
    acquiredAt: startedAt,
    released: true,
    firstAcquired: true,
    duplicateSkipped: false,
    staleLockReclaimed: lockOutcome.staleLockReclaimed,
    currentLockPresent: false,
    currentLockOwner: null,
    skippedReason: null,
    failureReason: null,
    messages: [definition.productNote],
  });

  await fs.rm(lockPath, { force: true }).catch(() => undefined);
  await writeWorkerStatus(statusPath, result);
  return result;
}

function buildResult({
  definition,
  workerName,
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
  skippedReason,
  failureReason,
  messages,
}: {
  definition: WorkerDefinition;
  workerName: SchedulerWorkerName;
  status: InstrumentedWorkerStatus;
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
  skippedReason: string | null;
  failureReason: string | null;
  messages: string[];
}): InstrumentedSchedulerWorkerResult {
  return {
    worker: definition.worker,
    schedulerWorkerName: workerName,
    status,
    implementationStatus: 'instrumentation_only',
    startedAt,
    finishedAt,
    invocation_observed: true,
    last_invocation_at: finishedAt,
    lock: { path: lockPath, acquiredAt, released },
    statusPath,
    same_worker_singleton: {
      first_acquired: firstAcquired,
      duplicate_skipped: duplicateSkipped,
      source: 'runtime-status-lock-instrumentation',
    },
    cross_worker_independence: true,
    stale_lock: {
      reclaimed: staleLockReclaimed,
      source: 'runtime-status-lock-instrumentation',
      current_lock_present: currentLockPresent,
      current_lock_owner: currentLockOwner,
    },
    productWork: {
      claimed: false,
      note: definition.productNote,
    },
    skippedReason,
    failureReason,
    messages,
    schemaVersion: 1,
  };
}

async function acquireOrClassifyWorkerLock({ lockPath, payload, now, staleLockSeconds }: { lockPath: string; payload: WorkerLockFile; now: () => Date; staleLockSeconds: number; }): Promise<{ duplicateSkipped: boolean; staleLockReclaimed: boolean; currentLockOwner: string | null; }> {
  try {
    await fs.writeFile(lockPath, `${JSON.stringify(payload, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
    return { duplicateSkipped: false, staleLockReclaimed: false, currentLockOwner: null };
  } catch (error) {
    if (!isNodeErrorWithCode(error, 'EEXIST')) throw error;
    const existing = await readJsonObject(lockPath);
    const currentLockOwner = formatLockOwner(existing);
    if (isStaleLock(existing, now, staleLockSeconds)) {
      await fs.rm(lockPath, { force: true });
      await fs.writeFile(lockPath, `${JSON.stringify(payload, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
      return { duplicateSkipped: false, staleLockReclaimed: true, currentLockOwner };
    }
    return { duplicateSkipped: true, staleLockReclaimed: false, currentLockOwner };
  }
}

async function writeWorkerStatus(statusPath: string, result: InstrumentedSchedulerWorkerResult): Promise<void> {
  await fs.writeFile(statusPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
}

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

function formatLockOwner(existing: JsonObject | null): string | null {
  const workerId = typeof existing?.workerId === 'string' ? existing.workerId : null;
  const pid = typeof existing?.pid === 'number' ? String(existing.pid) : null;
  return workerId ?? pid;
}

function resolveStaleLockSeconds(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 900;
}

function isNodeErrorWithCode(error: unknown, code: string): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === code;
}
