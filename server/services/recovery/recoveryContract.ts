import type { V2RecoveryStateSaveReason } from '../../../shared/v2RecoveryStateSchema.ts';

export type RecoveryEngineId = 'v1' | 'v2-stub';
export type RecoveryMode = 'test' | 'real';
export type RecoveryOperationStatus = 'passed' | 'blocked' | 'error' | 'not_implemented';
export type RecoverySnapshotSource = 'manual' | 'automatic' | 'emulate-power-off' | 'worker-start' | 'proof';
export type RecoveryWorkerName = 'regular-worker' | 'playback-worker' | 'screen-worker' | 'unknown';

export interface RecoveryEngineInfo {
  engineId: RecoveryEngineId;
  label: string;
  version: string;
  storage: 'filesystem' | 'stub';
  implemented: boolean;
  strategyRole: 'canonical-state-strategy' | 'stub-strategy';
  supportedSnapshotSchemaVersions: Array<RecoverySnapshot['schemaVersion']>;
  notes: string[];
}

export interface RecoverySnapshot {
  schemaVersion: 'recovery.snapshot.v1';
  snapshotId: string;
  createdAt: string;
  mode: RecoveryMode;
  source: RecoverySnapshotSource;
  metadata: {
    createdByEngine?: RecoveryEngineId;
    createdByAppVersion?: string;
    [key: string]: unknown;
  };
  playback?: {
    currentMediaId?: string;
    currentMediaPath?: string;
    mediaKind?: 'image' | 'video' | 'other' | 'unknown';
    queueCursorIndex?: number;
    queueLength?: number;
    playbackPositionSeconds?: number;
    resumePolicy: 'same-media' | 'next-media' | 'safe-queue-position' | 'none';
  };
  regularWorker?: {
    activeStage?: 'download' | 'index' | 'gps-parser' | 'geocode' | 'queue' | 'unknown' | 'none';
    lastCommittedStage?: string;
    lastRunId?: string;
  };
  screenWorker?: {
    lastScreenState?: 'on' | 'off' | 'fake-off' | 'unknown';
    lastActivitySource?: 'mouse' | 'keyboard' | 'pir' | 'timer' | 'unknown';
  };
  validation: {
    ok: boolean;
    warnings: string[];
    errors: string[];
  };
}

export interface PlaybackResumeTarget {
  schemaVersion: 'recovery.playbackResumeTarget.v1';
  recoveryEngine: RecoveryEngineId;
  mode: RecoveryMode;
  decision: 'resume-same-media' | 'resume-next-media' | 'resume-safe-queue-position' | 'start-from-beginning' | 'none';
  mediaId?: string;
  mediaPath?: string;
  queueCursorIndex?: number;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface RecoveryCheckResult {
  schemaVersion: 'recovery.check.v1';
  recoveryEngine: RecoveryEngineId;
  checkedAt: string;
  mode: RecoveryMode;
  status: RecoveryOperationStatus;
  possibleRestartDetected: boolean;
  uncleanShutdownFlagPresent: boolean;
  snapshotFound: boolean;
  snapshotValid: boolean;
  selectedSnapshotId?: string;
  resumeTarget?: PlaybackResumeTarget;
  warnings: string[];
  errors: string[];
}

export interface RecoveryMutationResult {
  schemaVersion: 'recovery.mutation.v1';
  recoveryEngine: RecoveryEngineId;
  mode: RecoveryMode;
  status: RecoveryOperationStatus;
  operation: string;
  createdAt: string;
  snapshotId?: string;
  filePath?: string;
  warnings: string[];
  errors: string[];
}

export interface SaveRecoveryStateInput {
  mode?: RecoveryMode;
  source?: RecoverySnapshotSource;
  reason?: V2RecoveryStateSaveReason | string;
  snapshot?: unknown;
  playback?: RecoverySnapshot['playback'] | Record<string, unknown>;
  regularWorker?: RecoverySnapshot['regularWorker'] | Record<string, unknown>;
  screenWorker?: RecoverySnapshot['screenWorker'] | Record<string, unknown>;
  queue?: Record<string, unknown>;
  pipeline?: Record<string, unknown>;
  notes?: string[];
}

export interface LoadRecoveryStateInput {
  mode?: RecoveryMode;
}

export interface MarkUncleanShutdownInput {
  mode?: RecoveryMode;
  source?: RecoverySnapshotSource;
  snapshotId?: string;
  reason?: string;
}

export interface ClearUncleanShutdownInput {
  mode?: RecoveryMode;
  reason?: string;
}

export interface RecoveryCheckInput {
  mode?: RecoveryMode;
  source?: string;
}

export interface PlaybackResumeInput {
  mode?: RecoveryMode;
  snapshot?: RecoverySnapshot | null;
}

export interface WorkerRecoveryCheckpointInput {
  mode?: RecoveryMode;
  worker: RecoveryWorkerName;
  event: string;
  stage?: string;
  runId?: string;
  screenState?: 'on' | 'off' | 'fake-off' | 'unknown';
  activitySource?: 'mouse' | 'keyboard' | 'pir' | 'timer' | 'unknown';
  details?: Record<string, unknown>;
}

export interface RecoveryService {
  getActiveEngine(): RecoveryEngineId;
  getEngineInfo(): RecoveryEngineInfo;
  saveState(input?: SaveRecoveryStateInput): Promise<RecoverySnapshot>;
  loadLatestState(input?: LoadRecoveryStateInput): Promise<RecoverySnapshot | null>;
  markUncleanShutdown(input?: MarkUncleanShutdownInput): Promise<RecoveryMutationResult>;
  clearUncleanShutdown(input?: ClearUncleanShutdownInput): Promise<RecoveryMutationResult>;
  checkRestart(input?: RecoveryCheckInput): Promise<RecoveryCheckResult>;
  getPlaybackResumeTarget(input?: PlaybackResumeInput): Promise<PlaybackResumeTarget>;
  recordWorkerCheckpoint(input: WorkerRecoveryCheckpointInput): Promise<RecoveryMutationResult>;
}

export interface RecoveryEngine extends RecoveryService {}

export interface RecoveryServiceOptions {
  repoRoot: string;
  engineId?: string;
  env?: NodeJS.ProcessEnv;
}
