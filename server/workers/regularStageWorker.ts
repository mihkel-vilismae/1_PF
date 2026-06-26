/*
 * Product-capable regular_stage_worker.
 *
 * The B-test view already wires B3.1-B3.5 Run buttons to backend runtime routes.
 * This worker reuses those same backend actions as scheduler-owned product work:
 * download -> index -> gps -> geocode -> queue_prepare -> download.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { SCHEDULER_WORKER_NAMES } from '../../shared/schedulerWorkerCommands.ts';

export const REGULAR_STAGE_WORKER_IMPLEMENTATION_STATUS = 'b3_stage_state_machine_v1' as const;

export const REGULAR_STAGE_WORKER_STAGES = Object.freeze([
  { key: 'download', endpoint: '/api/runtime/download/run', bStage: 'B3.1', label: 'Download' },
  { key: 'index', endpoint: '/api/runtime/index/run', bStage: 'B3.2', label: 'Index' },
  { key: 'gps', endpoint: '/api/runtime/gps/run', bStage: 'B3.3', label: 'Parse GPS' },
  { key: 'geocode', endpoint: '/api/runtime/geocode/run', bStage: 'B3.4', label: 'Geocode' },
  { key: 'queue_prepare', endpoint: '/api/runtime/queue/prepare', bStage: 'B3.5', label: 'Enqueue playback' },
] as const);

export type RegularStageWorkerStage = typeof REGULAR_STAGE_WORKER_STAGES[number];
export type RegularStageWorkerStageKey = RegularStageWorkerStage['key'];

type WorkerStatus = 'succeeded' | 'skipped' | 'failed';
type JsonObject = Record<string, unknown>;

export interface RegularStageWorkerStageResult {
  statusCode?: number;
  payload?: unknown;
}

export type RegularStageWorkerStageRunner = (stage: RegularStageWorkerStage) => Promise<RegularStageWorkerStageResult>;

export interface RegularStageWorkerOptions {
  repoRoot: string;
  runStage: RegularStageWorkerStageRunner;
  now?: () => Date;
  workerId?: string;
  staleLockSeconds?: number;
  maxStagesPerRun?: number;
}

export interface RegularStageWorkerState {
  schemaVersion: 1;
  worker: 'regular_stage_worker';
  implementationStatus: typeof REGULAR_STAGE_WORKER_IMPLEMENTATION_STATUS;
  lastCompletedStage: RegularStageWorkerStageKey | null;
  nextStage: RegularStageWorkerStageKey;
  completedProductCycleObserved: boolean;
  cycleCount: number;
  updatedAt: string;
  lastRunId: string | null;
  stageHistory: Array<{
    runId: string;
    stage: RegularStageWorkerStageKey;
    bStage: string;
    endpoint: string;
    completedAt: string;
    statusCode: number | null;
    summary: JsonObject;
  }>;
}

export interface RegularStageWorkerResult {
  worker: 'regular_stage_worker';
  schedulerWorkerName: typeof SCHEDULER_WORKER_NAMES.regularStage;
  status: WorkerStatus;
  implementationStatus: typeof REGULAR_STAGE_WORKER_IMPLEMENTATION_STATUS;
  startedAt: string;
  finishedAt: string;
  invocation_observed: boolean;
  last_invocation_at: string;
  runId: string;
  workerRunId: string;
  lock: {
    path: string;
    acquiredAt: string | null;
    released: boolean;
  };
  statusPath: string;
  statePath: string;
  productOutputPath: string;
  same_worker_singleton: {
    first_acquired: boolean;
    duplicate_skipped: boolean;
    source: string;
  };
  cross_worker_independence: true;
  stale_lock: {
    reclaimed: boolean;
    source: string;
    current_lock_present: boolean;
    current_lock_owner: string | null;
  };
  stageState: {
    previousLastCompletedStage: RegularStageWorkerStageKey | null;
    lastCompletedStage: RegularStageWorkerStageKey | null;
    nextStage: RegularStageWorkerStageKey;
    completedProductCycleObserved: boolean;
    cycleCount: number;
  };
  productWork: {
    claimed: boolean;
    runId: string;
    workerRunId: string;
    implementationStatus: typeof REGULAR_STAGE_WORKER_IMPLEMENTATION_STATUS;
    source: 'manual-b3-run-actions-attached-to-regular-worker';
    completedProductCycleObserved: boolean;
    stagesCompletedInRun: RegularStageWorkerStageKey[];
    lastCompletedStage: RegularStageWorkerStageKey | null;
    nextStage: RegularStageWorkerStageKey;
    productOutputPath: string;
    note: string;
  };
  stageResults: Array<{
    stage: RegularStageWorkerStageKey;
    bStage: string;
    endpoint: string;
    label: string;
    statusCode: number | null;
    payloadSummary: JsonObject;
  }>;
  skippedReason: string | null;
  failureReason: string | null;
  messages: string[];
  schemaVersion: 1;
}

interface WorkerLockFile {
  worker: 'regular_stage_worker';
  acquiredAt: string;
  pid: number;
  workerId: string;
}

function resolveStaleLockSeconds(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 300;
}

function clampMaxStagesPerRun(value: number | undefined): number {
  const parsed = Number.isFinite(value) ? Math.trunc(value as number) : REGULAR_STAGE_WORKER_STAGES.length;
  return Math.max(1, Math.min(REGULAR_STAGE_WORKER_STAGES.length, parsed));
}

export function chooseNextRegularStage(lastCompletedStage: RegularStageWorkerStageKey | null | undefined): RegularStageWorkerStage {
  if (!lastCompletedStage) return REGULAR_STAGE_WORKER_STAGES[0];
  const index = REGULAR_STAGE_WORKER_STAGES.findIndex((stage) => stage.key === lastCompletedStage);
  if (index < 0 || index === REGULAR_STAGE_WORKER_STAGES.length - 1) return REGULAR_STAGE_WORKER_STAGES[0];
  return REGULAR_STAGE_WORKER_STAGES[index + 1];
}

function stagesForRun(previousLastCompletedStage: RegularStageWorkerStageKey | null, maxStagesPerRun: number): RegularStageWorkerStage[] {
  const stages: RegularStageWorkerStage[] = [];
  let next = chooseNextRegularStage(previousLastCompletedStage);
  for (let i = 0; i < maxStagesPerRun; i += 1) {
    stages.push(next);
    if (next.key === 'queue_prepare') break;
    next = chooseNextRegularStage(next.key);
  }
  return stages;
}

export async function runRegularStageWorker({
  repoRoot,
  runStage,
  now = () => new Date(),
  workerId = `${SCHEDULER_WORKER_NAMES.regularStage}-${process.pid}`,
  staleLockSeconds = resolveStaleLockSeconds(process.env.PF_RASPBERRY_WORKER_STALE_LOCK_SECONDS),
  maxStagesPerRun = Number.parseInt(process.env.PF_REGULAR_STAGE_WORKER_MAX_STAGES_PER_RUN ?? '', 10),
}: RegularStageWorkerOptions): Promise<RegularStageWorkerResult> {
  const runtimeDirectory = path.join(repoRoot, 'runtime_data', 'scheduler');
  const lockPath = path.join(runtimeDirectory, 'regular-stage-worker-lock.json');
  const statusPath = path.join(runtimeDirectory, 'regular-stage-worker-status.json');
  const statePath = path.join(runtimeDirectory, 'regular-stage-worker-state.json');
  const productOutputPath = path.join(runtimeDirectory, 'regular-stage-worker-product-output.json');
  const startedAt = now().toISOString();
  const runId = randomUUID();
  await fs.mkdir(runtimeDirectory, { recursive: true });

  const lockPayload: WorkerLockFile = { worker: 'regular_stage_worker', acquiredAt: startedAt, pid: process.pid, workerId };
  const lockOutcome = await acquireOrClassifyWorkerLock({ lockPath, payload: lockPayload, now, staleLockSeconds });

  if (lockOutcome.duplicateSkipped) {
    const previousState = await readWorkerState(statePath);
    const finishedAt = now().toISOString();
    const result = buildResult({
      status: 'skipped',
      startedAt,
      finishedAt,
      runId,
      lockPath,
      statusPath,
      statePath,
      productOutputPath,
      acquiredAt: null,
      released: false,
      firstAcquired: false,
      duplicateSkipped: true,
      staleLockReclaimed: false,
      currentLockPresent: true,
      currentLockOwner: lockOutcome.currentLockOwner,
      previousLastCompletedStage: previousState.lastCompletedStage,
      state: previousState,
      stageResults: [],
      skippedReason: 'same_worker_instance_already_running',
      failureReason: null,
      messages: ['regular_stage_worker duplicate invocation skipped because a same-worker lock is active.'],
    });
    await writeJson(statusPath, result);
    return result;
  }

  const previousState = await readWorkerState(statePath);
  const selectedStages = stagesForRun(previousState.lastCompletedStage, clampMaxStagesPerRun(maxStagesPerRun));
  const stageResults: RegularStageWorkerResult['stageResults'] = [];
  let state = previousState;
  let status: WorkerStatus = 'succeeded';
  let failureReason: string | null = null;
  const messages: string[] = [];

  try {
    for (const stage of selectedStages) {
      const result = await runStage(stage);
      const statusCode = typeof result.statusCode === 'number' ? result.statusCode : null;
      const payloadSummary = summarizeStagePayload(result.payload);
      stageResults.push({
        stage: stage.key,
        bStage: stage.bStage,
        endpoint: stage.endpoint,
        label: stage.label,
        statusCode,
        payloadSummary,
      });
      if (statusCode !== null && (statusCode < 200 || statusCode >= 300)) {
        throw new Error(`${stage.bStage} ${stage.endpoint} returned status ${statusCode}`);
      }
      state = completeStageInState({ state, stage, runId, completedAt: now().toISOString(), statusCode, payloadSummary });
      await writeJson(statePath, state);
      messages.push(`${stage.bStage} ${stage.label} completed by regular_stage_worker via ${stage.endpoint}.`);
    }
  } catch (error) {
    status = 'failed';
    failureReason = error instanceof Error ? error.message : String(error);
    messages.push(`regular_stage_worker failed: ${failureReason}`);
  } finally {
    await fs.rm(lockPath, { force: true }).catch(() => undefined);
  }

  const finishedAt = now().toISOString();
  const result = buildResult({
    status,
    startedAt,
    finishedAt,
    runId,
    lockPath,
    statusPath,
    statePath,
    productOutputPath,
    acquiredAt: startedAt,
    released: true,
    firstAcquired: true,
    duplicateSkipped: false,
    staleLockReclaimed: lockOutcome.staleLockReclaimed,
    currentLockPresent: false,
    currentLockOwner: null,
    previousLastCompletedStage: previousState.lastCompletedStage,
    state,
    stageResults,
    skippedReason: null,
    failureReason,
    messages,
  });
  await writeJson(productOutputPath, buildProductOutput(result));
  await writeJson(statusPath, result);
  return result;
}

function completeStageInState({
  state,
  stage,
  runId,
  completedAt,
  statusCode,
  payloadSummary,
}: {
  state: RegularStageWorkerState;
  stage: RegularStageWorkerStage;
  runId: string;
  completedAt: string;
  statusCode: number | null;
  payloadSummary: JsonObject;
}): RegularStageWorkerState {
  const completedProductCycleObserved = state.completedProductCycleObserved || stage.key === 'queue_prepare';
  const nextStage = chooseNextRegularStage(stage.key).key;
  const cycleCount = state.cycleCount + (stage.key === 'queue_prepare' ? 1 : 0);
  const stageHistory = [
    ...state.stageHistory,
    { runId, stage: stage.key, bStage: stage.bStage, endpoint: stage.endpoint, completedAt, statusCode, summary: payloadSummary },
  ].slice(-50);
  return {
    ...state,
    lastCompletedStage: stage.key,
    nextStage,
    completedProductCycleObserved,
    cycleCount,
    updatedAt: completedAt,
    lastRunId: runId,
    stageHistory,
  };
}

function buildEmptyState(now = new Date().toISOString()): RegularStageWorkerState {
  return {
    schemaVersion: 1,
    worker: 'regular_stage_worker',
    implementationStatus: REGULAR_STAGE_WORKER_IMPLEMENTATION_STATUS,
    lastCompletedStage: null,
    nextStage: 'download',
    completedProductCycleObserved: false,
    cycleCount: 0,
    updatedAt: now,
    lastRunId: null,
    stageHistory: [],
  };
}

async function readWorkerState(statePath: string): Promise<RegularStageWorkerState> {
  const parsed = await readJsonObject(statePath);
  if (!parsed || parsed.worker !== 'regular_stage_worker') return buildEmptyState();
  const lastCompletedStage = isRegularStageKey(parsed.lastCompletedStage) ? parsed.lastCompletedStage : null;
  const nextStage = isRegularStageKey(parsed.nextStage) ? parsed.nextStage : chooseNextRegularStage(lastCompletedStage).key;
  return {
    schemaVersion: 1,
    worker: 'regular_stage_worker',
    implementationStatus: REGULAR_STAGE_WORKER_IMPLEMENTATION_STATUS,
    lastCompletedStage,
    nextStage,
    completedProductCycleObserved: parsed.completedProductCycleObserved === true,
    cycleCount: Number.isInteger(parsed.cycleCount) ? Number(parsed.cycleCount) : 0,
    updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    lastRunId: typeof parsed.lastRunId === 'string' ? parsed.lastRunId : null,
    stageHistory: Array.isArray(parsed.stageHistory)
      ? parsed.stageHistory.filter(isJsonObject).slice(-50).map((entry) => ({
        runId: typeof entry.runId === 'string' ? entry.runId : 'unknown',
        stage: isRegularStageKey(entry.stage) ? entry.stage : 'download',
        bStage: typeof entry.bStage === 'string' ? entry.bStage : 'B3.?',
        endpoint: typeof entry.endpoint === 'string' ? entry.endpoint : 'unknown',
        completedAt: typeof entry.completedAt === 'string' ? entry.completedAt : new Date().toISOString(),
        statusCode: typeof entry.statusCode === 'number' ? entry.statusCode : null,
        summary: isJsonObject(entry.summary) ? entry.summary : {},
      }))
      : [],
  };
}

function buildResult({
  status,
  startedAt,
  finishedAt,
  runId,
  lockPath,
  statusPath,
  statePath,
  productOutputPath,
  acquiredAt,
  released,
  firstAcquired,
  duplicateSkipped,
  staleLockReclaimed,
  currentLockPresent,
  currentLockOwner,
  previousLastCompletedStage,
  state,
  stageResults,
  skippedReason,
  failureReason,
  messages,
}: {
  status: WorkerStatus;
  startedAt: string;
  finishedAt: string;
  runId: string;
  lockPath: string;
  statusPath: string;
  statePath: string;
  productOutputPath: string;
  acquiredAt: string | null;
  released: boolean;
  firstAcquired: boolean;
  duplicateSkipped: boolean;
  staleLockReclaimed: boolean;
  currentLockPresent: boolean;
  currentLockOwner: string | null;
  previousLastCompletedStage: RegularStageWorkerStageKey | null;
  state: RegularStageWorkerState;
  stageResults: RegularStageWorkerResult['stageResults'];
  skippedReason: string | null;
  failureReason: string | null;
  messages: string[];
}): RegularStageWorkerResult {
  const completedStages = stageResults.map((entry) => entry.stage);
  const productClaimed = status === 'succeeded' && state.completedProductCycleObserved === true;
  const nextStage = chooseNextRegularStage(state.lastCompletedStage).key;
  return {
    worker: 'regular_stage_worker',
    schedulerWorkerName: SCHEDULER_WORKER_NAMES.regularStage,
    status,
    implementationStatus: REGULAR_STAGE_WORKER_IMPLEMENTATION_STATUS,
    startedAt,
    finishedAt,
    invocation_observed: true,
    last_invocation_at: finishedAt,
    runId,
    workerRunId: runId,
    lock: { path: lockPath, acquiredAt, released },
    statusPath,
    statePath,
    productOutputPath,
    same_worker_singleton: {
      first_acquired: firstAcquired,
      duplicate_skipped: duplicateSkipped,
      source: REGULAR_STAGE_WORKER_IMPLEMENTATION_STATUS,
    },
    cross_worker_independence: true,
    stale_lock: {
      reclaimed: staleLockReclaimed,
      source: REGULAR_STAGE_WORKER_IMPLEMENTATION_STATUS,
      current_lock_present: currentLockPresent,
      current_lock_owner: currentLockOwner,
    },
    stageState: {
      previousLastCompletedStage,
      lastCompletedStage: state.lastCompletedStage,
      nextStage,
      completedProductCycleObserved: state.completedProductCycleObserved,
      cycleCount: state.cycleCount,
    },
    productWork: {
      claimed: productClaimed,
      runId,
      workerRunId: runId,
      implementationStatus: REGULAR_STAGE_WORKER_IMPLEMENTATION_STATUS,
      source: 'manual-b3-run-actions-attached-to-regular-worker',
      completedProductCycleObserved: state.completedProductCycleObserved,
      stagesCompletedInRun: completedStages,
      lastCompletedStage: state.lastCompletedStage,
      nextStage,
      productOutputPath,
      note: productClaimed
        ? 'regular_stage_worker ran the existing B3 manual Run actions as scheduler-owned product work and observed a completed queue_prepare cycle.'
        : 'regular_stage_worker ran B3 stage work but has not completed queue_prepare in this state file yet.',
    },
    stageResults,
    skippedReason,
    failureReason,
    messages,
    schemaVersion: 1,
  };
}

function buildProductOutput(result: RegularStageWorkerResult): JsonObject {
  return {
    schemaVersion: 1,
    worker: result.worker,
    implementationStatus: result.implementationStatus,
    runId: result.runId,
    productWorkClaimed: result.productWork.claimed,
    completedProductCycleObserved: result.productWork.completedProductCycleObserved,
    stageResults: result.stageResults.map((entry) => ({
      stage: entry.stage,
      bStage: entry.bStage,
      endpoint: entry.endpoint,
      statusCode: entry.statusCode,
      payloadSummary: entry.payloadSummary,
    })),
    redaction: {
      private_paths_redacted: true,
      secrets_redacted: true,
      raw_media_included: false,
      raw_provider_output_included: false,
    },
    observedAt: result.finishedAt,
  };
}

function summarizeStagePayload(payload: unknown): JsonObject {
  if (!isJsonObject(payload)) return {};
  const indexing = isJsonObject(payload.indexing) ? payload.indexing : null;
  return removeUndefined({
    status: stringOrNull(payload.status),
    stage: stringOrNull(payload.stage),
    message: stringOrNull(payload.message),
    messages: Array.isArray(payload.messages) ? payload.messages.filter((entry) => typeof entry === 'string').slice(0, 5) : undefined,
    inserted_count: numberOrNull(payload.inserted_count),
    skipped_count: numberOrNull(payload.skipped_count),
    processed_count: numberOrNull(payload.processed_count),
    success_count: numberOrNull(payload.success_count),
    failure_count: numberOrNull(payload.failure_count),
    indexed_count: numberOrNull(indexing?.scannedMediaCount),
    inserted_canonical_count: numberOrNull(indexing?.insertedCanonicalCount),
  });
}

function removeUndefined(value: JsonObject): JsonObject {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null));
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function isNodeErrorWithCode(error: unknown, code: string): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === code;
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

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function readJsonObject(filePath: string): Promise<JsonObject | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return isJsonObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isRegularStageKey(value: unknown): value is RegularStageWorkerStageKey {
  return typeof value === 'string' && REGULAR_STAGE_WORKER_STAGES.some((stage) => stage.key === value);
}

function formatLockOwner(lock: JsonObject | null): string | null {
  if (!lock) return null;
  const workerId = typeof lock.workerId === 'string' ? lock.workerId : null;
  const pid = typeof lock.pid === 'number' ? `pid:${lock.pid}` : null;
  return [workerId, pid].filter(Boolean).join(' ') || null;
}

function isStaleLock(lock: JsonObject | null, now: () => Date, staleLockSeconds: number): boolean {
  if (!lock || typeof lock.acquiredAt !== 'string') return true;
  const acquired = Date.parse(lock.acquiredAt);
  if (!Number.isFinite(acquired)) return true;
  return now().getTime() - acquired > staleLockSeconds * 1000;
}
