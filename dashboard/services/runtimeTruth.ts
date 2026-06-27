/*
 * Provides the mutable browser-side runtime-truth store for the dashboard.
 * Views dispatch through this module so state changes, logs, and persistence
 * remain centralized.
 */
import { createRuntimeTruthBehavior } from './runtimeTruth/runtimeTruthBehavior.ts';
import { createInitialState, type SchedulerEndpointLogEntry } from './runtimeTruth/runtimeTruthState.ts';
import {
  createRuntimeTruthPersistence,
  type RuntimeTruthPersistenceApi,
  type RuntimeTruthSnapshot,
} from './runtimeTruth/runtimeTruthPersistence.ts';
import { normalizePlaybackRenderingState, type PlaybackRenderingMode, type PlaybackRenderingPlatform } from './playbackRenderer.ts';
import {
  buildB5ActivityResult,
  completeB5ActivityResults,
  isB5ActivitySource,
  normalizeB5ActivityDetectionState,
  prepareB5ActivityResults,
  type B5ActivitySource,
} from './viewBActivityDetection.ts';
import {
  applyOsPlaybackActivityEvent,
  normalizeOsPlaybackActivityState,
  startOsPlaybackActivityMonitoring as startOsPlaybackActivityStateMonitoring,
  stopOsPlaybackActivityMonitoring as stopOsPlaybackActivityStateMonitoring,
  type OsPlaybackActivitySource,
} from './osPlaybackActivityDetection.ts';
import { readV2WorkerTruth, type V2WorkerTruthPayload } from './v2WorkerTruthClient.ts';
import { getCurrentMode, type V2RuntimeMode } from './v2ReadinessService.ts';

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
  simulation: Record<string, unknown>;
  databaseViewer: {
    selectedTableName?: string | null;
    rows?: { page?: number } | null;
    [key: string]: unknown;
  };
  schedulerEmulator?: {
    editableCrontab?: string;
    activeCrontab?: string;
    endpointLog?: SchedulerEndpointLogEntry[];
    buttonStates?: Record<string, unknown>;
    [key: string]: unknown;
  };
  runningProcess: {
    pipelineStages: Array<Record<string, unknown>>;
    screenWorker: Record<string, unknown>;
    [key: string]: unknown;
  };
  lastRunMode: string;
  lastRunData: Record<string, unknown>;
  osPlaybackActivity?: Record<string, unknown>;
  v2WorkerTruth?: Partial<Record<V2RuntimeMode, V2WorkerTruthPayload & { loadStatus?: string; lastError?: string | null }>>;
  [key: string]: unknown;
};
type RuntimeTruthListener = (state: RuntimeTruthState) => void;
type RuntimeTruthMutator = (draft: RuntimeTruthState) => void;
type RuntimeTruthUnsubscribe = () => void;
type RuntimeActionPayload = Record<string, unknown>;

const stamp = (): string => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const createHistoryId = (): string => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `history-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

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
    draft.history = [{ id: createHistoryId(), at: stamp(), source: 'USER', type: 'info', message: 'History cleared.' }];
  });
}

export function pushHistory(source: string, type: string, message: string, details: unknown = null): void {
  patchState((draft) => {
    draft.history.unshift({
      id: createHistoryId(),
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


// Starts fullscreen playback activity monitoring for one OS playback platform.
export function startOsPlaybackActivityMonitoring(platform: string): void {
  const normalizedPlatform = normalizeOsPlaybackActivityPlatform(platform);
  if (!normalizedPlatform) {
    return;
  }

  patchState((draft) => {
    draft.osPlaybackActivity ??= {};
    draft.osPlaybackActivity[normalizedPlatform] = startOsPlaybackActivityStateMonitoring(draft.osPlaybackActivity[normalizedPlatform]);
    draft.runningProcess.screenWorker = {
      ...draft.runningProcess.screenWorker,
      status: 'Active',
      screenState: 'ON',
      lastActivity: 'Fullscreen monitoring started',
      summary: 'Fullscreen playback wake/keep-on monitoring is active.',
    };
  });
  pushHistory('PLAYBACK', 'info', `${normalizedPlatform} fullscreen activity monitoring started.`, { platform: normalizedPlatform });
  pushLog('B4', 'info', `${normalizedPlatform} fullscreen activity monitoring started.`);
}

// Stops fullscreen playback activity monitoring for one OS playback platform.
export function stopOsPlaybackActivityMonitoring(platform: string): void {
  const normalizedPlatform = normalizeOsPlaybackActivityPlatform(platform);
  if (!normalizedPlatform) {
    return;
  }

  patchState((draft) => {
    draft.osPlaybackActivity ??= {};
    draft.osPlaybackActivity[normalizedPlatform] = stopOsPlaybackActivityStateMonitoring(draft.osPlaybackActivity[normalizedPlatform]);
    draft.runningProcess.screenWorker = {
      ...draft.runningProcess.screenWorker,
      status: 'Inactive',
      lastActivity: 'Fullscreen monitoring stopped',
      summary: 'Fullscreen playback wake/keep-on monitoring is idle.',
    };
  });
  pushHistory('PLAYBACK', 'info', `${normalizedPlatform} fullscreen activity monitoring stopped.`, { platform: normalizedPlatform });
}

// Returns true when a browser activity event can affect at least one active fullscreen playback monitor.
function hasActiveOsPlaybackActivitySource(source: OsPlaybackActivitySource): boolean {
  const activityState = getState().osPlaybackActivity ?? {};
  return Object.values(activityState).some((value) => {
    const normalized = normalizeOsPlaybackActivityState(value);
    return normalized.monitoring && normalized.selectedSources[source] === true;
  });
}

// Marks a browser activity event for any fullscreen playback platform currently monitoring activity.
export function markOsPlaybackActivityDetected(source: OsPlaybackActivitySource | string): void {
  if (!isB5ActivitySource(source)) {
    return;
  }
  if (!hasActiveOsPlaybackActivitySource(source)) {
    return;
  }

  const nowIso = new Date().toISOString();
  const touchedPlatforms: string[] = [];
  patchState((draft) => {
    const activityState = draft.osPlaybackActivity ?? {};
    Object.entries(activityState).forEach(([platform, value]) => {
      const before = normalizeOsPlaybackActivityState(value);
      if (!before.monitoring || before.selectedSources[source] !== true) {
        return;
      }
      const after = applyOsPlaybackActivityEvent(before, { nowIso, source });
      draft.osPlaybackActivity ??= {};
      draft.osPlaybackActivity[platform] = after;
      if (after.lastActivityAtIso !== before.lastActivityAtIso) {
        touchedPlatforms.push(platform);
        draft.runningProcess.screenWorker = {
          ...draft.runningProcess.screenWorker,
          status: 'Active',
          screenState: 'ON',
          lastActivity: after.statusMessage,
          timeout: '30s keep-awake window',
          summary: 'Fullscreen playback activity extended the keep-awake window.',
        };
      }
    });
  });

  touchedPlatforms.forEach((platform) => {
    pushHistory('PLAYBACK', 'success', `${platform} fullscreen activity detected from ${source}.`, { platform, source });
  });
}

// Narrows arbitrary strings to supported OS playback activity platform ids.
function normalizeOsPlaybackActivityPlatform(platform: string): 'windows' | 'raspberry' | null {
  if (platform === 'windows' || platform === 'raspberry') {
    return platform;
  }
  return null;
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


export function startB5ActivityTestCountdown(countdownValue = 3): void {
  // Starts the View B/B5 countdown without touching legacy screen simulation state.
  patchState((draft) => {
    const next = normalizeB5ActivityDetectionState(draft.simulation.b5ActivityDetection);
    next.phase = 'countdown';
    next.countdownValue = countdownValue;
    next.startedAt = null;
    next.completedAt = null;
    draft.simulation.b5ActivityDetection = next;
  });
}

export function setB5ActivityTestCountdownValue(countdownValue: number): void {
  // Updates the visible View B/B5 countdown number during the pre-test countdown.
  patchState((draft) => {
    const next = normalizeB5ActivityDetectionState(draft.simulation.b5ActivityDetection);
    next.phase = 'countdown';
    next.countdownValue = countdownValue;
    draft.simulation.b5ActivityDetection = next;
  });
}

export function startB5ActivityDetectionWindow(): void {
  // Opens the bounded View B/B5 activity detection window after countdown completes.
  patchState((draft) => {
    const next = normalizeB5ActivityDetectionState(draft.simulation.b5ActivityDetection);
    next.phase = 'detecting';
    next.countdownValue = null;
    next.startedAt = new Date().toISOString();
    next.completedAt = null;
    draft.simulation.b5ActivityDetection = next;
  });
}

export function markB5ActivityDetected(source: B5ActivitySource | string): void {
  // Marks browser-observed activity for the current View B/B5 test window only.
  if (!isB5ActivitySource(source)) {
    return;
  }

  patchState((draft) => {
    const next = normalizeB5ActivityDetectionState(draft.simulation.b5ActivityDetection);
    if (next.phase !== 'detecting' || !next.selectedSources[source]) {
      return;
    }
    if (source === 'pir' && next.pirAvailability !== 'available') {
      next.results[source] = buildB5ActivityResult('unavailable');
    } else {
      next.results[source] = buildB5ActivityResult('detected');
    }
    draft.simulation.b5ActivityDetection = next;
  });
}

export function completeB5ActivityDetectionWindow(): void {
  // Completes the View B/B5 activity test and finalizes honest per-source results.
  patchState((draft) => {
    const next = normalizeB5ActivityDetectionState(draft.simulation.b5ActivityDetection);
    const detectedSources = Object.fromEntries(
      Object.entries(next.results).map(([source, result]) => [source, result.status === 'detected']),
    );
    next.phase = 'complete';
    next.countdownValue = null;
    next.completedAt = new Date().toISOString();
    next.results = completeB5ActivityResults(next, {
      detectedSources,
      pirAvailable: next.pirAvailability === 'available',
    });
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

// Refreshes the combined V2 worker source-of-truth projection for one mode.
// This is intentionally frontend-to-API only: the UI never reads worker truth files directly.
export async function refreshV2WorkerTruth(mode: V2RuntimeMode = getCurrentMode()): Promise<void> {
  const normalizedMode: V2RuntimeMode = mode === 'real' ? 'real' : 'test';
  patchState((draft) => {
    draft.v2WorkerTruth ??= {};
    draft.v2WorkerTruth[normalizedMode] = {
      ...(draft.v2WorkerTruth[normalizedMode] ?? {
        schemaVersion: 1,
        mode: normalizedMode,
        status: 'ok',
        events: [],
        files: [],
        malformed: [],
        readAt: '',
      }),
      loadStatus: 'loading',
      lastError: null,
    };
  });
  try {
    const response = await readV2WorkerTruth(normalizedMode);
    const payload = response.payload ?? response as unknown as V2WorkerTruthPayload;
    patchState((draft) => {
      draft.v2WorkerTruth ??= {};
      draft.v2WorkerTruth[normalizedMode] = {
        ...payload,
        loadStatus: payload.status === 'warning' ? 'warning' : 'ready',
        lastError: null,
      };
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    patchState((draft) => {
      draft.v2WorkerTruth ??= {};
      draft.v2WorkerTruth[normalizedMode] = {
        ...(draft.v2WorkerTruth[normalizedMode] ?? {
          schemaVersion: 1,
          mode: normalizedMode,
          status: 'warning',
          events: [],
          files: [],
          malformed: [],
          readAt: '',
        }),
        loadStatus: 'error',
        lastError: message,
      };
    });
    pushHistory('V2_WORKER_TRUTH', 'warning', `Failed to refresh ${normalizedMode.toUpperCase()} worker truth.`, {
      mode: normalizedMode,
      error: message,
    });
  }
}

export function runAction(action: string, payload: RuntimeActionPayload = {}): void {
  runtimeTruthBehavior.runAction(action, payload);
}
