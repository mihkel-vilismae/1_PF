/*
 * Defines the lightweight V2 recovery state snapshot contract.
 * B11.1 is schema-only: it does not save, load, autosave, or restore state.
 */
export const V2_RECOVERY_STATE_SCHEMA_VERSION = 1;

export type V2RecoveryStateSaveReason =
  | 'manual-save'
  | 'autosave-stage-change'
  | 'pre-shutdown'
  | 'restart-detected';

export type V2RecoveryStateMediaKind = 'image' | 'video' | 'other' | 'unknown';

export type V2RecoveryPlaybackContext = {
  currentMediaId: string | null;
  currentFilename: string | null;
  mediaKind: V2RecoveryStateMediaKind;
  queueCursorIndex: number | null;
  queueLength: number;
  playbackPositionSeconds: number | null;
  exactTimestampRequired: false;
};

export type V2RecoveryQueueContext = {
  source: 'backend-playback-queue' | 'v2-browser-local-bridge' | 'unknown';
  preparedMediaCount: number;
  selectedQueueItemId: string | null;
  selectedBackendQueueStatus: string | null;
};

export type V2RecoveryPipelineContext = {
  activeStage: 'download' | 'index' | 'gps-parser' | 'geocode' | 'queue' | 'playback' | 'idle' | 'unknown';
  stageStatuses: Record<string, string>;
  corruptOrPartialDownloadsExcluded: boolean;
};

export type V2RecoveryStateSnapshot = {
  schemaVersion: typeof V2_RECOVERY_STATE_SCHEMA_VERSION;
  savedAtIso: string;
  reason: V2RecoveryStateSaveReason;
  playback: V2RecoveryPlaybackContext;
  queue: V2RecoveryQueueContext;
  pipeline: V2RecoveryPipelineContext;
  notes: string[];
};

export type V2RecoveryStateValidationResult =
  | { ok: true; errors: [] }
  | { ok: false; errors: string[] };

export function createEmptyV2RecoveryStateSnapshot(savedAtIso: string, reason: V2RecoveryStateSaveReason = 'manual-save'): V2RecoveryStateSnapshot {
  return {
    schemaVersion: V2_RECOVERY_STATE_SCHEMA_VERSION,
    savedAtIso,
    reason,
    playback: {
      currentMediaId: null,
      currentFilename: null,
      mediaKind: 'unknown',
      queueCursorIndex: null,
      queueLength: 0,
      playbackPositionSeconds: null,
      exactTimestampRequired: false,
    },
    queue: {
      source: 'unknown',
      preparedMediaCount: 0,
      selectedQueueItemId: null,
      selectedBackendQueueStatus: null,
    },
    pipeline: {
      activeStage: 'idle',
      stageStatuses: {},
      corruptOrPartialDownloadsExcluded: true,
    },
    notes: ['B11.1 schema-only snapshot. Real save/load endpoints arrive later.'],
  };
}

export function validateV2RecoveryStateSnapshot(value: unknown): V2RecoveryStateValidationResult {
  const errors: string[] = [];
  if (!value || typeof value !== 'object') {
    return { ok: false, errors: ['snapshot must be an object'] };
  }
  const snapshot = value as Partial<V2RecoveryStateSnapshot>;
  if (snapshot.schemaVersion !== V2_RECOVERY_STATE_SCHEMA_VERSION) {
    errors.push(`schemaVersion must be ${V2_RECOVERY_STATE_SCHEMA_VERSION}`);
  }
  if (typeof snapshot.savedAtIso !== 'string' || Number.isNaN(Date.parse(snapshot.savedAtIso))) {
    errors.push('savedAtIso must be a parseable ISO timestamp');
  }
  if (!['manual-save', 'autosave-stage-change', 'pre-shutdown', 'restart-detected'].includes(String(snapshot.reason))) {
    errors.push('reason must be a supported recovery save reason');
  }
  if (!snapshot.playback || snapshot.playback.exactTimestampRequired !== false) {
    errors.push('playback.exactTimestampRequired must be false; same media/queue context is enough for V2 recovery');
  }
  if (!snapshot.queue || typeof snapshot.queue.preparedMediaCount !== 'number' || snapshot.queue.preparedMediaCount < 0) {
    errors.push('queue.preparedMediaCount must be a non-negative number');
  }
  if (!snapshot.pipeline || snapshot.pipeline.corruptOrPartialDownloadsExcluded !== true) {
    errors.push('pipeline.corruptOrPartialDownloadsExcluded must be true');
  }
  if (!Array.isArray(snapshot.notes)) {
    errors.push('notes must be an array of strings');
  }
  return errors.length ? { ok: false, errors } : { ok: true, errors: [] };
}
