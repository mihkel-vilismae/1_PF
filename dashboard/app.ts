/*
 * Renders the dashboard shell and binds browser-side UI interactions.
 * The frontend owns presentation state while backend routes provide runtime truth.
 * This file also displays component versions visible to operators.
 */
import { VIEW_ORDER } from './shared/constants.ts';
import {
  getState,
  changeDatabaseViewerPage,
  closeModal,
  patchState,
  openModal,
  pushHistory,
  resetHistory,
  runAction,
  seedDemoState,
  selectDatabaseViewerTable,
  setActiveView,
  toggleBackendStatusInspectMode,
  toggleInspectMode,
  toggleRealityInspectMode,
  toggleValueInspectMode,
  setLastRunMode,
  setPlaybackRenderingMode,
  setPlaybackRenderingPlatform,
  setSchedulerEditableCrontab,
  setSimulationValue,
  subscribe,
} from './services/runtimeTruth.ts';
import { renderDefinitionList, renderHistory, renderModal } from './services/renderers.ts';
import type { PlaybackRenderingMode, PlaybackRenderingPlatform } from './services/playbackRenderer.ts';
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

const app = document.getElementById('app');
declare const __APP_VERSION__: string;
const TRANSIT_EVENT_NAME = 'dashboard:transit';
const COPY_HISTORY_LABEL = 'copy all log';
type BackendVersionState = {
  status: 'checking' | 'ready' | 'unavailable';
  version: string | null;
  message: string | null;
};

let historyCopyStatus: 'idle' | 'copied' | 'failed' = 'idle';
let historyCopyResetTimer: ReturnType<typeof setTimeout> | null = null;
let backendVersionState: BackendVersionState = {
  status: 'checking',
  version: null,
  message: null,
};
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

// Renders the current dashboard state and the component version badge.
function render() {
  const state = getState();
  const hasLiveTraffic = transitTerminal.hasLiveTraffic();
  const viewMarkup = {
    A: renderInitView(state),
    B: renderTestView(state),
    C: renderLastRunView(state),
    D: renderRunningProcessView(state),
    E: renderDatabaseViewerView(state),
  }[state.activeView];

  document.body.classList.toggle('modal-open', Boolean(state.modal));

  app.innerHTML = `
    ${renderVersionBadge(__APP_VERSION__, backendVersionState)}
    <div class="shell">
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
            <p class="eyebrow">${state.modeBanner}</p>
            <h1>${state.currentViewTitle}</h1>
          </div>
          <div class="topbar__actions">
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
    const response = await fetch('/api/version', { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json() as { version?: unknown };
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

// Binds rendered controls to runtime-truth actions and local state updates.
function bindEvents() {
  app.querySelectorAll<HTMLElement>('[data-view]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.view;
      const label = VIEW_ORDER.find((view) => view.id === id);
      setActiveView(id, `${id} — ${label?.name ?? ''}`);
      if (id === 'C') {
        runAction('refresh-last-run');
      }
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

  app.querySelectorAll<HTMLButtonElement>('[data-playback-rendering-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      const mode = button.dataset.playbackRenderingMode;
      if (mode) {
        setPlaybackRenderingMode(mode as PlaybackRenderingMode);
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
void loadBackendVersion();

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

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
