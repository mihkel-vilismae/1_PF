import { randomUUID } from 'node:crypto';
import type {
  RecoveryEngineId,
  RecoveryMode,
  RecoverySnapshot,
  RecoverySnapshotSource,
  SaveRecoveryStateInput,
} from './recoveryContract.ts';

export const RECOVERY_SNAPSHOT_SCHEMA_VERSION = 'recovery.snapshot.v1' as const;
export const SUPPORTED_RECOVERY_SNAPSHOT_SCHEMA_VERSIONS = [RECOVERY_SNAPSHOT_SCHEMA_VERSION] as const;

type JsonRecord = Record<string, unknown>;

export function nowIso(): string {
  return new Date().toISOString();
}

export function safeTimestamp(value: string = nowIso()): string {
  return value.replace(/[:.]/g, '-');
}

export function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function normalizeRecoveryMode(value: unknown): RecoveryMode {
  return value === 'test' ? 'test' : 'real';
}

export function normalizeRecoveryEngineId(value: unknown): RecoveryEngineId | undefined {
  return value === 'v1' || value === 'v2-stub' ? value : undefined;
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

function parseableIsoOrNow(value: unknown): string {
  const text = readString(value);
  return text && Number.isFinite(Date.parse(text)) ? text : nowIso();
}

export interface NormalizeRecoverySnapshotOptions {
  createdByEngine?: RecoveryEngineId;
  createdByAppVersion?: string;
}

export function normalizeRecoverySnapshot(input: SaveRecoveryStateInput = {}, options: NormalizeRecoverySnapshotOptions = {}): RecoverySnapshot {
  const source = sourceRecord(input);
  const playbackSource: JsonRecord = isRecord(input.playback) ? input.playback : isRecord(source.playback) ? source.playback : {};
  const queueSource: JsonRecord = isRecord(input.queue) ? input.queue : isRecord(source.queue) ? source.queue : {};
  const pipelineSource: JsonRecord = isRecord(input.pipeline) ? input.pipeline : isRecord(source.pipeline) ? source.pipeline : {};
  const regularWorkerSource: JsonRecord = isRecord(input.regularWorker) ? input.regularWorker : isRecord(source.regularWorker) ? source.regularWorker : {};
  const screenWorkerSource: JsonRecord = isRecord(input.screenWorker) ? input.screenWorker : isRecord(source.screenWorker) ? source.screenWorker : {};
  const metadataSource: JsonRecord = isRecord(source.metadata) ? source.metadata : {};

  const createdAt = parseableIsoOrNow(source.createdAt);
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

  const createdByEngine = normalizeRecoveryEngineId(metadataSource.createdByEngine)
    ?? normalizeRecoveryEngineId(source.createdByEngine)
    ?? normalizeRecoveryEngineId(source.recoveryEngine)
    ?? options.createdByEngine;
  const createdByAppVersion = readString(metadataSource.createdByAppVersion) ?? readString(source.createdByAppVersion) ?? options.createdByAppVersion;

  const snapshot: RecoverySnapshot = {
    schemaVersion: RECOVERY_SNAPSHOT_SCHEMA_VERSION,
    snapshotId: readString(source.snapshotId) ?? `recovery-${safeTimestamp(createdAt)}-${randomUUID().slice(0, 8)}`,
    createdAt,
    mode: normalizeRecoveryMode(input.mode ?? source.mode),
    source: normalizeSource(input.source ?? source.source ?? (input.reason === 'pre-shutdown' ? 'automatic' : 'manual')),
    metadata: {
      ...(createdByEngine ? { createdByEngine } : {}),
      ...(createdByAppVersion ? { createdByAppVersion } : {}),
    },
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

  validateRecoverySnapshotInPlace(snapshot);
  return snapshot;
}

export function validateRecoverySnapshotInPlace(snapshot: RecoverySnapshot): void {
  const warnings: string[] = [];
  const errors: string[] = [];
  if (snapshot.schemaVersion !== RECOVERY_SNAPSHOT_SCHEMA_VERSION) errors.push(`schemaVersion must be ${RECOVERY_SNAPSHOT_SCHEMA_VERSION}`);
  if (!snapshot.snapshotId) errors.push('snapshotId is required');
  if (!Number.isFinite(Date.parse(snapshot.createdAt))) errors.push('createdAt must be parseable ISO');
  if (snapshot.mode !== 'real' && snapshot.mode !== 'test') errors.push('mode must be real or test');
  if (snapshot.metadata?.createdByEngine && !normalizeRecoveryEngineId(snapshot.metadata.createdByEngine)) {
    warnings.push(`metadata.createdByEngine is informational only and is not a known engine: ${snapshot.metadata.createdByEngine}`);
  }
  if (!snapshot.playback?.currentMediaId && !snapshot.playback?.currentMediaPath && snapshot.playback?.queueCursorIndex === undefined) {
    warnings.push('No exact playback media or queue cursor was supplied; recovery strategy may start from beginning.');
  }
  snapshot.validation = { ok: errors.length === 0, warnings, errors };
}

export function isRecoverySnapshot(value: unknown): value is RecoverySnapshot {
  if (!isRecord(value)) return false;
  const candidate = value as Partial<RecoverySnapshot> & Record<string, unknown>;
  return candidate.schemaVersion === RECOVERY_SNAPSHOT_SCHEMA_VERSION && typeof candidate.snapshotId === 'string';
}

export function recoverySnapshotSupportsCanonicalState(value: unknown): boolean {
  return isRecoverySnapshot(value) && value.schemaVersion === RECOVERY_SNAPSHOT_SCHEMA_VERSION;
}
