/*
 * Builds view models for the OS-specific playback views.
 * The model keeps Windows/Raspberry labels, stages, workers, and logs centralized
 * so the view renderer stays additive and does not reach into backend internals.
 */

export const OS_PLAYBACK_PLATFORMS = Object.freeze({
  windows: 'windows',
  raspberry: 'raspberry',
} as const);

export type OsPlaybackPlatform = (typeof OS_PLAYBACK_PLATFORMS)[keyof typeof OS_PLAYBACK_PLATFORMS];

export type PlaybackStageViewModel = {
  key: string;
  label: string;
  status: string;
  actionHint: string;
};

export type PlaybackWorkerViewModel = {
  key: string;
  label: string;
  status: string;
  lastCalled: string;
  sinceLastCall: string;
  summary: string;
};

export type PlaybackLogEntryViewModel = {
  at: string;
  type: 'info' | 'error' | 'warning' | 'success';
  message: string;
};

export type PlaybackQueueItemViewModel = {
  mediaAssetId: string | null;
  displayName: string;
  mediaType: string;
  queueStatus: string;
  resolvedAddress: string;
  displayUrl: string | null;
  position: string;
};

export type PlaybackRotationViewModel = {
  activeIndex: number;
  itemCount: number;
  canRotate: boolean;
  paused: boolean;
  fullscreen: boolean;
  intervalSeconds: number;
  status: string;
  nextIn: string;
  toggleLabel: string;
};

export type OsPlaybackViewModel = {
  platform: OsPlaybackPlatform;
  code: 'WIN' | 'RPI';
  title: string;
  eyebrow: string;
  sourceBadge: 'hybrid' | 'real' | 'mock';
  sourceLabel: string;
  modeLabel: string;
  description: string;
  schedulerTitle: string;
  schedulerSummary: string;
  playbackStatus: string;
  queueSummary: string;
  currentMediaName: string;
  currentMediaType: string;
  currentMediaUrl: string | null;
  resolvedAddress: string;
  nextIn: string;
  playbackItems: PlaybackQueueItemViewModel[];
  rotation: PlaybackRotationViewModel;
  stageItems: PlaybackStageViewModel[];
  workers: PlaybackWorkerViewModel[];
  schedulerLog: PlaybackLogEntryViewModel[];
  errorLog: PlaybackLogEntryViewModel[];
  mainLog: PlaybackLogEntryViewModel[];
};

type PlaybackContractItemLike = {
  mediaAssetId?: unknown;
  displayName?: unknown;
  mediaType?: unknown;
  resolvedAddress?: unknown;
  hasResolvedAddress?: unknown;
  queueStatus?: unknown;
  displayUrl?: unknown;
};

type PlaybackContractLike = {
  status?: unknown;
  messages?: unknown;
  runtimeMode?: unknown;
  mediaBasePath?: unknown;
  playback?: {
    currentItem?: PlaybackContractItemLike | null;
    nextItem?: PlaybackContractItemLike | null;
    items?: PlaybackContractItemLike[];
    queue?: {
      totalCount?: unknown;
      readyCount?: unknown;
      failedCount?: unknown;
      returnedCount?: unknown;
    };
  };
};

type OsPlaybackContractStateLike = {
  status: 'idle' | 'loading' | 'ready' | 'error';
  loadedAt?: string;
  error?: string;
  contract?: PlaybackContractLike;
};

type PlaybackObservabilityLike = {
  status?: unknown;
  messages?: unknown;
  workers?: unknown[];
  scheduler?: {
    entries?: unknown[];
    message?: unknown;
  };
  logs?: {
    error?: { entries?: unknown[]; message?: unknown };
    main?: { entries?: unknown[]; message?: unknown };
  };
};

type OsPlaybackObservabilityStateLike = {
  status?: 'idle' | 'loading' | 'ready' | 'error';
  loadedAt?: string;
  error?: string;
  payload?: PlaybackObservabilityLike;
};

type OsPlaybackRotationStateLike = {
  activeIndex?: unknown;
  paused?: unknown;
  fullscreen?: unknown;
  intervalSeconds?: unknown;
  nextRotationAtIso?: unknown;
};

type RuntimeStateLike = {
  truth?: Record<string, unknown>;
  runningProcess?: {
    pipelineStages?: Array<Record<string, unknown>>;
    playbackWorker?: Record<string, unknown>;
    screenWorker?: Record<string, unknown>;
  };
  logs?: Record<string, Array<Record<string, unknown>>>;
  osPlayback?: Partial<Record<OsPlaybackPlatform, OsPlaybackContractStateLike>>;
  osPlaybackObservability?: Partial<Record<OsPlaybackPlatform, OsPlaybackObservabilityStateLike>>;
  osPlaybackRotation?: Partial<Record<OsPlaybackPlatform, OsPlaybackRotationStateLike>>;
};

const PLATFORM_COPY = Object.freeze({
  windows: {
    code: 'WIN',
    title: 'Windows Playback View',
    eyebrow: 'Windows-only development playback',
    sourceBadge: 'hybrid',
    sourceLabel: 'WINDOWS DEV',
    modeLabel: 'Windows / CronEmulator',
    description: 'Preview and operate the playback surface on Windows while keeping scheduler visibility tied to the CronEmulator path.',
    schedulerTitle: 'Windows CronEmulator activity',
    schedulerSummary: 'Shows scheduler simulation activity for regular state, playback, and on-off workers.',
  },
  raspberry: {
    code: 'RPI',
    title: 'Raspberry OS Playback View',
    eyebrow: 'Raspberry OS deployment playback',
    sourceBadge: 'real',
    sourceLabel: 'RASPBERRY REAL',
    modeLabel: 'Raspberry OS / crontab',
    description: 'Preview the Raspberry Pi playback surface and prepare the final fullscreen frame mode around real crontab worker activity.',
    schedulerTitle: 'Raspberry OS crontab activity',
    schedulerSummary: 'Shows real crontab activity for regular state, playback, and on-off workers once those contracts are wired.',
  },
} as const);

const PIPELINE_STAGE_ORDER = Object.freeze([
  { key: 'download', label: 'Download', statusKey: 'B3.1', actionHint: 'Run or inspect download stage' },
  { key: 'index', label: 'Index', statusKey: 'B3.2', actionHint: 'Run or inspect media index stage' },
  { key: 'gps', label: 'GPS parser', statusKey: 'B3.3', actionHint: 'Run or inspect GPS parser stage' },
  { key: 'geocode', label: 'Geocode', statusKey: 'B3.4', actionHint: 'Run or inspect address resolving stage' },
  { key: 'queue', label: 'Queue / Q', statusKey: 'B3.5', actionHint: 'Run or inspect playback queue stage' },
]);

/**
 * Builds a platform-specific playback view model from the dashboard state.
 * Slice 2 prefers the read-only playback API contract and keeps old state fallback.
 */
export function buildOsPlaybackViewModel(state: RuntimeStateLike, platform: OsPlaybackPlatform): OsPlaybackViewModel {
  const copy = PLATFORM_COPY[platform];
  const contractState = state.osPlayback?.[platform];
  const playbackContract = contractState?.contract;
  const observabilityState = state.osPlaybackObservability?.[platform];
  const observabilityPayload = observabilityState?.payload;
  const fallbackMedia = normalizeCurrentMedia(state.truth?.currentMedia);
  const playbackItems = normalizePlaybackItems(playbackContract, fallbackMedia);
  const defaultActiveIndex = inferDefaultActiveIndex(playbackItems, playbackContract);
  const rotation = buildRotationViewModel(state.osPlaybackRotation?.[platform], playbackItems.length, defaultActiveIndex);
  const media = playbackItems[rotation.activeIndex] ?? fallbackMedia;
  const queueSummary = buildQueueSummary(playbackContract, readNumber(state.truth?.queueLength, 0), playbackItems.length);
  const playbackStatus = buildPlaybackStatus(contractState, playbackContract, readText(state.truth?.playbackStatus, 'Waiting for queued media'));

  return {
    platform,
    code: copy.code,
    title: copy.title,
    eyebrow: copy.eyebrow,
    sourceBadge: copy.sourceBadge,
    sourceLabel: copy.sourceLabel,
    modeLabel: copy.modeLabel,
    description: copy.description,
    schedulerTitle: copy.schedulerTitle,
    schedulerSummary: copy.schedulerSummary,
    playbackStatus,
    queueSummary,
    currentMediaName: media.displayName,
    currentMediaType: media.mediaType,
    currentMediaUrl: media.displayUrl,
    resolvedAddress: media.resolvedAddress,
    nextIn: rotation.nextIn,
    playbackItems,
    rotation,
    stageItems: buildStageItems(state),
    workers: buildWorkerItems(state, observabilityPayload),
    schedulerLog: buildSchedulerLog(platform, observabilityPayload, observabilityState),
    errorLog: buildErrorLog(state, platform, observabilityPayload, observabilityState),
    mainLog: buildMainLog(state, platform, observabilityPayload, observabilityState),
  };
}

/**
 * Converts known runtime stage state into the compact stage row shown on playback views.
 */
function buildStageItems(state: RuntimeStateLike): PlaybackStageViewModel[] {
  return PIPELINE_STAGE_ORDER.map((stage) => {
    const runningStage = state.runningProcess?.pipelineStages?.find((item) => item.key === stage.key);
    return {
      key: stage.key,
      label: stage.label,
      status: readText(runningStage?.status, readText((state as { statusByKey?: Record<string, unknown> }).statusByKey?.[stage.statusKey], 'Idle')),
      actionHint: stage.actionHint,
    };
  });
}

/**
 * Builds the regular/playback/on-off worker status row from backend observability when present.
 */
function buildWorkerItems(state: RuntimeStateLike, observability: PlaybackObservabilityLike | null | undefined): PlaybackWorkerViewModel[] {
  const backendWorkers = Array.isArray(observability?.workers) ? observability?.workers ?? [] : [];
  const normalizedBackendWorkers = backendWorkers
    .map(normalizeObservabilityWorker)
    .filter((worker): worker is PlaybackWorkerViewModel => worker !== null);

  if (normalizedBackendWorkers.length > 0) {
    return normalizedBackendWorkers;
  }

  const playbackWorker = state.runningProcess?.playbackWorker ?? {};
  const screenWorker = state.runningProcess?.screenWorker ?? {};

  return [
    {
      key: 'regular-state-worker',
      label: 'Regular state worker',
      status: inferPipelineWorkerStatus(state),
      lastCalled: inferPipelineWorkerLastRun(state),
      sinceLastCall: 'Waiting for first scheduler evidence',
      summary: 'Owns regular Download → Index → GPS → Geocode → Queue stage checks.',
    },
    {
      key: 'playback-worker',
      label: 'Playback worker',
      status: readText(playbackWorker.status, 'Inactive'),
      lastCalled: readText(playbackWorker.heartbeat, 'Never'),
      sinceLastCall: 'Waiting for heartbeat timestamp',
      summary: readText(playbackWorker.summary, 'Selects the current playable queue item; rendering remains UI/fullscreen-owned.'),
    },
    {
      key: 'on-off-worker',
      label: 'On-off worker',
      status: readText(screenWorker.status, 'Inactive'),
      lastCalled: readText(screenWorker.heartbeat, 'Never'),
      sinceLastCall: 'Waiting for heartbeat timestamp',
      summary: readText(screenWorker.summary, 'Tracks screen wake/keep-on state before real fullscreen reuse.'),
    },
  ];
}

/**
 * Creates scheduler evidence from backend observability instead of placeholders when available.
 */
function buildSchedulerLog(
  platform: OsPlaybackPlatform,
  observability: PlaybackObservabilityLike | null | undefined,
  observabilityState: OsPlaybackObservabilityStateLike | null | undefined,
): PlaybackLogEntryViewModel[] {
  const entries = normalizeObservabilityLogEntries(observability?.scheduler?.entries);
  if (entries.length > 0) {
    return entries;
  }
  if (observabilityState?.status === 'error') {
    return [{ at: 'error', type: 'error', message: `Scheduler observability failed: ${readText(observabilityState.error, 'unknown error')}` }];
  }

  const schedulerName = platform === OS_PLAYBACK_PLATFORMS.windows ? 'CronEmulator' : 'crontab';
  return [
    { at: 'pending', type: 'info', message: `${schedulerName} regular state worker evidence will appear here.` },
    { at: 'pending', type: 'info', message: `${schedulerName} playback worker evidence will appear here.` },
    { at: 'pending', type: 'info', message: `${schedulerName} on-off worker evidence will appear here.` },
  ];
}

/**
 * Builds the error-only log board from backend error.log observability when available.
 */
function buildErrorLog(
  state: RuntimeStateLike,
  platform: OsPlaybackPlatform,
  observability: PlaybackObservabilityLike | null | undefined,
  observabilityState: OsPlaybackObservabilityStateLike | null | undefined,
): PlaybackLogEntryViewModel[] {
  const entries = normalizeObservabilityLogEntries(observability?.logs?.error?.entries);
  if (entries.length > 0) {
    return entries.filter((entry) => entry.type === 'error').slice(0, 8);
  }
  if (observabilityState?.status === 'error') {
    return [{ at: 'error', type: 'error', message: `Error-log observability failed: ${readText(observabilityState.error, 'unknown error')}` }];
  }

  const localEntries = Object.values(state.logs ?? {})
    .flat()
    .filter((entry) => readText(entry.type, '').toLowerCase() === 'error')
    .slice(0, 5)
    .map(toPlaybackLogEntry);

  if (localEntries.length > 0) {
    return localEntries;
  }

  return [{ at: 'pending', type: 'info', message: `${platformLabel(platform)} error-only log has no errors yet.` }];
}

/**
 * Builds the main runtime log board from backend full_log.log observability when available.
 */
function buildMainLog(
  state: RuntimeStateLike,
  platform: OsPlaybackPlatform,
  observability: PlaybackObservabilityLike | null | undefined,
  observabilityState: OsPlaybackObservabilityStateLike | null | undefined,
): PlaybackLogEntryViewModel[] {
  const entries = normalizeObservabilityLogEntries(observability?.logs?.main?.entries);
  if (entries.length > 0) {
    return entries.slice(0, 8);
  }
  if (observabilityState?.status === 'error') {
    return [{ at: 'error', type: 'error', message: `Main-log observability failed: ${readText(observabilityState.error, 'unknown error')}` }];
  }

  const sourceKeys = platform === OS_PLAYBACK_PLATFORMS.windows ? ['D', 'B4', 'B3.5'] : ['D', 'B4', 'B3.5'];
  const localEntries = sourceKeys
    .flatMap((key) => state.logs?.[key] ?? [])
    .slice(0, 5)
    .map(toPlaybackLogEntry);

  if (localEntries.length > 0) {
    return localEntries;
  }

  return [{ at: 'pending', type: 'info', message: `${platformLabel(platform)} main runtime log is waiting for playback activity.` }];
}

/**
 * Normalizes a backend worker row into the playback worker view model.
 */
function normalizeObservabilityWorker(value: unknown): PlaybackWorkerViewModel | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const worker = value as Record<string, unknown>;
  return {
    key: readText(worker.key, 'worker'),
    label: readText(worker.label, 'Worker'),
    status: readText(worker.status, 'Waiting'),
    lastCalled: readText(worker.lastCalled, 'Never'),
    sinceLastCall: readText(worker.sinceLastCall, 'No worker call observed yet'),
    summary: readText(worker.summary, 'Waiting for worker observability evidence.'),
  };
}

/**
 * Normalizes backend terminal entries into the renderer's log row shape.
 */
function normalizeObservabilityLogEntries(value: unknown): PlaybackLogEntryViewModel[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === 'object' && !Array.isArray(entry)))
    .map((entry) => ({
      at: readText(entry.at, readText(entry.atIso, 'unknown')),
      type: normalizeLogEntryType(entry.type),
      message: readText(entry.message, 'No message'),
    }));
}

/**
 * Normalizes a dashboard log entry into the playback terminal row shape.
 */
function toPlaybackLogEntry(entry: Record<string, unknown>): PlaybackLogEntryViewModel {
  return {
    at: readText(entry.atTallinn, readText(entry.at, 'unknown')),
    type: normalizeLogEntryType(entry.type),
    message: readText(entry.message, 'No message'),
  };
}

/**
 * Narrows arbitrary terminal row types to the four CSS-supported severities.
 */
function normalizeLogEntryType(value: unknown): PlaybackLogEntryViewModel['type'] {
  const normalizedType = readText(value, 'info').toLowerCase();
  if (normalizedType === 'error' || normalizedType === 'cron-run-failed') {
    return 'error';
  }
  if (normalizedType === 'warning' || normalizedType === 'warn') {
    return 'warning';
  }
  if (normalizedType === 'success' || normalizedType === 'cron-run-success') {
    return 'success';
  }
  return 'info';
}

/**
 * Builds a queue item list from the playback API contract with a safe fallback.
 */
function normalizePlaybackItems(
  contract: PlaybackContractLike | null | undefined,
  fallbackMedia: PlaybackQueueItemViewModel,
): PlaybackQueueItemViewModel[] {
  const contractItems = Array.isArray(contract?.playback?.items) ? contract?.playback?.items ?? [] : [];
  const candidates = contractItems.length > 0
    ? contractItems
    : [contract?.playback?.currentItem, contract?.playback?.nextItem].filter(Boolean) as PlaybackContractItemLike[];

  const normalized = candidates
    .map((item, index) => normalizePlaybackItem(item, index, candidates.length))
    .filter((item) => item.displayUrl || item.displayName !== 'No playback queue item selected');

  if (normalized.length > 0) {
    return dedupePlaybackItems(normalized).map((item, index, list) => ({
      ...item,
      position: `${index + 1} of ${list.length}`,
    }));
  }

  return [fallbackMedia];
}

/**
 * Converts one playback API item into the renderer's item shape.
 */
function normalizePlaybackItem(item: PlaybackContractItemLike | null | undefined, index: number, total: number): PlaybackQueueItemViewModel {
  const mediaAssetId = readText(item?.mediaAssetId, '');
  const displayName = readText(item?.displayName, mediaAssetId ? `Media asset ${mediaAssetId}` : 'Selected playback item');
  return {
    mediaAssetId: mediaAssetId || null,
    displayName,
    mediaType: readText(item?.mediaType, 'media'),
    queueStatus: readText(item?.queueStatus, 'queued'),
    resolvedAddress: readText(item?.resolvedAddress, 'Address pending until GPS/geocode stages produce a resolved address.'),
    displayUrl: readText(item?.displayUrl, '') || null,
    position: `${index + 1} of ${Math.max(total, 1)}`,
  };
}

/**
 * Removes repeated current/next queue items while keeping stable API order.
 */
function dedupePlaybackItems(items: PlaybackQueueItemViewModel[]): PlaybackQueueItemViewModel[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.mediaAssetId ?? `${item.displayName}|${item.displayUrl ?? ''}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Chooses the initial queue index from the current API item when available.
 */
function inferDefaultActiveIndex(items: PlaybackQueueItemViewModel[], contract: PlaybackContractLike | null | undefined): number {
  const currentMediaAssetId = readText(contract?.playback?.currentItem?.mediaAssetId, '');
  if (!currentMediaAssetId) {
    return 0;
  }
  const index = items.findIndex((item) => item.mediaAssetId === currentMediaAssetId);
  return index >= 0 ? index : 0;
}

/**
 * Builds rotation/fullscreen display state without starting timers in the view model.
 */
function buildRotationViewModel(
  rotationState: OsPlaybackRotationStateLike | null | undefined,
  itemCount: number,
  defaultActiveIndex: number,
): PlaybackRotationViewModel {
  const intervalSeconds = Math.max(3, Math.min(120, readNumber(rotationState?.intervalSeconds, 12)));
  const activeIndex = clampIndex(readNumber(rotationState?.activeIndex, defaultActiveIndex), itemCount);
  const paused = rotationState?.paused !== false;
  const fullscreen = rotationState?.fullscreen === true;
  const canRotate = itemCount > 1;
  const secondsUntilNext = readSecondsUntilNext(rotationState?.nextRotationAtIso);
  const nextIn = canRotate
    ? paused
      ? 'Rotation paused'
      : `Next in ${secondsUntilNext}s`
    : 'Rotation waits for more than one queue item';

  return {
    activeIndex,
    itemCount,
    canRotate,
    paused,
    fullscreen,
    intervalSeconds,
    status: canRotate ? `Showing ${activeIndex + 1} of ${itemCount}` : 'Single item / waiting queue',
    nextIn,
    toggleLabel: paused ? 'Start rotation' : 'Pause rotation',
  };
}

/**
 * Clamps a queue index against the current playback item count.
 */
function clampIndex(value: number, itemCount: number): number {
  if (itemCount <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(itemCount - 1, Math.trunc(value)));
}

/**
 * Reads the countdown for the next browser-side queue rotation.
 */
function readSecondsUntilNext(value: unknown): number {
  const timestamp = Date.parse(readText(value, ''));
  if (!Number.isFinite(timestamp)) {
    return 0;
  }
  return Math.max(0, Math.ceil((timestamp - Date.now()) / 1000));
}

/**
 * Normalizes the selected media summary without requiring a queue API in this slice.
 */
function normalizeCurrentMedia(rawMedia: unknown): PlaybackQueueItemViewModel {
  if (!rawMedia || typeof rawMedia !== 'object') {
    return {
      mediaAssetId: null,
      displayName: 'No playback queue item selected',
      mediaType: 'waiting',
      queueStatus: 'waiting',
      resolvedAddress: 'Address pending until GPS/geocode stages produce a resolved address.',
      displayUrl: null,
      position: '0 of 0',
    };
  }

  const media = rawMedia as Record<string, unknown>;
  return {
    mediaAssetId: null,
    displayName: readText(media.name, 'Selected playback item'),
    mediaType: readText(media.type, 'media'),
    queueStatus: 'selected',
    resolvedAddress: readText(media.address, readText(media.resolvedAddress, readText(media.overlay, 'Resolved address pending.'))),
    displayUrl: readText(media.displayUrl, '') || null,
    position: '1 of 1',
  };
}

/**
 * Builds a queue summary from the API contract, with fallback to older truth state.
 */
function buildQueueSummary(contract: PlaybackContractLike | null | undefined, fallbackQueueLength: number, playbackItemCount: number): string {
  const queue = contract?.playback?.queue;
  if (queue) {
    const ready = readNumber(queue.readyCount, 0);
    const total = readNumber(queue.totalCount, 0);
    const failed = readNumber(queue.failedCount, 0);
    return `Queue rows: ${total} total • ${ready} READY • ${failed} FAILED • ${playbackItemCount} loaded for rotation.`;
  }
  return fallbackQueueLength > 0 ? `Queue contains ${fallbackQueueLength} item${fallbackQueueLength === 1 ? '' : 's'}; ${playbackItemCount} loaded for rotation.` : 'No playback queue rows ready yet.';
}

/**
 * Builds the playback status line from loaded API state or the original fallback state.
 */
function buildPlaybackStatus(
  contractState: OsPlaybackContractStateLike | undefined,
  contract: PlaybackContractLike | null | undefined,
  fallbackStatus: string,
): string {
  if (contractState?.status === 'loading') {
    return 'Loading playback contract from backend.';
  }
  if (contractState?.status === 'error') {
    return `Playback contract load failed: ${readText(contractState.error, 'unknown error')}.`;
  }
  if (contract?.messages && Array.isArray(contract.messages) && contract.messages.length > 0) {
    return readText(contract.messages[0], fallbackStatus);
  }
  return fallbackStatus;
}

/**
 * Infers regular worker status from the running process stage row.
 */
function inferPipelineWorkerStatus(state: RuntimeStateLike): string {
  const stages = state.runningProcess?.pipelineStages ?? [];
  if (stages.some((stage) => readText(stage.status, '').toLowerCase() === 'running')) {
    return 'Running';
  }
  if (stages.some((stage) => readText(stage.status, '').toLowerCase() === 'error')) {
    return 'Error';
  }
  return 'Inactive';
}

/**
 * Infers the latest regular worker call time from stage metadata.
 */
function inferPipelineWorkerLastRun(state: RuntimeStateLike): string {
  const stages = state.runningProcess?.pipelineStages ?? [];
  const lastRun = stages.map((stage) => readText(stage.lastRun, '')).find((value) => value && value !== 'Never');
  return lastRun || 'Never';
}

/**
 * Returns the human-facing platform label used in default log rows.
 */
function platformLabel(platform: OsPlaybackPlatform): string {
  return platform === OS_PLAYBACK_PLATFORMS.windows ? 'Windows playback' : 'Raspberry playback';
}

/**
 * Reads a number with a safe fallback.
 */
function readNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/**
 * Reads a trimmed string with a fallback for missing values.
 */
function readText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}
