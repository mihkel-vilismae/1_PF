/*
 * Defines the Test Mode whole-logic emulator contract shared by UI and backend.
 * The contract records safe cadence, item-limit, focused-log, and status semantics.
 * It does not execute cron rows or terminate arbitrary processes by itself.
 */
import {
  POWERSHELL_ENTRYPOINT_PREFIX,
  WINDOWS_CRON_EMULATOR_ENTRYPOINTS,
} from './schedulerWorkerCommands.ts';

export const WHOLE_LOGIC_TEST_MODE_FAST_EMULATOR_LABEL = 'TEST MODE FAST EMULATOR';

export const WHOLE_LOGIC_TEST_MODE_SECTION_TITLE = 'RUN whole logic without logging in — TEST MODE FAST EMULATOR';

export const WHOLE_LOGIC_TEST_MODE_BUTTON_LABEL = 'INSTALL TEST MODE EMULATOR, CALLING REGULAR WORKER EVERY 6sec, PLAYBACK WORKER EVERY 3sec, screen-on-off worker EVERY 12sec, ADD LIMIT OF 5 ITEMS TO EACH WORKER STAGE (INCLUDING THE MOCK DOWNLOAD)';

export const WHOLE_LOGIC_TEST_MODE_START_DISABLED_REASON = 'TEST MODE FAST EMULATOR run already started; duplicate start calls are blocked.';

export const WHOLE_LOGIC_TEST_MODE_RUNTIME_KEYS = Object.freeze([
  'PRESS [q] to shut down regular worker process.',
  'PRESS [w] to shut down playback worker process.',
  'PRESS [e] to shut down screen-on-off worker process.',
  'PRESS [r] to stop all cronjobs - so that the processes would not autorun',
  'PRESS [t] to stop all running processes related to the photoframe app (but not the photoframe dashboard itself!) - the database, playaback, everything. this also stops cronjobs. kill them using a signal that imitates a sudden power-outage. they can leave unfisinshed state etc, it must imitate sudden poweroff',
  'PRESS [t] again to imitate a power on and enable all the cronjobs',
]);

export const WHOLE_LOGIC_TEST_MODE_SAFETY_LIMITS = Object.freeze([
  'Only stop/terminate worker processes spawned and tracked by this TEST mode controller.',
  'Do not kill the dashboard process.',
  'Do not kill arbitrary Node/Python/SQLite/system processes.',
]);

export const WHOLE_LOGIC_TEST_MODE_STAGE_LIMIT = 5;
export const WHOLE_LOGIC_TEST_MODE_END2END_LOG_RELATIVE_PATH = 'logs/end2end_test.log';

export const WHOLE_LOGIC_TEST_MODE_CONTROL_KEYS = Object.freeze(['q', 'w', 'e', 'r', 't'] as const);
export type WholeLogicControlKey = typeof WHOLE_LOGIC_TEST_MODE_CONTROL_KEYS[number];

export const WHOLE_LOGIC_TEST_MODE_CONTROL_ACTIONS = Object.freeze({
  q: {
    key: 'q',
    label: 'shut down regular worker process',
    workerKey: 'regularStage',
    resultMessage: 'Regular worker process was terminated in the owned Test Mode controller state.',
  },
  w: {
    key: 'w',
    label: 'shut down playback worker process',
    workerKey: 'playback',
    resultMessage: 'Playback worker process was terminated in the owned Test Mode controller state.',
  },
  e: {
    key: 'e',
    label: 'shut down screen-on-off worker process',
    workerKey: 'screenOnOff',
    resultMessage: 'Screen on-off worker process was terminated in the owned Test Mode controller state.',
  },
  r: {
    key: 'r',
    label: 'stop all cronjobs',
    workerKey: null,
    resultMessage: 'Cronjobs were stopped in the owned Test Mode controller state.',
  },
  t: {
    key: 't',
    label: 'toggle whole app power-off/power-on simulation',
    workerKey: null,
    resultMessage: 'Whole app power state was toggled in the owned Test Mode controller state.',
  },
} as const);

export const WHOLE_LOGIC_TEST_MODE_WORKERS = Object.freeze({
  regularStage: {
    id: 'regular_stage_worker',
    label: 'regular worker',
    cadenceSeconds: 6,
    itemLimit: WHOLE_LOGIC_TEST_MODE_STAGE_LIMIT,
    includesMockDownloadLimit: true,
    windowsCrontabRow: `* * * * * ${POWERSHELL_ENTRYPOINT_PREFIX} "${WINDOWS_CRON_EMULATOR_ENTRYPOINTS.regularStage}"`,
  },
  playback: {
    id: 'playback_worker',
    label: 'playback worker',
    cadenceSeconds: 3,
    itemLimit: WHOLE_LOGIC_TEST_MODE_STAGE_LIMIT,
    includesMockDownloadLimit: false,
    windowsCrontabRow: `* * * * * ${POWERSHELL_ENTRYPOINT_PREFIX} "${WINDOWS_CRON_EMULATOR_ENTRYPOINTS.playback}"`,
  },
  screenOnOff: {
    id: 'screen_on_off_worker',
    label: 'screen on-off worker',
    cadenceSeconds: 12,
    itemLimit: WHOLE_LOGIC_TEST_MODE_STAGE_LIMIT,
    includesMockDownloadLimit: false,
    windowsCrontabRow: `*/2 * * * * ${POWERSHELL_ENTRYPOINT_PREFIX} "${WINDOWS_CRON_EMULATOR_ENTRYPOINTS.screenOnOff}"`,
  },
} as const);

export const WHOLE_LOGIC_TEST_MODE_STATUS_STATES = Object.freeze({
  blank: 'blank',
  pending: 'pending',
  passed: 'passed',
  failed: 'failed',
} as const);

export type WholeLogicStatusState = typeof WHOLE_LOGIC_TEST_MODE_STATUS_STATES[keyof typeof WHOLE_LOGIC_TEST_MODE_STATUS_STATES];

export const WHOLE_LOGIC_TEST_MODE_STATUS_ITEMS = Object.freeze([
  { id: 'crontab_working', label: 'CRONTAB WORKING' },
  { id: 'regular_worker_called', label: 'REGULAR WORKER CALLED' },
  { id: 'playback_worker_called', label: 'PLAYBACK WORKER CALLED' },
  { id: 'screen_on_off_worker_called', label: 'ON/OFF WORKER CALLED' },
  { id: 'native_playback_started', label: 'NATIVE PLAYBACK STARTED' },
  { id: 'stage_mock_download', label: 'STAGE: MOCK DOWNLOAD' },
  { id: 'stage_index_register', label: 'STAGE: INDEX / REGISTER MEDIA' },
  { id: 'stage_gps_processing', label: 'STAGE: GPS PROCESSING' },
  { id: 'stage_geocode_address', label: 'STAGE: GEOCODE / ADDRESS RESOLUTION' },
  { id: 'stage_queue_prepare', label: 'STAGE: QUEUE PREPARE' },
  { id: 'stage_playback_select', label: 'STAGE: PLAYBACK SELECT' },
] as const);

export type WholeLogicStatusRow = {
  id: string;
  label: string;
  state: WholeLogicStatusState;
  firstCalledAt: string | null;
  lastCalledAt: string | null;
  calledCount: number;
  message: string;
};

export type WholeLogicFocusedLogEntry = {
  at: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
};

export type WholeLogicStartButtonState = {
  enabled: boolean;
  disabled: boolean;
  reason: string | null;
};

export const WHOLE_LOGIC_TEST_MODE_CONFIG_SCHEMA_VERSION = 1;
export const WHOLE_LOGIC_TEST_MODE_CONTROLLER_SCHEMA_VERSION = 2;

export type WholeLogicWorkerState = {
  id: string;
  label: string;
  cadenceSeconds: number;
  itemLimit: number;
  ownedByController: true;
  osPid: null;
  processState: 'running' | 'terminated';
  startedAt: string;
  terminatedAt: string | null;
  lastSignal: string | null;
  unfinishedStateAllowed: boolean;
};

export type WholeLogicControllerState = {
  schemaVersion: number;
  mode: 'test-mode-whole-logic-controller';
  runActive: boolean;
  startButton: WholeLogicStartButtonState;
  powerState: 'on' | 'off';
  cronjobsEnabled: boolean;
  cronState: 'enabled' | 'stopped';
  databaseState: 'available' | 'abruptly_interrupted';
  playbackState: 'available' | 'abruptly_interrupted';
  itemLimitPerWorkerStage: number;
  safeTerminationBoundary: string[];
  nativeFullscreenOperatorInstructions: string[];
  end2endLogRelativePath: string;
  workers: {
    regularStage: WholeLogicWorkerState;
    playback: WholeLogicWorkerState;
    screenOnOff: WholeLogicWorkerState;
  };
  statusRows: WholeLogicStatusRow[];
  focusedLog: WholeLogicFocusedLogEntry[];
  events: Array<{ at: string; key: string; action: string }>;
  lastControlKey: string | null;
  createdAt: string;
  updatedAt: string;
};

// Builds the canonical Test Mode whole-logic configuration object for API responses and proofs.
export function buildWholeLogicTestModeConfig(nowIso = new Date().toISOString()) {
  return {
    schemaVersion: WHOLE_LOGIC_TEST_MODE_CONFIG_SCHEMA_VERSION,
    mode: 'test-mode-whole-logic-emulator',
    title: WHOLE_LOGIC_TEST_MODE_SECTION_TITLE,
    buttonLabel: WHOLE_LOGIC_TEST_MODE_BUTTON_LABEL,
    startButton: buildWholeLogicStartButtonState(false),
    workerStageItemLimit: WHOLE_LOGIC_TEST_MODE_STAGE_LIMIT,
    statusRows: buildWholeLogicInitialStatusRows(),
    focusedLog: buildWholeLogicInitialFocusedLog(nowIso),
    workers: structuredClone(WHOLE_LOGIC_TEST_MODE_WORKERS),
    safeTerminationBoundary: [...WHOLE_LOGIC_TEST_MODE_SAFETY_LIMITS],
    nativeFullscreenOperatorInstructions: [...WHOLE_LOGIC_TEST_MODE_RUNTIME_KEYS],
    controlActions: structuredClone(WHOLE_LOGIC_TEST_MODE_CONTROL_ACTIONS),
    end2endLogRelativePath: WHOLE_LOGIC_TEST_MODE_END2END_LOG_RELATIVE_PATH,
    generatedAt: nowIso,
  };
}

// Builds a fresh owned controller state after the large Test Mode start button is clicked.
export function buildWholeLogicTestModeControllerState(nowIso = new Date().toISOString()): WholeLogicControllerState {
  return {
    schemaVersion: WHOLE_LOGIC_TEST_MODE_CONTROLLER_SCHEMA_VERSION,
    mode: 'test-mode-whole-logic-controller',
    runActive: true,
    startButton: buildWholeLogicStartButtonState(true),
    powerState: 'on',
    cronjobsEnabled: true,
    cronState: 'enabled',
    databaseState: 'available',
    playbackState: 'available',
    itemLimitPerWorkerStage: WHOLE_LOGIC_TEST_MODE_STAGE_LIMIT,
    safeTerminationBoundary: [...WHOLE_LOGIC_TEST_MODE_SAFETY_LIMITS],
    nativeFullscreenOperatorInstructions: [...WHOLE_LOGIC_TEST_MODE_RUNTIME_KEYS],
    end2endLogRelativePath: WHOLE_LOGIC_TEST_MODE_END2END_LOG_RELATIVE_PATH,
    statusRows: buildWholeLogicStartedStatusRows(nowIso),
    focusedLog: buildWholeLogicStartedFocusedLog(nowIso),
    workers: {
      regularStage: buildWorkerState('regularStage', nowIso),
      playback: buildWorkerState('playback', nowIso),
      screenOnOff: buildWorkerState('screenOnOff', nowIso),
    },
    events: [{ at: nowIso, key: 'start', action: 'Started owned Test Mode fast-emulator controller state.' }],
    lastControlKey: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

// Builds blank status rows for the status-circle panel before a run touches them.
export function buildWholeLogicInitialStatusRows(): WholeLogicStatusRow[] {
  return WHOLE_LOGIC_TEST_MODE_STATUS_ITEMS.map((item) => ({
    id: item.id,
    label: item.label,
    state: WHOLE_LOGIC_TEST_MODE_STATUS_STATES.blank,
    firstCalledAt: null,
    lastCalledAt: null,
    calledCount: 0,
    message: 'Waiting for TEST MODE FAST EMULATOR start.',
  }));
}

// Builds the status rows produced by the safe deterministic start boundary.
export function buildWholeLogicStartedStatusRows(nowIso = new Date().toISOString()): WholeLogicStatusRow[] {
  const passed = new Set(['crontab_working', 'regular_worker_called', 'playback_worker_called', 'screen_on_off_worker_called']);
  const pending = new Set([
    'native_playback_started',
    'stage_mock_download',
    'stage_index_register',
    'stage_gps_processing',
    'stage_geocode_address',
    'stage_queue_prepare',
    'stage_playback_select',
  ]);
  return WHOLE_LOGIC_TEST_MODE_STATUS_ITEMS.map((item) => {
    const state = passed.has(item.id)
      ? WHOLE_LOGIC_TEST_MODE_STATUS_STATES.passed
      : pending.has(item.id)
        ? WHOLE_LOGIC_TEST_MODE_STATUS_STATES.pending
        : WHOLE_LOGIC_TEST_MODE_STATUS_STATES.blank;
    return buildCalledStatusRow(item.id, item.label, state, nowIso, buildStartedStatusMessage(item.id, state));
  });
}

// Builds the focused run-log seed shown in the Test Mode panel terminal surface before start.
export function buildWholeLogicInitialFocusedLog(nowIso = new Date().toISOString()): WholeLogicFocusedLogEntry[] {
  return [{
    at: nowIso,
    level: 'info',
    message: 'Awaiting TEST MODE FAST EMULATOR start; no login is required in Test Mode.',
  }];
}

// Builds focused log rows that are relevant only to the started fast-emulator run.
export function buildWholeLogicStartedFocusedLog(nowIso = new Date().toISOString()): WholeLogicFocusedLogEntry[] {
  return [
    { at: nowIso, level: 'info', message: 'Large TEST MODE FAST EMULATOR start button clicked.' },
    { at: nowIso, level: 'success', message: 'CronEmulator configuration was verified and written for the owned Test Mode controller.' },
    { at: nowIso, level: 'success', message: 'Owned regular, playback, and screen-on-off worker records were started without login.' },
    { at: nowIso, level: 'warning', message: 'Native playback and pipeline stages are marked pending until real runtime execution proves them.' },
  ];
}

// Builds enabled/disabled button state for the large Test Mode start control.
export function buildWholeLogicStartButtonState(started: boolean): WholeLogicStartButtonState {
  return {
    enabled: !started,
    disabled: started,
    reason: started ? WHOLE_LOGIC_TEST_MODE_START_DISABLED_REASON : null,
  };
}

// Builds one status row after an item was called, attempted, or verified.
export function buildCalledStatusRow(id: string, label: string, state: WholeLogicStatusState, nowIso: string, message: string): WholeLogicStatusRow {
  return {
    id,
    label,
    state,
    firstCalledAt: nowIso,
    lastCalledAt: nowIso,
    calledCount: 1,
    message,
  };
}

// Normalizes a keyboard/button control value to the supported operator key set.
export function normalizeWholeLogicControlKey(value: unknown): WholeLogicControlKey | null {
  if (typeof value !== 'string') {
    return null;
  }
  const key = value.trim().toLowerCase();
  return (WHOLE_LOGIC_TEST_MODE_CONTROL_KEYS as readonly string[]).includes(key) ? key as WholeLogicControlKey : null;
}

// Builds the Windows CronEmulator crontab text for the rows supported by the current emulator.
export function buildWholeLogicWindowsCronEmulatorCrontabText(): string {
  return [
    '# PF_login TEST MODE whole-logic emulator rows.',
    '# Managed by the dashboard Test Mode whole-logic controller.',
    '# Fast-emulator playback requests 3 seconds in the dashboard contract; five-field CronEmulator rows stay minute-granularity until the owned controller loop executes sub-minute cadence.',
    WHOLE_LOGIC_TEST_MODE_WORKERS.regularStage.windowsCrontabRow,
    WHOLE_LOGIC_TEST_MODE_WORKERS.playback.windowsCrontabRow,
    WHOLE_LOGIC_TEST_MODE_WORKERS.screenOnOff.windowsCrontabRow,
  ].join('\n') + '\n';
}

// Creates one owned worker-process record without binding to an arbitrary OS PID.
function buildWorkerState(workerKey: keyof typeof WHOLE_LOGIC_TEST_MODE_WORKERS, nowIso: string): WholeLogicWorkerState {
  const worker = WHOLE_LOGIC_TEST_MODE_WORKERS[workerKey];
  return {
    id: worker.id,
    label: worker.label,
    cadenceSeconds: worker.cadenceSeconds,
    itemLimit: worker.itemLimit,
    ownedByController: true,
    osPid: null,
    processState: 'running',
    startedAt: nowIso,
    terminatedAt: null,
    lastSignal: null,
    unfinishedStateAllowed: false,
  };
}

// Describes each status row after the deterministic start boundary touches it.
function buildStartedStatusMessage(id: string, state: WholeLogicStatusState): string {
  if (id === 'native_playback_started') {
    return 'Native playback start intent is pending; real fullscreen runtime proof is not claimed.';
  }
  if (id.startsWith('stage_')) {
    return 'Stage is scheduled by the Test Mode fast-emulator controller and awaits runtime execution proof.';
  }
  return state === WHOLE_LOGIC_TEST_MODE_STATUS_STATES.passed
    ? 'Owned Test Mode controller record was started or verified successfully.'
    : 'Status was called and is waiting for completion evidence.';
}
