/*
 * Owns View A CronEmulator action state, status-circle classification, and logs.
 * It mirrors the auth button-state pattern while targeting scheduler endpoints.
 */
import {
  SCHEDULER_EMULATOR_ENDPOINTS,
  checkEmulatorScheduler,
  getActiveEmulatorCrontab,
  installEmulatorCrontab,
  runEmulator,
  stopEmulator,
} from '../initService.ts';
import { buildInitLogDetails, normalizeActionResult, summarizeInitPayload } from './runtimeTruthActionUtils.ts';
import {
  SCHEDULER_EMULATOR_BUTTON_KEYS,
  type SchedulerEmulatorButtonKey,
} from '../../data/schedulerEmulatorStatusCopy.ts';
import { buildInitialSchedulerEmulatorButtonStates } from './runtimeTruthState.ts';

const SCHEDULER_CARD_KEY = '3A';
const SCHEDULER_HISTORY_SOURCE = 'SCHEDULER';

type SchedulerEndpoint = {
  method: string;
  path: string;
};

type SchedulerButtonState = {
  status: 'neutral' | 'running' | 'success' | 'failed' | 'blocked' | 'pending' | 'error';
  message: string;
  updatedAt: string | null;
  endpoint: string | null;
};

type SchedulerActionInput = {
  buttonKey: SchedulerEmulatorButtonKey;
  operation: string;
  endpoint: SchedulerEndpoint;
  execute: () => Promise<unknown>;
  payload?: unknown;
  onSuccess?: (draft: Record<string, unknown>, responsePayload: Record<string, unknown>) => void;
};

// Builds the scheduler action API consumed by the shared runtime behavior dispatcher.
export function createRuntimeTruthSchedulerActions({
  getState,
  patchState,
  pushHistory,
  pushLog,
  setStatus,
  stamp,
  guards,
}) {
  const { guardAction, endAction } = guards;

  // Checks the CronEmulator process/API without starting it.
  async function checkEmulatorSchedulerAction() {
    return runSchedulerAction({
      buttonKey: 'check-emulator-scheduler',
      operation: 'Check emulator scheduler',
      endpoint: SCHEDULER_EMULATOR_ENDPOINTS.check,
      execute: () => checkEmulatorScheduler({ target: getState().selectedSchedulerTarget }),
    });
  }

  // Starts CronEmulator and its internal scheduler loop.
  async function runEmulatorAction() {
    return runSchedulerAction({
      buttonKey: 'run-emulator',
      operation: 'Run emulator',
      endpoint: SCHEDULER_EMULATOR_ENDPOINTS.run,
      execute: () => runEmulator({ target: getState().selectedSchedulerTarget }),
    });
  }

  // Stops the CronEmulator scheduler loop and backend-owned process if present.
  async function stopEmulatorAction() {
    return runSchedulerAction({
      buttonKey: 'stop-emulator',
      operation: 'Stop emulator',
      endpoint: SCHEDULER_EMULATOR_ENDPOINTS.stop,
      execute: () => stopEmulator({ target: getState().selectedSchedulerTarget }),
    });
  }

  // Installs the current textarea content into CronEmulator's crontab file.
  async function installCrontabAction() {
    const crontabText = String(getState().schedulerEmulator?.editableCrontab ?? '');
    return runSchedulerAction({
      buttonKey: 'install-crontab',
      operation: 'Install crontab',
      endpoint: SCHEDULER_EMULATOR_ENDPOINTS.installCrontab,
      payload: { crontabText },
      execute: () => installEmulatorCrontab({ target: getState().selectedSchedulerTarget, crontabText }),
    });
  }

  // Reads the active crontab and is the only action that updates textarea B.
  async function getActiveCrontabAction() {
    return runSchedulerAction({
      buttonKey: 'get-active-crontab',
      operation: 'Get active crontab',
      endpoint: SCHEDULER_EMULATOR_ENDPOINTS.activeCrontab,
      execute: () => getActiveEmulatorCrontab({ target: getState().selectedSchedulerTarget }),
      onSuccess: (draft, responsePayload) => {
        const crontabText = readSchedulerCrontabText(responsePayload);
        if (typeof crontabText === 'string') {
          ensureSchedulerEmulatorState(draft).activeCrontab = crontabText;
        }
      },
    });
  }

  // Runs one scheduler backend action and records button/result/log state.
  async function runSchedulerAction({ buttonKey, operation, endpoint, execute, payload = undefined, onSuccess = undefined }: SchedulerActionInput) {
    if (!guardAction(SCHEDULER_CARD_KEY, SCHEDULER_HISTORY_SOURCE, `${operation} is already running; duplicate trigger was blocked.`)) {
      return null;
    }

    const runningMessage = `${operation} started through ${endpoint.method} ${endpoint.path}.`;
    setStatus(SCHEDULER_CARD_KEY, 'running');
    patchState((draft) => {
      const schedulerState = ensureSchedulerEmulatorState(draft);
      schedulerState.buttonStates[buttonKey] = buildSchedulerButtonState('running', runningMessage, endpoint);
      draft.initResults[SCHEDULER_CARD_KEY] = {
        outcome: 'running',
        operation,
        method: endpoint.method,
        endpoint: endpoint.path,
        receivedAt: stamp(),
        message: runningMessage,
        request: { body: payload ?? null },
        response: null,
      };
    });
    pushLog(SCHEDULER_CARD_KEY, 'info', runningMessage, buildInitLogDetails({ operation, endpoint, requestBody: payload, outcome: 'running' }));

    try {
      const responseEnvelope = normalizeActionResult(await execute());
      const responsePayload = responseEnvelope.payload as Record<string, unknown>;
      const responseMeta = responseEnvelope.meta;
      const message = summarizeInitPayload(operation, responsePayload);
      const status = classifySchedulerButtonStatus(buttonKey, responsePayload, 'success');
      const details = buildInitLogDetails({
        operation,
        endpoint,
        requestBody: payload,
        apiMeta: responseMeta,
        responsePayload,
        outcome: 'success',
      });
      patchState((draft) => {
        const schedulerState = ensureSchedulerEmulatorState(draft);
        schedulerState.buttonStates[buttonKey] = buildSchedulerButtonState(status, message, endpoint);
        draft.initResults[SCHEDULER_CARD_KEY] = {
          outcome: 'success',
          operation,
          method: endpoint.method,
          endpoint: endpoint.path,
          receivedAt: stamp(),
          message,
          payload: responsePayload,
          request: details.request,
          response: details.response,
        };
        if (typeof onSuccess === 'function') {
          onSuccess(draft, responsePayload);
        }
        recalculateSchedulerButtonStates(draft, responsePayload);
      });
      setStatus(SCHEDULER_CARD_KEY, status === 'failed' || status === 'error' ? 'error' : status === 'success' ? 'success' : 'info');
      pushLog(SCHEDULER_CARD_KEY, status === 'success' ? 'success' : 'info', message, details);
      pushHistory(SCHEDULER_HISTORY_SOURCE, status === 'success' ? 'success' : 'info', `${operation} completed through ${endpoint.path}.`, details);
      return responsePayload;
    } catch (error) {
      const responsePayload = error?.payload ?? null;
      const message = error?.message ?? `${operation} failed.`;
      const details = buildInitLogDetails({
        operation,
        endpoint,
        requestBody: payload,
        apiMeta: error?.meta ?? null,
        responsePayload,
        outcome: 'error',
      });
      patchState((draft) => {
        const schedulerState = ensureSchedulerEmulatorState(draft);
        schedulerState.buttonStates[buttonKey] = buildSchedulerButtonState('failed', message, endpoint);
        draft.initResults[SCHEDULER_CARD_KEY] = {
          outcome: 'error',
          operation,
          method: endpoint.method,
          endpoint: endpoint.path,
          receivedAt: stamp(),
          status: error?.status ?? null,
          message,
          errorPayload: responsePayload,
          request: details.request,
          response: details.response,
        };
      });
      setStatus(SCHEDULER_CARD_KEY, 'error');
      pushLog(SCHEDULER_CARD_KEY, 'error', message, details);
      pushHistory(SCHEDULER_HISTORY_SOURCE, 'error', `${operation} failed through ${endpoint.path}.`, details);
      return null;
    } finally {
      endAction(SCHEDULER_CARD_KEY);
    }
  }

  return {
    checkEmulatorSchedulerAction,
    runEmulatorAction,
    stopEmulatorAction,
    installCrontabAction,
    getActiveCrontabAction,
  };
}

// Classifies scheduler backend payloads into auth-style circle statuses.
function classifySchedulerButtonStatus(buttonKey: SchedulerEmulatorButtonKey, payload: Record<string, unknown>, transportOutcome: string): SchedulerButtonState['status'] {
  if (transportOutcome === 'error' || payload?.status === 'error') return 'failed';
  const scheduler = readRecord(payload?.scheduler);
  const task = readRecord(scheduler?.task);
  const host = readRecord(scheduler?.host);
  const running = task?.running === true || host?.state === 'running';
  const observed = host?.observed === true;

  if (buttonKey === 'run-emulator') return running ? 'success' : 'pending';
  if (buttonKey === 'stop-emulator') return running ? 'pending' : 'success';
  if (buttonKey === 'install-crontab') return task?.crontabInstalled === true || task?.installed === true ? 'success' : 'pending';
  if (buttonKey === 'get-active-crontab') return typeof readSchedulerCrontabText(payload) === 'string' ? 'success' : 'failed';
  if (buttonKey === 'check-emulator-scheduler') return observed ? 'success' : 'failed';
  return payload?.status === 'ok' ? 'success' : 'pending';
}

// Reconciles all scheduler circles from the latest backend scheduler projection.
function recalculateSchedulerButtonStates(draft: Record<string, unknown>, payload: Record<string, unknown>) {
  const schedulerState = ensureSchedulerEmulatorState(draft);
  const scheduler = readRecord(payload?.scheduler);
  const task = readRecord(scheduler?.task);
  const host = readRecord(scheduler?.host);
  const running = task?.running === true || host?.state === 'running';
  const observed = host?.observed === true;
  const message = Array.isArray(payload?.messages) ? String(payload.messages[0] ?? '') : String(scheduler?.messages?.[0] ?? '');

  if (observed) {
    schedulerState.buttonStates['check-emulator-scheduler'] = buildSchedulerButtonState('success', message || 'CronEmulator API responded.', SCHEDULER_EMULATOR_ENDPOINTS.check);
  }
  if (running) {
    schedulerState.buttonStates['run-emulator'] = buildSchedulerButtonState('success', message || 'CronEmulator scheduler is running.', SCHEDULER_EMULATOR_ENDPOINTS.run);
    schedulerState.buttonStates['stop-emulator'] = buildSchedulerButtonState('neutral', 'CronEmulator is running; Stop emulator is available.', SCHEDULER_EMULATOR_ENDPOINTS.stop);
  } else if (observed || task?.stopped === true) {
    schedulerState.buttonStates['run-emulator'] = buildSchedulerButtonState('neutral', 'CronEmulator is reachable but scheduler is stopped.', SCHEDULER_EMULATOR_ENDPOINTS.run);
    schedulerState.buttonStates['stop-emulator'] = buildSchedulerButtonState('success', 'CronEmulator scheduler is stopped.', SCHEDULER_EMULATOR_ENDPOINTS.stop);
  }
}

// Ensures scheduler emulator state exists before mutation.
function ensureSchedulerEmulatorState(draft: Record<string, unknown>) {
  draft.schedulerEmulator ??= {
    editableCrontab: '',
    activeCrontab: "not checked, press 'Get active crontab'",
    buttonStates: buildInitialSchedulerEmulatorButtonStates(),
  };
  const schedulerState = draft.schedulerEmulator as {
    editableCrontab: string;
    activeCrontab: string;
    buttonStates: Record<SchedulerEmulatorButtonKey, SchedulerButtonState>;
  };
  schedulerState.buttonStates ??= buildInitialSchedulerEmulatorButtonStates();
  for (const key of SCHEDULER_EMULATOR_BUTTON_KEYS) {
    schedulerState.buttonStates[key] ??= buildSchedulerButtonState('neutral', 'Not checked yet.', null);
  }
  return schedulerState;
}

// Creates one scheduler emulator button-state record.
function buildSchedulerButtonState(status: SchedulerButtonState['status'], message: string, endpoint: SchedulerEndpoint | null): SchedulerButtonState {
  return {
    status,
    message,
    updatedAt: new Date().toLocaleString('et-EE', { timeZone: 'Europe/Tallinn' }),
    endpoint: endpoint ? `${endpoint.method} ${endpoint.path}` : null,
  };
}

// Reads the crontab text from the backend scheduler payload.
function readSchedulerCrontabText(payload: Record<string, unknown>): string | null {
  const scheduler = readRecord(payload?.scheduler);
  const task = readRecord(scheduler?.task);
  return typeof task?.rawCrontab === 'string' ? task.rawCrontab : null;
}

// Narrows arbitrary payload values to records.
function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
