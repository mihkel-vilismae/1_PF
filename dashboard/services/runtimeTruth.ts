/*
 * Provides the mutable browser-side runtime-truth store for the dashboard.
 * Views dispatch through this module so state changes, logs, and persistence
 * remain centralized.
 */
import { createRuntimeTruthBehavior } from './runtimeTruth/runtimeTruthBehavior.ts';
import { createInitialState } from './runtimeTruth/runtimeTruthState.ts';
import {
  createRuntimeTruthPersistence,
  type RuntimeTruthPersistenceApi,
  type RuntimeTruthSnapshot,
} from './runtimeTruth/runtimeTruthPersistence.ts';
import { normalizePlaybackRenderingState, type PlaybackRenderingMode, type PlaybackRenderingPlatform } from './playbackRenderer.ts';
import {
  buildB5ActivityResult,
  isB5ActivitySource,
  normalizeB5ActivityDetectionState,
  type B5ActivitySource,
} from './viewBActivityDetection.ts';

type RuntimeTruthState = {
  activeView: string;
  currentViewTitle: string;
  inspectMode: boolean;
  valueInspectMode: boolean;
  realityInspectMode: boolean;
  backendStatusInspectMode: boolean;
  showMarkedForRemoval: boolean;
  truth: RuntimeTruthSnapshot & Record<string, unknown>;
  history: Array<Record<string, unknown>>;
  logs: Record<string, Array<Record<string, unknown>>>;
  statusByKey: Record<string, string>;
  modal: unknown;
  simulation: Record<string, boolean | number | string>;
  databaseViewer: {
    selectedTableName?: string | null;
    rows?: { page?: number } | null;
    [key: string]: unknown;
  };
  runningProcess: {
    pipelineStages: Array<Record<string, unknown>>;
    screenWorker: Record<string, unknown>;
    [key: string]: unknown;
  };
  lastRunMode: string;
  lastRunData: Record<string, unknown>;
  [key: string]: unknown;
};
type RuntimeTruthListener = (state: RuntimeTruthState) => void;
type RuntimeTruthMutator = (draft: RuntimeTruthState) => void;
type RuntimeTruthUnsubscribe = () => void;
type RuntimeActionPayload = Record<string, unknown>;

const stamp = (): string => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const formatTallinnTimestamp = (): string =>
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

const listeners = new Set<RuntimeTruthListener>();

let state: RuntimeTruthState = createInitialState();
let getTruthSignature: RuntimeTruthPersistenceApi['getTruthSignature'] = (truthState: RuntimeTruthSnapshot): string => JSON.stringify(truthState);
let queueRuntimeTruthPersistence: RuntimeTruthPersistenceApi['queueRuntimeTruthPersistence'] = (): void => {};
let initializeRuntimeTruthPersistence: RuntimeTruthPersistenceApi['initializeRuntimeTruthPersistence'] = async (): Promise<void> => {};
let noteLocalTruthMutation: RuntimeTruthPersistenceApi['noteLocalTruthMutation'] = (): void => {};

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

export function getState(): RuntimeTruthState {
  return state;
}

export function subscribe(listener: RuntimeTruthListener): RuntimeTruthUnsubscribe {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(): void {
  listeners.forEach((listener) => listener(state));
}

export function patchState(mutator: RuntimeTruthMutator): void {
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

export function setActiveView(viewId: string, title: string): void {
  state = { ...state, activeView: viewId, currentViewTitle: title };
  emit();
}

export function toggleInspectMode(): void {
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

export function toggleValueInspectMode(): void {
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

export function toggleRealityInspectMode(): void {
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

export function toggleBackendStatusInspectMode(): void {
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

// Toggles visibility for dashboard blocks explicitly marked for future removal.
export function toggleMarkedForRemoval(): void {
  state = {
    ...state,
    showMarkedForRemoval: !state.showMarkedForRemoval,
  };
  emit();
}

export function resetHistory(): void {
  patchState((draft) => {
    draft.history = [{ id: crypto.randomUUID(), at: stamp(), source: 'USER', type: 'info', message: 'History cleared.' }];
  });
}

export function pushHistory(source: string, type: string, message: string, details: unknown = null): void {
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

export function openModal(modal: unknown): void {
  patchState((draft) => {
    draft.modal = modal ? structuredClone(modal) : null;
  });
}

export function closeModal(): void {
  patchState((draft) => {
    draft.modal = null;
  });
}

export function pushLog(key: string, type: string, message: string, details: unknown = null): void {
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

export function setStatus(key: string, status: string): void {
  patchState((draft) => {
    draft.statusByKey[key] = status;
  });
}

// Selects the B4 rendering mode without changing backend playback selection.
export function setPlaybackRenderingMode(mode: PlaybackRenderingMode): void {
  patchState((draft) => {
    draft.playbackRendering = normalizePlaybackRenderingState({
      ...(draft.playbackRendering as Record<string, unknown> | null | undefined),
      mode,
    });
  });
}

// Selects the B4 rendering platform tab while keeping selection backend-owned.
export function setPlaybackRenderingPlatform(platform: PlaybackRenderingPlatform): void {
  patchState((draft) => {
    draft.playbackRendering = normalizePlaybackRenderingState({
      ...(draft.playbackRendering as Record<string, unknown> | null | undefined),
      platform,
    });
  });
}

export function seedDemoState(): void {
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

export function setLastRunMode(mode: string): void {
  patchState((draft) => {
    draft.lastRunMode = mode;
  });
}

export function setB5ActivitySourceSelection(source: B5ActivitySource | string, selected: boolean): void {
  // Updates only the View B/B5 detection-test source selection, not screen simulation toggles.
  if (!isB5ActivitySource(source)) {
    return;
  }

  patchState((draft) => {
    const next = normalizeB5ActivityDetectionState(draft.simulation.b5ActivityDetection);
    next.selectedSources[source] = selected;
    next.results[source] = buildB5ActivityResult(selected ? 'pending' : 'skipped');
    draft.simulation.b5ActivityDetection = next;
  });
}

export function setSimulationValue(key: string, value: boolean | number | string): void {
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
}


// Clears the View A scheduler endpoint/row live terminal log.
export function clearSchedulerEndpointLog(): void {
  patchState((draft) => {
    draft.schedulerEmulator ??= {};
    draft.schedulerEmulator.endpointLog = [];
  });
}

// Opens one scheduler endpoint/row live log entry in the shared large modal.
export function openSchedulerEndpointLogRow(rowId: string | null | undefined): void {
  if (!rowId) {
    return;
  }
  const entries = Array.isArray(state.schedulerEmulator?.endpointLog) ? state.schedulerEmulator.endpointLog : [];
  const entry = entries.find((candidate) => String(candidate?.id ?? '') === String(rowId));
  if (!entry) {
    return;
  }
  openModal({
    kind: 'scheduler-endpoint-row',
    title: 'Cron endpoint / row live log entry',
    subtitle: 'Full untruncated scheduler endpoint or cron row evidence.',
    entry: structuredClone(entry),
  });
}

// Stores the editable View A CronEmulator crontab textarea value.
export function setSchedulerEditableCrontab(value: string): void {
  patchState((draft) => {
    draft.schedulerEmulator ??= {};
    draft.schedulerEmulator.editableCrontab = value;
  });
}

export function selectDatabaseViewerTable(tableName: string | null | undefined): void {
  if (!tableName) {
    return;
  }
  void runtimeTruthBehavior.runDatabaseViewerRowsAction(tableName, 0);
}

export function changeDatabaseViewerPage(delta: number | string): void {
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

export function runAction(action: string, payload: RuntimeActionPayload = {}): void {
  runtimeTruthBehavior.runAction(action, payload);
}
