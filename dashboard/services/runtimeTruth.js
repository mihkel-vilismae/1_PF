import { createRuntimeTruthBehavior } from './runtimeTruth/runtimeTruthBehavior.js';
import { createInitialState } from './runtimeTruth/runtimeTruthState.js';
import { createRuntimeTruthPersistence } from './runtimeTruth/runtimeTruthPersistence.js';

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

let state = createInitialState();
let getTruthSignature = (truthState) => JSON.stringify(truthState);
let queueRuntimeTruthPersistence = () => {};
let initializeRuntimeTruthPersistence = async () => {};
let noteLocalTruthMutation = () => {};

const runtimeTruthPersistence = createRuntimeTruthPersistence({
  getState: () => state,
  patchState,
  pushHistory,
});

getTruthSignature = runtimeTruthPersistence.getTruthSignature;
queueRuntimeTruthPersistence = runtimeTruthPersistence.queueRuntimeTruthPersistence;
initializeRuntimeTruthPersistence = runtimeTruthPersistence.initializeRuntimeTruthPersistence;
noteLocalTruthMutation = runtimeTruthPersistence.noteLocalTruthMutation;

const runtimeTruthBehavior = createRuntimeTruthBehavior({
  getState: () => state,
  patchState,
  pushHistory,
  pushLog,
  setStatus,
  stamp,
});

void initializeRuntimeTruthPersistence();

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

export function patchState(mutator) {
  const previousTruthSignature = getTruthSignature(state.truth);
  const nextState = structuredClone(state);
  mutator(nextState);
  const nextTruthSignature = getTruthSignature(nextState.truth);
  const truthChanged = previousTruthSignature !== nextTruthSignature;
  if (truthChanged) {
    noteLocalTruthMutation();
  }
  state = nextState;
  emit();
  if (truthChanged) {
    queueRuntimeTruthPersistence();
  }
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
    runtimeTruthBehavior.applyScreenSimulationState(`${key} changed`);
  }
}

export function selectDatabaseViewerTable(tableName) {
  if (!tableName) {
    return;
  }
  void runtimeTruthBehavior.runDatabaseViewerRowsAction(tableName, 0);
}

export function changeDatabaseViewerPage(delta) {
  const selectedTableName = state.databaseViewer.selectedTableName;
  const currentPage = state.databaseViewer.rows?.page ?? 0;
  if (!selectedTableName) {
    return;
  }
  const nextPage = Math.max(0, currentPage + Number(delta || 0));
  if (nextPage === currentPage && Number(delta || 0) !== 0) {
    return;
  }
  void runtimeTruthBehavior.runDatabaseViewerRowsAction(selectedTableName, nextPage);
}

export function runAction(action, payload = {}) {
  runtimeTruthBehavior.runAction(action, payload);
}
