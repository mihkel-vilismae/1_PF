/*
 * Renders the dashboard shell and binds browser-side UI interactions.
 * The frontend owns presentation state while backend routes provide runtime truth.
 * This file also displays component versions visible to operators.
 * The startup mode gate tags backend calls and disables NEW AUTH login in Test Mode.
 */
import { VIEW_ORDER } from './shared/constants.ts';
import {
  getState,
  changeDatabaseViewerPage,
  closeModal,
  patchState,
  openModal,
  pushHistory,
  pushLog,
  resetHistory,
  runAction,
  refreshV2WorkerTruth,
  seedDemoState,
  selectDatabaseViewerTable,
  setActiveView,
  clearSchedulerEndpointLog,
  openSchedulerEndpointLogRow,
  toggleBackendStatusInspectMode,
  toggleInspectMode,
  toggleMarkedForRemoval,
  toggleRealityInspectMode,
  toggleValueInspectMode,
  setLastRunMode,
  setPlaybackRenderingMode,
  setPlaybackRenderingPlatform,
  setSchedulerEditableCrontab,
  setSimulationValue,
  setB5ActivitySourceSelection,
  startB5ActivityTestCountdown,
  setB5ActivityTestCountdownValue,
  startB5ActivityDetectionWindow,
  completeB5ActivityDetectionWindow,
  markB5ActivityDetected,
  startOsPlaybackActivityMonitoring,
  stopOsPlaybackActivityMonitoring,
  markOsPlaybackActivityDetected,
  subscribe,
} from './services/runtimeTruth.ts';
import { renderDefinitionList, renderHistory, renderModal } from './services/renderers.ts';
import { PLAYBACK_RENDERING_MODES, type PlaybackRenderingMode, type PlaybackRenderingPlatform } from './services/playbackRenderer.ts';
import { copyEventHistoryExportToClipboard } from './services/eventHistoryExport.ts';
import { createTransitTerminal } from './services/transitTerminal.ts';
import {
  bindBackendStatusInspectMode,
  bindInspectMode,
  bindRealityInspectMode,
  bindValueInspectMode,
} from './inspect/bindInspectModes.ts';
import { describeInspectableElement, describeValueElement } from './inspect/controlMetadata.ts';
import { createRealityMetadataHelpers } from './inspect/realityMetadata.ts';
import { createBackendStatusMetadataHelpers } from './inspect/backendStatusMetadata.ts';
import { createGuideTooltipController } from './inspect/tooltipController.ts';
import { renderInitView } from './views/initView.ts';
import { renderTestView } from './views/testView.ts';
import { renderLastRunView } from './views/lastRunView.ts';
import { renderRunningProcessView } from './views/runningProcessView.ts';
import { renderDatabaseViewerView } from './views/databaseViewerView.ts';
import { renderOsPlaybackFullscreenOverlay, renderOsPlaybackView } from './views/osPlaybackView.ts';
import { renderDebugView } from './views/debugView.ts';
import { renderV2OperatorMenuView } from './views/v2OperatorMenuView.ts';
import { renderV2StartupOperatorMenuView, type V2PlaybackQueueItem } from './views/v2StartupOperatorMenuView.ts';
import { addIsolatedTestMediaItem, buildDefaultDebugPageState, clearDebugElementMetadata, cycleDebugColorSchema, cycleDebugMajorVisualMode, pauseFakeDebugCrontab, previewFakeDebugStateRestore, readFakeDebugCrontab, resumeFakeDebugCrontab, runMockDebugWorker, saveFakeDebugStateSnapshot, saveManualTestingSystemStateSnapshot, selectDebugElementMetadata, setDebugCrontabContent, stageFakeDebugCrontabInstall, type DebugPageState, type DebugWorkerKey } from './services/debugPageModel.ts';
import { buildOsPlaybackViewModel, OS_PLAYBACK_PLATFORMS, type OsPlaybackPlatform, type PlaybackLogEntryViewModel } from './services/osPlaybackViewModel.ts';
import { requestJson, setDashboardRuntimeMode } from './services/apiClient.ts';
import { buildV2PlaybackDropQueueBridgeRequest } from './services/v2PlaybackDropQueueBridge.ts';
import { buildBrowserLocalV2PlaybackMetadata } from './services/v2PlaybackMetadataBridge.ts';
import {
  V2_RECOVERY_ENDPOINTS,
  autosaveV2RecoveryStateSnapshot,
  checkV2RecoveryRestartState,
  loadV2RecoveryStateSnapshot,
  saveV2RecoveryStateSnapshot,
} from './services/v2RecoveryStateClient.ts';
import { createEmptyV2RecoveryStateSnapshot, type V2RecoveryStateSaveReason } from './services/v2RecoveryStateSchema.ts';
import { isV2OperatorSidebarRoute, type V2OperatorSidebarRoute } from './data/v2OperatorSidebar.ts';
import { V2_IMPLEMENTATION_STATUS_REGISTRY, getV2ImplementationStatusElement } from './data/v2ImplementationStatus.ts';
import { buildViewARefreshPlan } from './services/viewARefreshPlan.ts';
import { captureScrollSnapshot, restoreScrollSnapshotAfterLayout } from './services/scrollPreservation.ts';
import { isModeReadyForAutonomousPlayback, setCurrentMode } from './services/v2ReadinessService.ts';

const app = document.getElementById('app');
declare const __APP_VERSION__: string;
type DashboardVisualMode = 'test' | 'real' | 'v2';
const TRANSIT_EVENT_NAME = 'dashboard:transit';
const COPY_HISTORY_LABEL = 'copy all log';
const SCHEDULER_RUN_LOG_POLL_MS = 5000;
const OS_PLAYBACK_OBSERVABILITY_POLL_MS = 5000;
const V2_WORKER_TRUTH_POLL_MS = 5000;
const OS_PLAYBACK_ROTATION_INTERVAL_SECONDS = 12;
const OS_PLAYBACK_RESUME_HEARTBEAT_MIN_MS = 5000;
const TEST_MODE_NEW_AUTH_DISABLED_MESSAGE = 'NEW AUTH login is disabled in Test Mode. Switch to Real Mode to use iCloudPD login controls.';
let dashboardVisualMode: DashboardVisualMode | null = null;
let v2OperatorSidebarRoute: V2OperatorSidebarRoute = 'setup';
let liveUpdatesPaused = false;
let pendingLiveUpdateRender = false;
let v2ImplementationStatusMode = false;
let v2PlaybackQueueItems: V2PlaybackQueueItem[] = [];
let v2PlaybackQueueItemCounter = 0;
let v2RecoveryRestartCheckQueued = false;
let hasInitPreloadRun = false;
let hasInitNewAuthPreloadRun = false;
type BackendVersionState = {
  status: 'checking' | 'ready' | 'unavailable';
  version: string | null;
  message: string | null;
};

let historyCopyStatus: 'idle' | 'copied' | 'failed' = 'idle';
let historyCopyResetTimer: ReturnType<typeof setTimeout> | null = null;
let b5ActivityCountdownTimer: number | null = null;
let b5ActivityDetectionTimer: number | null = null;
let backendVersionState: BackendVersionState = {
  status: 'checking',
  version: null,
  message: null,
};
const osPlaybackRotationTimers = new Map<OsPlaybackPlatform, number>();
const osPlaybackResumeHeartbeatTimers = new Map<OsPlaybackPlatform, number>();
const osPlaybackResumeLastSavedAt = new Map<OsPlaybackPlatform, number>();
const transitTerminal = createTransitTerminal();
const { describeRealityElement } = createRealityMetadataHelpers({
  getState,
  getTransitHasLiveTraffic: () => transitTerminal.hasLiveTraffic(),
});
const { describeBackendStatusElement } = createBackendStatusMetadataHelpers({
  getState,
  getTransitHasLiveTraffic: () => transitTerminal.hasLiveTraffic(),
});
const {
  handleInspectEnter,
  handleValueInspectEnter,
  handleRealityInspectEnter,
  handleBackendStatusInspectEnter,
  handleInspectLeave,
  hideInspectTooltip,
} = createGuideTooltipController({ getState });


// Records mouse movement only while the View B/B5 activity test window is active.
function handleB5ActivityMouseMove(): void {
  const activityState = getState().simulation?.b5ActivityDetection as { phase?: string; selectedSources?: Record<string, boolean> } | undefined;
  if (activityState?.phase === 'detecting' && activityState?.selectedSources?.mouse) {
    markB5ActivityDetected('mouse');
  }
  markOsPlaybackActivityDetected('mouse');
}

// Records keyboard input only while the View B/B5 activity test window is active.
function handleB5ActivityKeyDown(): void {
  const activityState = getState().simulation?.b5ActivityDetection as { phase?: string; selectedSources?: Record<string, boolean> } | undefined;
  if (activityState?.phase === 'detecting' && activityState?.selectedSources?.keyboard) {
    markB5ActivityDetected('keyboard');
  }
  markOsPlaybackActivityDetected('keyboard');
}

// Renders the current dashboard state and the component version badge.
function render() {
  const state = getState();
  const hasLiveTraffic = transitTerminal.hasLiveTraffic();
  const nonV2DashboardVisualMode = dashboardVisualMode === 'v2' ? null : dashboardVisualMode;
  const viewMarkup = {
    A: renderInitView(state, nonV2DashboardVisualMode),
    B: renderTestView(state, nonV2DashboardVisualMode),
    C: renderLastRunView(state, nonV2DashboardVisualMode),
    D: renderRunningProcessView(state),
    E: renderDatabaseViewerView(state),
    WIN: renderOsPlaybackView(state, OS_PLAYBACK_PLATFORMS.windows),
    RPI: renderOsPlaybackView(state, OS_PLAYBACK_PLATFORMS.raspberry),
    V2: renderV2OperatorMenuView(),
    DEBUG: renderDebugView(state, __APP_VERSION__),
  }[state.activeView] ?? renderInitView(state, nonV2DashboardVisualMode);

  document.body.classList.toggle('modal-open', Boolean(state.modal) || dashboardVisualMode === null);
  document.body.classList.toggle('show-marked-for-removal', Boolean(state.showMarkedForRemoval));
  applyDashboardVisualModeClass(dashboardVisualMode);
  document.body.classList.toggle('v2-implementation-status-mode', dashboardVisualMode === 'v2' && v2ImplementationStatusMode);

  // Compute a visible banner for the current visual mode. When a visual mode has
  // been selected, override the lengthy default mode banner with a concise
  // indicator so operators can immediately see whether they are in Test Mode or
  // Real Mode. Fall back to the default dashboard banner when the mode is
  // unselected.
  const visualModeBanner = dashboardVisualMode === null
    ? state.modeBanner
    : dashboardVisualMode === 'test'
      ? 'Test Mode'
      : dashboardVisualMode === 'real'
        ? 'Real Mode'
        : 'V2';
  const scrollSnapshot = captureScrollSnapshot(app);

  if (dashboardVisualMode === 'v2') {
    app.innerHTML = `
      ${renderVersionBadge(__APP_VERSION__, backendVersionState)}
      ${renderV2StartupOperatorMenuView(v2OperatorSidebarRoute, state.history, getHistoryCopyButtonLabel(), {
        inspectMode: Boolean(state.inspectMode),
        valueInspectMode: Boolean(state.valueInspectMode),
        implementationStatusMode: v2ImplementationStatusMode,
        runtimeState: state,
        dashboardVisualMode,
        v2PlaybackQueueItems,
      })}
    `;
    restoreScrollSnapshotAfterLayout(app, scrollSnapshot);
    if (!liveUpdatesPaused) {
      pendingLiveUpdateRender = false;
    }
    hideInspectTooltip();
    bindEvents();
    return;
  }

  app.innerHTML = `
    ${renderVersionBadge(__APP_VERSION__, backendVersionState)}
    ${dashboardVisualMode === null ? renderModeSelectionGate() : ''}
    <div class="shell ${dashboardVisualMode === null ? 'shell--mode-gated' : ''}" ${dashboardVisualMode === null ? 'aria-hidden="true" inert' : ''}>
      <aside class="sidebar">
        <div class="brand-card">
          <p class="eyebrow">Photo frame operator workspace</p>
          <h1>Control Dashboard</h1>
          <p class="brand-copy">A higher-clarity dashboard where A and E call documented repo-local endpoints, B mixes real runtime actions with clearly marked placeholders, and C-D stay explicit preview surfaces.</p>
        </div>

        <nav class="nav-card" aria-label="Views">
          ${VIEW_ORDER.map(
            (view) => `
              <button class="nav-link ${state.activeView === view.id ? 'nav-link--active' : ''}" data-view="${view.id}">
                <span class="nav-link__code">${view.id}</span>
                <span class="nav-link__body"><strong>${view.name}</strong><small>${view.subtitle}</small></span>
              </button>
            `,
          ).join('')}
        </nav>

        <article class="side-panel side-panel--debug-version" aria-label="Debug version tracker" data-debug-sidebar-version>
          <div class="side-panel__header">
            <h2>Debug</h2>
            <span class="pill" data-debug-sidebar-version-value>v${escapeHtml(__APP_VERSION__)}</span>
          </div>
          <p class="card__copy">Debug Menu route: <code>/debug</code>. Uses the same repo version source as the top-right tracker.</p>
        </article>

        <article class="side-panel">
          <div class="side-panel__header">
            <h2>Current truth</h2>
            <span class="pill">A/E real • B mixed • C/D mock</span>
          </div>
          ${renderDefinitionList({
            'Source of truth': state.truth.sourceOfTruth,
            'Queue length': String(state.truth.queueLength),
            'Current media': state.truth.currentMedia?.name ?? 'None',
            'Playback status': state.truth.playbackStatus,
            'Screen state': state.truth.screenState,
            'Last activity': state.truth.lastActivitySource,
            'Timeout': `${state.truth.inactivityTimeoutSeconds}s`,
            'Last checkpoint': state.truth.lastCheckpoint,
            'Last stage': state.truth.lastStageCompleted,
            'Stage lock': state.truth.stageLock,
            'Playback lock': state.truth.playbackLock,
            'Screen lock': state.truth.screenLock,
          })}
        </article>

        <article class="side-panel side-panel--history" data-scroll-preserve="event-history-panel">
          <div class="side-panel__header">
            <h2>Event history</h2>
            <div class="side-panel__actions">
              <button class="button button--ghost" data-action="copy-history">${getHistoryCopyButtonLabel()}</button>
              <button class="button button--ghost" data-action="clear-history">Clear</button>
            </div>
          </div>
          <div class="history-surface" data-scroll-preserve="event-history-surface">${renderHistory(state.history)}</div>
        </article>
      </aside>

      <main class="main-panel" data-scroll-preserve="main-view-${state.activeView}">
        <header class="topbar">
          <div>
            <p class="eyebrow">${visualModeBanner}</p>
            <h1>${state.currentViewTitle}</h1>
          </div>
          <div class="topbar__actions">
            <button
              class="button ${state.showMarkedForRemoval ? 'button--danger' : 'button--secondary'} marked-removal-toggle"
              type="button"
              data-action="toggle-marked-for-removal"
            >
              ${state.showMarkedForRemoval ? 'Hide marked for removal' : 'Show marked for removal'}
            </button>
            <button
              class="button ${state.inspectMode ? 'button--primary' : 'button--secondary'} inspect-toggle"
              type="button"
              data-action="toggle-inspect-mode"
            >
              ${state.inspectMode ? 'Hide control guide' : 'Explain controls'}
            </button>
            <button
              class="button ${state.valueInspectMode ? 'button--primary' : 'button--secondary'} inspect-toggle"
              type="button"
              data-action="toggle-value-inspect-mode"
            >
              ${state.valueInspectMode ? 'Hide value guide' : 'Explain values'}
            </button>
            <button
              class="button ${state.realityInspectMode ? 'button--primary' : 'button--secondary'} inspect-toggle"
              type="button"
              data-action="toggle-reality-inspect-mode"
            >
              ${state.realityInspectMode ? 'Hide real vs mock' : 'Show real vs mock'}
            </button>
            <button
              class="button ${state.backendStatusInspectMode ? 'button--primary' : 'button--secondary'} inspect-toggle"
              type="button"
              data-action="toggle-backend-status-inspect-mode"
            >
              ${state.backendStatusInspectMode ? 'Hide backend status' : 'Show backend status'}
            </button>
            <button
              class="button ${liveUpdatesPaused ? 'button--primary' : 'button--secondary'} inspect-toggle"
              type="button"
              data-action="toggle-live-updates"
              aria-pressed="${liveUpdatesPaused ? 'true' : 'false'}"
              title="Pause background polling and transit-triggered renders so DevTools can inspect stable DOM nodes."
            >
              ${liveUpdatesPaused ? 'Resume live updates' : 'Pause live updates'}
            </button>
          </div>
        </header>
        ${viewMarkup}
        <article class="card card--feature" aria-label="Transit log">
          <header class="card__header">
            <div>
              <p class="card__code">IO</p>
              <h3>Transit terminal</h3>
            </div>
            <span class="pill">${hasLiveTraffic ? 'Live gateway traffic' : 'Placeholder'}</span>
          </header>
          <p class="card__copy">${hasLiveTraffic ? 'All dashboard outbound/inbound API traffic is routed through a single gateway and mirrored here.' : 'PLACEHOLDER: random-looking terminal output. Live gateway traffic will appear after the first request is made.'}</p>
          <div class="log-surface history-surface" data-scroll-preserve="transit-terminal-surface">
            <pre class="modal-panel__json">${escapeHtml(transitTerminal.renderLines())}</pre>
          </div>
        </article>
      </main>
    </div>
    ${renderModal(state.modal)}
    ${renderOsPlaybackFullscreenOverlay(state)}
  `;

  restoreScrollSnapshotAfterLayout(app, scrollSnapshot);
  if (!liveUpdatesPaused) {
    pendingLiveUpdateRender = false;
  }
  hideInspectTooltip();
  bindEvents();
  bindInspectMode({
    app,
    enabled: state.inspectMode,
    describeInspectableElement,
    handleInspectEnter,
    handleInspectLeave,
    hideInspectTooltip,
  });
  bindValueInspectMode({
    app,
    enabled: state.valueInspectMode,
    describeValueElement,
    handleValueInspectEnter,
    handleInspectLeave,
    hideInspectTooltip,
  });
  bindRealityInspectMode({
    app,
    enabled: state.realityInspectMode,
    describeRealityElement,
    handleRealityInspectEnter,
    handleInspectLeave,
    hideInspectTooltip,
  });
  bindBackendStatusInspectMode({
    app,
    enabled: state.backendStatusInspectMode,
    describeBackendStatusElement,
    handleBackendStatusInspectEnter,
    handleInspectLeave,
    hideInspectTooltip,
  });
}

// Requests a dashboard render unless operator inspection mode has paused live updates.
function requestLiveUpdateRender(): void {
  if (liveUpdatesPaused) {
    pendingLiveUpdateRender = true;
    return;
  }
  render();
}

// Toggles the operator inspection guard that pauses background render churn.
function toggleV2ImplementationStatusMode(): void {
  v2ImplementationStatusMode = !v2ImplementationStatusMode;
  render();
}

function openV2StatusHelp(statusId: string | undefined): void {
  const status = getV2ImplementationStatusElement(statusId ?? '');
  const label = status?.label ?? statusId ?? 'V2 implementation status';
  const statusName = status?.status ?? 'in-progress';
  const summary = status?.summary ?? 'This V2 element has status metadata attributes, but no dedicated JSON registry entry yet.';
  openModal({
    kind: 'log',
    title: label,
    subtitle: `V2 implementation status: ${statusName}`,
    entry: {
      type: statusName === 'done' ? 'success' : statusName === 'not-implemented' ? 'warning' : 'info',
      message: summary,
      details: {
        id: statusId ?? null,
        status: statusName,
        sourceDocument: V2_IMPLEMENTATION_STATUS_REGISTRY.sourceDocument,
        scope: V2_IMPLEMENTATION_STATUS_REGISTRY.scope,
      },
    },
  });
}

function toggleLiveUpdatesPaused(): void {
  liveUpdatesPaused = !liveUpdatesPaused;
  if (!liveUpdatesPaused && pendingLiveUpdateRender) {
    pendingLiveUpdateRender = false;
  }
  render();
}

// Checks whether background polling and transit-driven refreshes should currently run.
function shouldRunLiveUpdates(): boolean {
  return !liveUpdatesPaused;
}

// Applies the frontend-only visual mode marker used by mode-specific CSS.
function applyDashboardVisualModeClass(mode: DashboardVisualMode | null): void {
  document.body.dataset.dashboardVisualMode = mode ?? 'unselected';
}

// Renders the startup mode chooser without changing backend/runtime execution.
// Choosing a visual mode does not trigger real auth, downloads, scheduler actions, playback, or backend behavior changes.
function renderModeSelectionGate(): string {
  return `
    <section class="mode-gate" role="dialog" aria-modal="true" aria-labelledby="modeGateTitle" aria-describedby="modeGateDescription">
      <div class="mode-gate__panel">
        <p class="eyebrow">Startup choice</p>
        <h1 id="modeGateTitle">Choose dashboard mode</h1>
        <p id="modeGateDescription" class="mode-gate__copy">
          Select an operating mode before entering the dashboard. Test Mode routes runtime/database/log actions to isolated test storage; Real Mode uses the real configured runtime storage; V2 opens the operator menu shell without enabling release actions.
        </p>
        <div class="mode-gate__actions" aria-label="Dashboard mode choices">
          <button class="mode-choice mode-choice--test" type="button" data-dashboard-visual-mode="test">
            <span>Test Mode</span>
            <small>Use isolated test runtime data, logs, downloads, and database paths.</small>
          </button>
          <button class="mode-choice mode-choice--real" type="button" data-dashboard-visual-mode="real">
            <span>Real Mode</span>
            <small>Use the real configured runtime data, logs, downloads, and database paths.</small>
          </button>
          <button class="mode-choice mode-choice--v2" type="button" data-dashboard-visual-mode="v2">
            <span>V2</span>
            <small>Open the v2 operator menu shell. No auth, worker, crontab, database, or recovery actions run on entry.</small>
          </button>
        </div>
      </div>
    </section>
  `;
}


// Clears pending View B/B5 activity-test timers before starting or resetting a run.
function clearB5ActivityTestTimers(): void {
  if (b5ActivityCountdownTimer !== null) {
    window.clearTimeout(b5ActivityCountdownTimer);
    b5ActivityCountdownTimer = null;
  }
  if (b5ActivityDetectionTimer !== null) {
    window.clearTimeout(b5ActivityDetectionTimer);
    b5ActivityDetectionTimer = null;
  }
}

// Runs the View B/B5 countdown and then opens a bounded activity-detection window.
function startB5ActivityTest(): void {
  clearB5ActivityTestTimers();
  startB5ActivityTestCountdown(3);
  pushHistory('SCREEN', 'info', 'B5 activity detection test countdown started.', {
    action: 'start-b5-activity-test',
  });

  const tick = (value: number): void => {
    if (value > 0) {
      setB5ActivityTestCountdownValue(value);
      b5ActivityCountdownTimer = window.setTimeout(() => tick(value - 1), 1000);
      return;
    }

    startB5ActivityDetectionWindow();
    const activityState = getState().simulation?.b5ActivityDetection as { detectionWindowSeconds?: number } | undefined;
    const windowSeconds = Number(activityState?.detectionWindowSeconds ?? 5);
    pushHistory('SCREEN', 'info', `B5 activity detection window opened for ${windowSeconds} seconds.`, {
      action: 'b5-activity-detecting',
      windowSeconds,
    });
    b5ActivityDetectionTimer = window.setTimeout(() => {
      completeB5ActivityDetectionWindow();
      pushHistory('SCREEN', 'success', 'B5 activity detection test completed.', {
        action: 'complete-b5-activity-test',
      });
    }, Math.max(1, windowSeconds) * 1000);
  };

  tick(3);
}

// Copies the scheduler endpoint/row live log as readable JSON for debugging.
async function copySchedulerEndpointLogToClipboard(): Promise<void> {
  const entries = Array.isArray(getState().schedulerEmulator?.endpointLog) ? getState().schedulerEmulator.endpointLog : [];
  const payload = JSON.stringify({
    exportedAt: new Date().toISOString(),
    source: 'cron endpoint / row live log',
    count: entries.length,
    entries,
  }, null, 2);

  try {
    await navigator.clipboard.writeText(payload);
    pushHistory('SCHEDULER', 'success', 'Cron endpoint / row live log copied to clipboard.', {
      action: 'copy-scheduler-endpoint-log',
      entryCount: entries.length,
    });
  } catch (error) {
    pushHistory('SCHEDULER', 'error', 'Cron endpoint / row live log copy failed.', {
      action: 'copy-scheduler-endpoint-log',
      entryCount: entries.length,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// Builds the fixed top-right frontend/backend version display.
function renderVersionBadge(frontendVersion: string, backendState: BackendVersionState): string {
  const backendText = getBackendVersionText(backendState);
  const title = `Frontend version ${frontendVersion}; backend version ${backendText}`;

  return `
    <div
      id="versionBadge"
      class="version-badge"
      aria-label="${escapeHtml(title)}"
      title="${escapeHtml(title)}"
    >
      <span class="version-badge__line">
        <span class="version-badge__label">Frontend</span>
        <span class="version-badge__value">v${escapeHtml(frontendVersion)}</span>
      </span>
      <span class="version-badge__line ${backendState.status === 'unavailable' ? 'version-badge__line--muted' : ''}">
        <span class="version-badge__label">Backend</span>
        <span class="version-badge__value">${escapeHtml(backendText)}</span>
      </span>
    </div>
  `;
}

// Formats the backend version state for compact operator display.
function getBackendVersionText(backendState: BackendVersionState): string {
  if (backendState.status === 'ready' && backendState.version) {
    return `v${backendState.version}`;
  }
  if (backendState.status === 'checking') {
    return 'checking';
  }
  return 'unavailable';
}

// Loads the backend component version once without blocking initial render.
async function loadBackendVersion(): Promise<void> {
  try {
    const payload = await requestJson<{ version?: unknown }>('/api/version', {
      headers: { Accept: 'application/json' },
      operation: 'Load backend version',
    });
    const version = typeof payload.version === 'string' ? payload.version.trim() : '';
    backendVersionState = version
      ? { status: 'ready', version, message: null }
      : { status: 'unavailable', version: null, message: 'Backend version payload did not include a version.' };
  } catch (error) {
    backendVersionState = {
      status: 'unavailable',
      version: null,
      message: error instanceof Error ? error.message : String(error),
    };
  }
  requestLiveUpdateRender();
}

// Loads the read-only playback queue/current-item contract for the OS playback views.
async function loadOsPlaybackContract(platform: OsPlaybackPlatform): Promise<void> {
  patchState((draft) => {
    const osPlayback = ensureMutableOsPlaybackState(draft);
    osPlayback[platform] = {
      status: 'loading',
      loadedAt: new Date().toISOString(),
    };
  });

  try {
    const payload = await requestJson<Record<string, unknown>>('/api/runtime/playback/current?limit=25', {
      headers: { Accept: 'application/json' },
      operation: `Load ${platform} playback contract`,
    });
    patchState((draft) => {
      const osPlayback = ensureMutableOsPlaybackState(draft);
      osPlayback[platform] = {
        status: 'ready',
        loadedAt: new Date().toISOString(),
        contract: payload,
      };
      ensureMutableOsPlaybackRotationState(draft, platform);
    });
    await loadOsPlaybackResumeCheckpoint(platform);
    queueOsPlaybackResumeCheckpointSave(platform, 'contract-refresh');
    pushHistory('PLAYBACK', 'success', `${getOsPlaybackLabel(platform)} playback contract refreshed.`, {
      platform,
      endpoint: '/api/runtime/playback/current',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    patchState((draft) => {
      const osPlayback = ensureMutableOsPlaybackState(draft);
      osPlayback[platform] = {
        status: 'error',
        loadedAt: new Date().toISOString(),
        error: message,
      };
    });
    pushHistory('PLAYBACK', 'error', `${getOsPlaybackLabel(platform)} playback contract refresh failed.`, {
      platform,
      endpoint: '/api/runtime/playback/current',
      error: message,
    });
  }
}



// Loads and applies a fresh backend playback resume checkpoint for the selected platform.
async function loadOsPlaybackResumeCheckpoint(platform: OsPlaybackPlatform): Promise<void> {
  try {
    const payload = await requestJson<Record<string, unknown>>(`/api/runtime/playback/resume-checkpoint?platform=${platform}`, {
      headers: { Accept: 'application/json' },
      operation: `Load ${platform} playback resume checkpoint`,
    });
    applyOsPlaybackResumeCheckpoint(platform, payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    patchState((draft) => {
      const resume = ensureMutableOsPlaybackResumeState(draft);
      resume[platform] = {
        status: 'error',
        message,
        validation: { status: 'invalid', reason: message },
        checkpoint: null,
      };
    });
  }
}

// Applies a valid resume checkpoint to browser-side rotation state without forcing fullscreen.
function applyOsPlaybackResumeCheckpoint(platform: OsPlaybackPlatform, payload: Record<string, unknown>): void {
  const checkpoint = isRecordValue(payload.checkpoint) ? payload.checkpoint : null;
  const validation = isRecordValue(payload.validation) ? payload.validation : {};
  const validationStatus = typeof validation.status === 'string' ? validation.status : 'missing';
  const mediaAssetId = typeof checkpoint?.mediaAssetId === 'string' ? checkpoint.mediaAssetId : null;
  const state = getState();
  const items = readOsPlaybackItems(platform);
  const restoredIndex = mediaAssetId ? items.findIndex((item) => String(item.mediaAssetId ?? '') === mediaAssetId) : -1;
  const canRestore = validationStatus === 'valid' && restoredIndex >= 0;
  const paused = checkpoint?.rotationPaused !== false;
  const remainingRotationMs = typeof checkpoint?.remainingRotationMs === 'number' ? checkpoint.remainingRotationMs : null;

  patchState((draft) => {
    const resume = ensureMutableOsPlaybackResumeState(draft);
    resume[platform] = {
      ...payload,
      status: payload.status ?? validationStatus,
      message: canRestore
        ? 'Restored the last valid playback item from the backend checkpoint.'
        : String(validation.reason ?? 'No fresh valid playback checkpoint was applied.'),
      restoredFromCheckpoint: canRestore,
    };

    if (!canRestore) {
      return;
    }

    const rotation = ensureMutableOsPlaybackRotationState(draft, platform);
    rotation.activeIndex = restoredIndex;
    rotation.paused = paused;
    rotation.fullscreen = false;
    rotation.intervalSeconds = OS_PLAYBACK_ROTATION_INTERVAL_SECONDS;
    rotation.nextRotationAtIso = paused
      ? null
      : new Date(Date.now() + Math.max(1000, remainingRotationMs ?? OS_PLAYBACK_ROTATION_INTERVAL_SECONDS * 1000)).toISOString();
  });

  if (canRestore && !paused) {
    scheduleOsPlaybackRotation(platform);
  }

  if (canRestore && state.activeView) {
    pushLog('B4', 'success', `${getOsPlaybackLabel(platform)} restored playback checkpoint item after startup/load.`);
  }
}

// Reads playback items from the same OS playback view model used by rendering.
function readOsPlaybackItems(platform: OsPlaybackPlatform): Array<Record<string, unknown>> {
  const playback = ((getState().osPlayback as Record<string, Record<string, unknown>> | undefined)?.[platform]?.contract as { playback?: Record<string, unknown> } | undefined)?.playback;
  const items = Array.isArray(playback?.items) ? playback.items : [];
  if (items.length > 0) {
    return items.filter(isRecordValue);
  }
  return [playback?.currentItem, playback?.nextItem].filter(isRecordValue);
}

// Narrows unknown values to records for checkpoint payload inspection.
function isRecordValue(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}


// Loads native playback status for the selected OS playback platform.
async function loadNativePlaybackStatus(platform: OsPlaybackPlatform): Promise<void> {
  patchState((draft) => {
    const nativePlayback = ensureMutableOsNativePlaybackState(draft);
    nativePlayback[platform] = {
      ...(typeof nativePlayback[platform] === 'object' && nativePlayback[platform] !== null ? nativePlayback[platform] as Record<string, unknown> : {}),
      status: 'loading',
      loadedAt: new Date().toISOString(),
    };
  });
  try {
    const payload = await requestJson<Record<string, unknown>>('/api/native-playback/status', {
      headers: { Accept: 'application/json' },
      operation: `Load ${platform} native playback status`,
    });
    applyNativePlaybackPayload(platform, payload, 'Native playback status refreshed.');
  } catch (error) {
    applyNativePlaybackError(platform, error, 'Native playback status refresh failed.');
  }
}

// Calls one native playback endpoint and refreshes platform status with the returned payload.
async function runNativePlaybackCommand(platform: OsPlaybackPlatform, endpoint: string, label: string): Promise<void> {
  try {
    const payload = await requestJson<Record<string, unknown>>(endpoint, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: { platform },
      operation: `${label} for ${platform} native playback`,
    });
    applyNativePlaybackPayload(platform, payload, label);
  } catch (error) {
    applyNativePlaybackError(platform, error, `${label} failed.`);
  }
}

// Stores a successful native playback route payload in dashboard state.
function applyNativePlaybackPayload(platform: OsPlaybackPlatform, payload: Record<string, unknown>, message: string): void {
  patchState((draft) => {
    const nativePlayback = ensureMutableOsNativePlaybackState(draft);
    nativePlayback[platform] = {
      status: 'ready',
      loadedAt: new Date().toISOString(),
      payload,
    };
  });
  pushHistory('PLAYBACK', 'success', `${getOsPlaybackLabel(platform)} ${message}`, {
    platform,
    endpoint: 'native-playback',
  });
}

// Stores a native playback route error in dashboard state.
function applyNativePlaybackError(platform: OsPlaybackPlatform, error: unknown, message: string): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  patchState((draft) => {
    const nativePlayback = ensureMutableOsNativePlaybackState(draft);
    nativePlayback[platform] = {
      status: 'error',
      loadedAt: new Date().toISOString(),
      error: errorMessage,
    };
  });
  pushHistory('PLAYBACK', 'error', `${getOsPlaybackLabel(platform)} ${message}`, {
    platform,
    error: errorMessage,
  });
}

// Ensures dashboard state has a mutable native playback status bucket.
function ensureMutableOsNativePlaybackState(draft: Record<string, unknown>): Record<string, unknown> {
  if (!draft.osNativePlayback || typeof draft.osNativePlayback !== 'object' || Array.isArray(draft.osNativePlayback)) {
    draft.osNativePlayback = {};
  }
  return draft.osNativePlayback as Record<string, unknown>;
}

// Loads backend scheduler/log/worker observability for the OS playback views.
async function loadOsPlaybackObservability(platform: OsPlaybackPlatform): Promise<void> {
  patchState((draft) => {
    const observability = ensureMutableOsPlaybackObservabilityState(draft);
    const existing = observability[platform] as Record<string, unknown> | undefined;
    observability[platform] = {
      ...(existing ?? {}),
      status: existing?.payload ? 'ready' : 'loading',
      loadedAt: new Date().toISOString(),
    };
  });

  try {
    const payload = await requestJson<Record<string, unknown>>(`/api/runtime/playback/observability?platform=${platform}&limit=40`, {
      headers: { Accept: 'application/json' },
      operation: `Load ${platform} playback observability`,
    });
    patchState((draft) => {
      const observability = ensureMutableOsPlaybackObservabilityState(draft);
      observability[platform] = {
        status: 'ready',
        loadedAt: new Date().toISOString(),
        payload,
      };
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    patchState((draft) => {
      const observability = ensureMutableOsPlaybackObservabilityState(draft);
      observability[platform] = {
        status: 'error',
        loadedAt: new Date().toISOString(),
        error: message,
      };
    });
    pushHistory('PLAYBACK', 'error', `${getOsPlaybackLabel(platform)} playback observability refresh failed.`, {
      platform,
      endpoint: '/api/runtime/playback/observability',
      error: message,
    });
  }
}

// Ensures the dynamic runtime-truth state has a mutable OS playback bucket.
function ensureMutableOsPlaybackState(draft: Record<string, unknown>): Record<string, unknown> {
  if (!draft.osPlayback || typeof draft.osPlayback !== 'object' || Array.isArray(draft.osPlayback)) {
    draft.osPlayback = {};
  }
  return draft.osPlayback as Record<string, unknown>;
}

// Ensures the dynamic runtime-truth state has a mutable OS playback observability bucket.
function ensureMutableOsPlaybackResumeState(draft: Record<string, unknown>): Record<string, unknown> {
  if (!draft.osPlaybackResume || typeof draft.osPlaybackResume !== 'object' || Array.isArray(draft.osPlaybackResume)) {
    draft.osPlaybackResume = {};
  }
  return draft.osPlaybackResume as Record<string, unknown>;
}

// Ensures the dynamic runtime-truth state has a mutable OS playback observability bucket.
function ensureMutableOsPlaybackObservabilityState(draft: Record<string, unknown>): Record<string, unknown> {
  if (!draft.osPlaybackObservability || typeof draft.osPlaybackObservability !== 'object' || Array.isArray(draft.osPlaybackObservability)) {
    draft.osPlaybackObservability = {};
  }
  return draft.osPlaybackObservability as Record<string, unknown>;
}


// Ensures each OS playback platform has mutable primitive rotation state.
function ensureMutableOsPlaybackRotationState(draft: Record<string, unknown>, platform: OsPlaybackPlatform): Record<string, unknown> {
  if (!draft.osPlaybackRotation || typeof draft.osPlaybackRotation !== 'object' || Array.isArray(draft.osPlaybackRotation)) {
    draft.osPlaybackRotation = {};
  }
  const bucket = draft.osPlaybackRotation as Record<string, Record<string, unknown>>;
  if (!bucket[platform] || typeof bucket[platform] !== 'object' || Array.isArray(bucket[platform])) {
    bucket[platform] = {
      activeIndex: 0,
      paused: true,
      fullscreen: false,
      intervalSeconds: OS_PLAYBACK_ROTATION_INTERVAL_SECONDS,
      nextRotationAtIso: null,
    };
  }
  return bucket[platform];
}

// Maps playback platform ids to operator labels for history entries.
function getOsPlaybackLabel(platform: OsPlaybackPlatform): string {
  return platform === OS_PLAYBACK_PLATFORMS.windows ? 'Windows' : 'Raspberry OS';
}

// Converts a new view id into the corresponding playback platform, when applicable.
function getOsPlaybackPlatformForView(viewId: string | null | undefined): OsPlaybackPlatform | null {
  if (viewId === 'WIN') {
    return OS_PLAYBACK_PLATFORMS.windows;
  }
  if (viewId === 'RPI') {
    return OS_PLAYBACK_PLATFORMS.raspberry;
  }
  return null;
}


// Normalizes rendered platform attributes back to the supported OS playback platform ids.
function normalizeOsPlaybackPlatform(value: string | null | undefined): OsPlaybackPlatform {
  return value === OS_PLAYBACK_PLATFORMS.raspberry ? OS_PLAYBACK_PLATFORMS.raspberry : OS_PLAYBACK_PLATFORMS.windows;
}

// Starts or pauses browser-side queue rotation for the selected OS playback surface.
function toggleOsPlaybackRotation(platform: OsPlaybackPlatform): void {
  const rotation = readOsPlaybackRotation(platform);
  if (rotation.paused) {
    startOsPlaybackRotation(platform, 'manual');
    return;
  }
  pauseOsPlaybackRotation(platform, 'manual');
}

// Starts browser-side rotation and schedules the next queue advance.
function startOsPlaybackRotation(platform: OsPlaybackPlatform, reason: 'manual' | 'fullscreen' | 'auto'): void {
  const itemCount = readOsPlaybackItemCount(platform);
  patchState((draft) => {
    const rotation = ensureMutableOsPlaybackRotationState(draft, platform);
    rotation.paused = itemCount <= 1;
    rotation.intervalSeconds = OS_PLAYBACK_ROTATION_INTERVAL_SECONDS;
    rotation.nextRotationAtIso = buildNextRotationIso(OS_PLAYBACK_ROTATION_INTERVAL_SECONDS);
    rotation.activeIndex = clampOsPlaybackIndex(Number(rotation.activeIndex ?? 0), itemCount);
  });
  pushHistory('PLAYBACK', itemCount > 1 ? 'success' : 'info', `${getOsPlaybackLabel(platform)} playback rotation ${itemCount > 1 ? 'started' : 'is waiting for more queue items'}.`, { platform, reason, itemCount });
  pushLog('B4', itemCount > 1 ? 'success' : 'info', `${getOsPlaybackLabel(platform)} playback rotation ${itemCount > 1 ? 'started' : 'waiting for queue'}.`);
  queueOsPlaybackResumeCheckpointSave(platform, reason);
  scheduleOsPlaybackRotation(platform);
}

// Pauses browser-side queue rotation without leaving the current item.
function pauseOsPlaybackRotation(platform: OsPlaybackPlatform, reason: 'manual' | 'fullscreen-change'): void {
  clearOsPlaybackRotationTimer(platform);
  patchState((draft) => {
    const rotation = ensureMutableOsPlaybackRotationState(draft, platform);
    rotation.paused = true;
    rotation.nextRotationAtIso = null;
  });
  pushHistory('PLAYBACK', 'info', `${getOsPlaybackLabel(platform)} playback rotation paused.`, { platform, reason });
  queueOsPlaybackResumeCheckpointSave(platform, reason);
}

// Advances the active queue item for manual controls and automatic rotation ticks.
function advanceOsPlaybackRotation(platform: OsPlaybackPlatform, step: number, reason: 'manual' | 'auto'): void {
  const itemCount = readOsPlaybackItemCount(platform);
  if (itemCount <= 1) {
    startOsPlaybackRotation(platform, reason);
    return;
  }
  patchState((draft) => {
    const rotation = ensureMutableOsPlaybackRotationState(draft, platform);
    const currentIndex = clampOsPlaybackIndex(Number(rotation.activeIndex ?? 0), itemCount);
    rotation.activeIndex = (currentIndex + step + itemCount) % itemCount;
    rotation.paused = false;
    rotation.intervalSeconds = OS_PLAYBACK_ROTATION_INTERVAL_SECONDS;
    rotation.nextRotationAtIso = buildNextRotationIso(OS_PLAYBACK_ROTATION_INTERVAL_SECONDS);
  });
  pushLog('B4', 'info', `${getOsPlaybackLabel(platform)} playback moved to the ${reason === 'auto' ? 'next timed' : 'selected'} queue item.`);
  queueOsPlaybackResumeCheckpointSave(platform, reason);
  scheduleOsPlaybackRotation(platform);
}

// Opens the OS playback overlay and requests browser fullscreen when supported.
function enterOsPlaybackFullscreen(platform: OsPlaybackPlatform): void {
  patchState((draft) => {
    const rotation = ensureMutableOsPlaybackRotationState(draft, platform);
    rotation.fullscreen = true;
    rotation.paused = false;
    rotation.intervalSeconds = OS_PLAYBACK_ROTATION_INTERVAL_SECONDS;
    rotation.nextRotationAtIso = buildNextRotationIso(OS_PLAYBACK_ROTATION_INTERVAL_SECONDS);
    Object.keys((draft.osPlaybackRotation as Record<string, unknown>) ?? {}).forEach((key) => {
      if (key !== platform && typeof (draft.osPlaybackRotation as Record<string, Record<string, unknown>>)[key] === 'object') {
        (draft.osPlaybackRotation as Record<string, Record<string, unknown>>)[key].fullscreen = false;
      }
    });
  });
  pushHistory('PLAYBACK', 'success', `${getOsPlaybackLabel(platform)} fullscreen playback opened.`, { platform });
  startOsPlaybackActivityMonitoring(platform);
  scheduleOsPlaybackRotation(platform);
  queueOsPlaybackResumeCheckpointSave(platform, 'fullscreen-enter');
  requestBrowserFullscreenForOsPlayback(platform);
}

// Closes the OS playback overlay and exits browser fullscreen when possible.
function exitOsPlaybackFullscreen(platform: OsPlaybackPlatform): void {
  patchState((draft) => {
    const rotation = ensureMutableOsPlaybackRotationState(draft, platform);
    rotation.fullscreen = false;
  });
  if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
    void document.exitFullscreen().catch(() => undefined);
  }
  pushHistory('PLAYBACK', 'info', `${getOsPlaybackLabel(platform)} fullscreen playback closed.`, { platform });
  stopOsPlaybackActivityMonitoring(platform);
  queueOsPlaybackResumeCheckpointSave(platform, 'fullscreen-exit');
}

// Requests browser fullscreen for the rendered overlay after state has re-rendered.
function requestBrowserFullscreenForOsPlayback(platform: OsPlaybackPlatform): void {
  window.setTimeout(() => {
    const overlay = document.querySelector<HTMLElement>(`[data-os-playback-fullscreen-overlay="${platform}"]`);
    if (!overlay || typeof overlay.requestFullscreen !== 'function' || document.fullscreenElement) {
      return;
    }
    void overlay.requestFullscreen().catch((error) => {
      pushHistory('PLAYBACK', 'error', `${getOsPlaybackLabel(platform)} browser fullscreen request failed.`, {
        platform,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }, 0);
}

// Schedules the next browser-side queue rotation tick for an active platform.
function scheduleOsPlaybackRotation(platform: OsPlaybackPlatform): void {
  clearOsPlaybackRotationTimer(platform);
  const rotation = readOsPlaybackRotation(platform);
  const itemCount = readOsPlaybackItemCount(platform);
  if (rotation.paused || itemCount <= 1) {
    return;
  }
  const delayMs = Math.max(250, Date.parse(rotation.nextRotationAtIso ?? '') - Date.now());
  osPlaybackRotationTimers.set(platform, window.setTimeout(() => {
    advanceOsPlaybackRotation(platform, 1, 'auto');
  }, Number.isFinite(delayMs) ? delayMs : OS_PLAYBACK_ROTATION_INTERVAL_SECONDS * 1000));
}

// Clears any pending queue rotation timer for the selected platform.
function clearOsPlaybackRotationTimer(platform: OsPlaybackPlatform): void {
  const timer = osPlaybackRotationTimers.get(platform);
  if (timer) {
    clearTimeout(timer);
    osPlaybackRotationTimers.delete(platform);
  }
}

// Reads the primitive rotation state from dashboard state with safe defaults.
function readOsPlaybackRotation(platform: OsPlaybackPlatform): { activeIndex: number; paused: boolean; fullscreen: boolean; nextRotationAtIso: string | null } {
  const rotation = (getState().osPlaybackRotation as Record<string, Record<string, unknown>> | undefined)?.[platform] ?? {};
  return {
    activeIndex: Number(rotation.activeIndex ?? 0),
    paused: rotation.paused !== false,
    fullscreen: rotation.fullscreen === true,
    nextRotationAtIso: typeof rotation.nextRotationAtIso === 'string' ? rotation.nextRotationAtIso : null,
  };
}


// Queues a throttled checkpoint save so playback state survives browser/reboot loss without spamming the backend.
function queueOsPlaybackResumeCheckpointSave(platform: OsPlaybackPlatform, reason: string): void {
  const now = Date.now();
  const lastSavedAt = osPlaybackResumeLastSavedAt.get(platform) ?? 0;
  const remainingDelay = Math.max(0, OS_PLAYBACK_RESUME_HEARTBEAT_MIN_MS - (now - lastSavedAt));

  if (osPlaybackResumeHeartbeatTimers.has(platform)) {
    return;
  }

  const timeout = window.setTimeout(() => {
    osPlaybackResumeHeartbeatTimers.delete(platform);
    void saveOsPlaybackResumeCheckpoint(platform, reason);
  }, remainingDelay);
  osPlaybackResumeHeartbeatTimers.set(platform, timeout);
}

// Persists the current OS playback surface as a backend resume checkpoint.
async function saveOsPlaybackResumeCheckpoint(platform: OsPlaybackPlatform, reason: string): Promise<void> {
  const payload = buildOsPlaybackResumeCheckpointPayload(platform);
  if (!payload) {
    return;
  }

  try {
    await requestJson('/api/runtime/playback/resume-checkpoint', {
      method: 'POST',
      body: { ...payload, heartbeatReason: reason },
      operation: `Save ${platform} playback resume checkpoint`,
    });
    osPlaybackResumeLastSavedAt.set(platform, Date.now());
  } catch (error) {
    pushLog('B4', 'warning', `${getOsPlaybackLabel(platform)} playback resume checkpoint save failed.`, {
      platform,
      reason,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// Builds a backend checkpoint payload from the rendered OS playback view model.
function buildOsPlaybackResumeCheckpointPayload(platform: OsPlaybackPlatform): Record<string, unknown> | null {
  const viewModel = buildOsPlaybackViewModel(getState(), platform);
  const item = viewModel.playbackItems[viewModel.rotation.activeIndex];
  if (!item?.mediaAssetId) {
    return null;
  }

  const rotation = readOsPlaybackRotation(platform);
  return {
    platform,
    mediaAssetId: item.mediaAssetId,
    displayUrl: item.displayUrl,
    displayName: item.displayName,
    mediaType: item.mediaType,
    resolvedAddress: item.resolvedAddress,
    activeIndex: viewModel.rotation.activeIndex,
    rotationPaused: rotation.paused,
    fullscreenRequested: rotation.fullscreen,
    fullscreenActive: document.fullscreenElement !== null && rotation.fullscreen,
    rotationDurationMs: OS_PLAYBACK_ROTATION_INTERVAL_SECONDS * 1000,
    remainingRotationMs: computeOsPlaybackRemainingRotationMs(rotation.nextRotationAtIso),
    videoPositionMs: readActiveOsPlaybackVideoPositionMs(platform),
    lastHeartbeatAt: new Date().toISOString(),
    restorePolicy: 'resume_same_item',
  };
}

// Computes the approximate remaining image rotation time from the browser-side deadline.
function computeOsPlaybackRemainingRotationMs(nextRotationAtIso: string | null): number | null {
  if (!nextRotationAtIso) {
    return null;
  }
  const timestamp = Date.parse(nextRotationAtIso);
  return Number.isFinite(timestamp) ? Math.max(0, timestamp - Date.now()) : null;
}

// Reads the active fullscreen video timestamp when the current media is a video element.
function readActiveOsPlaybackVideoPositionMs(platform: OsPlaybackPlatform): number | null {
  const video = document.querySelector<HTMLVideoElement>(`[data-os-playback-fullscreen-overlay="${platform}"] video`);
  if (!video || !Number.isFinite(video.currentTime)) {
    return null;
  }
  return Math.max(0, Math.trunc(video.currentTime * 1000));
}

// Counts queue items available from the read-only playback contract.
function readOsPlaybackItemCount(platform: OsPlaybackPlatform): number {
  const playback = ((getState().osPlayback as Record<string, Record<string, unknown>> | undefined)?.[platform]?.contract as { playback?: Record<string, unknown> } | undefined)?.playback;
  const items = Array.isArray(playback?.items) ? playback.items : [];
  if (items.length > 0) {
    return items.length;
  }
  return playback?.currentItem || playback?.nextItem ? 1 : 0;
}

// Builds the next rotation deadline in ISO form for state/rendering.
function buildNextRotationIso(intervalSeconds: number): string {
  return new Date(Date.now() + intervalSeconds * 1000).toISOString();
}

// Clamps queue indices so stale state cannot point outside the current contract list.
function clampOsPlaybackIndex(index: number, itemCount: number): number {
  if (itemCount <= 0 || !Number.isFinite(index)) {
    return 0;
  }
  return Math.max(0, Math.min(itemCount - 1, Math.trunc(index)));
}

// Mirrors browser fullscreen exits back into the dashboard fullscreen overlay state.
function syncOsPlaybackFullscreenStateFromBrowser(): void {
  if (document.fullscreenElement) {
    return;
  }
  patchState((draft) => {
    const rotation = draft.osPlaybackRotation as Record<string, Record<string, unknown>> | undefined;
    Object.values(rotation ?? {}).forEach((entry) => {
      if (entry && typeof entry === 'object') {
        entry.fullscreen = false;
      }
    });
  });
  stopOsPlaybackActivityMonitoring(OS_PLAYBACK_PLATFORMS.windows);
  stopOsPlaybackActivityMonitoring(OS_PLAYBACK_PLATFORMS.raspberry);
  queueOsPlaybackResumeCheckpointSave(OS_PLAYBACK_PLATFORMS.windows, 'browser-fullscreen-exit');
  queueOsPlaybackResumeCheckpointSave(OS_PLAYBACK_PLATFORMS.raspberry, 'browser-fullscreen-exit');
}

// Updates browser-local Debug page state without touching backend/runtime systems.
function patchDebugPage(mutator: (debugPage: DebugPageState) => DebugPageState): void {
  patchState((draft) => {
    const current = draft.debugPage && typeof draft.debugPage === 'object' && !Array.isArray(draft.debugPage)
      ? draft.debugPage as DebugPageState
      : buildDefaultDebugPageState();
    draft.debugPage = mutator(current);
  });
}


// Narrows rendered Debug worker ids to the three supported mock worker panes.
function normalizeDebugWorkerKey(value: string | null | undefined): DebugWorkerKey | null {
  return value === 'regular' || value === 'playback' || value === 'screen' ? value : null;
}

// Binds rendered controls to runtime-truth actions and local state updates.
function bindEvents() {
  app.querySelectorAll<HTMLButtonElement>('[data-dashboard-visual-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      const requestedMode = button.dataset.dashboardVisualMode;
      const selectedMode: DashboardVisualMode = requestedMode === 'real' ? 'real' : requestedMode === 'v2' ? 'v2' : 'test';
      dashboardVisualMode = selectedMode;
      // V2 is a frontend-only shell in this slice. Do not send a new backend
      // runtime header until server-side V2 action boundaries are specified.
      setDashboardRuntimeMode(selectedMode === 'v2' ? null : selectedMode);
      if (selectedMode === 'v2') {
        setActiveView('V2', 'V2');
      }
      render();
      if (selectedMode === 'v2') {
        queueV2RecoveryRestartCheck();
      } else {
        tryInitPreload();
      }
    });
  });

  app.querySelectorAll<HTMLButtonElement>('[data-v2-sidebar-route]').forEach((button) => {
    button.addEventListener('click', () => {
      const route = button.dataset.v2SidebarRoute;
      if (isV2OperatorSidebarRoute(route)) {
        v2OperatorSidebarRoute = route;
        render();
      }
    });
  });


  app.querySelectorAll<HTMLSelectElement>('select[data-action="select-mode"]').forEach((select) => {
    select.addEventListener('change', () => {
      const selectedMode = select.value === 'real' ? 'real' : 'test';
      setCurrentMode(selectedMode);
      pushHistory('V2', 'info', `V2 source-of-truth mode changed to ${selectedMode.toUpperCase()}.`, {
        action: 'select-mode',
        selectedMode,
        backendRuntimeModeChanged: false,
      });
      render();
    });
  });

  app.querySelectorAll<HTMLElement>('[data-view]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.view;
      const label = VIEW_ORDER.find((view) => view.id === id);
      setActiveView(id, `${id} — ${label?.name ?? ''}`);
      // Trigger safe preloads or refresh actions depending on the selected view.
      if (id === 'A') {
        const plan = buildViewARefreshPlan(dashboardVisualMode === 'v2' ? null : dashboardVisualMode);
        plan.actions.forEach((action) => runAction(action));
        pushHistory('VIEW_A', 'info', 'View A preload/refresh plan executed.', {
          actions: plan.actions,
          mode: plan.mode,
          safeRefreshOnly: plan.safeRefreshOnly,
          productionMutation: plan.productionMutation,
          nonClaim: plan.nonClaim,
        });
      } else if (id === 'C') {
        runAction('refresh-last-run');
      } else if (id === 'D') {
        runAction('refresh-running-process');
      }
      const osPlaybackPlatform = getOsPlaybackPlatformForView(id);
      if (osPlaybackPlatform) {
        void loadOsPlaybackContract(osPlaybackPlatform);
        void loadOsPlaybackObservability(osPlaybackPlatform);
        void loadNativePlaybackStatus(osPlaybackPlatform);
      }
    });
  });

  app.querySelectorAll<HTMLButtonElement>('[data-debug-visual-action]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const action = button.dataset.debugVisualAction;
      if (action === 'cycle-color-schema') {
        patchDebugPage((debugPage) => cycleDebugColorSchema(debugPage));
        pushHistory('DEBUG', 'success', 'Changed Debug page color schema locally.', {
          action,
          browserLocal: true,
          productionMutation: false,
        });
        return;
      }
      if (action === 'cycle-major-visual-mode') {
        patchDebugPage((debugPage) => cycleDebugMajorVisualMode(debugPage));
        pushHistory('DEBUG', 'success', 'Changed Debug page major visual mode locally.', {
          action,
          browserLocal: true,
          productionMutation: false,
        });
        return;
      }
    });
  });

  app.querySelectorAll<HTMLButtonElement>('[data-debug-element-marker]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const elementId = button.dataset.debugElementMarker;
      if (!elementId) {
        return;
      }
      patchDebugPage((debugPage) => selectDebugElementMetadata(debugPage, elementId));
      pushHistory('DEBUG', 'info', `Opened Debug element metadata for ${elementId}.`, {
        action: 'show-element-metadata',
        elementId,
        markerOnly: true,
        productionMutation: false,
        underlyingActionTriggered: false,
      });
    });
  });

  app.querySelectorAll<HTMLButtonElement>('[data-debug-element-modal-close]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      patchDebugPage((debugPage) => clearDebugElementMetadata(debugPage));
      pushHistory('DEBUG', 'info', 'Closed Debug element metadata dialog.', {
        action: 'close-element-metadata',
        markerOnly: true,
        productionMutation: false,
      });
    });
  });

  app.querySelectorAll<HTMLButtonElement>('[data-debug-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.debugAction;
      if (action === 'save-state') {
        patchDebugPage((debugPage) => saveFakeDebugStateSnapshot(debugPage));
        pushHistory('DEBUG', 'success', 'Saved fake/local Debug restore preview snapshot.', {
          action,
          fakeOnly: true,
          productionMutation: false,
          restoreMutation: false,
        });
        return;
      }
      if (action === 'restore-state') {
        patchDebugPage((debugPage) => previewFakeDebugStateRestore(debugPage));
        pushHistory('DEBUG', 'blocked', 'Blocked fake/local Debug restore preview before production mutation.', {
          action,
          fakeOnly: true,
          productionMutation: false,
          restoreMutation: false,
        });
        return;
      }
      if (action === 'save-pre-login-system-state') {
        patchDebugPage((debugPage) => saveManualTestingSystemStateSnapshot(debugPage, 'pre-login'));
        pushHistory('DEBUG', 'success', 'Saved browser-local pre-login SYSTEM_STATE draft.', {
          action,
          browserLocal: true,
          productionMutation: false,
          sessionSecretsCopied: false,
        });
        return;
      }
      if (action === 'save-post-login-system-state') {
        patchDebugPage((debugPage) => saveManualTestingSystemStateSnapshot(debugPage, 'post-login'));
        pushHistory('DEBUG', 'success', 'Saved browser-local post-login SYSTEM_STATE draft.', {
          action,
          browserLocal: true,
          productionMutation: false,
          sessionSecretsCopied: false,
        });
        return;
      }
      if (action === 'add-test-image') {
        patchDebugPage((debugPage) => addIsolatedTestMediaItem(debugPage));
        pushHistory('DEBUG', 'success', 'Registered isolated Debug test-media placeholder.', {
          action,
          storage: 'isolated-test-only',
          productionMutation: false,
        });
        return;
      }
      if (action === 'parse-crontab') {
        patchDebugPage((debugPage) => readFakeDebugCrontab(debugPage));
        pushHistory('DEBUG', 'success', 'Parsed fake/app-owned Debug crontab content read-only.', {
          action,
          fakeOnly: true,
          systemCrontabTouched: false,
        });
        return;
      }
      if (action === 'pause-crontab') {
        patchDebugPage((debugPage) => pauseFakeDebugCrontab(debugPage));
        pushHistory('DEBUG', 'success', 'Paused fake app-owned Debug crontab entries only.', {
          action,
          fakeOnly: true,
          systemCrontabTouched: false,
          unrelatedEntriesPreserved: true,
        });
        return;
      }
      if (action === 'resume-crontab') {
        patchDebugPage((debugPage) => resumeFakeDebugCrontab(debugPage));
        pushHistory('DEBUG', 'success', 'Resumed fake app-owned Debug crontab entries only.', {
          action,
          fakeOnly: true,
          systemCrontabTouched: false,
          unrelatedEntriesPreserved: true,
        });
        return;
      }
      if (action === 'install-crontab-pending') {
        patchDebugPage((debugPage) => stageFakeDebugCrontabInstall(debugPage));
        pushHistory('DEBUG', 'blocked', 'Fake Debug crontab install requires safety confirmation when high-frequency intervals are present.', {
          action,
          fakeOnly: true,
          systemCrontabTouched: false,
          requiresDoubleConfirmation: true,
        });
        return;
      }
    });
  });

  app.querySelectorAll<HTMLTextAreaElement>('[data-debug-crontab-input]').forEach((textarea) => {
    textarea.addEventListener('input', () => {
      patchDebugPage((debugPage) => setDebugCrontabContent(debugPage, textarea.value));
    });
  });

  app.querySelectorAll<HTMLButtonElement>('[data-debug-worker-run-now]').forEach((button) => {
    button.addEventListener('click', () => {
      const workerKey = normalizeDebugWorkerKey(button.dataset.debugWorkerRunNow);
      if (!workerKey) {
        return;
      }
      patchDebugPage((debugPage) => runMockDebugWorker(debugPage, workerKey));
      pushHistory('DEBUG', 'success', `${workerKey} worker Run now simulated locally.`, {
        action: 'debug-worker-run-now',
        workerKey,
        mockOnly: true,
        spawnedProcess: false,
      });
    });
  });

  app.querySelectorAll<HTMLButtonElement>('[data-os-playback-refresh-platform]').forEach((button) => {
    button.addEventListener('click', () => {
      const platform = button.dataset.osPlaybackRefreshPlatform;
      const osPlaybackPlatform = platform === OS_PLAYBACK_PLATFORMS.raspberry
        ? OS_PLAYBACK_PLATFORMS.raspberry
        : OS_PLAYBACK_PLATFORMS.windows;
      void loadOsPlaybackContract(osPlaybackPlatform);
      void loadOsPlaybackObservability(osPlaybackPlatform);
      void loadNativePlaybackStatus(osPlaybackPlatform);
    });
  });

  app.querySelectorAll<HTMLButtonElement>('[data-os-playback-restore-fullscreen-platform]').forEach((button) => {
    button.addEventListener('click', () => {
      const platform = normalizeOsPlaybackPlatform(button.dataset.osPlaybackRestoreFullscreenPlatform);
      enterOsPlaybackFullscreen(platform);
    });
  });

  app.querySelectorAll<HTMLButtonElement>('[data-playback-view-fullscreen-platform]').forEach((button) => {
    button.addEventListener('click', () => {
      const platform = normalizeOsPlaybackPlatform(button.dataset.playbackViewFullscreenPlatform);
      enterOsPlaybackFullscreen(platform);
    });
  });

  app.querySelectorAll<HTMLButtonElement>('[data-os-playback-toggle-rotation-platform]').forEach((button) => {
    button.addEventListener('click', () => {
      const platform = normalizeOsPlaybackPlatform(button.dataset.osPlaybackToggleRotationPlatform);
      toggleOsPlaybackRotation(platform);
    });
  });

  app.querySelectorAll<HTMLButtonElement>('[data-os-playback-step-platform]').forEach((button) => {
    button.addEventListener('click', () => {
      const platform = normalizeOsPlaybackPlatform(button.dataset.osPlaybackStepPlatform);
      const step = Number(button.dataset.osPlaybackStep) < 0 ? -1 : 1;
      advanceOsPlaybackRotation(platform, step, 'manual');
    });
  });

  app.querySelectorAll<HTMLButtonElement>('[data-os-playback-exit-fullscreen]').forEach((button) => {
    button.addEventListener('click', () => {
      const platform = normalizeOsPlaybackPlatform(button.dataset.osPlaybackExitFullscreen);
      exitOsPlaybackFullscreen(platform);
    });
  });

  app.querySelectorAll<HTMLElement>('[data-log-entry-open]').forEach((entry) => {
    entry.addEventListener('click', () => {
      openLogModal(entry.dataset.logSourceKey, entry.dataset.logEntryIndex);
    });
    entry.addEventListener('keydown', (event) => {
      const key = (event as KeyboardEvent).key;
      if (key === 'Enter' || key === ' ') {
        event.preventDefault();
        openLogModal(entry.dataset.logSourceKey, entry.dataset.logEntryIndex);
      }
    });
  });

  app.querySelectorAll<HTMLElement>('[data-history-entry-open]').forEach((entry) => {
    entry.addEventListener('click', () => {
      openHistoryModal(entry.dataset.historyEntryIndex);
    });
    entry.addEventListener('keydown', (event) => {
      const key = (event as KeyboardEvent).key;
      if (key === 'Enter' || key === ' ') {
        event.preventDefault();
        openHistoryModal(entry.dataset.historyEntryIndex);
      }
    });
  });

  app.querySelectorAll('[data-modal-close]').forEach((button) => {
    button.addEventListener('click', () => closeModal());
  });

  app.querySelectorAll('[data-modal-backdrop]').forEach((backdrop) => {
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) {
        closeModal();
      }
    });
  });

  app.querySelectorAll<HTMLButtonElement>('[data-scheduler-endpoint-copy-all]').forEach((button) => {
    button.addEventListener('click', () => {
      copySchedulerEndpointLogToClipboard();
    });
  });

  app.querySelectorAll<HTMLButtonElement>('[data-scheduler-endpoint-clear-all]').forEach((button) => {
    button.addEventListener('click', () => {
      clearSchedulerEndpointLog();
      pushHistory('SCHEDULER', 'info', 'Cron endpoint / row live log cleared.', { action: 'clear-scheduler-endpoint-log' });
    });
  });

  app.querySelectorAll<HTMLButtonElement>('[data-scheduler-endpoint-row-expand]').forEach((button) => {
    button.addEventListener('click', () => {
      openSchedulerEndpointLogRow(button.dataset.schedulerEndpointRowExpand);
    });
  });



  app.querySelectorAll<HTMLButtonElement>('[data-native-playback-detect-platform]').forEach((button) => {
    button.addEventListener('click', () => {
      const platform = normalizeOsPlaybackPlatform(button.dataset.nativePlaybackDetectPlatform);
      void runNativePlaybackCommand(platform, '/api/native-playback/detect', 'Native playback player detection');
    });
  });

  app.querySelectorAll<HTMLButtonElement>('[data-native-playback-start-platform]').forEach((button) => {
    button.addEventListener('click', () => {
      const platform = normalizeOsPlaybackPlatform(button.dataset.nativePlaybackStartPlatform);
      void runNativePlaybackCommand(platform, '/api/native-playback/start-current', 'Native fullscreen start');
    });
  });

  app.querySelectorAll<HTMLButtonElement>('[data-native-playback-stop-platform]').forEach((button) => {
    button.addEventListener('click', () => {
      const platform = normalizeOsPlaybackPlatform(button.dataset.nativePlaybackStopPlatform);
      void runNativePlaybackCommand(platform, '/api/native-playback/stop', 'Native playback stop');
    });
  });

  app.querySelectorAll<HTMLButtonElement>('[data-os-terminal-copy-all-platform]').forEach((button) => {
    button.addEventListener('click', () => {
      copyOsPlaybackTerminalToClipboard(
        normalizeOsPlaybackPlatform(button.dataset.osTerminalCopyAllPlatform),
        normalizeOsTerminalKind(button.dataset.osTerminalCopyAllKind),
      );
    });
  });

  app.querySelectorAll<HTMLButtonElement>('[data-os-terminal-clear-platform]').forEach((button) => {
    button.addEventListener('click', () => {
      clearOsPlaybackTerminal(
        normalizeOsPlaybackPlatform(button.dataset.osTerminalClearPlatform),
        normalizeOsTerminalKind(button.dataset.osTerminalClearKind),
      );
    });
  });

  app.querySelectorAll<HTMLButtonElement>('[data-os-terminal-row-expand-platform]').forEach((button) => {
    button.addEventListener('click', () => {
      openOsPlaybackTerminalRow(
        normalizeOsPlaybackPlatform(button.dataset.osTerminalRowExpandPlatform),
        normalizeOsTerminalKind(button.dataset.osTerminalRowExpandKind),
        Number(button.dataset.osTerminalRowExpandIndex),
      );
    });
  });

  app.querySelectorAll<HTMLElement>('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;
      if (isNewAuthActionDisabledForCurrentMode(action)) {
        pushHistory('NEW AUTH', 'warning', TEST_MODE_NEW_AUTH_DISABLED_MESSAGE, {
          action,
          runtimeMode: dashboardVisualMode,
          blocked: true,
        });
        return;
      }
      if (action === 'toggle-inspect-mode') {
        toggleInspectMode();
        return;
      }
      if (action === 'toggle-value-inspect-mode') {
        toggleValueInspectMode();
        return;
      }
      if (action === 'toggle-reality-inspect-mode') {
        toggleRealityInspectMode();
        return;
      }
      if (action === 'toggle-backend-status-inspect-mode') {
        toggleBackendStatusInspectMode();
        return;
      }
      if (action === 'toggle-live-updates') {
        toggleLiveUpdatesPaused();
        return;
      }
      if (action === 'toggle-v2-implementation-status') {
        toggleV2ImplementationStatusMode();
        return;
      }
      if (action === 'show-v2-status-help') {
        openV2StatusHelp(button.dataset.v2HelpStatusId);
        return;
      }
      if (action === 'v2-placeholder-alert') {
        const alertText = button.dataset.v2AlertText ?? button.textContent?.trim() ?? '';
        window.alert(alertText);
        pushHistory('RECOVERY', 'info', `${alertText} placeholder clicked.`, {
          action,
          placeholderOnly: true,
          productionMutation: false,
        });
        return;
      }
      if (action === 'v2-recovery-save-state') {
        void runV2RecoverySave('manual-save');
        return;
      }
      if (action === 'v2-recovery-load-state') {
        void runV2RecoveryLoad();
        return;
      }
      if (action === 'v2-recovery-emulate-power-off') {
        void runV2RecoverySave('pre-shutdown', 'EMULATE POWER OFF records a pre-shutdown snapshot; it does not power off this machine.');
        return;
      }
      if (action === 'v2-playback-queue-prepare-item') {
        prepareV2PlaybackQueueItemForBackend(button.dataset.v2PlaybackQueueItemId);
        return;
      }
      if (action === 'emulate-pir-signal') {
        markB5ActivityDetected('pir');
        pushHistory('SCREEN', 'success', 'PIR emulator signal received.', {
          action,
          source: 'pir',
          emulated: true,
          hardwareProof: false,
        });
        return;
      }
      if (action === 'toggle-marked-for-removal') {
        toggleMarkedForRemoval();
        return;
      }
      if (action === 'clear-history') {
        resetHistory();
        return;
      }
      if (action === 'copy-history') {
        copyHistoryToClipboard();
        return;
      }
      if (action === 'submit-b1-2fa') {
        const input = app.querySelector<HTMLInputElement>('[data-auth-2fa-code]');
        const code = typeof input?.value === 'string' ? input.value : '';
        runAction(action, { code });
        if (input) input.value = '';
        return;
      }
      if (action === 'new-auth-submit-2fa') {
        const input = app.querySelector<HTMLInputElement>('[data-new-auth-2fa-code]');
        const code = typeof input?.value === 'string' ? input.value.trim() : '';
        if (!code) {
          pushHistory('NEW AUTH', 'warning', 'New auth 2FA submission was cancelled because no response was entered.', {
            action: 'new-auth-submit-2fa',
            submitted: false,
          });
          return;
        }
        runAction(action, { code });
        if (input) input.value = '';
        return;
      }
      if (action === 'new-auth-logout-session') {
        if (!confirmNewAuthLogout()) {
          pushHistory('NEW AUTH', 'warning', 'New auth logout/session removal was cancelled before local session files were removed.', {
            action: 'new-auth-logout-session',
            confirmed: false,
          });
          return;
        }
        runAction(action, { confirmationSource: 'window.confirm' });
        return;
      }
      if (action === 'delete-db') {
        const confirmed = window.confirm('Delete the configured SQLite database file and any WAL/SHM sidecar files?');
        if (!confirmed) {
          pushHistory('DB', 'warning', 'Delete DB was cancelled before the request was sent.', {
            action: 'delete-db',
            confirmed: false,
          });
          return;
        }
        runAction(action, { confirmationSource: 'window.confirm' });
        return;
      }
      if (action === 'recreate-db') {
        const confirmed = window.confirm('Recreate the configured SQLite database as an empty file? This will remove the current file first if it exists.');
        if (!confirmed) {
          pushHistory('DB', 'warning', 'Recreate DB was cancelled before the request was sent.', {
            action: 'recreate-db',
            confirmed: false,
          });
          return;
        }
        runAction(action, { confirmationSource: 'window.confirm' });
        return;
      }
      const schedulerTarget = button.dataset.schedulerTarget;
      const schedulerTargetPayload = schedulerTarget ? { target: schedulerTarget } : {};
      if (action === 'install-crontab') {
        const input = app.querySelector<HTMLTextAreaElement>('[data-scheduler-crontab-input]');
        if (input) {
          setSchedulerEditableCrontab(input.value);
        }
        if (dashboardVisualMode === 'v2' && v2OperatorSidebarRoute === 'real-playback') {
          if (!isModeReadyForAutonomousPlayback('real')) {
            const confirmedBlockedStart = window.confirm('REAL readiness rings are not all complete. Continue installing crontab anyway?');
            if (!confirmedBlockedStart) {
              pushHistory('SCHEDULER', 'warning', 'REAL crontab installation was cancelled because readiness rings were incomplete.', {
                action: 'install-crontab',
                route: v2OperatorSidebarRoute,
                readinessGate: 'incomplete',
              });
              return;
            }
          }
          const confirmedStart = window.confirm('Are you sure you want to start the real playback process?');
          if (!confirmedStart) {
            pushHistory('SCHEDULER', 'warning', 'REAL playback crontab installation was cancelled before start.', {
              action: 'install-crontab',
              route: v2OperatorSidebarRoute,
              confirmed: false,
            });
            return;
          }
          setCurrentMode('real');
        }
        runAction(action, schedulerTargetPayload);
        return;
      }
      runAction(action, schedulerTargetPayload);
    });
  });

  app.querySelectorAll<HTMLTextAreaElement>('[data-scheduler-crontab-input]').forEach((textarea) => {
    textarea.addEventListener('input', () => {
      setSchedulerEditableCrontab(textarea.value);
    });
  });

  app.querySelectorAll<HTMLElement>('[data-db-table]').forEach((button) => {
    button.addEventListener('click', () => {
      selectDatabaseViewerTable(button.dataset.dbTable);
    });
  });

  app.querySelectorAll<HTMLElement>('[data-db-page-delta]').forEach((button) => {
    button.addEventListener('click', () => {
      changeDatabaseViewerPage(Number(button.dataset.dbPageDelta || 0));
    });
  });

  app.querySelectorAll<HTMLInputElement>('input[name="execution-mode"]').forEach((input) => {
    input.addEventListener('change', () => setSimulationValue('executionMode', input.value));
  });

  app.querySelectorAll<HTMLInputElement>('input[name="input-mode"]').forEach((input) => {
    input.addEventListener('change', () => setSimulationValue('inputMode', input.value));
  });

  app.querySelectorAll<HTMLSelectElement>('select[name="realDownloadRecentCount"]').forEach((select) => {
    select.addEventListener('change', () => setSimulationValue('realDownloadRecentCount', Number(select.value || 1)));
  });


  app.querySelectorAll<HTMLButtonElement>('[data-os-playback-restore-fullscreen-platform]').forEach((button) => {
    button.addEventListener('click', () => {
      const platform = normalizeOsPlaybackPlatform(button.dataset.osPlaybackRestoreFullscreenPlatform);
      enterOsPlaybackFullscreen(platform);
    });
  });

  app.querySelectorAll<HTMLButtonElement>('[data-playback-view-fullscreen-platform]').forEach((button) => {
    button.addEventListener('click', () => {
      const platform = button.dataset.playbackViewFullscreenPlatform as OsPlaybackPlatform | undefined;
      requestOsPlaybackFullscreen(platform);
    });
  });

  app.querySelectorAll<HTMLButtonElement>('[data-playback-rendering-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      const mode = button.dataset.playbackRenderingMode;
      if (mode) {
        setPlaybackRenderingMode(mode as PlaybackRenderingMode);
        if (mode === PLAYBACK_RENDERING_MODES.fullscreen) {
          requestPlaybackFullscreen();
        }
      }
    });
  });

  app.querySelectorAll<HTMLButtonElement>('[data-playback-rendering-platform]').forEach((button) => {
    button.addEventListener('click', () => {
      const platform = button.dataset.playbackRenderingPlatform;
      if (platform) {
        setPlaybackRenderingPlatform(platform as PlaybackRenderingPlatform);
      }
    });
  });

  ['pirEnabled', 'mouseEnabled', 'keyboardEnabled', 'simulateAllEnabled'].forEach((name) => {
    app.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`).forEach((input) => {
      input.addEventListener('change', () => {
        const checked = input.checked;
        setSimulationValue(name, checked);
        runAction('configure-screen-simulation');
        pushHistory('SCREEN', 'info', `${name} changed to ${checked ? 'enabled' : 'disabled'}.`, {
          setting: name,
          enabled: checked,
        });
      });
    });
  });

  app.querySelectorAll<HTMLButtonElement>('[data-action="start-b5-activity-test"]').forEach((button) => {
    button.addEventListener('click', () => startB5ActivityTest());
  });

  app.querySelectorAll<HTMLInputElement>('input[name="b5ActivitySource"]').forEach((input) => {
    input.addEventListener('change', () => {
      const source = input.value;
      setB5ActivitySourceSelection(source, input.checked);
      pushHistory('SCREEN', 'info', `B5 activity test source ${source} ${input.checked ? 'selected' : 'skipped'}.`, {
        source,
        selected: input.checked,
      });
    });
  });

  app.querySelectorAll<HTMLInputElement>('input[name="inactivityTimeoutSeconds"]').forEach((input) => {
    input.addEventListener('change', () => {
      const value = Number(input.value || 5);
      setSimulationValue('inactivityTimeoutSeconds', value);
      runAction('configure-screen-simulation');
      pushHistory('SCREEN', 'info', `Inactivity timeout changed to ${value} seconds.`, {
        setting: 'inactivityTimeoutSeconds',
        seconds: value,
      });
    });
  });

  app.querySelectorAll<HTMLInputElement>('[data-v2-playback-file-input]').forEach((input) => {
    input.addEventListener('change', () => {
      addV2PlaybackFiles(input.files);
      input.value = '';
    });
  });

  app.querySelectorAll<HTMLElement>('[data-v2-playback-drop-zone]').forEach((dropZone) => {
    dropZone.addEventListener('dragover', (event) => {
      event.preventDefault();
      dropZone.classList.add('v2-playback-drop-zone--dragging');
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('v2-playback-drop-zone--dragging');
    });
    dropZone.addEventListener('drop', (event) => {
      event.preventDefault();
      dropZone.classList.remove('v2-playback-drop-zone--dragging');
      addV2PlaybackFiles(event.dataTransfer?.files ?? null);
    });
  });

  app.querySelectorAll<HTMLElement>('[data-last-run-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      const mode = button.dataset.lastRunMode;
      setLastRunMode(mode);
      if (mode === 'ready') {
        seedDemoState();
      }
      if (mode === 'error') {
        patchState((draft) => {
          draft.lastRunMode = 'error';
        });
      }
      if (mode === 'none') {
        patchState((draft) => {
          draft.lastRunMode = 'none';
          draft.lastRunData = { media: {}, playback: {}, stage: {}, screen: {} };
        });
      }
    });
  });
}


// Copies one OS playback terminal panel as readable JSON for debugging.
async function copyOsPlaybackTerminalToClipboard(platform: OsPlaybackPlatform, kind: string): Promise<void> {
  const entries = getOsPlaybackTerminalEntries(platform, kind);
  const payload = JSON.stringify({
    exportedAt: new Date().toISOString(),
    source: `${getOsPlaybackLabel(platform)} ${kind} terminal`,
    platform,
    kind,
    count: entries.length,
    entries,
  }, null, 2);

  try {
    await navigator.clipboard.writeText(payload);
    pushHistory('PLAYBACK', 'success', `${getOsPlaybackLabel(platform)} ${kind} terminal copied to clipboard.`, {
      action: 'copy-os-playback-terminal',
      platform,
      kind,
      entryCount: entries.length,
    });
  } catch (error) {
    pushHistory('PLAYBACK', 'error', `${getOsPlaybackLabel(platform)} ${kind} terminal copy failed.`, {
      action: 'copy-os-playback-terminal',
      platform,
      kind,
      entryCount: entries.length,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// Clears one OS playback terminal panel locally until the next backend refresh.
function clearOsPlaybackTerminal(platform: OsPlaybackPlatform, kind: string): void {
  patchState((draft) => {
    const observability = (draft.osPlaybackObservability as Record<string, Record<string, unknown>> | undefined)?.[platform];
    const payload = observability?.payload as Record<string, unknown> | undefined;
    if (!payload) {
      return;
    }
    if (kind === 'scheduler') {
      const scheduler = payload.scheduler as Record<string, unknown> | undefined;
      if (scheduler) scheduler.entries = [];
    } else {
      const logs = payload.logs as Record<string, Record<string, unknown>> | undefined;
      const targetLog = logs?.[kind];
      if (targetLog) targetLog.entries = [];
    }
  });
  pushHistory('PLAYBACK', 'info', `${getOsPlaybackLabel(platform)} ${kind} terminal cleared locally.`, {
    action: 'clear-os-playback-terminal',
    platform,
    kind,
  });
}

// Opens a large modal with the selected OS playback terminal row details.
function openOsPlaybackTerminalRow(platform: OsPlaybackPlatform, kind: string, index: number): void {
  const entries = getOsPlaybackTerminalEntries(platform, kind);
  const entry = entries[index];
  if (!entry) {
    return;
  }
  openModal({
    kind: 'log',
    title: `${getOsPlaybackLabel(platform)} ${kind} terminal • ${entry.type.toUpperCase()}`,
    subtitle: entry.message,
    entry: {
      ...entry,
      platform,
      terminalKind: kind,
    },
  });
}

// Reads terminal rows from the same view model used by the playback renderer.
function getOsPlaybackTerminalEntries(platform: OsPlaybackPlatform, kind: string): PlaybackLogEntryViewModel[] {
  const viewModel = buildOsPlaybackViewModel(getState(), platform);
  if (kind === 'scheduler') {
    return viewModel.schedulerLog;
  }
  if (kind === 'error') {
    return viewModel.errorLog;
  }
  if (kind === 'native') {
    return viewModel.nativePlayback.log;
  }
  return viewModel.mainLog;
}

// Narrows terminal kind values to supported OS playback panels.
function normalizeOsTerminalKind(value: unknown): string {
  return value === 'scheduler' || value === 'error' || value === 'native' ? value : 'main';
}

// Confirms destructive NEW AUTH session-file removal before dispatching logout.
function confirmNewAuthLogout(): boolean {
  return window.confirm('Remove local iCloudPD session files and log out locally? Only continue if you do not need the current authenticated session.');
}

// Opens a log detail modal for the selected source entry.
function openLogModal(sourceKey, index) {
  const state = getState();
  const sourceName = typeof sourceKey === 'string' ? sourceKey : '';
  const sourceLogs = state.logs[sourceName] ?? [];
  const entry = sourceLogs[Number(index)];
  if (!entry) {
    return;
  }

  const type = typeof entry.type === 'string' ? entry.type : 'info';
  openModal({
    kind: 'log',
    title: `${sourceName} log • ${type.toUpperCase()}`,
    subtitle: entry.message ?? 'Log entry details',
    entry: {
      ...entry,
      sourceKey: sourceName,
    },
  });
}


function addV2PlaybackFiles(files: FileList | null | undefined): void {
  const fileArray = Array.from(files ?? []);
  if (!fileArray.length) {
    return;
  }

  const nextItems = fileArray.map((file) => buildV2PlaybackQueueItem(file));
  v2PlaybackQueueItems = [...v2PlaybackQueueItems, ...nextItems];
  pushHistory('PLAYBACK', 'info', `Added ${nextItems.length} file(s) to the V2 browser-local playback queue.`, {
    action: 'v2-playback-drop-queue-add',
    fileCount: nextItems.length,
    mediaKinds: nextItems.map((item) => item.mediaKind),
    productionMutation: false,
  });
  render();

  nextItems.forEach((item, index) => {
    const file = fileArray[index];
    if (item.mediaKind === 'video' && file) {
      hydrateV2VideoDuration(file, item.id);
    }
  });
}

function buildV2PlaybackQueueItem(file: File): V2PlaybackQueueItem {
  const mediaKind = classifyV2PlaybackFile(file);
  const metadata = buildBrowserLocalV2PlaybackMetadata();
  v2PlaybackQueueItemCounter += 1;
  return {
    id: `v2-drop-${v2PlaybackQueueItemCounter}`,
    filename: file.name || `unnamed-${v2PlaybackQueueItemCounter}`,
    mediaKind,
    durationLabel: mediaKind === 'video' ? 'metadata pending' : mediaKind === 'image' ? 'not applicable for image' : 'not playable as media',
    gpsCoordinates: metadata.gpsCoordinates,
    gpsStatus: metadata.gpsStatus,
    address: metadata.address,
    addressStatus: metadata.addressStatus,
    metadataSource: metadata.metadataSource,
    metadataMessage: metadata.metadataMessage,
    backendQueueStatus: mediaKind === 'other' ? 'blocked' : 'local-only',
    backendQueueMessage: mediaKind === 'other'
      ? 'Non-media cannot request backend queue prepare.'
      : 'Not sent to backend yet.',
  };
}

function classifyV2PlaybackFile(file: File): V2PlaybackQueueItem['mediaKind'] {
  const type = String(file.type ?? '').toLowerCase();
  const name = String(file.name ?? '').toLowerCase();
  if (type.startsWith('video/') || /\.(mp4|mov|m4v|webm|avi|mkv)$/i.test(name)) {
    return 'video';
  }
  if (type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|heic|heif|bmp)$/i.test(name)) {
    return 'image';
  }
  return 'other';
}

function prepareV2PlaybackQueueItemForBackend(itemId: string | undefined): void {
  const item = v2PlaybackQueueItems.find((candidate) => candidate.id === itemId) ?? null;
  const bridgeRequest = buildV2PlaybackDropQueueBridgeRequest(item);
  if (bridgeRequest.ok === false) {
    if (item) {
      v2PlaybackQueueItems = v2PlaybackQueueItems.map((candidate) => candidate.id === item.id
        ? { ...candidate, backendQueueStatus: 'blocked', backendQueueMessage: bridgeRequest.message }
        : candidate);
    }
    pushHistory('PLAYBACK', 'warning', bridgeRequest.message, {
      action: 'v2-playback-queue-prepare-item',
      endpoint: bridgeRequest.endpoint.path,
      reason: bridgeRequest.reason,
      backendRequestSent: false,
    });
    render();
    return;
  }

  v2PlaybackQueueItems = v2PlaybackQueueItems.map((candidate) => candidate.id === item?.id
    ? { ...candidate, backendQueueStatus: 'requested', backendQueueMessage: bridgeRequest.message }
    : candidate);
  pushHistory('PLAYBACK', 'info', bridgeRequest.message, {
    action: 'v2-playback-queue-prepare-item',
    endpoint: bridgeRequest.endpoint.path,
    request: bridgeRequest.body,
    backendRequestSent: true,
  });
  runAction('run-b3-5', bridgeRequest.body);
  queueV2RecoveryAutosave('autosave-stage-change');
  render();
}

function hydrateV2VideoDuration(file: File, itemId: string): void {
  if (typeof URL === 'undefined' || typeof document === 'undefined') {
    return;
  }
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'metadata';
  video.onloadedmetadata = () => {
    const duration = Number.isFinite(video.duration) ? video.duration : null;
    URL.revokeObjectURL(objectUrl);
    v2PlaybackQueueItems = v2PlaybackQueueItems.map((item) => item.id === itemId
      ? { ...item, durationLabel: duration == null ? 'duration unavailable' : formatDurationSeconds(duration) }
      : item);
    render();
  };
  video.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    v2PlaybackQueueItems = v2PlaybackQueueItems.map((item) => item.id === itemId
      ? { ...item, durationLabel: 'duration unavailable' }
      : item);
    render();
  };
  video.src = objectUrl;
}

function formatDurationSeconds(seconds: number): string {
  const roundedSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(roundedSeconds / 60);
  const remainder = roundedSeconds % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

function buildCurrentV2RecoverySnapshot(reason: V2RecoveryStateSaveReason) {
  const state = getState();
  const savedAtIso = new Date().toISOString();
  const snapshot = createEmptyV2RecoveryStateSnapshot(savedAtIso, reason);
  const mediaRows = v2PlaybackQueueItems.filter((item) => item.mediaKind === 'image' || item.mediaKind === 'video');
  const preparedRows = mediaRows.filter((item) => ['requested', 'prepared', 'queued', 'success'].includes(String(item.backendQueueStatus ?? '').toLowerCase()));
  const selected = preparedRows[0] ?? mediaRows[0] ?? null;
  const lastStageCompleted = String(state.truth?.lastStageCompleted ?? '');
  snapshot.playback = {
    currentMediaId: selected?.id ?? (state.truth?.currentMedia && typeof state.truth.currentMedia === 'object' ? String((state.truth.currentMedia as Record<string, unknown>).id ?? '') || null : null),
    currentFilename: selected?.filename ?? (state.truth?.currentMedia && typeof state.truth.currentMedia === 'object' ? String((state.truth.currentMedia as Record<string, unknown>).name ?? '') || null : null),
    mediaKind: selected?.mediaKind === 'image' || selected?.mediaKind === 'video' || selected?.mediaKind === 'other' ? selected.mediaKind : 'unknown',
    queueCursorIndex: selected ? Math.max(0, v2PlaybackQueueItems.findIndex((item) => item.id === selected.id)) : null,
    queueLength: mediaRows.length || Number(state.truth?.queueLength ?? 0),
    playbackPositionSeconds: null,
    exactTimestampRequired: false,
  };
  snapshot.queue = {
    source: preparedRows.length > 0 ? 'v2-browser-local-bridge' : mediaRows.length > 0 ? 'v2-browser-local-bridge' : 'unknown',
    preparedMediaCount: preparedRows.length,
    selectedQueueItemId: selected?.id ?? null,
    selectedBackendQueueStatus: selected?.backendQueueStatus ?? null,
  };
  snapshot.pipeline = {
    activeStage: mapV2RecoveryActiveStage(lastStageCompleted),
    stageStatuses: {
      '3A': String(state.statusByKey?.['3A'] ?? 'idle'),
      'B3.1': String(state.statusByKey?.['B3.1'] ?? 'idle'),
      'B3.2': String(state.statusByKey?.['B3.2'] ?? 'idle'),
      'B3.3': String(state.statusByKey?.['B3.3'] ?? 'idle'),
      'B3.4': String(state.statusByKey?.['B3.4'] ?? 'idle'),
      'B3.5': String(state.statusByKey?.['B3.5'] ?? 'idle'),
      B4: String(state.statusByKey?.B4 ?? 'idle'),
      B11: String(state.statusByKey?.B11 ?? 'idle'),
    },
    corruptOrPartialDownloadsExcluded: true,
  };
  snapshot.notes = [
    `${reason} snapshot created by V2 recovery wiring.`,
    'No credentials, cookies, or session file contents are included.',
    'Exact playback timestamp resume is not required; same media/queue context is enough.',
  ];
  return snapshot;
}

function mapV2RecoveryActiveStage(lastStageCompleted: string): 'download' | 'index' | 'gps-parser' | 'geocode' | 'queue' | 'playback' | 'idle' | 'unknown' {
  if (lastStageCompleted === 'B3.1') return 'download';
  if (lastStageCompleted === 'B3.2') return 'index';
  if (lastStageCompleted === 'B3.3') return 'gps-parser';
  if (lastStageCompleted === 'B3.4') return 'geocode';
  if (lastStageCompleted === 'B3.5') return 'queue';
  if (lastStageCompleted === 'B4') return 'playback';
  return lastStageCompleted ? 'unknown' : 'idle';
}

async function runV2RecoverySave(reason: V2RecoveryStateSaveReason, operatorMessage: string | null = null): Promise<void> {
  const snapshot = buildCurrentV2RecoverySnapshot(reason);
  recordV2RecoveryResult('running', 'Save V2 recovery state', V2_RECOVERY_ENDPOINTS.save, 'Saving V2 recovery state...', { snapshot, reason });
  try {
    const result = await saveV2RecoveryStateSnapshot({ snapshot, reason });
    recordV2RecoveryResult('success', 'Save V2 recovery state', V2_RECOVERY_ENDPOINTS.save, String((result.payload as Record<string, unknown>)?.message ?? 'V2 recovery state saved.'), result.payload, result.meta);
    pushHistory('RECOVERY', 'success', operatorMessage ?? 'V2 recovery state saved.', { reason, endpoint: V2_RECOVERY_ENDPOINTS.save.path });
  } catch (error) {
    recordV2RecoveryResult('error', 'Save V2 recovery state', V2_RECOVERY_ENDPOINTS.save, getV2RecoveryErrorMessage('Save V2 recovery state', error), null, (error as any)?.meta ?? null, error);
    pushHistory('RECOVERY', 'error', getV2RecoveryErrorMessage('Save V2 recovery state', error), { reason, endpoint: V2_RECOVERY_ENDPOINTS.save.path });
  }
}

async function runV2RecoveryLoad(): Promise<void> {
  recordV2RecoveryResult('running', 'Load V2 recovery state', V2_RECOVERY_ENDPOINTS.load, 'Loading V2 recovery state...', {});
  try {
    const result = await loadV2RecoveryStateSnapshot();
    const payload = result.payload as Record<string, unknown>;
    recordV2RecoveryResult('success', 'Load V2 recovery state', V2_RECOVERY_ENDPOINTS.load, String(payload?.message ?? 'V2 recovery state loaded.'), payload, result.meta);
    patchState((draft) => {
      draft.v2Recovery = {
        ...(typeof draft.v2Recovery === 'object' && draft.v2Recovery !== null ? draft.v2Recovery as Record<string, unknown> : {}),
        latestLoad: structuredClone(payload),
      };
      const snapshot = payload?.snapshot as Record<string, any> | null;
      if (snapshot?.playback?.currentFilename) {
        draft.truth.lastCheckpoint = `Recovered context: ${snapshot.playback.currentFilename}`;
        draft.truth.playbackStatus = 'Recovery snapshot loaded; same media can be resumed from beginning';
      }
    });
    pushHistory('RECOVERY', payload?.snapshot ? 'success' : 'warning', String(payload?.message ?? 'V2 recovery state loaded.'), { endpoint: V2_RECOVERY_ENDPOINTS.load.path });
  } catch (error) {
    recordV2RecoveryResult('error', 'Load V2 recovery state', V2_RECOVERY_ENDPOINTS.load, getV2RecoveryErrorMessage('Load V2 recovery state', error), null, (error as any)?.meta ?? null, error);
    pushHistory('RECOVERY', 'error', getV2RecoveryErrorMessage('Load V2 recovery state', error), { endpoint: V2_RECOVERY_ENDPOINTS.load.path });
  }
}

function queueV2RecoveryAutosave(reason: V2RecoveryStateSaveReason = 'autosave-stage-change'): void {
  const snapshot = buildCurrentV2RecoverySnapshot(reason);
  void autosaveV2RecoveryStateSnapshot({ snapshot, reason }).then((result) => {
    patchState((draft) => {
      draft.v2Recovery = {
        ...(typeof draft.v2Recovery === 'object' && draft.v2Recovery !== null ? draft.v2Recovery as Record<string, unknown> : {}),
        latestAutosave: structuredClone(result.payload),
      };
      draft.statusByKey.B11 = 'success';
      draft.truth.lastCheckpoint = `V2 recovery autosave: ${snapshot.playback.currentFilename ?? 'no media selected'}`;
    });
  }).catch((error) => {
    pushHistory('RECOVERY', 'warning', getV2RecoveryErrorMessage('Autosave V2 recovery state', error), { endpoint: V2_RECOVERY_ENDPOINTS.autosave.path, autosave: true });
  });
}

function queueV2RecoveryRestartCheck(): void {
  if (v2RecoveryRestartCheckQueued) {
    return;
  }
  v2RecoveryRestartCheckQueued = true;
  void checkV2RecoveryRestartState().then((result) => {
    const payload = result.payload as Record<string, unknown>;
    patchState((draft) => {
      draft.v2Recovery = {
        ...(typeof draft.v2Recovery === 'object' && draft.v2Recovery !== null ? draft.v2Recovery as Record<string, unknown> : {}),
        restartCheck: structuredClone(payload),
      };
    });
    if (payload?.possibleRestartDetected === true) {
      pushHistory('RECOVERY', 'warning', 'Possible restart detected; V2 recovery snapshot is available to load.', { endpoint: V2_RECOVERY_ENDPOINTS.restartCheck.path });
    }
  }).catch((error) => {
    pushHistory('RECOVERY', 'warning', getV2RecoveryErrorMessage('Check V2 recovery restart state', error), { endpoint: V2_RECOVERY_ENDPOINTS.restartCheck.path });
  });
}

function recordV2RecoveryResult(outcome: 'running' | 'success' | 'error', operation: string, endpoint: { method: string; path: string }, message: string, payload: unknown = null, meta: any = null, error: unknown = null): void {
  patchState((draft) => {
    draft.statusByKey.B11 = outcome === 'running' ? 'running' : outcome;
    (draft.initResults as Record<string, unknown>).B11 = {
      operation,
      method: endpoint.method,
      endpoint: endpoint.path,
      outcome,
      receivedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      status: meta?.response?.status ?? (error as any)?.status ?? null,
      message,
      payload: outcome === 'success' ? payload : undefined,
      errorPayload: outcome === 'error' ? ((error as any)?.payload ?? meta?.response?.body ?? null) : undefined,
    };
  });
}

function getV2RecoveryErrorMessage(operation: string, error: unknown): string {
  if (error instanceof Error && error.message) {
    return `${operation} failed: ${error.message}`;
  }
  return `${operation} failed.`;
}

function getHistoryCopyButtonLabel(): string {
  if (historyCopyStatus === 'copied') {
    return 'copied';
  }
  if (historyCopyStatus === 'failed') {
    return 'copy failed';
  }
  return COPY_HISTORY_LABEL;
}

async function copyHistoryToClipboard(): Promise<void> {
  try {
    await copyEventHistoryExportToClipboard(getState().history);
    setHistoryCopyStatus('copied');
  } catch {
    setHistoryCopyStatus('failed');
  }
}

function setHistoryCopyStatus(status: 'idle' | 'copied' | 'failed'): void {
  if (historyCopyResetTimer) {
    clearTimeout(historyCopyResetTimer);
  }
  historyCopyStatus = status;
  render();

  if (status !== 'idle') {
    historyCopyResetTimer = setTimeout(() => {
      historyCopyStatus = 'idle';
      historyCopyResetTimer = null;
      render();
    }, 1600);
  }
}


// Requests browser fullscreen for the selected OS-specific playback stage.
function requestOsPlaybackFullscreen(platform: OsPlaybackPlatform | undefined): void {
  const normalizedPlatform = platform === OS_PLAYBACK_PLATFORMS.raspberry ? OS_PLAYBACK_PLATFORMS.raspberry : OS_PLAYBACK_PLATFORMS.windows;
  window.setTimeout(() => {
    const target = app.querySelector<HTMLElement>(`[data-os-playback-stage="${normalizedPlatform}"]`);
    if (!target || typeof target.requestFullscreen !== 'function') {
      pushHistory('PLAYBACK', 'warning', 'OS playback fullscreen was requested, but the browser did not expose a fullscreen target.', {
        action: 'switch-os-playback-fullscreen',
        platform: normalizedPlatform,
      });
      return;
    }
    void target.requestFullscreen().catch((error) => {
      pushHistory('PLAYBACK', 'warning', 'OS playback fullscreen request was rejected by the browser.', {
        action: 'switch-os-playback-fullscreen',
        platform: normalizedPlatform,
        message: error instanceof Error ? error.message : String(error),
      });
    });
  }, 0);
}

// Requests browser fullscreen for the Windows playback preview stage after rendering updates.
function requestPlaybackFullscreen(): void {
  window.setTimeout(() => {
    const target = app.querySelector<HTMLElement>('[data-playback-rendering-stage="windows"]');
    if (!target || typeof target.requestFullscreen !== 'function') {
      pushHistory('PLAYBACK', 'warning', 'Fullscreen playback was requested, but the browser did not expose a fullscreen target.', {
        action: 'switch-to-fullscreen',
        platform: 'windows',
      });
      return;
    }
    void target.requestFullscreen().catch((error) => {
      pushHistory('PLAYBACK', 'warning', 'Fullscreen playback request was rejected by the browser.', {
        action: 'switch-to-fullscreen',
        platform: 'windows',
        message: error instanceof Error ? error.message : String(error),
      });
    });
  }, 0);
}

// Opens a history detail modal for the selected event-history entry.
function openHistoryModal(index) {
  const state = getState();
  const entry = state.history[Number(index)];
  if (!entry) {
    return;
  }

  const source = typeof entry.source === 'string' ? entry.source : 'History';
  const type = typeof entry.type === 'string' ? entry.type : 'info';
  openModal({
    kind: 'history',
    title: `${source} • ${type.toUpperCase()}`,
    subtitle: entry.message ?? 'History entry details',
    entry,
  });
}

subscribe(render);
render();
// Blocks NEW AUTH controls in Test Mode before they can reach auth endpoints.
function isNewAuthActionDisabledForCurrentMode(action: string | undefined): boolean {
  return dashboardVisualMode === 'test' && typeof action === 'string' && action.startsWith('new-auth-');
}

// Automatically runs View A preloads while keeping NEW AUTH login disabled outside Real Mode.
const tryInitPreload = () => {
  const state = getState();
  if (state.activeView !== 'A') {
    return;
  }
  if (!hasInitPreloadRun) {
    runAction('verify-env');
    runAction('check-db');
    runAction('check-cron');
    hasInitPreloadRun = true;
  }
  if (!hasInitNewAuthPreloadRun && dashboardVisualMode === 'real') {
    runAction('new-auth-check-login');
    hasInitNewAuthPreloadRun = true;
  }
};
tryInitPreload();
startSchedulerRunLogPolling();
startOsPlaybackObservabilityPolling();
startV2WorkerTruthPolling();
void loadBackendVersion();

document.addEventListener('mousemove', handleB5ActivityMouseMove);
document.addEventListener('keydown', handleB5ActivityKeyDown);
document.addEventListener('fullscreenchange', syncOsPlaybackFullscreenStateFromBrowser);
window.addEventListener('beforeunload', () => {
  void saveOsPlaybackResumeCheckpoint(OS_PLAYBACK_PLATFORMS.windows, 'beforeunload');
  void saveOsPlaybackResumeCheckpoint(OS_PLAYBACK_PLATFORMS.raspberry, 'beforeunload');
  queueV2RecoveryAutosave('pre-shutdown');
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && getState().modal) {
    closeModal();
    return;
  }
  const wholeLogicAction = getWholeLogicTestModeKeyboardAction(event.key);
  if (wholeLogicAction) {
    event.preventDefault();
    runAction(wholeLogicAction);
  }
});

// Maps q/w/e/r/t immediate keys to the owned Test Mode whole-logic controller only.
function getWholeLogicTestModeKeyboardAction(key: string): string | null {
  if (dashboardVisualMode !== 'test' || getState().activeView !== 'A') {
    return null;
  }
  const normalizedKey = key.toLowerCase();
  if (!['q', 'w', 'e', 'r', 't'].includes(normalizedKey)) {
    return null;
  }
  return `control-whole-logic-${normalizedKey}`;
}

window.addEventListener('resize', () => {
  hideInspectTooltip();
});

window.addEventListener(
  'scroll',
  () => {
    hideInspectTooltip();
  },
  true,
);

window.addEventListener(TRANSIT_EVENT_NAME, (event) => {
  if (!transitTerminal.consumeRecord((event as CustomEvent)?.detail)) {
    return;
  }
  requestLiveUpdateRender();
});


// Polls actual cron row execution evidence while View A is visible.
function startSchedulerRunLogPolling() {
  window.setInterval(() => {
    const state = getState();
    if (!shouldRunLiveUpdates() || state.activeView !== 'A') {
      return;
    }
    runAction('refresh-scheduler-run-log');
  }, SCHEDULER_RUN_LOG_POLL_MS);
}


// Polls playback observability while an OS playback view is visible.
function startOsPlaybackObservabilityPolling() {
  window.setInterval(() => {
    if (!shouldRunLiveUpdates()) {
      return;
    }
    const platform = getOsPlaybackPlatformForView(getState().activeView);
    if (!platform) {
      return;
    }
    void loadOsPlaybackObservability(platform);
  }, OS_PLAYBACK_OBSERVABILITY_POLL_MS);
}

// Polls V2 worker truth while the V2 operator shell is visible.
function startV2WorkerTruthPolling() {
  window.setInterval(() => {
    if (!shouldRunLiveUpdates() || getState().activeView !== 'V2') {
      return;
    }
    void refreshV2WorkerTruth(v2OperatorSidebarRoute === 'real-playback' ? 'real' : undefined);
  }, V2_WORKER_TRUTH_POLL_MS);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
