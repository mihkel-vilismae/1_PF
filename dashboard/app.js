import { VIEW_ORDER } from './shared/constants.js';
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
  setSimulationValue,
  subscribe,
} from './services/runtimeTruth.js';
import { renderDefinitionList, renderHistory, renderModal } from './services/renderers.js';
import { createTransitTerminal } from './services/transitTerminal.js';
import {
  bindBackendStatusInspectMode,
  bindInspectMode,
  bindRealityInspectMode,
  bindValueInspectMode,
} from './inspect/bindInspectModes.js';
import { describeInspectableElement, describeValueElement } from './inspect/controlMetadata.js';
import { createRealityMetadataHelpers } from './inspect/realityMetadata.js';
import { createBackendStatusMetadataHelpers } from './inspect/backendStatusMetadata.js';
import { createGuideTooltipController } from './inspect/tooltipController.js';
import { renderInitView } from './views/initView.js';
import { renderTestView } from './views/testView.js';
import { renderLastRunView } from './views/lastRunView.js';
import { renderRunningProcessView } from './views/runningProcessView.js';
import { renderDatabaseViewerView } from './views/databaseViewerView.js';

const app = document.getElementById('app');
const TRANSIT_EVENT_NAME = 'dashboard:transit';
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
            <button class="button button--ghost" data-action="clear-history">Clear</button>
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

function bindEvents() {
  app.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.view;
      const label = VIEW_ORDER.find((view) => view.id === id);
      setActiveView(id, `${id} — ${label?.name ?? ''}`);
    });
  });

  app.querySelectorAll('[data-log-entry-open]').forEach((entry) => {
    entry.addEventListener('click', () => {
      openLogModal(entry.dataset.logSourceKey, entry.dataset.logEntryIndex);
    });
    entry.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openLogModal(entry.dataset.logSourceKey, entry.dataset.logEntryIndex);
      }
    });
  });

  app.querySelectorAll('[data-history-entry-open]').forEach((entry) => {
    entry.addEventListener('click', () => {
      openHistoryModal(entry.dataset.historyEntryIndex);
    });
    entry.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
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

  app.querySelectorAll('[data-action]').forEach((button) => {
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
      runAction(action);
    });
  });

  app.querySelectorAll('[data-db-table]').forEach((button) => {
    button.addEventListener('click', () => {
      selectDatabaseViewerTable(button.dataset.dbTable);
    });
  });

  app.querySelectorAll('[data-db-page-delta]').forEach((button) => {
    button.addEventListener('click', () => {
      changeDatabaseViewerPage(Number(button.dataset.dbPageDelta || 0));
    });
  });

  app.querySelectorAll('input[name="execution-mode"]').forEach((input) => {
    input.addEventListener('change', (event) => setSimulationValue('executionMode', event.target.value));
  });

  app.querySelectorAll('input[name="input-mode"]').forEach((input) => {
    input.addEventListener('change', (event) => setSimulationValue('inputMode', event.target.value));
  });

  ['pirEnabled', 'mouseEnabled', 'keyboardEnabled', 'simulateAllEnabled'].forEach((name) => {
    app.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
      input.addEventListener('change', (event) => {
        const checked = event.target.checked;
        setSimulationValue(name, checked);
        pushHistory('SCREEN', 'info', `${name} changed to ${checked ? 'enabled' : 'disabled'}.`, {
          setting: name,
          enabled: checked,
        });
      });
    });
  });

  app.querySelectorAll('input[name="inactivityTimeoutSeconds"]').forEach((input) => {
    input.addEventListener('change', (event) => {
      const value = Number(event.target.value || 5);
      setSimulationValue('inactivityTimeoutSeconds', value);
      pushHistory('SCREEN', 'info', `Inactivity timeout changed to ${value} seconds.`, {
        setting: 'inactivityTimeoutSeconds',
        seconds: value,
      });
    });
  });

  app.querySelectorAll('[data-last-run-mode]').forEach((button) => {
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

function openLogModal(sourceKey, index) {
  const state = getState();
  const sourceLogs = state.logs[sourceKey] ?? [];
  const entry = sourceLogs[Number(index)];
  if (!entry) {
    return;
  }

  const type = entry.type ?? 'info';
  openModal({
    kind: 'log',
    title: `${sourceKey} log • ${type.toUpperCase()}`,
    subtitle: entry.message ?? 'Log entry details',
    entry: {
      ...entry,
      sourceKey,
    },
  });
}

function openHistoryModal(index) {
  const state = getState();
  const entry = state.history[Number(index)];
  if (!entry) {
    return;
  }

  openModal({
    kind: 'history',
    title: `${entry.source} • ${(entry.type ?? 'info').toUpperCase()}`,
    subtitle: entry.message ?? 'History entry details',
    entry,
  });
}

subscribe(render);
render();

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
  if (!transitTerminal.consumeRecord(event?.detail)) {
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
