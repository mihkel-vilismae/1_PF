/*
 * Renders the dashboard shell and binds browser-side UI interactions.
 * The frontend owns presentation state while backend routes provide runtime truth.
 * This file also displays component versions visible to operators.
 * The startup mode gate also tags backend calls so Test Mode uses test storage.
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
import { buildOsPlaybackViewModel, OS_PLAYBACK_PLATFORMS, type OsPlaybackPlatform, type PlaybackLogEntryViewModel } from './services/osPlaybackViewModel.ts';
import { requestJson, setDashboardRuntimeMode } from './services/apiClient.ts';

const app = document.getElementById('app');
declare const __APP_VERSION__: string;
type DashboardVisualMode = 'test' | 'real';
const TRANSIT_EVENT_NAME = 'dashboard:transit';
const COPY_HISTORY_LABEL = 'copy all log';
const SCHEDULER_RUN_LOG_POLL_MS = 5000;
const OS_PLAYBACK_OBSERVABILITY_POLL_MS = 5000;
const OS_PLAYBACK_ROTATION_INTERVAL_SECONDS = 12;
let dashboardVisualMode: DashboardVisualMode | null = null;
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
}

// Records keyboard input only while the View B/B5 activity test window is active.
function handleB5ActivityKeyDown(): void {
  const activityState = getState().simulation?.b5ActivityDetection as { phase?: string; selectedSources?: Record<string, boolean> } | undefined;
  if (activityState?.phase === 'detecting' && activityState?.selectedSources?.keyboard) {
    markB5ActivityDetected('keyboard');
  }
}

// Renders the current dashboard state and the component version badge.
function render() {
  const state = getState();
  const hasLiveTraffic = transitTerminal.hasLiveTraffic();
  const viewMarkup = {
    A: renderInitView(state),
    B: renderTestView(state, dashboardVisualMode),
    C: renderLastRunView(state),
    D: renderRunningProcessView(state),
    E: renderDatabaseViewerView(state),
    WIN: renderOsPlaybackView(state, OS_PLAYBACK_PLATFORMS.windows),
    RPI: renderOsPlaybackView(state, OS_PLAYBACK_PLATFORMS.raspberry),
  }[state.activeView] ?? renderInitView(state);

  document.body.classList.toggle('modal-open', Boolean(state.modal) || dashboardVisualMode === null);
  document.body.classList.toggle('show-marked-for-removal', Boolean(state.showMarkedForRemoval));
  applyDashboardVisualModeClass(dashboardVisualMode);

  // Compute a visible banner for the current visual mode. When a visual mode has
  // been selected, override the lengthy default mode banner with a concise
  // indicator so operators can immediately see whether they are in Test Mode or
  // Real Mode. Fall back to the default dashboard banner when the mode is
  // unselected.
  const visualModeBanner = dashboardVisualMode === null
    ? state.modeBanner
    : dashboardVisualMode === 'test'
      ? 'Test Mode'
      : 'Real Mode';

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

        <article class="side-panel side-panel--history">
          <div class="side-panel__header">
            <h2>Event history</h2>
            <div class="side-panel__actions">
              <button class="button button--ghost" data-action="copy-history">${getHistoryCopyButtonLabel()}</button>
              <button class="button button--ghost" data-action="clear-history">Clear</button>
            </div>
          </div>
          <div class="history-surface">${renderHistory(state.history)}</div>
        </article>
      </aside>

      <main class="main-panel">
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
          <div class="log-surface history-surface">
            <pre class="modal-panel__json">${escapeHtml(transitTerminal.renderLines())}</pre>
          </div>
        </article>
      </main>
    </div>
    ${renderModal(state.modal)}
    ${renderOsPlaybackFullscreenOverlay(state)}
  `;

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
          Select an operating mode before entering the dashboard. Test Mode routes runtime/database/log actions to isolated test storage; Real Mode uses the real configured runtime storage.
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
  render();
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
  scheduleOsPlaybackRotation(platform);
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
function readOsPlaybackRotation(platform: OsPlaybackPlatform): { activeIndex: number; paused: boolean; nextRotationAtIso: string | null } {
  const rotation = (getState().osPlaybackRotation as Record<string, Record<string, unknown>> | undefined)?.[platform] ?? {};
  return {
    activeIndex: Number(rotation.activeIndex ?? 0),
    paused: rotation.paused !== false,
    nextRotationAtIso: typeof rotation.nextRotationAtIso === 'string' ? rotation.nextRotationAtIso : null,
  };
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
}

// Binds rendered controls to runtime-truth actions and local state updates.
function bindEvents() {
  app.querySelectorAll<HTMLButtonElement>('[data-dashboard-visual-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      const selectedMode = button.dataset.dashboardVisualMode === 'real' ? 'real' : 'test';
      dashboardVisualMode = selectedMode;
      setDashboardRuntimeMode(selectedMode);
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
        runAction('verify-env');
        runAction('check-db');
        runAction('check-cron');
        runAction('new-auth-check-login');
      } else if (id === 'C') {
        runAction('refresh-last-run');
      } else if (id === 'D') {
        runAction('refresh-running-process');
      }
      const osPlaybackPlatform = getOsPlaybackPlatformForView(id);
      if (osPlaybackPlatform) {
        void loadOsPlaybackContract(osPlaybackPlatform);
        void loadOsPlaybackObservability(osPlaybackPlatform);
      }
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
      if (action === 'install-crontab') {
        const input = app.querySelector<HTMLTextAreaElement>('[data-scheduler-crontab-input]');
        if (input) {
          setSchedulerEditableCrontab(input.value);
        }
        runAction(action);
        return;
      }
      runAction(action);
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
  return viewModel.mainLog;
}

// Narrows terminal kind values to supported OS playback panels.
function normalizeOsTerminalKind(value: unknown): string {
  return value === 'scheduler' || value === 'error' ? value : 'main';
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
// Automatically run safe read‑only status preloads the first time View A is active.
let hasInitPreloadRun = false;
const tryInitPreload = () => {
  const state = getState();
  if (!hasInitPreloadRun && state.activeView === 'A') {
    runAction('verify-env');
    runAction('check-db');
    runAction('check-cron');
    runAction('new-auth-check-login');
    hasInitPreloadRun = true;
  }
};
tryInitPreload();
startSchedulerRunLogPolling();
startOsPlaybackObservabilityPolling();
void loadBackendVersion();

document.addEventListener('mousemove', handleB5ActivityMouseMove);
document.addEventListener('keydown', handleB5ActivityKeyDown);
document.addEventListener('fullscreenchange', syncOsPlaybackFullscreenStateFromBrowser);

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && getState().modal) {
    closeModal();
  }
});

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
  render();
});


// Polls actual cron row execution evidence while View A is visible.
function startSchedulerRunLogPolling() {
  window.setInterval(() => {
    const state = getState();
    if (state.activeView !== 'A') {
      return;
    }
    runAction('refresh-scheduler-run-log');
  }, SCHEDULER_RUN_LOG_POLL_MS);
}


// Polls playback observability while an OS playback view is visible.
function startOsPlaybackObservabilityPolling() {
  window.setInterval(() => {
    const platform = getOsPlaybackPlatformForView(getState().activeView);
    if (!platform) {
      return;
    }
    void loadOsPlaybackObservability(platform);
  }, OS_PLAYBACK_OBSERVABILITY_POLL_MS);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
