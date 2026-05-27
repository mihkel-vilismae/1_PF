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

type RuntimeStateLike = {
  truth?: Record<string, unknown>;
  runningProcess?: {
    pipelineStages?: Array<Record<string, unknown>>;
    playbackWorker?: Record<string, unknown>;
    screenWorker?: Record<string, unknown>;
  };
  logs?: Record<string, Array<Record<string, unknown>>>;
  osPlayback?: Partial<Record<OsPlaybackPlatform, OsPlaybackContractStateLike>>;
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
  const contractMedia = normalizeContractMedia(playbackContract);
  const fallbackMedia = normalizeCurrentMedia(state.truth?.currentMedia);
  const media = contractMedia ?? fallbackMedia;
  const queueSummary = buildQueueSummary(playbackContract, readNumber(state.truth?.queueLength, 0));
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
    currentMediaName: media.name,
    currentMediaType: media.type,
    currentMediaUrl: media.displayUrl,
    resolvedAddress: media.resolvedAddress,
    nextIn: media.nextIn,
    stageItems: buildStageItems(state),
    workers: buildWorkerItems(state),
    schedulerLog: buildSchedulerLog(platform),
    errorLog: buildErrorLog(state, platform),
    mainLog: buildMainLog(state, platform),
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
 * Builds the regular/playback/on-off worker status row from available dashboard state.
 */
function buildWorkerItems(state: RuntimeStateLike): PlaybackWorkerViewModel[] {
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
 * Creates placeholder scheduler evidence without claiming live cron/crontab integration.
 */
function buildSchedulerLog(platform: OsPlaybackPlatform): PlaybackLogEntryViewModel[] {
  const schedulerName = platform === OS_PLAYBACK_PLATFORMS.windows ? 'CronEmulator' : 'crontab';
  return [
    { at: 'pending', type: 'info', message: `${schedulerName} regular state worker evidence will appear here.` },
    { at: 'pending', type: 'info', message: `${schedulerName} playback worker evidence will appear here.` },
    { at: 'pending', type: 'info', message: `${schedulerName} on-off worker evidence will appear here.` },
  ];
}

/**
 * Builds the error-only log board from existing dashboard log state.
 */
function buildErrorLog(state: RuntimeStateLike, platform: OsPlaybackPlatform): PlaybackLogEntryViewModel[] {
  const entries = Object.values(state.logs ?? {})
    .flat()
    .filter((entry) => readText(entry.type, '').toLowerCase() === 'error')
    .slice(0, 5)
    .map(toPlaybackLogEntry);

  if (entries.length > 0) {
    return entries;
  }

  return [{ at: 'pending', type: 'info', message: `${platformLabel(platform)} error-only log has no errors yet.` }];
}

/**
 * Builds the main runtime log board from available dashboard logs.
 */
function buildMainLog(state: RuntimeStateLike, platform: OsPlaybackPlatform): PlaybackLogEntryViewModel[] {
  const sourceKeys = platform === OS_PLAYBACK_PLATFORMS.windows ? ['D', 'B4', 'B3.5'] : ['D', 'B4', 'B3.5'];
  const entries = sourceKeys
    .flatMap((key) => state.logs?.[key] ?? [])
    .slice(0, 5)
    .map(toPlaybackLogEntry);

  if (entries.length > 0) {
    return entries;
  }

  return [{ at: 'pending', type: 'info', message: `${platformLabel(platform)} main runtime log is waiting for playback activity.` }];
}

/**
 * Normalizes a dashboard log entry into the playback terminal row shape.
 */
function toPlaybackLogEntry(entry: Record<string, unknown>): PlaybackLogEntryViewModel {
  const normalizedType = readText(entry.type, 'info').toLowerCase();
  const type = ['info', 'error', 'warning', 'success'].includes(normalizedType)
    ? normalizedType as PlaybackLogEntryViewModel['type']
    : 'info';
  return {
    at: readText(entry.atTallinn, readText(entry.at, 'unknown')),
    type,
    message: readText(entry.message, 'No message'),
  };
}

/**
 * Normalizes API contract media into the playback surface display shape.
 */
function normalizeContractMedia(contract: PlaybackContractLike | null | undefined): { name: string; type: string; resolvedAddress: string; nextIn: string; displayUrl: string | null } | null {
  const item = contract?.playback?.currentItem ?? contract?.playback?.nextItem ?? null;
  if (!item) {
    return null;
  }

  const displayName = readText(item.displayName, `Media asset ${readText(item.mediaAssetId, 'unknown')}`);
  const mediaType = readText(item.mediaType, 'media');
  const queueStatus = readText(item.queueStatus, 'queued');
  return {
    name: displayName,
    type: mediaType,
    resolvedAddress: readText(item.resolvedAddress, 'Address pending until GPS/geocode stages produce a resolved address.'),
    nextIn: item === contract?.playback?.currentItem
      ? `Current ${queueStatus} item from playback contract`
      : `Next ${queueStatus} item from playback contract`,
    displayUrl: readText(item.displayUrl, '') || null,
  };
}

/**
 * Normalizes the selected media summary without requiring a queue API in this slice.
 */
function normalizeCurrentMedia(rawMedia: unknown): { name: string; type: string; resolvedAddress: string; nextIn: string; displayUrl: string | null } {
  if (!rawMedia || typeof rawMedia !== 'object') {
    return {
      name: 'No playback queue item selected',
      type: 'waiting',
      resolvedAddress: 'Address pending until GPS/geocode stages produce a resolved address.',
      nextIn: 'Rotation waits for queue item',
      displayUrl: null,
    };
  }

  const media = rawMedia as Record<string, unknown>;
  return {
    name: readText(media.name, 'Selected playback item'),
    type: readText(media.type, 'media'),
    resolvedAddress: readText(media.address, readText(media.resolvedAddress, readText(media.overlay, 'Resolved address pending.'))),
    nextIn: readText(media.nextIn, 'Next rotation interval pending'),
    displayUrl: readText(media.displayUrl, '') || null,
  };
}

/**
 * Builds a queue summary from the API contract, with fallback to older truth state.
 */
function buildQueueSummary(contract: PlaybackContractLike | null | undefined, fallbackQueueLength: number): string {
  const queue = contract?.playback?.queue;
  if (queue) {
    const ready = readNumber(queue.readyCount, 0);
    const total = readNumber(queue.totalCount, 0);
    const failed = readNumber(queue.failedCount, 0);
    return `Queue rows: ${total} total • ${ready} READY • ${failed} FAILED.`;
  }
  return fallbackQueueLength > 0 ? `Queue contains ${fallbackQueueLength} item${fallbackQueueLength === 1 ? '' : 's'}.` : 'No playback queue rows ready yet.';
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
