/*
 * Builds the guarded Test Mode whole-logic emulator controller contract.
 * The service records scheduler/emulator cadence, item-limit, focused status,
 * and dedicated end-to-end log evidence for the no-login Test Mode flow.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  WHOLE_LOGIC_TEST_MODE_CONTROL_ACTIONS,
  WHOLE_LOGIC_TEST_MODE_END2END_LOG_RELATIVE_PATH,
  WHOLE_LOGIC_TEST_MODE_STAGE_LIMIT,
  WHOLE_LOGIC_TEST_MODE_START_DISABLED_REASON,
  buildWholeLogicTestModeConfig,
  buildWholeLogicTestModeControllerState,
  buildWholeLogicWindowsCronEmulatorCrontabText,
  normalizeWholeLogicControlKey,
  type WholeLogicControlKey,
  type WholeLogicControllerState,
  type WholeLogicFocusedLogEntry,
} from '../shared/testModeWholeLogicContract.ts';

type RuntimeMode = 'test' | 'real' | string | undefined;

type WholeLogicStartOptions = {
  runtimeMode?: RuntimeMode;
  platform?: NodeJS.Platform | string;
  repoRoot?: string;
  configFilePath?: string;
  crontabFilePath?: string;
  controllerStateFilePath?: string;
  end2endLogFilePath?: string;
  now?: Date;
};

type WholeLogicControlOptions = {
  runtimeMode?: RuntimeMode;
  controllerStateFilePath?: string;
  end2endLogFilePath?: string;
  key?: unknown;
  now?: Date;
};

// Creates or reports the Test Mode whole-logic scheduler/emulator start boundary.
export async function buildWholeLogicTestModeStartResult(options: WholeLogicStartOptions = {}) {
  const nowIso = (options.now ?? new Date()).toISOString();
  const config = buildWholeLogicTestModeConfig(nowIso);
  const crontabText = buildWholeLogicWindowsCronEmulatorCrontabText();
  const runtimeMode = options.runtimeMode ?? 'unknown';

  if (runtimeMode !== 'test') {
    return {
      status: 'blocked',
      message: 'Whole-logic no-login emulator start is blocked outside Test Mode.',
      runtimeMode,
      destructiveActionAttempted: false,
      productionBehaviorChanged: false,
      schemaVersion: config.schemaVersion,
      generatedAt: nowIso,
    };
  }

  const existingState = await readExistingControllerState(options.controllerStateFilePath);
  if (existingState?.runActive && existingState.startButton?.disabled) {
    await appendEnd2EndLog(options.end2endLogFilePath, [{
      at: nowIso,
      level: 'warning',
      message: 'Duplicate TEST MODE FAST EMULATOR start click was blocked because the owned controller run is already active.',
    }]);
    return {
      status: 'blocked',
      message: WHOLE_LOGIC_TEST_MODE_START_DISABLED_REASON,
      runtimeMode,
      platform: options.platform ?? process.platform,
      duplicateStartBlocked: true,
      destructiveActionAttempted: false,
      productionBehaviorChanged: false,
      loginRequired: false,
      schedulerTarget: 'windows-cron-emulator',
      workerStageItemLimit: WHOLE_LOGIC_TEST_MODE_STAGE_LIMIT,
      config,
      controllerState: existingState,
      schemaVersion: config.schemaVersion,
      generatedAt: nowIso,
    };
  }

  const controllerState = buildWholeLogicTestModeControllerState(nowIso);
  const writes = await writeWholeLogicRuntimeFiles({ ...options, config, crontabText, controllerState });
  await writeEnd2EndLog(options.end2endLogFilePath, controllerState.focusedLog);
  return {
    status: 'ok',
    message: 'Test Mode fast-emulator boundary is configured, the large start button is now disabled, and the owned controller state is running. Controls only affect this controller state; they do not kill arbitrary processes.',
    runtimeMode,
    platform: options.platform ?? process.platform,
    duplicateStartBlocked: false,
    destructiveActionAttempted: false,
    productionBehaviorChanged: false,
    loginRequired: false,
    schedulerTarget: 'windows-cron-emulator',
    startButton: controllerState.startButton,
    emulator: {
      configured: true,
      crontabText,
      crontabFilePath: writes.crontabFilePath,
      configFilePath: writes.configFilePath,
      controllerStateFilePath: writes.controllerStateFilePath,
      end2endLogFilePath: writes.end2endLogFilePath,
      limitation: 'Current CronEmulator uses five-field minute cron rows; requested 6/3/12-second fast-emulator cadences are tracked by the Test Mode controller state and are not claimed as real OS cron proof.',
    },
    workerStageItemLimit: WHOLE_LOGIC_TEST_MODE_STAGE_LIMIT,
    config,
    controllerState,
    schemaVersion: config.schemaVersion,
    generatedAt: nowIso,
  };
}

// Reports the current Test Mode whole-logic controller state without mutating it.
export async function buildWholeLogicTestModeStatusResult(options: WholeLogicControlOptions = {}) {
  const runtimeMode = options.runtimeMode ?? 'unknown';
  if (runtimeMode !== 'test') {
    return buildWholeLogicBlockedControlResult(runtimeMode, 'status', options.now);
  }
  const state = await readControllerState(options.controllerStateFilePath, options.now);
  return {
    status: 'ok',
    runtimeMode,
    productionBehaviorChanged: false,
    destructiveActionAttempted: false,
    controllerState: state,
    startButton: state.startButton,
    schemaVersion: state.schemaVersion,
    generatedAt: (options.now ?? new Date()).toISOString(),
  };
}

// Applies one q/w/e/r/t operator control to the owned Test Mode controller state.
export async function buildWholeLogicTestModeControlResult(options: WholeLogicControlOptions = {}) {
  const runtimeMode = options.runtimeMode ?? 'unknown';
  const key = normalizeWholeLogicControlKey(options.key);
  const nowIso = (options.now ?? new Date()).toISOString();

  if (runtimeMode !== 'test') {
    return buildWholeLogicBlockedControlResult(runtimeMode, key ?? 'unknown', options.now);
  }
  if (!key) {
    return {
      status: 'blocked',
      message: 'Whole-logic Test Mode control key must be one of q, w, e, r, or t.',
      runtimeMode,
      requestedKey: options.key ?? null,
      allowedKeys: Object.keys(WHOLE_LOGIC_TEST_MODE_CONTROL_ACTIONS),
      destructiveActionAttempted: false,
      productionBehaviorChanged: false,
      generatedAt: nowIso,
      schemaVersion: 1,
    };
  }

  const previousState = await readControllerState(options.controllerStateFilePath, options.now);
  const nextState = applyWholeLogicControl(previousState, key, nowIso);
  if (options.controllerStateFilePath) {
    await writeJsonFile(options.controllerStateFilePath, nextState);
  }
  await appendEnd2EndLog(options.end2endLogFilePath, [{
    at: nowIso,
    level: 'info',
    message: `Operator control ${key.toUpperCase()} applied to the owned Test Mode controller state.`,
  }]);

  return {
    status: 'ok',
    message: WHOLE_LOGIC_TEST_MODE_CONTROL_ACTIONS[key].resultMessage,
    runtimeMode,
    key,
    action: WHOLE_LOGIC_TEST_MODE_CONTROL_ACTIONS[key],
    destructiveActionAttempted: false,
    productionBehaviorChanged: false,
    safetyBoundary: nextState.safeTerminationBoundary,
    controllerState: nextState,
    startButton: nextState.startButton,
    generatedAt: nowIso,
    schemaVersion: nextState.schemaVersion,
  };
}

// Writes the runtime config/crontab/controller/log files only when file paths are supplied by the route.
async function writeWholeLogicRuntimeFiles({ configFilePath, crontabFilePath, controllerStateFilePath, end2endLogFilePath, config, crontabText, controllerState }: WholeLogicStartOptions & { config: unknown; crontabText: string; controllerState: WholeLogicControllerState }) {
  if (configFilePath) {
    await writeJsonFile(configFilePath, config);
  }
  if (crontabFilePath) {
    await fs.mkdir(path.dirname(crontabFilePath), { recursive: true });
    await fs.writeFile(crontabFilePath, crontabText, 'utf8');
  }
  if (controllerStateFilePath) {
    await writeJsonFile(controllerStateFilePath, controllerState);
  }
  if (end2endLogFilePath) {
    await writeEnd2EndLog(end2endLogFilePath, controllerState.focusedLog);
  }

  return {
    configFilePath: configFilePath ?? null,
    crontabFilePath: crontabFilePath ?? null,
    controllerStateFilePath: controllerStateFilePath ?? null,
    end2endLogFilePath: end2endLogFilePath ?? null,
  };
}

// Reads persisted controller state and falls back to a fresh owned Test Mode state.
async function readControllerState(controllerStateFilePath: string | undefined, now: Date | undefined): Promise<WholeLogicControllerState> {
  const existing = await readExistingControllerState(controllerStateFilePath);
  return existing ?? buildWholeLogicTestModeControllerState((now ?? new Date()).toISOString());
}

// Reads an existing controller state only when it is present and schema-compatible enough.
async function readExistingControllerState(controllerStateFilePath: string | undefined): Promise<WholeLogicControllerState | null> {
  if (!controllerStateFilePath) {
    return null;
  }
  try {
    const parsed = JSON.parse(await fs.readFile(controllerStateFilePath, 'utf8'));
    if (parsed && typeof parsed === 'object' && parsed.mode === 'test-mode-whole-logic-controller') {
      return parsed as WholeLogicControllerState;
    }
  } catch {
    // Missing or invalid state is treated as not-yet-started and recreated safely.
  }
  return null;
}

// Persists a JSON document with stable indentation for audit/proof readability.
async function writeJsonFile(targetPath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

// Replaces the dedicated end-to-end Test Mode log with sanitized focused entries.
async function writeEnd2EndLog(targetPath: string | undefined, entries: WholeLogicFocusedLogEntry[]): Promise<void> {
  if (!targetPath) {
    return;
  }
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, formatEnd2EndLog(entries), 'utf8');
}

// Appends sanitized entries to the dedicated end-to-end Test Mode log.
async function appendEnd2EndLog(targetPath: string | undefined, entries: WholeLogicFocusedLogEntry[]): Promise<void> {
  if (!targetPath) {
    return;
  }
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.appendFile(targetPath, formatEnd2EndLog(entries), 'utf8');
}

// Formats focused log rows while filtering obvious secret-bearing noise.
function formatEnd2EndLog(entries: WholeLogicFocusedLogEntry[]): string {
  return entries
    .map((entry) => `${entry.at} [${entry.level.toUpperCase()}] ${sanitizeEnd2EndLogMessage(entry.message)}`)
    .filter((line) => line.trim().length > 0)
    .join('\n') + '\n';
}

// Redacts obvious passwords/tokens/codes before writing end2end_test.log.
function sanitizeEnd2EndLogMessage(message: string): string {
  return message
    .replace(/(password|token|secret|cookie)=\S+/gi, '$1=[REDACTED]')
    .replace(/\b\d{6}\b/g, '[REDACTED_CODE]');
}

// Applies an operator key to the owned Test Mode state without touching OS processes.
function applyWholeLogicControl(state: WholeLogicControllerState, key: WholeLogicControlKey, nowIso: string): WholeLogicControllerState {
  const next = structuredClone(state);
  next.updatedAt = nowIso;
  next.lastControlKey = key;
  next.events.push({ at: nowIso, key, action: WHOLE_LOGIC_TEST_MODE_CONTROL_ACTIONS[key].label });
  next.focusedLog.push({ at: nowIso, level: 'info', message: `Control ${key.toUpperCase()} applied to the owned Test Mode controller.` });

  if (key === 'q') {
    terminateWorker(next, 'regularStage', nowIso, 'SIGKILL_SIMULATED_POWER_LOSS');
  } else if (key === 'w') {
    terminateWorker(next, 'playback', nowIso, 'SIGKILL_SIMULATED_POWER_LOSS');
  } else if (key === 'e') {
    terminateWorker(next, 'screenOnOff', nowIso, 'SIGKILL_SIMULATED_POWER_LOSS');
  } else if (key === 'r') {
    next.cronjobsEnabled = false;
    next.cronState = 'stopped';
  } else if (key === 't' && next.powerState === 'on') {
    next.powerState = 'off';
    next.cronjobsEnabled = false;
    next.cronState = 'stopped';
    next.databaseState = 'abruptly_interrupted';
    next.playbackState = 'abruptly_interrupted';
    next.runActive = false;
    next.startButton = { enabled: false, disabled: true, reason: 'Power-off simulation is active; press T again to re-enable cronjobs.' };
    terminateWorker(next, 'regularStage', nowIso, 'SIGKILL_SIMULATED_POWER_LOSS');
    terminateWorker(next, 'playback', nowIso, 'SIGKILL_SIMULATED_POWER_LOSS');
    terminateWorker(next, 'screenOnOff', nowIso, 'SIGKILL_SIMULATED_POWER_LOSS');
  } else if (key === 't') {
    const restarted = buildWholeLogicTestModeControllerState(nowIso);
    restarted.events = [...next.events, { at: nowIso, key, action: 'Power-on simulation re-enabled cronjobs and worker controller records.' }];
    restarted.focusedLog = [...next.focusedLog, { at: nowIso, level: 'success', message: 'Power-on simulation re-enabled cronjobs and owned worker records.' }];
    return restarted;
  }

  return next;
}

// Marks one owned worker record as terminated by the Test Mode controller.
function terminateWorker(state: WholeLogicControllerState, workerKey: keyof WholeLogicControllerState['workers'], nowIso: string, signal: string): void {
  const worker = state.workers[workerKey];
  worker.processState = 'terminated';
  worker.lastSignal = signal;
  worker.terminatedAt = nowIso;
  worker.unfinishedStateAllowed = true;
}

// Builds a blocked response for controls/status outside Test Mode.
function buildWholeLogicBlockedControlResult(runtimeMode: RuntimeMode, key: unknown, now: Date | undefined) {
  return {
    status: 'blocked',
    message: 'Whole-logic Test Mode controls are blocked outside Test Mode.',
    runtimeMode,
    requestedKey: key,
    destructiveActionAttempted: false,
    productionBehaviorChanged: false,
    generatedAt: (now ?? new Date()).toISOString(),
    schemaVersion: 1,
  };
}

export const WHOLE_LOGIC_TEST_MODE_DEFAULT_END2END_LOG_PATH = WHOLE_LOGIC_TEST_MODE_END2END_LOG_RELATIVE_PATH;
