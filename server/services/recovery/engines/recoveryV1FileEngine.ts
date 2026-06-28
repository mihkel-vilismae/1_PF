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
  RecoveryMutationResult,
  RecoveryOperationStatus,
  RecoveryServiceOptions,
  RecoverySnapshot,
  WorkerRecoveryCheckpointInput,
} from '../recoveryContract.ts';
import {
  RECOVERY_SNAPSHOT_SCHEMA_VERSION,
  SUPPORTED_RECOVERY_SNAPSHOT_SCHEMA_VERSIONS,
  isRecord,
  isRecoverySnapshot,
  normalizeRecoveryMode,
  normalizeRecoverySnapshot,
  nowIso,
  safeTimestamp,
  validateRecoverySnapshotInPlace,
} from '../recoverySnapshotContract.ts';

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

function normalizeLoadedSnapshot(value: unknown): RecoverySnapshot | null {
  if (!isRecoverySnapshot(value)) return null;
  const snapshot = normalizeRecoverySnapshot({ snapshot: value }, { createdByEngine: value.metadata?.createdByEngine ?? 'v1' });
  validateRecoverySnapshotInPlace(snapshot);
  return snapshot.validation.ok ? snapshot : null;
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
    await fs.writeFile(
      activeEnginePath,
      `${JSON.stringify({
        schemaVersion: 'recovery.activeEngine.v1',
        activeEngine: 'v1',
        selectedStrategy: 'v1',
        canonicalSnapshotSchemaVersion: RECOVERY_SNAPSHOT_SCHEMA_VERSION,
        updatedAt: nowIso(),
      }, null, 2)}\n`,
      'utf8',
    );
  }

  async function loadLatestState(_input: LoadRecoveryStateInput = {}): Promise<RecoverySnapshot | null> {
    const parsed = await readJsonIfExists(latestSnapshotPath);
    const rawSnapshot = isRecord(parsed) && isRecoverySnapshot(parsed.snapshot) ? parsed.snapshot : parsed;
    return normalizeLoadedSnapshot(rawSnapshot);
  }

  async function getPlaybackResumeTarget(input: PlaybackResumeInput = {}): Promise<PlaybackResumeTarget> {
    const mode = normalizeRecoveryMode(input.mode);
    const snapshot = input.snapshot ? normalizeLoadedSnapshot(input.snapshot) : await loadLatestState({ mode });
    if (!snapshot || !snapshot.validation.ok) {
      return {
        schemaVersion: 'recovery.playbackResumeTarget.v1',
        recoveryEngine: 'v1',
        mode,
        decision: 'start-from-beginning',
        reason: 'No valid canonical recovery snapshot was available to the v1 strategy.',
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
        reason: 'V1 recovery strategy selected the latest canonical snapshot media context.',
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
        reason: 'V1 recovery strategy selected the latest canonical snapshot queue cursor.',
        confidence: 'medium',
      };
    }
    return {
      schemaVersion: 'recovery.playbackResumeTarget.v1',
      recoveryEngine: 'v1',
      mode: snapshot.mode,
      decision: 'start-from-beginning',
      reason: 'Canonical recovery snapshot had no resumable playback fields for the v1 strategy.',
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
      label: 'Recovery V1 File Strategy',
      version: '0.10.86',
      storage: 'filesystem',
      implemented: true,
      strategyRole: 'canonical-state-strategy',
      supportedSnapshotSchemaVersions: [...SUPPORTED_RECOVERY_SNAPSHOT_SCHEMA_VERSIONS],
      notes: [
        'File-backed recovery strategy over the canonical recovery.snapshot.v1 state schema.',
        'V1 keeps conservative latest-snapshot resume behavior; it does not own a private snapshot format.',
      ],
    }),
    async saveState(input = {}): Promise<RecoverySnapshot> {
      await ensureRecoveryDir();
      const snapshot = normalizeRecoverySnapshot(input, { createdByEngine: 'v1' });
      const snapshotPath = path.join(snapshotsDir, `recovery_snapshot_${safeTimestamp(snapshot.createdAt)}_${snapshot.snapshotId}.json`);
      const payload = `${JSON.stringify(snapshot, null, 2)}\n`;
      await fs.writeFile(snapshotPath, payload, 'utf8');
      await fs.writeFile(latestSnapshotPath, payload, 'utf8');
      return snapshot;
    },
    loadLatestState,
    async markUncleanShutdown(input: MarkUncleanShutdownInput = {}): Promise<RecoveryMutationResult> {
      await ensureRecoveryDir();
      const mode = normalizeRecoveryMode(input.mode);
      const flag = {
        schemaVersion: 'recovery.uncleanShutdownFlag.v1',
        recoveryEngine: 'v1',
        canonicalSnapshotSchemaVersion: RECOVERY_SNAPSHOT_SCHEMA_VERSION,
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
      const mode = normalizeRecoveryMode(input.mode);
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
      const mode = normalizeRecoveryMode(input.mode);
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
      const mode = normalizeRecoveryMode(input.mode);
      const event = {
        schemaVersion: 'recovery.workerCheckpoint.v1',
        recoveryEngine: 'v1',
        canonicalSnapshotSchemaVersion: RECOVERY_SNAPSHOT_SCHEMA_VERSION,
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
