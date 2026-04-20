import {
  INIT_ENDPOINTS,
  verifyEnv,
  checkDatabaseStatus,
  inspectDatabase,
  deleteDatabase,
  recreateEmptyDatabase,
  installCron,
  checkCronStatus,
  printCron,
} from './initService.js';
import {
  createSchedulerCapability,
  getOperationSupportLevel,
  SCHEDULER_OPERATION_SUPPORT,
  SCHEDULER_SUPPORT_LEVELS,
} from '../../shared/schedulerPlatformCapabilities.js';

const stamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const formatTallinnTimestamp = () =>
  new Intl.DateTimeFormat('et-EE', {
    timeZone: 'Europe/Tallinn',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date());

const listeners = new Set();
const STAGE_ACTION_KEYS = new Set(['B3.1', 'B3.2', 'B3.3', 'B3.4', 'B3.5']);
const PROCESS_ACTION_KEYS = new Set(['B4', 'D2', 'D3']);
const ACTION_LOCK_KEYS = new Set(['1A', '2A', '3A', 'B1', 'B2', 'B3', 'B3.1', 'B3.2', 'B3.3', 'B3.4', 'B3.5', 'B4', 'B5', 'C', 'D1', 'D2', 'D3']);
const SCHEDULER_ACTION_TO_OPERATION = Object.freeze({
  'install-cron': SCHEDULER_OPERATION_SUPPORT.install,
  'check-cron': SCHEDULER_OPERATION_SUPPORT.status,
  'print-cron': SCHEDULER_OPERATION_SUPPORT.print,
});

function buildInitialSchedulerCapability() {
  const browserPlatform = typeof navigator !== 'undefined' ? navigator.platform : null;
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null;
  return createSchedulerCapability({ browserPlatform, userAgent });
}

function getSchedulerSupportForAction(capability, action) {
  const operation = SCHEDULER_ACTION_TO_OPERATION[action];
  if (!operation) {
    return SCHEDULER_SUPPORT_LEVELS.supported;
  }
  return getOperationSupportLevel(capability, operation);
}

function supportsSchedulerAction(capability, action) {
  return getSchedulerSupportForAction(capability, action) === SCHEDULER_SUPPORT_LEVELS.supported;
}

function buildSchedulerReadyMessage(capability) {
  const label = capability?.profileLabel ?? 'current platform';
  const support = capability?.supportLevel ?? 'unknown';
  return `Scheduler controls are ready to call legacy /api/init/cron/* endpoints for ${label} (${support}).`;
}


function createInitialState() {
  const now = stamp();
  const schedulerCapability = buildInitialSchedulerCapability();
  return {
    activeView: 'A',
    inspectMode: false,
    valueInspectMode: false,
    realityInspectMode: false,
    backendStatusInspectMode: false,
    currentViewTitle: 'A — Init',
    modeBanner: 'Hybrid UI: A uses backend contract calls, while B-D remain frontend demos and previews',
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
    },
    activeActions: {},
    modal: null,
    truth: {
      queueLength: 0,
      currentMedia: null,
      playbackStatus: 'Waiting for queued media',
      screenState: 'ON',
      lastActivitySource: 'Mouse movement',
      inactivityTimeoutSeconds: 5,
      lastCheckpoint: 'No checkpoint yet',
      lastStageCompleted: 'None',
      realRunActive: false,
      sourceOfTruth: 'frontend://runtime-truth',
      stageLock: 'No stage lock active',
      playbackLock: 'Playback worker lock available',
      screenLock: 'Screen worker lock available',
      pipelineActiveKey: null,
      playbackActive: false,
      realRunStartCount: 0,
    },
    history: [
      { id: crypto.randomUUID(), at: now, source: 'BOOT', type: 'info', message: 'Dashboard shell initialized.' },
      { id: crypto.randomUUID(), at: now, source: 'TRUTH', type: 'info', message: 'Single source of truth loaded in memory.' },
    ],
    logs: {
      '1A': [{ at: now, type: 'info', message: 'Ready to call POST /api/init/verify-env.' }],
      '2A': [{ at: now, type: 'info', message: 'Database controls are ready to call /api/init/database/* endpoints.' }],
      '3A': [{ at: now, type: 'info', message: buildSchedulerReadyMessage(schedulerCapability) }],
      B1: [{ at: now, type: 'info', message: 'Login flow is idle.' }],
      B2: [{ at: now, type: 'info', message: 'No download batch has run yet.' }],
      'B3.1': [{ at: now, type: 'info', message: 'Mock download will read from /generated_test_data.' }],
      'B3.2': [{ at: now, type: 'info', message: 'Index stage waiting.' }],
      'B3.3': [{ at: now, type: 'info', message: 'GPS parser waiting.' }],
      'B3.4': [{ at: now, type: 'info', message: 'Geocode stage waiting.' }],
      'B3.5': [{ at: now, type: 'info', message: 'Queue stage waiting.' }],
      B4: [{ at: now, type: 'info', message: 'Playback emulation disabled until media exists.' }],
      B5: [{ at: now, type: 'info', message: 'Screen simulation controls ready.' }],
      C: [{ at: now, type: 'info', message: 'Last run demo state is idle until one of the view-level demo buttons is pressed.' }],
      D: [{ at: now, type: 'info', message: 'Simulated runtime preview is inactive.' }],
    },
    initResults: {
      '1A': null,
      '2A': null,
      '3A': null,
    },
    initCapabilities: {
      scheduler: schedulerCapability,
    },
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

let state = createInitialState();

export function getState() {
  return state;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  listeners.forEach((listener) => listener(state));
}

export function setActiveView(viewId, title) {
  state = { ...state, activeView: viewId, currentViewTitle: title };
  emit();
}

export function toggleInspectMode() {
  const nextInspectMode = !state.inspectMode;
  state = {
    ...state,
    inspectMode: nextInspectMode,
    valueInspectMode: nextInspectMode ? false : state.valueInspectMode,
    realityInspectMode: nextInspectMode ? false : state.realityInspectMode,
    backendStatusInspectMode: nextInspectMode ? false : state.backendStatusInspectMode,
  };
  emit();
}

export function toggleValueInspectMode() {
  const nextValueInspectMode = !state.valueInspectMode;
  state = {
    ...state,
    valueInspectMode: nextValueInspectMode,
    inspectMode: nextValueInspectMode ? false : state.inspectMode,
    realityInspectMode: nextValueInspectMode ? false : state.realityInspectMode,
    backendStatusInspectMode: nextValueInspectMode ? false : state.backendStatusInspectMode,
  };
  emit();
}

export function toggleRealityInspectMode() {
  const nextRealityInspectMode = !state.realityInspectMode;
  state = {
    ...state,
    realityInspectMode: nextRealityInspectMode,
    inspectMode: nextRealityInspectMode ? false : state.inspectMode,
    valueInspectMode: nextRealityInspectMode ? false : state.valueInspectMode,
    backendStatusInspectMode: nextRealityInspectMode ? false : state.backendStatusInspectMode,
  };
  emit();
}

export function toggleBackendStatusInspectMode() {
  const nextBackendStatusInspectMode = !state.backendStatusInspectMode;
  state = {
    ...state,
    backendStatusInspectMode: nextBackendStatusInspectMode,
    inspectMode: nextBackendStatusInspectMode ? false : state.inspectMode,
    valueInspectMode: nextBackendStatusInspectMode ? false : state.valueInspectMode,
    realityInspectMode: nextBackendStatusInspectMode ? false : state.realityInspectMode,
  };
  emit();
}

export function patchState(mutator) {
  const nextState = structuredClone(state);
  mutator(nextState);
  state = nextState;
  emit();
}

export function resetHistory() {
  patchState((draft) => {
    draft.history = [{ id: crypto.randomUUID(), at: stamp(), source: 'USER', type: 'info', message: 'History cleared.' }];
  });
}

export function pushHistory(source, type, message, details = null) {
  patchState((draft) => {
    draft.history.unshift({
      id: crypto.randomUUID(),
      at: stamp(),
      atIso: new Date().toISOString(),
      atTallinn: formatTallinnTimestamp(),
      source,
      type,
      message,
      details,
    });
  });
}

export function openModal(modal) {
  patchState((draft) => {
    draft.modal = modal ? structuredClone(modal) : null;
  });
}

export function closeModal() {
  patchState((draft) => {
    draft.modal = null;
  });
}

export function pushLog(key, type, message, details = null) {
  patchState((draft) => {
    draft.logs[key] ??= [];
    const now = new Date();
    draft.logs[key].unshift({
      at: stamp(),
      atIso: now.toISOString(),
      atTallinn: formatTallinnTimestamp(),
      type,
      message,
      details,
    });
  });
}

function buildRequestHeaders(body) {
  const headers = {
    Accept: 'application/json, text/plain;q=0.9, */*;q=0.8',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

function normalizeActionResult(result) {
  if (result && typeof result === 'object' && 'payload' in result && 'meta' in result) {
    return result;
  }

  return { payload: result, meta: null };
}

function buildTimelineDetails() {
  const now = new Date();
  return {
    local: stamp(),
    tallinn: formatTallinnTimestamp(),
    iso: now.toISOString(),
  };
}

function buildInitLogDetails({ operation, endpoint, requestBody, apiMeta, responsePayload, outcome }) {
  const request = apiMeta?.request ?? {
    method: endpoint.method,
    path: endpoint.path,
    headers: buildRequestHeaders(requestBody),
    body: requestBody === undefined ? null : requestBody,
  };
  const responseMeta = apiMeta?.response ?? null;

  return {
    timeline: buildTimelineDetails(),
    operation,
    endpoint: `${endpoint.method} ${endpoint.path}`,
    outcome,
    request,
    response: responseMeta
      ? {
          status: responseMeta.status,
          statusText: responseMeta.statusText,
          ok: responseMeta.ok,
          url: responseMeta.url,
          headers: responseMeta.headers,
          body: responsePayload ?? responseMeta.body ?? null,
        }
      : null,
  };
}

export function setStatus(key, status) {
  patchState((draft) => {
    draft.statusByKey[key] = status;
  });
}

export function seedDemoState() {
  patchState((draft) => {
    const now = stamp();
    draft.truth.queueLength = 3;
    draft.truth.currentMedia = {
      name: 'same_gps_03.jpg',
      type: 'Image',
      position: '2 of 3',
      overlay: 'Tallinn, Harjumaa, Estonia',
    };
    draft.truth.playbackStatus = 'Paused by inactivity';
    draft.truth.lastCheckpoint = `${now} checkpoint saved`;
    draft.truth.lastStageCompleted = 'Queue Slideshow';
    draft.truth.stageLock = 'Pipeline lock held by geocode loop';
    draft.lastRunMode = 'ready';
    draft.lastRunData = {
      media: {
        file: 'same_gps_03.jpg',
        type: 'Image',
        queuePosition: '2 of 3',
        checkpoint: `${now} checkpoint saved`,
      },
      playback: {
        status: 'Paused by inactivity',
        lastCheckpoint: `${now}`,
        resumeMarker: 'same_gps_03.jpg :: display-start',
        crashState: 'Recovered after simulated power loss',
      },
      stage: {
        active: 'Playback',
        lastCompleted: 'Queue Slideshow',
        previousStage: 'Geocode',
        stageError: 'None',
      },
      screen: {
        state: 'OFF',
        lastActivitySource: 'PIR timeout elapsed',
        timeout: '5 seconds',
        transition: 'screen_off_due_to_inactivity',
      },
    };
    draft.runningProcess.pipelineStages[0] = { ...draft.runningProcess.pipelineStages[0], status: 'Success', lastRun: now, summary: 'Downloaded 5 files in the last cycle.' };
    draft.runningProcess.pipelineStages[1] = { ...draft.runningProcess.pipelineStages[1], status: 'Running', lastRun: now, summary: 'Indexing current batch right now.' };
    draft.statusByKey.B4 = 'idle';
  });
  pushHistory('DEMO', 'success', 'Demo state seeded for playback and recovery views.');
}

export function setLastRunMode(mode) {
  patchState((draft) => {
    draft.lastRunMode = mode;
  });
}

export function setSimulationValue(key, value) {
  patchState((draft) => {
    draft.simulation[key] = value;
    if (key === 'simulateAllEnabled') {
      draft.simulation.pirEnabled = Boolean(value);
      draft.simulation.mouseEnabled = Boolean(value);
      draft.simulation.keyboardEnabled = Boolean(value);
    }
    if (['pirEnabled', 'mouseEnabled', 'keyboardEnabled'].includes(key) && !value) {
      draft.simulation.simulateAllEnabled = false;
    }
    if (key === 'inactivityTimeoutSeconds') {
      draft.truth.inactivityTimeoutSeconds = Number(value);
      draft.runningProcess.screenWorker.timeout = `${value}s`;
    }
  });
  if (['pirEnabled', 'mouseEnabled', 'keyboardEnabled', 'simulateAllEnabled', 'inactivityTimeoutSeconds'].includes(key)) {
    applyScreenSimulationState(`${key} changed`);
  }
}

export function runAction(action, payload = {}) {
  const schedulerOperation = SCHEDULER_ACTION_TO_OPERATION[action];
  if (schedulerOperation) {
    const schedulerCapability = state.initCapabilities?.scheduler ?? buildInitialSchedulerCapability();
    if (!supportsSchedulerAction(schedulerCapability, action)) {
      const support = getSchedulerSupportForAction(schedulerCapability, action);
      const profileLabel = schedulerCapability.profileLabel ?? 'current platform';
      const message = `Scheduler action blocked: ${schedulerOperation.toUpperCase()} is ${support} on ${profileLabel}.`;
      setStatus('3A', support === SCHEDULER_SUPPORT_LEVELS.unsupported ? 'error' : 'info');
      pushLog('3A', support === SCHEDULER_SUPPORT_LEVELS.unsupported ? 'error' : 'warning', message, {
        timeline: buildTimelineDetails(),
        action,
        schedulerOperation,
        supportLevel: support,
        profile: profileLabel,
      });
      pushHistory('SCHEDULER', support === SCHEDULER_SUPPORT_LEVELS.unsupported ? 'error' : 'warning', message, {
        action,
        schedulerOperation,
        supportLevel: support,
        profile: profileLabel,
      });
      return;
    }
  }

  const actionMap = {
    'verify-env': () => runInitAction('1A', 'INIT', 'Verify .env', INIT_ENDPOINTS.verifyEnv, verifyEnv),
    'check-db': () => runInitAction('2A', 'DB', 'Check DB', INIT_ENDPOINTS.checkDatabaseStatus, checkDatabaseStatus),
    'inspect-db': () => runInitAction('2A', 'DB', 'Inspect DB', INIT_ENDPOINTS.inspectDatabase, inspectDatabase),
    'delete-db': () => runInitAction('2A', 'DB', 'Delete DB', INIT_ENDPOINTS.deleteDatabase, deleteDatabase, payload),
    'recreate-db': () => runInitAction('2A', 'DB', 'Recreate DB', INIT_ENDPOINTS.recreateEmptyDatabase, recreateEmptyDatabase, payload),
    'install-cron': () => runInitAction('3A', 'SCHEDULER', 'Install scheduler', INIT_ENDPOINTS.installCron, installCron),
    'check-cron': () => runInitAction('3A', 'SCHEDULER', 'Check scheduler', INIT_ENDPOINTS.checkCronStatus, checkCronStatus),
    'print-cron': () => runInitAction('3A', 'SCHEDULER', 'Print scheduler', INIT_ENDPOINTS.printCron, printCron),
    'run-b1': () => runLoginFlow(),
    'run-b2': () => genericAction('B2', 'TEST', 'Mock batch download finished with 5 files.'),
    'run-b3-1': () => runPipelineStage('B3.1', 'Mock download copied 1 file from /generated_test_data.'),
    'run-b3-2': () => runPipelineStage('B3.2', 'Index stage produced 1 indexed asset.'),
    'run-b3-3': () => runPipelineStage('B3.3', 'GPS parser extracted location metadata.'),
    'run-b3-4': () => runPipelineStage('B3.4', 'Geocode stage resolved coordinates to address text.'),
    'run-b3-5': () => runEnqueueStage(),
    'run-b3-auto': () => runAutoPipeline(),
    'run-b4': () => runPlaybackEmulation(),
    'resume-last-run': () => genericAction('C', 'RECOVERY', 'Restore placeholder activated from the current last-run demo state.'),
    'start-real-run': () => startRealRun(),
  };

  const handler = actionMap[action];
  if (handler) {
    handler();
  }
}


function isPipelineBusy() {
  return Boolean(state.truth.pipelineActiveKey);
}

function startPipelineLock(key) {
  patchState((draft) => {
    draft.truth.pipelineActiveKey = key;
    draft.truth.stageLock = `Pipeline lock held by ${key}`;
  });
}

function releasePipelineLock(key) {
  patchState((draft) => {
    if (draft.truth.pipelineActiveKey === key) {
      draft.truth.pipelineActiveKey = null;
      draft.truth.stageLock = `${key} finished and released the pipeline lock`;
    }
  });
}

function rejectWhileBusy(key, source, message) {
  setStatus(key, 'error');
  pushLog(key, 'error', message);
  pushHistory(source, 'error', message);
}

function withPlaybackGuard(fn) {
  if (state.truth.playbackActive) {
    rejectWhileBusy('B4', 'PLAYBACK', 'Playback emulation is already active; duplicate playback start was blocked.');
    return false;
  }
  patchState((draft) => {
    draft.truth.playbackActive = true;
    draft.truth.playbackLock = 'Playback worker lock held';
  });
  fn();
  return true;
}

function releasePlaybackGuard() {
  patchState((draft) => {
    draft.truth.playbackActive = false;
    draft.truth.playbackLock = draft.truth.realRunActive ? 'Playback worker lock held by simulated runtime preview' : 'Playback worker lock available';
  });
}


function isActionActive(key) {
  return Boolean(state.activeActions[key]);
}

function beginAction(key) {
  patchState((draft) => {
    draft.activeActions[key] = true;
  });
}

function endAction(key) {
  patchState((draft) => {
    delete draft.activeActions[key];
  });
}

function guardAction(key, source, message) {
  if (!ACTION_LOCK_KEYS.has(key)) {
    return true;
  }
  if (isActionActive(key)) {
    rejectWhileBusy(key, source, message);
    return false;
  }
  beginAction(key);
  return true;
}

function applyScreenSimulationState(reason) {
  const simulation = state.simulation;
  const anyEnabled = simulation.simulateAllEnabled || simulation.pirEnabled || simulation.mouseEnabled || simulation.keyboardEnabled;
  const nextScreenState = anyEnabled ? 'ON' : 'OFF';
  const nextActivity = simulation.simulateAllEnabled
    ? 'All simulated activity sources enabled'
    : simulation.pirEnabled
      ? 'PIR sensor activity enabled'
      : simulation.mouseEnabled
        ? 'Mouse movement enabled'
        : simulation.keyboardEnabled
          ? 'Keyboard activity enabled'
          : 'No simulated activity sources enabled';

  patchState((draft) => {
    draft.truth.screenState = nextScreenState;
    draft.truth.lastActivitySource = nextActivity;
    draft.truth.inactivityTimeoutSeconds = Number(simulation.inactivityTimeoutSeconds);
    draft.runningProcess.screenWorker.screenState = nextScreenState;
    draft.runningProcess.screenWorker.lastActivity = nextActivity;
    draft.runningProcess.screenWorker.timeout = `${Number(simulation.inactivityTimeoutSeconds)}s`;
    if (nextScreenState === 'OFF') {
      draft.truth.playbackStatus = 'Paused by inactivity';
      draft.truth.lastCheckpoint = `${stamp()} screen-off checkpoint saved`;
    } else if (draft.truth.currentMedia) {
      draft.truth.playbackStatus = 'Ready for emulation';
    } else {
      draft.truth.playbackStatus = 'Waiting for queued media';
    }
  });

  pushLog('B5', 'info', `Screen simulation updated: ${reason}. Screen is now ${nextScreenState}.`);
  pushHistory('SCREEN', nextScreenState === 'OFF' ? 'warning' : 'success', `Screen simulation updated: ${reason}. Screen is now ${nextScreenState}.`, {
    reason,
    screenState: nextScreenState,
    activitySource: nextActivity,
  });
}

function genericAction(key, source, message) {
  if (!guardAction(key, source, `${key} action is already running; duplicate trigger was blocked.`)) {
    return;
  }
  setStatus(key, 'running');
  pushLog(key, 'info', `Started action: ${message}`);
  setTimeout(() => {
    setStatus(key, 'success');
    pushLog(key, 'success', message);
    pushHistory(source, 'success', message, {
      actionKey: key,
      actionMessage: message,
    });
    if (key.startsWith('B3')) {
      patchState((draft) => {
        draft.truth.lastStageCompleted = key;
      });
    }
    endAction(key);
  }, 420);
}

async function runInitAction(key, source, operation, endpoint, request, payload = undefined) {
  if (!guardAction(key, source, `${operation} is already running; duplicate trigger was blocked.`)) {
    return;
  }

  setStatus(key, 'running');
  const startDetails = buildInitLogDetails({
    operation,
    endpoint,
    requestBody: payload,
    apiMeta: null,
    responsePayload: null,
    outcome: 'running',
  });
  patchState((draft) => {
    draft.initResults[key] = {
      outcome: 'running',
      operation,
      method: endpoint.method,
      endpoint: endpoint.path,
      receivedAt: stamp(),
      message: `${operation} request sent. Waiting for backend response...`,
      request: startDetails.request,
      response: null,
    };
  });
  pushLog(key, 'info', `${operation} started via ${endpoint.method} ${endpoint.path}.`, startDetails);

  try {
    const responseEnvelope = normalizeActionResult(await request(payload));
    const responsePayload = responseEnvelope.payload;
    const responseMeta = responseEnvelope.meta;
    const message = summarizeInitPayload(operation, responsePayload);
    const successDetails = buildInitLogDetails({
      operation,
      endpoint,
      requestBody: payload,
      apiMeta: responseMeta,
      responsePayload,
      outcome: 'success',
    });
    patchState((draft) => {
      draft.initResults[key] = {
        outcome: 'success',
        operation,
        method: endpoint.method,
        endpoint: endpoint.path,
        receivedAt: stamp(),
        message,
        payload: responsePayload,
        request: successDetails.request,
        response: successDetails.response,
      };
      if (key === '3A') {
        draft.initCapabilities.scheduler = extractSchedulerCapability(responsePayload, draft.initCapabilities.scheduler);
      }
    });
    setStatus(key, mapPayloadStatusToUiStatus(responsePayload?.status));
    pushLog(key, 'success', message, successDetails);
    pushHistory(source, 'success', `${operation} completed through ${endpoint.path}.`, successDetails);
  } catch (error) {
    const message = formatInitError(operation, error);
    const errorDetails = buildInitLogDetails({
      operation,
      endpoint,
      requestBody: payload,
      apiMeta: error.meta ?? null,
      responsePayload: error.payload ?? null,
      outcome: 'error',
    });
    patchState((draft) => {
      draft.initResults[key] = {
        outcome: 'error',
        operation,
        method: endpoint.method,
        endpoint: endpoint.path,
        receivedAt: stamp(),
        status: error.status ?? null,
        message,
        errorPayload: error.payload ?? null,
        request: errorDetails.request,
        response: errorDetails.response,
      };
      if (key === '3A') {
        draft.initCapabilities.scheduler = extractSchedulerCapability(error.payload, draft.initCapabilities.scheduler);
      }
    });
    setStatus(key, 'error');
    pushLog(key, 'error', message, errorDetails);
    pushHistory(source, 'error', `${operation} failed through ${endpoint.path}.`, errorDetails);
  } finally {
    endAction(key);
  }
}

function runLoginFlow() {
  if (!guardAction('B1', 'TEST', 'B1 login flow is already running; duplicate start was blocked.')) {
    return;
  }
  setStatus('B1', 'running');
  patchState((draft) => {
    draft.loginSteps = draft.loginSteps.map((step, index) => ({ ...step, status: index === 0 ? 'active' : 'waiting' }));
  });
  pushLog('B1', 'info', 'Login flow started.');
  pushHistory('TEST', 'info', 'B1 login flow started.', { flow: 'login', step: 'start' });

  setTimeout(() => {
    patchState((draft) => {
      draft.loginSteps[0].status = 'done';
      draft.loginSteps[1].status = 'active';
    });
    pushLog('B1', 'success', 'Primary credentials accepted.');
  }, 260);

  setTimeout(() => {
    patchState((draft) => {
      draft.loginSteps[1].status = 'done';
      draft.loginSteps[2].status = 'active';
    });
    pushLog('B1', 'info', 'Required file prepared.');
  }, 560);

  setTimeout(() => {
    patchState((draft) => {
      draft.loginSteps[2].status = 'done';
    });
    setStatus('B1', 'success');
    pushLog('B1', 'success', '2FA completed in placeholder mode.');
    pushHistory('TEST', 'success', 'B1 login flow completed.', { flow: 'login', step: 'complete' });
    endAction('B1');
  }, 920);
}

function runPipelineStage(key, message, onComplete = () => {}) {
  if (isPipelineBusy()) {
    const owner = state.truth.pipelineActiveKey;
    rejectWhileBusy(key, 'PIPELINE', `${key} was blocked because ${owner} already holds the pipeline lock.`);
    return;
  }
  startPipelineLock(key);
  setStatus(key, 'running');
  setStatus('B3', 'running');
  pushLog(key, 'info', `Started ${key}.`);
  pushHistory('PIPELINE', 'info', `${key} started.`, { stage: key, phase: 'start' });
  setTimeout(() => {
    setStatus(key, 'success');
    setStatus('B3', 'success');
    pushLog(key, 'success', message);
    pushHistory('PIPELINE', 'success', message, { stage: key, phase: 'complete', message });
    patchState((draft) => {
      draft.truth.lastStageCompleted = key;
    });
    releasePipelineLock(key);
    onComplete();
  }, 420);
}

function runEnqueueStage(onComplete = () => {}) {
  runPipelineStage('B3.5', 'Queue stage added 1 media item for playback.', onComplete);
  setTimeout(() => {
    patchState((draft) => {
      draft.truth.queueLength = Math.max(1, draft.truth.queueLength + 1);
      draft.truth.currentMedia = {
        name: 'same_gps_03.jpg',
        type: 'Image',
        position: `${draft.truth.queueLength} of ${draft.truth.queueLength}`,
        overlay: 'Tallinn, Harjumaa, Estonia',
      };
      draft.truth.playbackStatus = 'Ready for emulation';
      draft.statusByKey.B4 = 'idle';
    });
    pushLog('B4', 'success', 'Playback emulation is now enabled because the queue has media.');
  }, 520);
}

function runAutoPipeline() {
  if (isPipelineBusy()) {
    rejectWhileBusy('B3', 'PIPELINE', `Auto pipeline start was blocked because ${state.truth.pipelineActiveKey} already holds the pipeline lock.`);
    return;
  }
  const stages = ['B3.1', 'B3.2', 'B3.3', 'B3.4', 'B3.5'];
  const runNextStage = (index = 0) => {
    const stage = stages[index];
    if (!stage) {
      setStatus('B3', 'success');
      pushHistory('PIPELINE', 'success', 'Auto pipeline completed without overlapping stages.', { stages, phase: 'complete' });
      return;
    }

    const action = stage === 'B3.5'
      ? () => runEnqueueStage(() => runNextStage(index + 1))
      : () => runPipelineStage(stage, `${stage} completed in auto mode.`, () => runNextStage(index + 1));

    action();
  };

  setStatus('B3', 'running');
  runNextStage();
}

function runPlaybackEmulation() {
  if (!state.truth.currentMedia) {
    setStatus('B4', 'disabled');
    pushLog('B4', 'error', 'Cannot start playback emulation without queued media.');
    return;
  }
  if (!withPlaybackGuard(() => {
    setStatus('B4', 'running');
    pushHistory('PLAYBACK', 'info', 'Playback emulation started.', { media: state.truth.currentMedia?.name ?? 'None' });
    pushLog('B4', 'info', `Showing ${state.truth.currentMedia.name}.`);
    patchState((draft) => {
      draft.truth.playbackStatus = 'Displaying media';
      draft.truth.lastCheckpoint = `${stamp()} image display checkpoint saved`;
    });
    setTimeout(() => {
      setStatus('B4', 'success');
      pushLog('B4', 'success', 'Playback emulation rendered the current media card without duplicate starts.');
      releasePlaybackGuard();
    }, 400);
  })) {
    return;
  }
}

function startRealRun() {
  if (state.truth.realRunActive) {
    pushHistory('RUNTIME', 'info', 'Duplicate simulated runtime preview start request ignored because the preview is already active.', {
      duplicate: true,
      previewActive: true,
    });
    pushLog('D', 'info', 'Simulated runtime preview start request ignored; the preview is already active.');
    return;
  }
  patchState((draft) => {
    draft.truth.realRunActive = true;
    draft.truth.realRunStartCount += 1;
    draft.truth.playbackLock = 'Playback worker lock held by simulated runtime preview';
    draft.truth.screenLock = 'Screen worker lock held by simulated runtime preview';
    draft.statusByKey.D1 = 'running';
    draft.statusByKey.D2 = 'running';
    draft.statusByKey.D3 = 'running';
    draft.runningProcess.pipelineStages = draft.runningProcess.pipelineStages.map((stage, index) => ({
      ...stage,
      status: index === 0 ? 'Running' : 'Waiting',
      lastRun: index === 0 ? stamp() : stage.lastRun,
      summary: index === 0 ? 'Download stage is active in the simulated preview loop.' : 'Waiting for its turn in the simulated preview loop.',
    }));
    draft.runningProcess.playbackWorker = {
      status: 'Running',
      heartbeat: stamp(),
      currentMedia: draft.truth.currentMedia?.name ?? 'No media queued yet',
      summary: 'Playback watchdog preview would verify the process every few seconds.',
    };
    draft.runningProcess.screenWorker = {
      status: 'Running',
      heartbeat: stamp(),
      screenState: draft.truth.screenState,
      lastActivity: draft.truth.lastActivitySource,
      timeout: `${draft.truth.inactivityTimeoutSeconds}s`,
      summary: 'Screen activity watchdog preview would verify process health every few seconds.',
    };
  });
  pushHistory('RUNTIME', 'success', 'Simulated runtime preview started with single-instance guard enabled.', {
    singleInstanceGuard: true,
    previewStartCount: d.truth.realRunStartCount,
  });
  pushLog('D', 'success', 'Simulated runtime preview is now active.');
}

function mapPayloadStatusToUiStatus(payloadStatus) {
  if (payloadStatus === 'error') {
    return 'error';
  }
  if (payloadStatus === 'warning') {
    return 'info';
  }
  return 'success';
}

function extractSchedulerCapability(payload, fallbackCapability) {
  const candidate = payload?.scheduler?.capability;
  if (!candidate || typeof candidate !== 'object') {
    return fallbackCapability ?? buildInitialSchedulerCapability();
  }
  return {
    ...(fallbackCapability ?? buildInitialSchedulerCapability()),
    ...candidate,
  };
}

function summarizeInitPayload(operation, payload) {
  if (!payload) {
    return `${operation} completed with an empty response body.`;
  }
  const schedulerSupport = payload?.scheduler?.operationSupportLevel;
  const schedulerProfile = payload?.scheduler?.platformProfileLabel;
  if (schedulerSupport && schedulerProfile) {
    return `${operation} completed for ${schedulerProfile} with scheduler support level ${schedulerSupport}.`;
  }
  if (typeof payload === 'string') {
    return `${operation} completed: ${payload}`;
  }
  if (typeof payload.message === 'string') {
    return `${operation} completed: ${payload.message}`;
  }
  if (typeof payload.status === 'string') {
    return `${operation} completed with status ${payload.status}.`;
  }
  const topLevelKeys = Object.keys(payload);
  return `${operation} completed and returned ${topLevelKeys.length} top-level field${topLevelKeys.length === 1 ? '' : 's'}.`;
}

function formatInitError(operation, error) {
  if (error?.status) {
    return `${operation} failed with HTTP ${error.status}: ${error.message}`;
  }
  if (error?.message) {
    return `${operation} failed: ${error.message}`;
  }
  return `${operation} failed for an unknown reason.`;
}
