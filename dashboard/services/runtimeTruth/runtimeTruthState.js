import runtimeTruthSeed from '../../../conf/runtime-truth.json' assert { type: 'json' };
import {
  createSchedulerCapability,
  getOperationSupportLevel,
  SCHEDULER_OPERATION_SUPPORT,
  SCHEDULER_SUPPORT_LEVELS,
} from '../../../shared/schedulerPlatformCapabilities.js';

export const RUNTIME_TRUTH_SEED_PATH = 'conf/runtime-truth.json';

export function buildInitialSchedulerCapability() {
  const browserPlatform = typeof navigator !== 'undefined' ? navigator.platform : null;
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null;
  return createSchedulerCapability({ browserPlatform, userAgent });
}

export function getSchedulerSupportForAction(capability, action) {
  const operation = {
    'install-cron': SCHEDULER_OPERATION_SUPPORT.install,
    'check-cron': SCHEDULER_OPERATION_SUPPORT.status,
    'print-cron': SCHEDULER_OPERATION_SUPPORT.print,
  }[action];

  if (!operation) {
    return SCHEDULER_SUPPORT_LEVELS.supported;
  }

  return getOperationSupportLevel(capability, operation);
}

export function supportsSchedulerAction(capability, action) {
  return getSchedulerSupportForAction(capability, action) === SCHEDULER_SUPPORT_LEVELS.supported;
}

export function buildSchedulerReadyMessage(capability) {
  const label = capability?.profileLabel ?? 'current platform';
  const support = capability?.supportLevel ?? 'unknown';
  return `Scheduler controls are ready to call legacy /api/init/cron/* endpoints for ${label} (${support}).`;
}

export function buildInitialTruthState() {
  const truth = structuredClone(runtimeTruthSeed);
  if (!truth.sourceOfTruth) {
    truth.sourceOfTruth = RUNTIME_TRUTH_SEED_PATH;
  }
  return truth;
}

export function buildInitialDatabaseViewerState() {
  return {
    verification: null,
    connection: null,
    connected: false,
    tables: [],
    sqlite: null,
    selectedTableName: null,
    rows: null,
    logging: {
      active: false,
      sessionId: null,
      startedAt: null,
      endedAt: null,
      coverage: 'Captures repo-local backend DB actions only while the logging session is active.',
      entries: [],
      entryCount: 0,
    },
    results: {
      E1: null,
      E2: null,
      E3: null,
      E4: null,
    },
  };
}

function createHistoryId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `fallback-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createInitialState() {
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const schedulerCapability = buildInitialSchedulerCapability();
  return {
    activeView: 'A',
    inspectMode: false,
    valueInspectMode: false,
    realityInspectMode: false,
    backendStatusInspectMode: false,
    currentViewTitle: 'A — Init',
    modeBanner: 'Hybrid UI: A and E are backend-backed, B mixes real runtime endpoints with placeholder panels, and C-D still contain explicit frontend-only previews.',
    statusByKey: {
      '1A': 'idle',
      '2A': 'idle',
      '3A': 'idle',
      B1: 'idle',
      B2: 'idle',
      B3: 'idle',
      'B3.1': 'idle',
      'B3.2': 'idle',
      'B3.3': 'idle',
      'B3.4': 'idle',
      'B3.5': 'idle',
      B4: 'disabled',
      B5: 'idle',
      C: 'info',
      D1: 'disabled',
      D2: 'disabled',
      D3: 'disabled',
      E1: 'idle',
      E2: 'disabled',
      E3: 'disabled',
      E4: 'disabled',
    },
    activeActions: {},
    modal: null,
    truth: buildInitialTruthState(),
    history: [
      { id: createHistoryId(), at: now, source: 'BOOT', type: 'info', message: 'Dashboard shell initialized.' },
      { id: createHistoryId(), at: now, source: 'TRUTH', type: 'info', message: 'Hybrid truth seed loaded from conf/runtime-truth.json and then kept in sync through dashboard actions.' },
    ],
    logs: {
      '1A': [{ at: now, type: 'info', message: 'Ready to call POST /api/init/verify-env.' }],
      '2A': [{ at: now, type: 'info', message: 'Database controls are ready to call /api/init/database/* endpoints.' }],
      '3A': [{ at: now, type: 'info', message: buildSchedulerReadyMessage(schedulerCapability) }],
      B1: [{ at: now, type: 'info', message: 'Login flow is idle.' }],
      B2: [{ at: now, type: 'info', message: 'Ready to call POST /api/runtime/download/run.' }],
      'B3.1': [{ at: now, type: 'info', message: 'Ready to call POST /api/runtime/download/run.' }],
      'B3.2': [{ at: now, type: 'info', message: 'Ready to call POST /api/runtime/index/run.' }],
      'B3.3': [{ at: now, type: 'info', message: 'GPS parser waiting.' }],
      'B3.4': [{ at: now, type: 'info', message: 'Geocode stage waiting.' }],
      'B3.5': [{ at: now, type: 'info', message: 'Ready to call POST /api/runtime/queue/prepare.' }],
      B4: [{ at: now, type: 'info', message: 'Ready to call POST /api/runtime/playback/select-current.' }],
      B5: [{ at: now, type: 'info', message: 'Screen simulation controls ready.' }],
      C: [{ at: now, type: 'info', message: 'Last run demo state is idle until one of the view-level demo buttons is pressed.' }],
      D: [{ at: now, type: 'info', message: 'Simulated runtime preview is inactive.' }],
      E1: [{ at: now, type: 'info', message: 'Ready to verify the configured DB file and required target-state tables.' }],
      E2: [{ at: now, type: 'info', message: 'Table catalog is locked until Verify Database and Connect to Database both succeed.' }],
      E3: [{ at: now, type: 'info', message: 'Select a table after the catalog loads to view bounded rows.' }],
      E4: [{ at: now, type: 'info', message: 'DB logging is inactive. It only captures repo-local backend DB actions while this server process is active.' }],
    },
    initResults: {
      '1A': null,
      '2A': null,
      '3A': null,
    },
    initCapabilities: {
      scheduler: schedulerCapability,
    },
    databaseViewer: buildInitialDatabaseViewerState(),
    simulation: {
      executionMode: 'auto',
      inputMode: 'single',
      pirEnabled: true,
      mouseEnabled: true,
      keyboardEnabled: true,
      inactivityTimeoutSeconds: 5,
      simulateAllEnabled: true,
    },
    lastRunMode: 'none',
    lastRunData: {
      media: {},
      playback: {},
      stage: {},
      screen: {},
    },
    runningProcess: {
      pipelineStages: [
        { key: 'download', name: 'Download', status: 'Idle', lastRun: 'Never', summary: 'Waiting for the simulated runtime preview.' },
        { key: 'index', name: 'Index', status: 'Idle', lastRun: 'Never', summary: 'Waiting for the simulated runtime preview.' },
        { key: 'gps', name: 'Get GPS', status: 'Idle', lastRun: 'Never', summary: 'Waiting for the simulated runtime preview.' },
        { key: 'geocode', name: 'Geocode', status: 'Idle', lastRun: 'Never', summary: 'Waiting for the simulated runtime preview.' },
        { key: 'queue', name: 'Queue Slideshow', status: 'Idle', lastRun: 'Never', summary: 'Waiting for the simulated runtime preview.' },
      ],
      playbackWorker: {
        status: 'Inactive',
        heartbeat: 'Never',
        currentMedia: 'None',
        summary: 'Playback worker preview has not been started.',
      },
      screenWorker: {
        status: 'Inactive',
        heartbeat: 'Never',
        screenState: 'ON',
        lastActivity: 'None',
        timeout: '5s',
        summary: 'Screen worker preview has not been started.',
      },
    },
    loginSteps: [
      { key: 'login', label: 'Login', status: 'waiting' },
      { key: 'file', label: 'Required file', status: 'waiting' },
      { key: '2fa', label: '2FA', status: 'waiting' },
    ],
  };
}
