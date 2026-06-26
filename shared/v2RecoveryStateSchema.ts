/*
 * Defines the lightweight V2 recovery state snapshot contract shared by frontend and backend.
 * The schema stores same-media/queue context only; exact playback timestamp resume is not required.
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


type V2RecoveryUnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is V2RecoveryUnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readNullableText(value: unknown): string | null {
  if (typeof value === 'string' || typeof value === 'number') {
    const text = String(value).trim();
    return text || null;
  }
  return null;
}

function readNonNegativeInteger(value: unknown, fallback: number): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? Math.trunc(numeric) : fallback;
}

function readNullableNonNegativeNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
}

function readSaveReason(value: unknown, fallback: V2RecoveryStateSaveReason): V2RecoveryStateSaveReason {
  return value === 'manual-save' || value === 'autosave-stage-change' || value === 'pre-shutdown' || value === 'restart-detected'
    ? value
    : fallback;
}

function readMediaKind(value: unknown): V2RecoveryStateMediaKind {
  return value === 'image' || value === 'video' || value === 'other' || value === 'unknown' ? value : 'unknown';
}

function readActiveStage(value: unknown): V2RecoveryPipelineContext['activeStage'] {
  return value === 'download' || value === 'index' || value === 'gps-parser' || value === 'geocode' || value === 'queue' || value === 'playback' || value === 'idle' || value === 'unknown'
    ? value
    : 'unknown';
}

function readQueueSource(value: unknown): V2RecoveryQueueContext['source'] {
  return value === 'backend-playback-queue' || value === 'v2-browser-local-bridge' || value === 'unknown'
    ? value
    : 'unknown';
}

function readStringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) {
    return {};
  }
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, String(entry ?? 'unknown')]));
}

function readNotes(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }
  return value
    .map((entry) => String(entry ?? '').trim())
    .filter(Boolean)
    .slice(0, 12);
}

export function normalizeV2RecoveryStateSnapshotInput(
  value: unknown,
  savedAtIso: string,
  fallbackReason: V2RecoveryStateSaveReason = 'manual-save',
): V2RecoveryStateSnapshot {
  const source = isRecord(value) && isRecord(value.snapshot) ? value.snapshot : value;
  if (!isRecord(source)) {
    return createEmptyV2RecoveryStateSnapshot(savedAtIso, fallbackReason);
  }

  const playback = isRecord(source.playback) ? source.playback : {};
  const queue = isRecord(source.queue) ? source.queue : {};
  const pipeline = isRecord(source.pipeline) ? source.pipeline : {};
  const reason = readSaveReason(source.reason, fallbackReason);
  return {
    schemaVersion: V2_RECOVERY_STATE_SCHEMA_VERSION,
    savedAtIso: typeof source.savedAtIso === 'string' && Number.isFinite(Date.parse(source.savedAtIso)) ? source.savedAtIso : savedAtIso,
    reason,
    playback: {
      currentMediaId: readNullableText(playback.currentMediaId),
      currentFilename: readNullableText(playback.currentFilename),
      mediaKind: readMediaKind(playback.mediaKind),
      queueCursorIndex: playback.queueCursorIndex === null || playback.queueCursorIndex === undefined
        ? null
        : readNonNegativeInteger(playback.queueCursorIndex, 0),
      queueLength: readNonNegativeInteger(playback.queueLength, 0),
      playbackPositionSeconds: readNullableNonNegativeNumber(playback.playbackPositionSeconds),
      exactTimestampRequired: false,
    },
    queue: {
      source: readQueueSource(queue.source),
      preparedMediaCount: readNonNegativeInteger(queue.preparedMediaCount, 0),
      selectedQueueItemId: readNullableText(queue.selectedQueueItemId),
      selectedBackendQueueStatus: readNullableText(queue.selectedBackendQueueStatus),
    },
    pipeline: {
      activeStage: readActiveStage(pipeline.activeStage),
      stageStatuses: readStringRecord(pipeline.stageStatuses),
      corruptOrPartialDownloadsExcluded: true,
    },
    notes: readNotes(source.notes, [`${reason} recovery snapshot normalized without secrets.`]),
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
