/*
 * Builds the guarded Test Mode whole-logic emulator controller contract.
 * The service records scheduler/emulator cadence and item-limit intent and owns
 * only the simulated worker-process records created by this Test Mode flow.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  WHOLE_LOGIC_TEST_MODE_CONTROL_ACTIONS,
  WHOLE_LOGIC_TEST_MODE_STAGE_LIMIT,
  buildWholeLogicTestModeConfig,
  buildWholeLogicTestModeControllerState,
  buildWholeLogicWindowsCronEmulatorCrontabText,
  normalizeWholeLogicControlKey,
  type WholeLogicControlKey,
  type WholeLogicControllerState,
} from '../shared/testModeWholeLogicContract.ts';

type RuntimeMode = 'test' | 'real' | string | undefined;

type WholeLogicStartOptions = {
  runtimeMode?: RuntimeMode;
  platform?: NodeJS.Platform | string;
  repoRoot?: string;
  configFilePath?: string;
  crontabFilePath?: string;
  controllerStateFilePath?: string;
  now?: Date;
};

type WholeLogicControlOptions = {
  runtimeMode?: RuntimeMode;
  controllerStateFilePath?: string;
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

  const controllerState = buildWholeLogicTestModeControllerState(nowIso);
  const writes = await writeWholeLogicRuntimeFiles({ ...options, config, crontabText, controllerState });
  return {
    status: 'ok',
    message: 'Test Mode whole-logic emulator boundary is configured and the owned controller state is running. Group 3 controls only this controller state; it does not kill arbitrary processes.',
    runtimeMode,
    platform: options.platform ?? process.platform,
    destructiveActionAttempted: false,
    productionBehaviorChanged: false,
    loginRequired: false,
    schedulerTarget: 'windows-cron-emulator',
    emulator: {
      configured: true,
      crontabText,
      crontabFilePath: writes.crontabFilePath,
      configFilePath: writes.configFilePath,
      controllerStateFilePath: writes.controllerStateFilePath,
      limitation: 'Current CronEmulator uses five-field minute cron rows; requested 6/3/12-second fast-emulator cadences are executed by the Test Mode controller state/proof model and are not claimed as real OS cron proof.',
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
    generatedAt: nowIso,
    schemaVersion: nextState.schemaVersion,
  };
}

// Writes the runtime config/crontab/controller files only when file paths are supplied by the route.
async function writeWholeLogicRuntimeFiles({ configFilePath, crontabFilePath, controllerStateFilePath, config, crontabText, controllerState }: WholeLogicStartOptions & { config: unknown; crontabText: string; controllerState: WholeLogicControllerState }) {
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

  return {
    configFilePath: configFilePath ?? null,
    crontabFilePath: crontabFilePath ?? null,
    controllerStateFilePath: controllerStateFilePath ?? null,
  };
}

// Reads persisted controller state and falls back to a fresh owned Test Mode state.
async function readControllerState(controllerStateFilePath: string | undefined, now: Date | undefined): Promise<WholeLogicControllerState> {
  if (!controllerStateFilePath) {
    return buildWholeLogicTestModeControllerState((now ?? new Date()).toISOString());
  }
  try {
    const parsed = JSON.parse(await fs.readFile(controllerStateFilePath, 'utf8'));
    if (parsed && typeof parsed === 'object' && parsed.mode === 'test-mode-whole-logic-controller') {
      return parsed as WholeLogicControllerState;
    }
  } catch {
    // Missing or invalid state is treated as not-yet-started and recreated safely.
  }
  return buildWholeLogicTestModeControllerState((now ?? new Date()).toISOString());
}

// Persists a JSON document with stable indentation for audit/proof readability.
async function writeJsonFile(targetPath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

// Applies an operator key to the owned Test Mode state without touching OS processes.
function applyWholeLogicControl(state: WholeLogicControllerState, key: WholeLogicControlKey, nowIso: string): WholeLogicControllerState {
  const next = structuredClone(state);
  next.updatedAt = nowIso;
  next.lastControlKey = key;
  next.events.push({ at: nowIso, key, action: WHOLE_LOGIC_TEST_MODE_CONTROL_ACTIONS[key].label });

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
    terminateWorker(next, 'regularStage', nowIso, 'SIGKILL_SIMULATED_POWER_LOSS');
    terminateWorker(next, 'playback', nowIso, 'SIGKILL_SIMULATED_POWER_LOSS');
    terminateWorker(next, 'screenOnOff', nowIso, 'SIGKILL_SIMULATED_POWER_LOSS');
  } else if (key === 't') {
    const restarted = buildWholeLogicTestModeControllerState(nowIso);
    restarted.events = [...next.events, { at: nowIso, key, action: 'Power-on simulation re-enabled cronjobs and worker controller records.' }];
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
