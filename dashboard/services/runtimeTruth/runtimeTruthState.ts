/*
 * Builds the dashboard runtime-truth state used by views, logs, and action guards.
 * It also owns initial View A scheduler target and CronEmulator UI state.
 */
import runtimeTruthSeed from '../../../conf/runtime-truth.json' with { type: 'json' };
import {
  SCHEDULER_EMULATOR_BUTTON_KEYS,
  type SchedulerEmulatorButtonKey,
} from '../../data/schedulerEmulatorStatusCopy.ts';
import {
  createSchedulerCapability,
  getOperationSupportLevel,
  SCHEDULER_OPERATION_SUPPORT,
  SCHEDULER_SUPPORT_LEVELS,
  SCHEDULER_TARGETS,
  type SchedulerCapability,
  type SchedulerOperation,
  type SchedulerSupportLevel,
  type SchedulerTarget,
} from '../../../shared/schedulerPlatformCapabilities.ts';
import { createDefaultPlaybackRenderingState } from '../playbackRenderer.ts';
import { WINDOWS_CRON_EMULATOR_PLAYBACK_WORKER_CRON_ROW } from '../../../shared/schedulerWorkerCommands.ts';

export const RUNTIME_TRUTH_SEED_PATH = 'conf/runtime-truth.json';

export type SchedulerActionKey =
  | 'install-cron'
  | 'check-cron'
  | 'print-cron'
  | SchedulerEmulatorButtonKey;
export type SchedulerTargetActionKey = 'select-scheduler-target-windows' | 'select-scheduler-target-raspberry';

export type RuntimeTruthSeed = typeof runtimeTruthSeed & {
  sourceOfTruth?: string;
  pipelineLockAcquiredAt?: string | null;
};

export type AuthButtonState = {
  status: 'neutral' | 'running' | 'success' | 'failed' | 'blocked' | 'pending' | 'error';
  message: string;
  updatedAt: string | null;
  endpoint: string | null;
};

export const SCHEDULER_EMULATOR_DEFAULT_ACTIVE_CRONTAB = "not checked, press 'Get active crontab'";

export const SCHEDULER_EMULATOR_DEFAULT_INSERT_CRONTAB = [
  '*/10 * * * * /path/to/regular_stage_worker',
  WINDOWS_CRON_EMULATOR_PLAYBACK_WORKER_CRON_ROW,
  '*/3 * * * * powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-RestMethod -Method Post -Uri \'http://127.0.0.1:4301/api/runtime/screen-simulation/configure\' -ContentType \'application/json\' -Body \'{\"simulateAllEnabled\":true}\' | Out-Null"',
].join('\n');

export type DatabaseViewerState = {
  verification: unknown;
  connection: unknown;
  connected: boolean;
  tables: unknown[];
  sqlite: unknown;
  selectedTableName: string | null;
  rows: unknown;
  logging: {
    active: boolean;
    sessionId: string | null;
    startedAt: string | null;
    endedAt: string | null;
    coverage: string;
    entries: unknown[];
    entryCount: number;
  };
  results: Record<'E1' | 'E2' | 'E3' | 'E4', unknown>;
};

export function buildInitialSchedulerCapability(): SchedulerCapability {
  // Builds the initial scheduler platform profile for dashboard boot state.
  const browserPlatform = resolveBrowserPlatformForSchedulerDefaults();
  const userAgent = typeof window !== 'undefined' && typeof navigator !== 'undefined' ? navigator.userAgent : null;
  return createSchedulerCapability({ browserPlatform, userAgent });
}

// Reads browser platform only in real browser rendering so Node tests keep the Windows-first default.
function resolveBrowserPlatformForSchedulerDefaults(): string | null {
  // Keeps Node-side rendering deterministic while letting real browsers report their platform.
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'Win32';
  }
  return navigator.platform;
}

const SCHEDULER_ACTION_OPERATION_MAP: Record<SchedulerActionKey, SchedulerOperation> = {
  'install-cron': SCHEDULER_OPERATION_SUPPORT.install,
  'check-cron': SCHEDULER_OPERATION_SUPPORT.status,
  'print-cron': SCHEDULER_OPERATION_SUPPORT.print,
  'check-emulator-scheduler': SCHEDULER_OPERATION_SUPPORT.status,
  'run-emulator': SCHEDULER_OPERATION_SUPPORT.install,
  'stop-emulator': SCHEDULER_OPERATION_SUPPORT.status,
  'install-crontab': SCHEDULER_OPERATION_SUPPORT.install,
  'get-active-crontab': SCHEDULER_OPERATION_SUPPORT.print,
};

export const SCHEDULER_TARGET_ACTION_MAP: Record<SchedulerTargetActionKey, SchedulerTarget> = {
  'select-scheduler-target-windows': SCHEDULER_TARGETS.windowsCronEmulator,
  'select-scheduler-target-raspberry': SCHEDULER_TARGETS.raspberryRealCrontab,
};

function isSchedulerActionKey(action: string): action is SchedulerActionKey {
  return Object.hasOwn(SCHEDULER_ACTION_OPERATION_MAP, action);
}

export function getSchedulerSupportForAction(
  capability: SchedulerCapability | null | undefined,
  action: SchedulerActionKey | string,
): SchedulerSupportLevel {
  const operation = isSchedulerActionKey(action) ? SCHEDULER_ACTION_OPERATION_MAP[action] : null;

  if (!operation) {
    return SCHEDULER_SUPPORT_LEVELS.supported;
  }

  return getOperationSupportLevel(capability, operation);
}

export function supportsSchedulerAction(
  capability: SchedulerCapability | null | undefined,
  action: SchedulerActionKey | string,
): boolean {
  return getSchedulerSupportForAction(capability, action) === SCHEDULER_SUPPORT_LEVELS.supported;
}

export function buildSchedulerReadyMessage(capability: SchedulerCapability | null | undefined): string {
  const label = capability?.profileLabel ?? 'current platform';
  const support = capability?.supportLevel ?? 'unknown';
  return `Scheduler controls are ready to call legacy /api/init/cron/* endpoints for ${label} (${support}).`;
}

export function buildInitialSchedulerTarget(): SchedulerTarget {
  const capability = buildInitialSchedulerCapability();
  return capability.schedulerTarget === SCHEDULER_TARGETS.raspberryRealCrontab
    ? SCHEDULER_TARGETS.raspberryRealCrontab
    : SCHEDULER_TARGETS.windowsCronEmulator;
}

export function buildInitialTruthState(): RuntimeTruthSeed {
  const truth = structuredClone(runtimeTruthSeed) as RuntimeTruthSeed;
  if (!truth.sourceOfTruth) {
    truth.sourceOfTruth = RUNTIME_TRUTH_SEED_PATH;
  }
  truth.pipelineActiveKey = null;
  truth.pipelineLockAcquiredAt = null;
  truth.playbackActive = false;
  truth.realRunActive = false;
  truth.stageLock = 'Pipeline lock available';
  truth.playbackLock = 'Playback worker lock available';
  truth.screenLock = 'Screen worker lock available';
  return truth;
}

// Compatibility note: View A owns auth as 1A-AUTH, but several action IDs still
// contain b1 because they are persisted/tested compatibility keys from the old B1 card.
// Keep this list as the single adapter point until a dedicated migration is approved.
export const AUTH_PREFLIGHT_BUTTON_KEYS = Object.freeze([
  'verify-icloudpd',
  'check-login',
  'login-using-env',
  'logout-b1-auth',
  'submit-b1-2fa',
  'refresh-b1-auth-status',
  'reset-b1-auth',
  'test-b1-login-download-one',
] as const);

export function buildInitialAuthButtonStates(): Record<(typeof AUTH_PREFLIGHT_BUTTON_KEYS)[number], AuthButtonState> {
  return Object.fromEntries(
    AUTH_PREFLIGHT_BUTTON_KEYS.map((key) => [
      key,
      {
        status: 'neutral',
        message: '',
        updatedAt: null,
        endpoint: null,
      },
    ]),
  );
}


export const NEW_AUTH_BUTTON_KEYS = Object.freeze([
  'new-auth-verify-icloudpd',
  'new-auth-login-using-env',
  'new-auth-check-login',
  'new-auth-logout-session',
  'new-auth-session-files',
] as const);

export function buildInitialNewAuthButtonStates(): Record<(typeof NEW_AUTH_BUTTON_KEYS)[number], AuthButtonState> {
  return Object.fromEntries(
    NEW_AUTH_BUTTON_KEYS.map((key) => [
      key,
      {
        status: 'neutral',
        message: 'Not checked yet.',
        updatedAt: null,
        endpoint: null,
      },
    ]),
  ) as Record<(typeof NEW_AUTH_BUTTON_KEYS)[number], AuthButtonState>;
}

// Builds neutral per-button state for the Windows CronEmulator controls.
export function buildInitialSchedulerEmulatorButtonStates(): Record<SchedulerEmulatorButtonKey, AuthButtonState> {
  return Object.fromEntries(
    SCHEDULER_EMULATOR_BUTTON_KEYS.map((key) => [
      key,
      {
        status: 'neutral',
        message: 'Not checked yet.',
        updatedAt: null,
        endpoint: null,
      },
    ]),
  ) as Record<SchedulerEmulatorButtonKey, AuthButtonState>;
}

export function buildInitialDatabaseViewerState(): DatabaseViewerState {
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

function createHistoryId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `fallback-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// Creates the full dashboard state object used at boot and in tests.
export function createInitialState() {
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const schedulerCapability = buildInitialSchedulerCapability();
  const selectedSchedulerTarget = schedulerCapability.schedulerTarget === SCHEDULER_TARGETS.raspberryRealCrontab
    ? SCHEDULER_TARGETS.raspberryRealCrontab
    : SCHEDULER_TARGETS.windowsCronEmulator;
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
      // B1 is retained as the compatibility status/log key for the visible 1A-AUTH card.
      B1: 'idle',
      '1A-STASH-OFF': 'idle',
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
      B1: [{ at: now, type: 'info', message: 'Auth preflight status has not been loaded yet.' }],
      '1A-STASH-OFF': [{ at: now, type: 'info', message: 'New auth UI is ready. Slice 1 points only at /api/auth/new/* endpoints.' }],
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
    selectedSchedulerTarget,
    schedulerEmulator: {
      editableCrontab: SCHEDULER_EMULATOR_DEFAULT_INSERT_CRONTAB,
      activeCrontab: SCHEDULER_EMULATOR_DEFAULT_ACTIVE_CRONTAB,
      buttonStates: buildInitialSchedulerEmulatorButtonStates(),
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
    playbackRendering: createDefaultPlaybackRenderingState(),
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
    authPreflight: {
      loaded: false,
      publicState: null,
      latestResult: null,
      buttonStates: buildInitialAuthButtonStates(),
    },
    newAuth: {
      loaded: false,
      latestResult: null,
      sessionFilesResult: null,
      buttonStates: buildInitialNewAuthButtonStates(),
    },
    loginSteps: [
      { key: 'preflight', label: 'Auth preflight', status: 'waiting' },
      { key: 'provider', label: 'Provider login', status: 'waiting' },
      { key: 'file', label: 'Required auth files', status: 'waiting' },
      { key: '2fa', label: '2FA', status: 'waiting' },
    ],
  };
}
