/*
 * Owns View A CronEmulator action state, status-circle classification, and logs.
 * It mirrors the auth button-state pattern while targeting scheduler endpoints.
 */
import {
  SCHEDULER_EMULATOR_ENDPOINTS,
  checkEmulatorScheduler,
  getActiveEmulatorCrontab,
  getSchedulerRunLog,
  installEmulatorCrontab,
  runEmulator,
  stopEmulator,
  testEmulatorCrontabWriting,
} from '../initService.ts';
import { buildInitLogDetails, normalizeActionResult, summarizeInitPayload } from './runtimeTruthActionUtils.ts';
import {
  SCHEDULER_EMULATOR_BUTTON_KEYS,
  type SchedulerEmulatorButtonKey,
} from '../../data/schedulerEmulatorStatusCopy.ts';
import { buildInitialSchedulerEmulatorButtonStates } from './runtimeTruthState.ts';

const SCHEDULER_CARD_KEY = '3A';
const SCHEDULER_HISTORY_SOURCE = 'SCHEDULER';
const DEFAULT_V2_REAL_CRONTAB = [
  '# PhotoFrame V2 default real crontab',
  '*/3 * * * * cd "$PF_REPO_ROOT" && npm run api -- --scheduler screen-on-off-worker',
  '*/10 * * * * cd "$PF_REPO_ROOT" && npm run api -- --scheduler regular-stage-worker',
  '* * * * * cd "$PF_REPO_ROOT" && npm run api -- --scheduler playback-worker',
].join('\n');

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

type SchedulerEndpointLogType = 'request' | 'response' | 'error' | 'cron-run-success' | 'cron-run-failed';

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

  function resolveSchedulerTarget(options: { target?: string } = {}) {
    return options?.target ?? getState().selectedSchedulerTarget;
  }

  // Checks the scheduler process/API without starting it.
  async function checkEmulatorSchedulerAction(options: { target?: string } = {}) {
    return runSchedulerAction({
      buttonKey: 'check-emulator-scheduler',
      operation: 'Check emulator scheduler',
      endpoint: SCHEDULER_EMULATOR_ENDPOINTS.check,
      execute: () => checkEmulatorScheduler({ target: resolveSchedulerTarget(options) }),
    });
  }

  // Starts the selected scheduler target.
  async function runEmulatorAction(options: { target?: string } = {}) {
    return runSchedulerAction({
      buttonKey: 'run-emulator',
      operation: 'Run emulator',
      endpoint: SCHEDULER_EMULATOR_ENDPOINTS.run,
      execute: () => runEmulator({ target: resolveSchedulerTarget(options) }),
    });
  }

  // Stops the selected scheduler target if the backend owns a stoppable process.
  async function stopEmulatorAction(options: { target?: string } = {}) {
    return runSchedulerAction({
      buttonKey: 'stop-emulator',
      operation: 'Stop emulator',
      endpoint: SCHEDULER_EMULATOR_ENDPOINTS.stop,
      execute: () => stopEmulator({ target: resolveSchedulerTarget(options) }),
    });
  }


  // Populates the editable crontab textarea with the Beeline default three-worker schedule.
  function printDefaultCrontabAction() {
    patchState((draft) => {
      const schedulerState = ensureSchedulerEmulatorState(draft);
      schedulerState.editableCrontab = DEFAULT_V2_REAL_CRONTAB;
      draft.initResults[SCHEDULER_CARD_KEY] = {
        outcome: 'success',
        operation: 'Print default crontab',
        method: 'LOCAL',
        endpoint: 'v2/default-crontab',
        receivedAt: stamp(),
        message: 'Default V2 crontab printed into the editable crontab textarea.',
        payload: { crontabText: DEFAULT_V2_REAL_CRONTAB, workerRows: 3 },
        request: null,
        response: null,
      };
    });
    setStatus(SCHEDULER_CARD_KEY, 'success');
    pushLog(SCHEDULER_CARD_KEY, 'success', 'Default V2 crontab printed into the editable crontab textarea.', {
      operation: 'Print default crontab',
      crontabRows: DEFAULT_V2_REAL_CRONTAB.split('\n').length,
    });
    pushHistory(SCHEDULER_HISTORY_SOURCE, 'success', 'Default V2 crontab printed into textarea.', {
      action: 'print-default-crontab',
      workerRows: 3,
    });
  }

  // Performs a real safe crontab write/read/remove test with a temporary comment marker.
  async function testCrontabWritingAction(options: { target?: string } = {}) {
    return runSchedulerAction({
      buttonKey: 'install-crontab',
      operation: 'Test crontab writing',
      endpoint: SCHEDULER_EMULATOR_ENDPOINTS.writeTestCrontab,
      payload: { target: resolveSchedulerTarget(options) },
      execute: () => testEmulatorCrontabWriting({ target: resolveSchedulerTarget(options) }),
    });
  }

  // Installs the current textarea content into the selected crontab target.
  async function installCrontabAction(options: { target?: string } = {}) {
    const crontabText = String(getState().schedulerEmulator?.editableCrontab ?? '');
    return runSchedulerAction({
      buttonKey: 'install-crontab',
      operation: 'Install crontab',
      endpoint: SCHEDULER_EMULATOR_ENDPOINTS.installCrontab,
      payload: { crontabText, target: resolveSchedulerTarget(options) },
      execute: () => installEmulatorCrontab({ target: resolveSchedulerTarget(options), crontabText }),
    });
  }

  // Reads the active crontab and is the only action that updates textarea B.
  async function getActiveCrontabAction(options: { target?: string } = {}) {
    return runSchedulerAction({
      buttonKey: 'get-active-crontab',
      operation: 'Get active crontab',
      endpoint: SCHEDULER_EMULATOR_ENDPOINTS.activeCrontab,
      execute: () => getActiveEmulatorCrontab({ target: resolveSchedulerTarget(options) }),
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
      appendSchedulerEndpointLog(draft, {
        type: 'request',
        operation,
        endpoint,
        status: null,
        message: runningMessage,
      });
    });
    pushLog(SCHEDULER_CARD_KEY, 'info', runningMessage, buildInitLogDetails({ operation, endpoint, requestBody: payload, outcome: 'running' }));

    try {
      const responseEnvelope = normalizeActionResult(await execute());
      const responsePayload = responseEnvelope.payload as Record<string, unknown>;
      const responseMeta = responseEnvelope.meta;
      const message = summarizeInitPayload(operation, responsePayload);
      const status = classifySchedulerButtonStatus(buttonKey, responsePayload, 'success');
      const httpStatus = typeof responseMeta?.response?.status === 'number' ? responseMeta.response.status : null;
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
        appendSchedulerEndpointLog(draft, {
          type: 'response',
          operation,
          endpoint,
          status: httpStatus,
          message,
        });
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
        appendSchedulerEndpointLog(draft, {
          type: 'error',
          operation,
          endpoint,
          status: typeof error?.status === 'number' ? error.status : null,
          message,
        });
      });
      setStatus(SCHEDULER_CARD_KEY, 'error');
      pushLog(SCHEDULER_CARD_KEY, 'error', message, details);
      pushHistory(SCHEDULER_HISTORY_SOURCE, 'error', `${operation} failed through ${endpoint.path}.`, details);
      return null;
    } finally {
      endAction(SCHEDULER_CARD_KEY);
    }
  }

  // Refreshes actual cron row execution evidence without pushing noisy history entries.
  async function refreshSchedulerRunLogAction() {
    try {
      const responseEnvelope = normalizeActionResult(await getSchedulerRunLog({ target: getState().selectedSchedulerTarget }));
      const responsePayload = responseEnvelope.payload as Record<string, unknown>;
      patchState((draft) => {
        mergeSchedulerRunLogEntries(draft, responsePayload);
      });
      return responsePayload;
    } catch {
      return null;
    }
  }

  return {
    checkEmulatorSchedulerAction,
    runEmulatorAction,
    stopEmulatorAction,
    installCrontabAction,
    getActiveCrontabAction,
    printDefaultCrontabAction,
    testCrontabWritingAction,
    refreshSchedulerRunLogAction,
  };
}


// Merges backend-observed cron row calls into the terminal log without duplicates.
function mergeSchedulerRunLogEntries(draft: Record<string, unknown>, responsePayload: Record<string, unknown>) {
  const schedulerState = ensureSchedulerEmulatorState(draft);
  const runLog = readRecord(responsePayload?.runLog);
  const entries = Array.isArray(runLog?.entries) ? runLog.entries : [];
  if (!entries.length) {
    return;
  }

  const existingIds = new Set(schedulerState.endpointLog.map((entry) => String(entry.id ?? '')));
  const normalizedEntries = entries
    .filter((entry): entry is Record<string, unknown> => Boolean(readRecord(entry)))
    .filter((entry) => !existingIds.has(String(entry.id ?? '')))
    .map((entry) => ({
      id: String(entry.id ?? createSchedulerEndpointLogId()),
      at: String(entry.at ?? ''),
      atIso: String(entry.atIso ?? new Date().toISOString()),
      type: normalizeSchedulerRunLogType(entry.type),
      operation: String(entry.operation ?? 'Cron row executed'),
      method: String(entry.method ?? 'CRON'),
      endpoint: String(entry.endpoint ?? entry.jobName ?? 'cron-row'),
      message: String(entry.message ?? 'Cron row was executed.'),
      status: typeof entry.status === 'number' ? entry.status : null,
      jobName: typeof entry.jobName === 'string' ? entry.jobName : null,
      rawCronRow: typeof entry.rawCronRow === 'string' ? entry.rawCronRow : null,
      command: typeof entry.command === 'string' ? entry.command : null,
      actualCronRowCall: entry.actualCronRowCall === true,
      source: typeof entry.source === 'string' ? entry.source : 'scheduler',
    }));

  schedulerState.endpointLog = [...normalizedEntries, ...schedulerState.endpointLog].slice(0, 80);
}

// Normalizes backend run evidence type values for safe CSS class use.
function normalizeSchedulerRunLogType(value: unknown): SchedulerEndpointLogType {
  return value === 'cron-run-failed' ? 'cron-run-failed' : 'cron-run-success';
}

// Appends a compact live terminal row for scheduler endpoint traffic.
function appendSchedulerEndpointLog(
  draft: Record<string, unknown>,
  entry: {
    type: SchedulerEndpointLogType;
    operation: string;
    endpoint: SchedulerEndpoint;
    status: number | null;
    message: string;
  },
) {
  const schedulerState = ensureSchedulerEmulatorState(draft);
  const now = new Date();
  schedulerState.endpointLog.unshift({
    id: createSchedulerEndpointLogId(),
    at: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    atIso: now.toISOString(),
    type: entry.type,
    operation: entry.operation,
    method: entry.endpoint.method,
    endpoint: entry.endpoint.path,
    message: entry.message,
    status: entry.status,
  });
  schedulerState.endpointLog = schedulerState.endpointLog.slice(0, 50);
}

// Creates a stable-enough local id for scheduler terminal rows without backend coupling.
function createSchedulerEndpointLogId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `scheduler-endpoint-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
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
    endpointLog: [],
    buttonStates: buildInitialSchedulerEmulatorButtonStates(),
  };
  const schedulerState = draft.schedulerEmulator as {
    editableCrontab: string;
    activeCrontab: string;
    endpointLog: Array<Record<string, unknown>>;
    buttonStates: Record<SchedulerEmulatorButtonKey, SchedulerButtonState>;
  };
  schedulerState.endpointLog ??= [];
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
