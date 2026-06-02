/*
 * Defines the Test Mode whole-logic emulator contract shared by UI and backend.
 * The contract records safe cadence, item-limit, and operator-control semantics.
 * It does not execute cron rows or terminate processes by itself.
 */
import {
  POWERSHELL_ENTRYPOINT_PREFIX,
  WINDOWS_CRON_EMULATOR_ENTRYPOINTS,
} from './schedulerWorkerCommands.ts';

export const WHOLE_LOGIC_TEST_MODE_SECTION_TITLE = 'RUN whole logic without logging in';

export const WHOLE_LOGIC_TEST_MODE_BUTTON_LABEL = 'INSTALL CRONTAB/EMULATOR, CALLING REGULAR WORKER EVERY 1 MINUTES, PLAYBACK WORKER EVERY 30sec, screen on-off worker EVERY 2 MINUTES, ADD LIMIT OF 5 ITEMS TO EACH WORKER STAGE (INCLUDING THE MOCK DOWNLOAD)';

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
    cadenceSeconds: 60,
    itemLimit: WHOLE_LOGIC_TEST_MODE_STAGE_LIMIT,
    includesMockDownloadLimit: true,
    windowsCrontabRow: `* * * * * ${POWERSHELL_ENTRYPOINT_PREFIX} "${WINDOWS_CRON_EMULATOR_ENTRYPOINTS.regularStage}"`,
  },
  playback: {
    id: 'playback_worker',
    label: 'playback worker',
    cadenceSeconds: 30,
    itemLimit: WHOLE_LOGIC_TEST_MODE_STAGE_LIMIT,
    includesMockDownloadLimit: false,
    windowsCrontabRow: `* * * * * ${POWERSHELL_ENTRYPOINT_PREFIX} "${WINDOWS_CRON_EMULATOR_ENTRYPOINTS.playback}"`,
  },
  screenOnOff: {
    id: 'screen_on_off_worker',
    label: 'screen on-off worker',
    cadenceSeconds: 120,
    itemLimit: WHOLE_LOGIC_TEST_MODE_STAGE_LIMIT,
    includesMockDownloadLimit: false,
    windowsCrontabRow: `*/2 * * * * ${POWERSHELL_ENTRYPOINT_PREFIX} "${WINDOWS_CRON_EMULATOR_ENTRYPOINTS.screenOnOff}"`,
  },
} as const);

export const WHOLE_LOGIC_TEST_MODE_CONFIG_SCHEMA_VERSION = 1;
export const WHOLE_LOGIC_TEST_MODE_CONTROLLER_SCHEMA_VERSION = 1;

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
  powerState: 'on' | 'off';
  cronjobsEnabled: boolean;
  cronState: 'enabled' | 'stopped';
  databaseState: 'available' | 'abruptly_interrupted';
  playbackState: 'available' | 'abruptly_interrupted';
  itemLimitPerWorkerStage: number;
  safeTerminationBoundary: string[];
  nativeFullscreenOperatorInstructions: string[];
  workers: {
    regularStage: WholeLogicWorkerState;
    playback: WholeLogicWorkerState;
    screenOnOff: WholeLogicWorkerState;
  };
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
    workerStageItemLimit: WHOLE_LOGIC_TEST_MODE_STAGE_LIMIT,
    workers: structuredClone(WHOLE_LOGIC_TEST_MODE_WORKERS),
    safeTerminationBoundary: [...WHOLE_LOGIC_TEST_MODE_SAFETY_LIMITS],
    nativeFullscreenOperatorInstructions: [...WHOLE_LOGIC_TEST_MODE_RUNTIME_KEYS],
    controlActions: structuredClone(WHOLE_LOGIC_TEST_MODE_CONTROL_ACTIONS),
    generatedAt: nowIso,
  };
}

// Builds a fresh owned controller state for the no-login whole-logic Test Mode flow.
export function buildWholeLogicTestModeControllerState(nowIso = new Date().toISOString()): WholeLogicControllerState {
  return {
    schemaVersion: WHOLE_LOGIC_TEST_MODE_CONTROLLER_SCHEMA_VERSION,
    mode: 'test-mode-whole-logic-controller',
    powerState: 'on',
    cronjobsEnabled: true,
    cronState: 'enabled',
    databaseState: 'available',
    playbackState: 'available',
    itemLimitPerWorkerStage: WHOLE_LOGIC_TEST_MODE_STAGE_LIMIT,
    safeTerminationBoundary: [...WHOLE_LOGIC_TEST_MODE_SAFETY_LIMITS],
    nativeFullscreenOperatorInstructions: [...WHOLE_LOGIC_TEST_MODE_RUNTIME_KEYS],
    workers: {
      regularStage: buildWorkerState('regularStage', nowIso),
      playback: buildWorkerState('playback', nowIso),
      screenOnOff: buildWorkerState('screenOnOff', nowIso),
    },
    events: [{ at: nowIso, key: 'start', action: 'Started owned Test Mode whole-logic controller state.' }],
    lastControlKey: null,
    createdAt: nowIso,
    updatedAt: nowIso,
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
    '# Playback requests 30 seconds in the dashboard contract; five-field CronEmulator rows run at minute granularity until Group 3 controller timing owns sub-minute cadence.',
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
