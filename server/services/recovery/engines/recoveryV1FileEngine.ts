import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type {
  ClearUncleanShutdownInput,
  LoadRecoveryStateInput,
  MarkUncleanShutdownInput,
  PlaybackResumeInput,
  PlaybackResumeTarget,
  RecoveryCheckInput,
  RecoveryCheckResult,
  RecoveryEngine,
  RecoveryEngineInfo,
  RecoveryMode,
  RecoveryMutationResult,
  RecoveryOperationStatus,
  RecoveryServiceOptions,
  RecoverySnapshot,
  RecoverySnapshotSource,
  SaveRecoveryStateInput,
  WorkerRecoveryCheckpointInput,
} from '../recoveryContract.ts';

type JsonRecord = Record<string, unknown>;

function nowIso(): string {
  return new Date().toISOString();
}

function safeTimestamp(value: string = nowIso()): string {
  return value.replace(/[:.]/g, '-');
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeMode(value: unknown): RecoveryMode {
  return value === 'test' ? 'test' : 'real';
}

function readString(value: unknown): string | undefined {
  if (typeof value === 'string' || typeof value === 'number') {
    const text = String(value).trim();
    return text || undefined;
  }
  return undefined;
}

function readNonNegativeInteger(value: unknown): number | undefined {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? Math.trunc(numeric) : undefined;
}

function readNonNegativeNumber(value: unknown): number | undefined {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : undefined;
}

function normalizeSource(value: unknown): RecoverySnapshotSource {
  return value === 'manual' || value === 'automatic' || value === 'emulate-power-off' || value === 'worker-start' || value === 'proof'
    ? value
    : 'manual';
}

function normalizeMediaKind(value: unknown): 'image' | 'video' | 'other' | 'unknown' {
  return value === 'image' || value === 'video' || value === 'other' || value === 'unknown' ? value : 'unknown';
}

function normalizeResumePolicy(value: unknown): 'same-media' | 'next-media' | 'safe-queue-position' | 'none' {
  return value === 'same-media' || value === 'next-media' || value === 'safe-queue-position' || value === 'none'
    ? value
    : 'same-media';
}

function normalizeActiveStage(value: unknown): 'download' | 'index' | 'gps-parser' | 'geocode' | 'queue' | 'unknown' | 'none' {
  return value === 'download' || value === 'index' || value === 'gps-parser' || value === 'geocode' || value === 'queue' || value === 'unknown' || value === 'none'
    ? value
    : 'unknown';
}

function normalizeScreenState(value: unknown): 'on' | 'off' | 'fake-off' | 'unknown' {
  return value === 'on' || value === 'off' || value === 'fake-off' || value === 'unknown' ? value : 'unknown';
}

function normalizeActivitySource(value: unknown): 'mouse' | 'keyboard' | 'pir' | 'timer' | 'unknown' {
  return value === 'mouse' || value === 'keyboard' || value === 'pir' || value === 'timer' || value === 'unknown' ? value : 'unknown';
}

function sourceRecord(input: SaveRecoveryStateInput): JsonRecord {
  if (isRecord(input.snapshot)) return input.snapshot;
  return input as JsonRecord;
}

function normalizeSnapshot(input: SaveRecoveryStateInput = {}): RecoverySnapshot {
  const source = sourceRecord(input);
  const playbackSource: JsonRecord = isRecord(input.playback) ? input.playback : isRecord(source.playback) ? source.playback : {};
  const queueSource: JsonRecord = isRecord(input.queue) ? input.queue : isRecord(source.queue) ? source.queue : {};
  const pipelineSource: JsonRecord = isRecord(input.pipeline) ? input.pipeline : isRecord(source.pipeline) ? source.pipeline : {};
  const regularWorkerSource: JsonRecord = isRecord(input.regularWorker) ? input.regularWorker : isRecord(source.regularWorker) ? source.regularWorker : {};
  const screenWorkerSource: JsonRecord = isRecord(input.screenWorker) ? input.screenWorker : isRecord(source.screenWorker) ? source.screenWorker : {};
  const createdAt = nowIso();
  const mediaId = readString(playbackSource.currentMediaId) ?? readString(playbackSource.mediaId) ?? readString(queueSource.selectedQueueItemId);
  const mediaPath = readString(playbackSource.currentMediaPath) ?? readString(playbackSource.currentFilename) ?? readString(playbackSource.mediaPath);
  const queueCursorIndex = readNonNegativeInteger(playbackSource.queueCursorIndex);
  const queueLength = readNonNegativeInteger(playbackSource.queueLength) ?? readNonNegativeInteger(queueSource.preparedMediaCount);
  const playback: RecoverySnapshot['playback'] = {
    resumePolicy: normalizeResumePolicy(playbackSource.resumePolicy ?? (mediaId || mediaPath ? 'same-media' : queueCursorIndex !== undefined ? 'safe-queue-position' : 'none')),
  };
  if (mediaId) playback.currentMediaId = mediaId;
  if (mediaPath) playback.currentMediaPath = mediaPath;
  playback.mediaKind = normalizeMediaKind(playbackSource.mediaKind);
  if (queueCursorIndex !== undefined) playback.queueCursorIndex = queueCursorIndex;
  if (queueLength !== undefined) playback.queueLength = queueLength;
  const playbackPositionSeconds = readNonNegativeNumber(playbackSource.playbackPositionSeconds);
  if (playbackPositionSeconds !== undefined) playback.playbackPositionSeconds = playbackPositionSeconds;

  const snapshot: RecoverySnapshot = {
    schemaVersion: 'recovery.snapshot.v1',
    recoveryEngine: 'v1',
    snapshotId: readString(source.snapshotId) ?? `recovery-${safeTimestamp(createdAt)}-${randomUUID().slice(0, 8)}`,
    createdAt,
    mode: normalizeMode(input.mode ?? source.mode),
    source: normalizeSource(input.source ?? source.source ?? (input.reason === 'pre-shutdown' ? 'automatic' : 'manual')),
    playback,
    regularWorker: {
      activeStage: normalizeActiveStage(regularWorkerSource.activeStage ?? pipelineSource.activeStage),
      lastCommittedStage: readString(regularWorkerSource.lastCommittedStage),
      lastRunId: readString(regularWorkerSource.lastRunId),
    },
    screenWorker: {
      lastScreenState: normalizeScreenState(screenWorkerSource.lastScreenState),
      lastActivitySource: normalizeActivitySource(screenWorkerSource.lastActivitySource),
    },
    validation: { ok: true, warnings: [], errors: [] },
  };

  validateSnapshotInPlace(snapshot);
  return snapshot;
}

function validateSnapshotInPlace(snapshot: RecoverySnapshot): void {
  const warnings: string[] = [];
  const errors: string[] = [];
  if (snapshot.schemaVersion !== 'recovery.snapshot.v1') errors.push('schemaVersion must be recovery.snapshot.v1');
  if (snapshot.recoveryEngine !== 'v1') errors.push('recoveryEngine must be v1');
  if (!snapshot.snapshotId) errors.push('snapshotId is required');
  if (!Number.isFinite(Date.parse(snapshot.createdAt))) errors.push('createdAt must be parseable ISO');
  if (!snapshot.playback?.currentMediaId && !snapshot.playback?.currentMediaPath && snapshot.playback?.queueCursorIndex === undefined) {
    warnings.push('No exact playback media or queue cursor was supplied; v1 recovery will start from beginning.');
  }
  snapshot.validation = { ok: errors.length === 0, warnings, errors };
}

function isRecoverySnapshot(value: unknown): value is RecoverySnapshot {
  if (!isRecord(value)) return false;
  const candidate = value as Partial<RecoverySnapshot>;
  return candidate.schemaVersion === 'recovery.snapshot.v1' && candidate.recoveryEngine === 'v1' && typeof candidate.snapshotId === 'string';
}

async function readJsonIfExists(filePath: string): Promise<unknown | null> {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export function createRecoveryV1FileEngine(options: RecoveryServiceOptions): RecoveryEngine {
  const repoRoot = options.repoRoot;
  const recoveryDir = path.join(repoRoot, 'runtime_data', 'recovery');
  const snapshotsDir = path.join(recoveryDir, 'snapshots');
  const latestSnapshotPath = path.join(recoveryDir, 'latest_recovery_snapshot.json');
  const activeEnginePath = path.join(recoveryDir, 'active_engine.json');
  const uncleanShutdownFlagPath = path.join(recoveryDir, 'unclean_shutdown.flag');
  const restartCheckLatestPath = path.join(recoveryDir, 'restart_check_latest.json');
  const checkpointJsonlPath = path.join(recoveryDir, 'worker_checkpoints.jsonl');

  async function ensureRecoveryDir(): Promise<void> {
    await fs.mkdir(snapshotsDir, { recursive: true });
    await fs.writeFile(activeEnginePath, `${JSON.stringify({ schemaVersion: 'recovery.activeEngine.v1', recoveryEngine: 'v1', updatedAt: nowIso() }, null, 2)}\n`, 'utf8');
  }

  async function loadLatestState(_input: LoadRecoveryStateInput = {}): Promise<RecoverySnapshot | null> {
    const parsed = await readJsonIfExists(latestSnapshotPath);
    const snapshot = isRecord(parsed) && isRecoverySnapshot(parsed.snapshot) ? parsed.snapshot : parsed;
    if (!isRecoverySnapshot(snapshot)) return null;
    validateSnapshotInPlace(snapshot);
    return snapshot.validation.ok ? snapshot : null;
  }

  async function getPlaybackResumeTarget(input: PlaybackResumeInput = {}): Promise<PlaybackResumeTarget> {
    const mode = normalizeMode(input.mode);
    const snapshot = input.snapshot ?? await loadLatestState({ mode });
    if (!snapshot || !snapshot.validation.ok) {
      return {
        schemaVersion: 'recovery.playbackResumeTarget.v1',
        recoveryEngine: 'v1',
        mode,
        decision: 'start-from-beginning',
        reason: 'No valid recovery snapshot was available.',
        confidence: 'low',
      };
    }
    const playback = snapshot.playback;
    if (playback?.currentMediaId || playback?.currentMediaPath) {
      return {
        schemaVersion: 'recovery.playbackResumeTarget.v1',
        recoveryEngine: 'v1',
        mode: snapshot.mode,
        decision: playback.resumePolicy === 'next-media' ? 'resume-next-media' : 'resume-same-media',
        mediaId: playback.currentMediaId,
        mediaPath: playback.currentMediaPath,
        queueCursorIndex: playback.queueCursorIndex,
        reason: 'Latest recovery snapshot contains current media context.',
        confidence: 'high',
      };
    }
    if (playback?.queueCursorIndex !== undefined) {
      return {
        schemaVersion: 'recovery.playbackResumeTarget.v1',
        recoveryEngine: 'v1',
        mode: snapshot.mode,
        decision: 'resume-safe-queue-position',
        queueCursorIndex: playback.queueCursorIndex,
        reason: 'Latest recovery snapshot contains queue cursor context but no current media.',
        confidence: 'medium',
      };
    }
    return {
      schemaVersion: 'recovery.playbackResumeTarget.v1',
      recoveryEngine: 'v1',
      mode: snapshot.mode,
      decision: 'start-from-beginning',
      reason: 'Recovery snapshot had no resumable playback fields.',
      confidence: 'low',
    };
  }

  async function archiveUncleanFlag(reason: string): Promise<string | undefined> {
    if (!(await exists(uncleanShutdownFlagPath))) return undefined;
    const archivePath = path.join(recoveryDir, `unclean_shutdown_${safeTimestamp()}_${reason.replace(/[^a-z0-9_-]/gi, '_')}.flag.json`);
    await fs.rename(uncleanShutdownFlagPath, archivePath);
    return archivePath;
  }

  return {
    getActiveEngine: () => 'v1',
    getEngineInfo: (): RecoveryEngineInfo => ({
      engineId: 'v1',
      label: 'Recovery V1 File Engine',
      version: '0.10.86',
      storage: 'filesystem',
      implemented: true,
      notes: ['File-backed lightweight recovery snapshots, unclean-shutdown flag, restart check, and playback resume target selection.'],
    }),
    async saveState(input: SaveRecoveryStateInput = {}): Promise<RecoverySnapshot> {
      await ensureRecoveryDir();
      const snapshot = normalizeSnapshot(input);
      const snapshotPath = path.join(snapshotsDir, `recovery_snapshot_${safeTimestamp(snapshot.createdAt)}_${snapshot.snapshotId}.json`);
      const payload = `${JSON.stringify(snapshot, null, 2)}\n`;
      await fs.writeFile(snapshotPath, payload, 'utf8');
      await fs.writeFile(latestSnapshotPath, payload, 'utf8');
      return snapshot;
    },
    loadLatestState,
    async markUncleanShutdown(input: MarkUncleanShutdownInput = {}): Promise<RecoveryMutationResult> {
      await ensureRecoveryDir();
      const mode = normalizeMode(input.mode);
      const flag = {
        schemaVersion: 'recovery.uncleanShutdownFlag.v1',
        recoveryEngine: 'v1',
        createdAt: nowIso(),
        mode,
        source: input.source ?? 'emulate-power-off',
        snapshotId: input.snapshotId,
        reason: input.reason ?? 'unclean shutdown marker requested',
      };
      await fs.writeFile(uncleanShutdownFlagPath, `${JSON.stringify(flag, null, 2)}\n`, 'utf8');
      return {
        schemaVersion: 'recovery.mutation.v1',
        recoveryEngine: 'v1',
        mode,
        status: 'passed',
        operation: 'markUncleanShutdown',
        createdAt: flag.createdAt,
        snapshotId: input.snapshotId,
        filePath: uncleanShutdownFlagPath,
        warnings: [],
        errors: [],
      };
    },
    async clearUncleanShutdown(input: ClearUncleanShutdownInput = {}): Promise<RecoveryMutationResult> {
      await ensureRecoveryDir();
      const mode = normalizeMode(input.mode);
      const archivePath = await archiveUncleanFlag(input.reason ?? 'clear');
      return {
        schemaVersion: 'recovery.mutation.v1',
        recoveryEngine: 'v1',
        mode,
        status: 'passed',
        operation: 'clearUncleanShutdown',
        createdAt: nowIso(),
        filePath: archivePath,
        warnings: archivePath ? [] : ['No active unclean-shutdown flag was present.'],
        errors: [],
      };
    },
    async checkRestart(input: RecoveryCheckInput = {}): Promise<RecoveryCheckResult> {
      await ensureRecoveryDir();
      const mode = normalizeMode(input.mode);
      const uncleanShutdownFlagPresent = await exists(uncleanShutdownFlagPath);
      const snapshot = await loadLatestState({ mode });
      const snapshotFound = Boolean(snapshot);
      const snapshotValid = Boolean(snapshot?.validation.ok);
      const possibleRestartDetected = Boolean(uncleanShutdownFlagPresent && snapshotFound && snapshotValid);
      const resumeTarget = await getPlaybackResumeTarget({ mode, snapshot });
      const status: RecoveryOperationStatus = snapshotFound && !snapshotValid ? 'blocked' : 'passed';
      const result: RecoveryCheckResult = {
        schemaVersion: 'recovery.check.v1',
        recoveryEngine: 'v1',
        checkedAt: nowIso(),
        mode,
        status,
        possibleRestartDetected,
        uncleanShutdownFlagPresent,
        snapshotFound,
        snapshotValid,
        selectedSnapshotId: snapshot?.snapshotId,
        resumeTarget,
        warnings: [],
        errors: [],
      };
      if (uncleanShutdownFlagPresent && !snapshotFound) result.warnings.push('Unclean-shutdown flag is present but no recovery snapshot exists.');
      await fs.writeFile(restartCheckLatestPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
      if (uncleanShutdownFlagPresent) {
        await archiveUncleanFlag(possibleRestartDetected ? 'restart_check_detected' : 'restart_check_no_snapshot');
      }
      return result;
    },
    getPlaybackResumeTarget,
    async recordWorkerCheckpoint(input: WorkerRecoveryCheckpointInput): Promise<RecoveryMutationResult> {
      await ensureRecoveryDir();
      const mode = normalizeMode(input.mode);
      const event = {
        schemaVersion: 'recovery.workerCheckpoint.v1',
        recoveryEngine: 'v1',
        mode,
        createdAt: nowIso(),
        worker: input.worker ?? 'unknown',
        event: String(input.event ?? 'state'),
        stage: input.stage,
        runId: input.runId,
        screenState: input.screenState,
        activitySource: input.activitySource,
        details: input.details ?? {},
      };
      await fs.mkdir(recoveryDir, { recursive: true });
      await fs.appendFile(checkpointJsonlPath, `${JSON.stringify(event)}\n`, 'utf8');
      return {
        schemaVersion: 'recovery.mutation.v1',
        recoveryEngine: 'v1',
        mode,
        status: 'passed',
        operation: 'recordWorkerCheckpoint',
        createdAt: event.createdAt,
        filePath: checkpointJsonlPath,
        warnings: [],
        errors: [],
      };
    },
  };
}
