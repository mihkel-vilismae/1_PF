/*
 * Pure Debug page helpers for browser-local, proofable Debug UI behavior.
 * These helpers deliberately model test/fake state only. They do not write
 * production media, mutate real crontab, or spawn real workers.
 */

export type DebugWorkerKey = 'regular' | 'playback' | 'screen';

export type DebugActionStatus = 'planned' | 'blocked' | 'ready' | 'running' | 'succeeded' | 'failed';

export type DebugActionResult = {
  action: string;
  status: DebugActionStatus;
  timestamp: string;
  evidence: string;
  message: string;
};

export type DebugTestMediaItem = {
  id: string;
  displayName: string;
  storage: 'isolated-test-only';
  addedAt: string;
  source: string;
};

export type DebugWorkerTelemetry = {
  key: DebugWorkerKey;
  label: string;
  firstCalledAt: string | null;
  lastCalledAt: string | null;
  calledCount: number;
  currentStatus: 'idle' | 'mock-running' | 'mock-succeeded';
  evidence: string;
};

export type DebugCrontabParseResult = {
  status: 'missing' | 'active' | 'paused' | 'malformed' | 'unknown';
  appOwnedLines: string[];
  unrelatedLines: string[];
  warnings: string[];
  hasHighFrequencyInterval: boolean;
};

export type DebugCrontabState = {
  editableContent: string;
  parseResult: DebugCrontabParseResult;
  pendingWarning: string | null;
  lastFakeMutation: DebugActionResult | null;
};

export type DebugPageState = {
  route: '/debug';
  openedAt: string | null;
  actionResults: Record<string, DebugActionResult>;
  testMedia: DebugTestMediaItem[];
  workers: Record<DebugWorkerKey, DebugWorkerTelemetry>;
  crontab: DebugCrontabState;
};

export const DEBUG_ROUTE = '/debug' as const;
export const DEBUG_VIEW_ID = 'DEBUG' as const;
export const PHOTOFRAME_CRONTAB_BEGIN = '# PF_LOGIN_DEBUG_FAKE_CRONTAB_BEGIN';
export const PHOTOFRAME_CRONTAB_END = '# PF_LOGIN_DEBUG_FAKE_CRONTAB_END';
export const DEBUG_CRONTAB_PENDING_WARNING = 'Setting is not applied yet. Press Install into crontab.';

export function formatTallinnDebugTimestamp(date = new Date()): string {
  return new Intl.DateTimeFormat('et-EE', {
    timeZone: 'Europe/Tallinn',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

export function createDebugActionResult(action: string, status: DebugActionStatus, message: string, evidence = 'debug-page-local-state'): DebugActionResult {
  return {
    action,
    status,
    timestamp: formatTallinnDebugTimestamp(),
    evidence,
    message,
  };
}

export function buildDefaultDebugPageState(): DebugPageState {
  return {
    route: DEBUG_ROUTE,
    openedAt: null,
    actionResults: {},
    testMedia: [],
    workers: {
      regular: createWorkerTelemetry('regular', 'Regular Worker Debug Pane'),
      playback: createWorkerTelemetry('playback', 'Playback Worker Debug Pane'),
      screen: createWorkerTelemetry('screen', 'On/off Worker Debug Pane'),
    },
    crontab: {
      editableContent: buildDefaultFakeCrontab(),
      parseResult: parseDebugCrontab(buildDefaultFakeCrontab()),
      pendingWarning: null,
      lastFakeMutation: null,
    },
  };
}

function createWorkerTelemetry(key: DebugWorkerKey, label: string): DebugWorkerTelemetry {
  return {
    key,
    label,
    firstCalledAt: null,
    lastCalledAt: null,
    calledCount: 0,
    currentStatus: 'idle',
    evidence: 'mock-only: worker has not been invoked',
  };
}




export function setDebugCrontabContent(state: DebugPageState, content: string): DebugPageState {
  return {
    ...state,
    crontab: {
      ...state.crontab,
      editableContent: content,
      parseResult: parseDebugCrontab(content),
      pendingWarning: null,
    },
  };
}

export function readFakeDebugCrontab(state: DebugPageState): DebugPageState {
  const parseResult = parseDebugCrontab(state.crontab.editableContent);
  return {
    ...state,
    crontab: {
      ...state.crontab,
      parseResult,
      lastFakeMutation: createDebugActionResult(
        'read-current-crontab',
        'succeeded',
        'Parsed fake/app-owned crontab content read-only. No system crontab was read or written.',
        'debug-page-fake-crontab-parser',
      ),
    },
    actionResults: {
      ...state.actionResults,
      'read-current-crontab': createDebugActionResult(
        'read-current-crontab',
        'succeeded',
        'Parsed fake/app-owned crontab content read-only. No system crontab was read or written.',
        'debug-page-fake-crontab-parser',
      ),
    },
  };
}

export function runMockDebugWorker(state: DebugPageState, key: DebugWorkerKey): DebugPageState {
  const worker = state.workers[key];
  const now = formatTallinnDebugTimestamp();
  return {
    ...state,
    workers: {
      ...state.workers,
      [key]: {
        ...worker,
        firstCalledAt: worker.firstCalledAt ?? now,
        lastCalledAt: now,
        calledCount: worker.calledCount + 1,
        currentStatus: 'mock-succeeded',
        evidence: `mock-only: ${worker.label} safe Run now simulated at ${now}`,
      },
    },
    actionResults: {
      ...state.actionResults,
      [`worker-${key}-run-now`]: createDebugActionResult(
        `worker-${key}-run-now`,
        'succeeded',
        `${worker.label} Run now simulated locally. No worker process was spawned.`,
        'debug-page-mock-worker-run',
      ),
    },
  };
}

export function addIsolatedTestMediaItem(state: DebugPageState, displayName = 'debug-test-image.jpg'): DebugPageState {
  const addedAt = formatTallinnDebugTimestamp();
  const id = `debug-media-${state.testMedia.length + 1}`;
  return {
    ...state,
    testMedia: [
      ...state.testMedia,
      {
        id,
        displayName,
        storage: 'isolated-test-only',
        addedAt,
        source: '+ Add images here',
      },
    ],
    actionResults: {
      ...state.actionResults,
      'add-test-image': createDebugActionResult(
        'add-test-image',
        'succeeded',
        'Registered isolated test-media placeholder. Production media/database state was not touched.',
        'debug-page-isolated-test-media',
      ),
    },
  };
}

export function buildDefaultFakeCrontab(): string {
  return [
    PHOTOFRAME_CRONTAB_BEGIN,
    '*/1 * * * * cd /home/mihkel/photoframe && npm run worker:regular # pf-login:regular',
    '*/1 * * * * cd /home/mihkel/photoframe && npm run worker:playback # pf-login:playback',
    '*/10 * * * * cd /home/mihkel/photoframe && npm run worker:screen # pf-login:screen',
    PHOTOFRAME_CRONTAB_END,
  ].join('\n');
}

export function parseDebugCrontab(content: string): DebugCrontabParseResult {
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const appOwnedLines = lines.filter((line) => line.includes('pf-login:') || line === PHOTOFRAME_CRONTAB_BEGIN || line === PHOTOFRAME_CRONTAB_END);
  const unrelatedLines = lines.filter((line) => !appOwnedLines.includes(line));
  const hasStart = lines.includes(PHOTOFRAME_CRONTAB_BEGIN);
  const hasEnd = lines.includes(PHOTOFRAME_CRONTAB_END);
  const warnings: string[] = [];
  if (appOwnedLines.length > 0 && (!hasStart || !hasEnd)) {
    warnings.push('App-owned crontab rows exist without both fake boundary markers.');
  }
  const activeRows = appOwnedLines.filter((line) => line.includes('pf-login:') && !line.startsWith('#'));
  const pausedRows = appOwnedLines.filter((line) => line.startsWith('#') && line.includes('pf-login:'));
  const hasHighFrequencyInterval = appOwnedLines.some((line) => /(^|\s)\*\/1\s+\*\s+\*\s+\*\s+\*/.test(line));
  const status: DebugCrontabParseResult['status'] = appOwnedLines.length === 0
    ? 'missing'
    : warnings.length > 0
      ? 'malformed'
      : activeRows.length > 0
        ? 'active'
        : pausedRows.length > 0
          ? 'paused'
          : 'unknown';
  return { status, appOwnedLines, unrelatedLines, warnings, hasHighFrequencyInterval };
}
