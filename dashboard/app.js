import { VIEW_ORDER } from './shared/constants.js';
import {
  getState,
  closeModal,
  patchState,
  openModal,
  pushHistory,
  resetHistory,
  runAction,
  seedDemoState,
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
import { renderInitView } from './views/initView.js';
import { renderTestView } from './views/testView.js';
import { renderLastRunView } from './views/lastRunView.js';
import { renderRunningProcessView } from './views/runningProcessView.js';

const app = document.getElementById('app');
const TRANSIT_EVENT_NAME = 'dashboard:transit';
const MAX_TRANSIT_LINES = 120;
const transitLines = [];
let transitHasLiveTraffic = false;
const INSPECTABLE_SELECTOR = [
  '.nav-link',
  '.button',
  '.toggle-card',
  '.selector-option',
  '.field-label',
  '[data-log-entry-open]',
  '[data-history-entry-open]',
].join(', ');
const VALUE_INSPECTABLE_SELECTOR = [
  '.topbar h1',
  '.definition-row dd',
  '.status-badge',
  '.result-surface .mini-badge',
  '.result-message',
  '.result-json',
  '.log-entry__message',
  '.log-entry__meta > span:first-child',
  '.log-entry__status-chip > span:first-child',
  '.history-item__message',
  '.history-item__meta > span:first-child',
  '.history-item__status-chip > span:first-child',
  '.preview-frame__bar .screen-indicator',
  '.preview-frame__content strong',
  '.preview-frame__content span',
  '.preview-frame__content small',
  '.worker-row__main span',
  '.worker-row__meta .mini-badge',
  '.worker-row__meta > span:last-child',
  '.notice',
  '.modal-panel__subtitle',
  '.modal-panel__json',
].join(', ');
const REALITY_INSPECTABLE_SELECTOR = [
  '.nav-link',
  '.button',
  '.hero-pill',
  '.pill',
  '.status-badge',
  '.notice',
  '.result-surface',
  '.definition-row',
  '.preview-frame',
  '.screen-indicator',
  '.worker-row',
  '[data-log-entry-open]',
  '[data-history-entry-open]',
].join(', ');
const BACKEND_STATUS_INSPECTABLE_SELECTOR = [
  '.button',
  '.hero-pill',
  '.pill',
  '.status-badge',
  '.notice',
  '.result-surface',
  '.definition-row',
  '.preview-frame',
  '.screen-indicator',
  '.worker-row',
  '[data-log-entry-open]',
  '[data-history-entry-open]',
].join(', ');
const REALITY_STATE_TITLES = {
  real: 'Real',
  mock: 'Mock',
  mixed: 'Mixed',
  unknown: 'Unknown',
};
const BACKEND_STATUS_TITLES = {
  real: 'Real',
  mock: 'Mock',
  missing: 'Missing',
  unknown: 'Unknown',
};
const INIT_ACTION_TO_CODE = {
  'verify-env': '1A',
  'check-db': '2A',
  'inspect-db': '2A',
  'delete-db': '2A',
  'recreate-db': '2A',
  'install-cron': '3A',
  'check-cron': '3A',
  'print-cron': '3A',
};
const ACTION_INSPECT_COPY = {
  'toggle-inspect-mode': {
    label: 'Explain controls mode',
    description: 'Highlights every interactive control and shows a tooltip that explains what it does when you hover or focus it.',
  },
  'toggle-value-inspect-mode': {
    label: 'Explain values mode',
    description: 'Highlights live values and shows a tooltip that explains where each value comes from.',
  },
  'toggle-reality-inspect-mode': {
    label: 'Show real vs mock mode',
    description: 'Highlights the current view by implementation truth so real wiring, mock behavior, and mixed areas are easy to spot.',
  },
  'toggle-backend-status-inspect-mode': {
    label: 'Show backend status mode',
    description: 'Highlights whether a section is backed by a real backend, frontend-only mock behavior, or missing backend support.',
  },
  'clear-history': {
    label: 'Clear event history',
    description: 'Removes the sidebar event history list and replaces it with a fresh "History cleared" entry.',
  },
  'verify-env': {
    label: 'Verify .env',
    description: 'Calls the init endpoint that checks whether the required environment variables and config keys are present.',
  },
  'check-db': {
    label: 'Check database status',
    description: 'Requests a database health/status summary without modifying the SQLite file.',
  },
  'inspect-db': {
    label: 'Inspect database',
    description: 'Fetches a deeper inspection payload for the configured SQLite database so the operator can review its current state.',
  },
  'delete-db': {
    label: 'Delete database',
    description: 'Deletes the configured SQLite database and related sidecar files after a confirmation prompt.',
  },
  'recreate-db': {
    label: 'Recreate database',
    description: 'Deletes the current SQLite file if needed and recreates it as a clean empty database after confirmation.',
  },
  'install-cron': {
    label: 'Install scheduler',
    description: 'Installs or updates the platform scheduler target used by the repo-local scheduler host.',
  },
  'check-cron': {
    label: 'Check scheduler',
    description: 'Reads scheduler status so the operator can verify whether the scheduled job is present and healthy.',
  },
  'print-cron': {
    label: 'Print scheduler',
    description: 'Prints the scheduler/task definition details returned by the backend for inspection.',
  },
  'run-b1': {
    label: 'Run login flow',
    description: 'Simulates the B1 login sequence through credentials, required file preparation, and placeholder 2FA.',
  },
  'run-b2': {
    label: 'Download 5 files',
    description: 'Runs the quick B2 test action that simulates downloading a small batch of files.',
  },
  'run-b3-auto': {
    label: 'Run all pipeline stages',
    description: 'Runs B3.1 through B3.5 in sequence using the current execution-mode controls.',
  },
  'run-b3-1': {
    label: 'Run mock download',
    description: 'Executes the mock download stage that reads from the generated test data folder.',
  },
  'run-b3-2': {
    label: 'Run index stage',
    description: 'Simulates the index stage that would register discovered files into the pipeline.',
  },
  'run-b3-3': {
    label: 'Run GPS parsing',
    description: 'Simulates GPS extraction for indexed media in the staged pipeline.',
  },
  'run-b3-4': {
    label: 'Run geocode stage',
    description: 'Simulates converting coordinates into readable location data for the queued asset.',
  },
  'run-b3-5': {
    label: 'Enqueue playback',
    description: 'Simulates the queue stage that creates a playable media item for the playback preview.',
  },
  'run-b4': {
    label: 'Run playback emulation',
    description: 'Starts the B4 preview so the currently queued media is shown in the operator-facing playback frame.',
  },
  'resume-last-run': {
    label: 'Resume from saved state',
    description: 'Triggers the placeholder recovery action that stands in for a future resume-from-checkpoint flow.',
  },
  'start-real-run': {
    label: 'Start simulated runtime preview',
    description: 'Activates the D-view worker preview so the pipeline, playback, and screen monitor cards begin updating.',
  },
};
const LAST_RUN_MODE_INSPECT_COPY = {
  none: {
    label: 'Show no-run demo',
    description: 'Switches the recovery panel to the empty state where no saved run is available.',
  },
  error: {
    label: 'Show error demo',
    description: 'Switches the recovery panel to an error state that mimics a failed source-of-truth read.',
  },
  ready: {
    label: 'Show ready demo',
    description: 'Loads the seeded last-run demo so the recovery layout shows realistic saved-run data.',
  },
};
const CURRENT_TRUTH_VALUE_SOURCES = {
  'Source of truth': 'state.truth.sourceOfTruth, updated whenever the shared truth snapshot is replaced or reseeded.',
  'Queue length': 'state.truth.queueLength, updated by queue-stage actions and demo-state seeding.',
  'Current media': 'state.truth.currentMedia, populated when media is queued or demo state is loaded.',
  'Playback status': 'state.truth.playbackStatus, updated by playback runs, screen simulation, and demo seeding.',
  'Screen state': 'state.truth.screenState, updated by screen-simulation toggles and runtime preview state changes.',
  'Last activity': 'state.truth.lastActivitySource, derived from the currently enabled simulated activity inputs.',
  Timeout: 'state.truth.inactivityTimeoutSeconds, updated from the B5 inactivity timeout input.',
  'Last checkpoint': 'state.truth.lastCheckpoint, updated by playback and screen checkpoint events.',
  'Last stage': 'state.truth.lastStageCompleted, updated when pipeline stages complete.',
  'Stage lock': 'state.truth.stageLock, updated when pipeline lock ownership changes.',
  'Playback lock': 'state.truth.playbackLock, updated when playback emulation or runtime preview acquires the worker lock.',
  'Screen lock': 'state.truth.screenLock, updated when the simulated runtime preview acquires the screen worker lock.',
};
const ACTION_REALITY_COPY = {
  'toggle-inspect-mode': {
    state: 'real',
    reason: 'Implemented dashboard-shell guide button that explains interactive controls.',
  },
  'toggle-value-inspect-mode': {
    state: 'real',
    reason: 'Implemented dashboard-shell guide button that explains where live values come from.',
  },
  'toggle-reality-inspect-mode': {
    state: 'real',
    reason: 'Implemented dashboard-shell guide button that classifies UI elements by implementation truth.',
  },
  'clear-history': {
    state: 'real',
    reason: 'Implemented local UI action that really clears the sidebar history list.',
  },
  'verify-env': {
    state: 'real',
    reason: 'Calls the live `/api/init/verify-env` backend endpoint.',
  },
  'check-db': {
    state: 'real',
    reason: 'Calls the live `/api/init/database/status` backend endpoint.',
  },
  'inspect-db': {
    state: 'real',
    reason: 'Calls the live `/api/init/database/inspect` backend endpoint.',
  },
  'delete-db': {
    state: 'real',
    reason: 'Calls the live destructive backend path for deleting the configured SQLite database.',
  },
  'recreate-db': {
    state: 'real',
    reason: 'Calls the live backend path that recreates the SQLite database file.',
  },
  'install-cron': {
    state: 'real',
    reason: 'Calls the live scheduler-install backend endpoint.',
  },
  'check-cron': {
    state: 'real',
    reason: 'Calls the live scheduler-status backend endpoint.',
  },
  'print-cron': {
    state: 'real',
    reason: 'Calls the live scheduler-print backend endpoint.',
  },
  'run-b1': {
    state: 'mock',
    reason: 'Runs a frontend-only simulated login flow; there is no live auth backend in this view.',
  },
  'run-b2': {
    state: 'mock',
    reason: 'Runs a simulated batch download action in the demo test view.',
  },
  'run-b3-1': {
    state: 'mock',
    reason: 'Runs the explicit mock-download stage backed by generated test data.',
  },
  'run-b3-2': {
    state: 'mock',
    reason: 'Runs a simulated index stage; no live backend pipeline wiring exists here yet.',
  },
  'run-b3-3': {
    state: 'mock',
    reason: 'Runs a simulated GPS parsing stage; no live backend pipeline wiring exists here yet.',
  },
  'run-b3-4': {
    state: 'mock',
    reason: 'Runs a simulated geocode stage; no live backend pipeline wiring exists here yet.',
  },
  'run-b3-5': {
    state: 'mock',
    reason: 'Runs a simulated queue stage in the frontend-only test workflow.',
  },
  'run-b3-auto': {
    state: 'mock',
    reason: 'Runs the full B3 sequence as a frontend-only simulated pipeline.',
  },
  'run-b4': {
    state: 'mock',
    reason: 'Starts the playback emulation preview rather than a real media playback engine.',
  },
  'resume-last-run': {
    state: 'mock',
    reason: 'Triggers a placeholder recovery action; no live runtime restore endpoint exists yet.',
  },
  'start-real-run': {
    state: 'mock',
    reason: 'Starts a simulated runtime preview; it does not launch the real runtime workers.',
  },
};
const VIEW_REALITY_COPY = {
  A: {
    state: 'mixed',
    reason: 'The Init view has real backend wiring for its main actions, but it still lives inside a hybrid dashboard shell with local UI state.',
  },
  B: {
    state: 'mock',
    reason: 'The Test view is explicitly simulation-only in the current repo.',
  },
  C: {
    state: 'mock',
    reason: 'The Last Run view currently uses seeded demo state and placeholder recovery behavior.',
  },
  D: {
    state: 'mock',
    reason: 'The Running Process view is a frontend-only runtime preview in the current repo.',
  },
};
const ACTION_BACKEND_STATUS_COPY = {
  'toggle-inspect-mode': {
    state: 'unknown',
    reason: 'Local UI guide button; it does not represent backend wiring status.',
  },
  'toggle-value-inspect-mode': {
    state: 'unknown',
    reason: 'Local UI guide button; it does not represent backend wiring status.',
  },
  'toggle-reality-inspect-mode': {
    state: 'unknown',
    reason: 'Local UI guide button; it does not represent backend wiring status.',
  },
  'toggle-backend-status-inspect-mode': {
    state: 'unknown',
    reason: 'Local UI guide button; it does not represent backend wiring status.',
  },
  'clear-history': {
    state: 'unknown',
    reason: 'Implemented local UI action; it is not a backend-backed operation.',
  },
  'run-b1': {
    state: 'missing',
    reason: 'This flow is simulated in the frontend, while the planned backend test/login endpoint is not implemented here.',
  },
  'run-b2': {
    state: 'missing',
    reason: 'This button simulates download behavior, but no real backend test-download endpoint is implemented here.',
  },
  'run-b3-auto': {
    state: 'missing',
    reason: 'This auto pipeline is frontend-driven because the planned backend stage endpoints are not implemented here.',
  },
  'run-b3-1': {
    state: 'mock',
    reason: 'This is the explicit mock-download stage backed by generated test data rather than a real backend.',
  },
  'run-b3-2': {
    state: 'missing',
    reason: 'This stage is meant to be backend-backed later, but currently no real endpoint/response exists here.',
  },
  'run-b3-3': {
    state: 'missing',
    reason: 'This stage is meant to be backend-backed later, but currently no real endpoint/response exists here.',
  },
  'run-b3-4': {
    state: 'missing',
    reason: 'This stage is meant to be backend-backed later, but currently no real endpoint/response exists here.',
  },
  'run-b3-5': {
    state: 'missing',
    reason: 'This queue stage is simulated because no real backend queue/playback endpoint is implemented here.',
  },
  'run-b4': {
    state: 'missing',
    reason: 'This playback action is a frontend emulation because no real backend playback service/endpoint is implemented here.',
  },
  'resume-last-run': {
    state: 'missing',
    reason: 'The UI exposes a placeholder restore action, but the real runtime restore backend is not implemented here.',
  },
  'start-real-run': {
    state: 'missing',
    reason: 'This starts a simulated runtime preview because the real runtime backend/worker API is not implemented here.',
  },
};

let inspectTooltipElement;
let inspectTooltipEyebrowElement;
let inspectTooltipTitleElement;
let inspectTooltipBodyElement;
let activeInspectTarget = null;

const placeholderLines = [
  '[PLACEHOLDER] boot: transit terminal is not wired yet',
  '$ tail -f dashboard-transit.log',
  '00:00:01 OUT GET /api/init/verify-env body=no',
  '00:00:01 IN  200 OK  GET /api/init/verify-env',
  '00:00:05 OUT GET /api/init/database/status body=no',
  '00:00:05 IN  404 ERR GET /api/init/database/status',
  '[PLACEHOLDER] replace this feed with live gateway traffic',
];

function render() {
  const state = getState();
  const viewMarkup = {
    A: renderInitView(state),
    B: renderTestView(state),
    C: renderLastRunView(state),
    D: renderRunningProcessView(state),
  }[state.activeView];

  document.body.classList.toggle('modal-open', Boolean(state.modal));

  app.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand-card">
          <p class="eyebrow">Photo frame operator workspace</p>
          <h1>Control Dashboard</h1>
          <p class="brand-copy">A higher-clarity dashboard where A now calls documented init endpoints, while B, C, and D still preserve their explicit prototype/runtime separation.</p>
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
            <span class="pill">A wired, B-D simulated</span>
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
            <span class="pill">${transitHasLiveTraffic ? 'Live gateway traffic' : 'Placeholder'}</span>
          </header>
          <p class="card__copy">${transitHasLiveTraffic ? 'All dashboard outbound/inbound API traffic is routed through a single gateway and mirrored here.' : 'PLACEHOLDER: random-looking terminal output. Live gateway traffic will appear after the first request is made.'}</p>
          <div class="log-surface history-surface">
            <pre class="modal-panel__json">${escapeHtml(renderTransitTerminalLines())}</pre>
          </div>
        </article>
      </main>
    </div>
    ${renderModal(state.modal)}
  `;

  hideInspectTooltip();
  bindEvents();
  bindInspectMode(state.inspectMode);
  bindValueInspectMode(state.valueInspectMode);
  bindRealityInspectMode(state.realityInspectMode);
  bindBackendStatusInspectMode(state.backendStatusInspectMode);
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

function bindInspectMode(enabled) {
  const inspectables = Array.from(app.querySelectorAll(INSPECTABLE_SELECTOR));

  inspectables.forEach((element, index) => {
    const meta = describeInspectableElement(element);
    if (!meta) {
      return;
    }

    element.classList.add('inspectable-control');
    element.dataset.inspectIndex = String(index + 1);
    element.dataset.inspectLabel = meta.label;
    element.dataset.inspectDescription = meta.description;
    element.addEventListener('mouseenter', handleInspectEnter);
    element.addEventListener('mouseleave', handleInspectLeave);
    element.addEventListener('focus', handleInspectEnter);
    element.addEventListener('blur', handleInspectLeave);
  });

  document.body.classList.toggle('inspect-mode', Boolean(enabled));
  if (!enabled) {
    hideInspectTooltip();
  }
}

function bindValueInspectMode(enabled) {
  const valueElements = Array.from(app.querySelectorAll(VALUE_INSPECTABLE_SELECTOR));

  valueElements.forEach((element) => {
    const meta = describeValueElement(element);
    if (!meta) {
      return;
    }

    element.classList.add('value-inspectable');
    element.dataset.valueLabel = meta.label;
    element.dataset.valueDescription = meta.description;
    element.addEventListener('mouseenter', handleValueInspectEnter);
    element.addEventListener('mouseleave', handleInspectLeave);
    element.addEventListener('focus', handleValueInspectEnter);
    element.addEventListener('blur', handleInspectLeave);

    if (enabled && !isNaturallyFocusable(element) && !element.hasAttribute('tabindex')) {
      element.dataset.valueGuideTabindexAdded = 'true';
      element.tabIndex = 0;
    }

    if (!enabled && element.dataset.valueGuideTabindexAdded === 'true') {
      element.removeAttribute('tabindex');
      delete element.dataset.valueGuideTabindexAdded;
    }
  });

  document.body.classList.toggle('value-inspect-mode', Boolean(enabled));
  if (!enabled) {
    hideInspectTooltip();
  }
}

function bindRealityInspectMode(enabled) {
  const realityElements = Array.from(app.querySelectorAll(REALITY_INSPECTABLE_SELECTOR));

  realityElements.forEach((element) => {
    const meta = describeRealityElement(element);
    if (!meta) {
      return;
    }

    element.classList.add('reality-inspectable');
    element.dataset.realityState = meta.state;
    element.dataset.realityLabel = meta.label;
    element.dataset.realityDescription = meta.description;
    element.addEventListener('mouseenter', handleRealityInspectEnter);
    element.addEventListener('mouseleave', handleInspectLeave);
    element.addEventListener('focus', handleRealityInspectEnter);
    element.addEventListener('blur', handleInspectLeave);

    if (enabled && !isNaturallyFocusable(element) && !element.hasAttribute('tabindex')) {
      element.dataset.realityGuideTabindexAdded = 'true';
      element.tabIndex = 0;
    }

    if (!enabled && element.dataset.realityGuideTabindexAdded === 'true') {
      element.removeAttribute('tabindex');
      delete element.dataset.realityGuideTabindexAdded;
    }
  });

  document.body.classList.toggle('reality-inspect-mode', Boolean(enabled));
  if (!enabled) {
    hideInspectTooltip();
  }
}

function bindBackendStatusInspectMode(enabled) {
  const backendStatusElements = Array.from(app.querySelectorAll(BACKEND_STATUS_INSPECTABLE_SELECTOR));

  backendStatusElements.forEach((element) => {
    const meta = describeBackendStatusElement(element);
    if (!meta) {
      return;
    }

    element.classList.add('backend-status-inspectable');
    element.dataset.backendStatusState = meta.state;
    element.dataset.backendStatusLabel = meta.label;
    element.dataset.backendStatusDescription = meta.description;
    element.addEventListener('mouseenter', handleBackendStatusInspectEnter);
    element.addEventListener('mouseleave', handleInspectLeave);
    element.addEventListener('focus', handleBackendStatusInspectEnter);
    element.addEventListener('blur', handleInspectLeave);

    if (enabled && !isNaturallyFocusable(element) && !element.hasAttribute('tabindex')) {
      element.dataset.backendStatusGuideTabindexAdded = 'true';
      element.tabIndex = 0;
    }

    if (!enabled && element.dataset.backendStatusGuideTabindexAdded === 'true') {
      element.removeAttribute('tabindex');
      delete element.dataset.backendStatusGuideTabindexAdded;
    }
  });

  document.body.classList.toggle('backend-status-inspect-mode', Boolean(enabled));
  if (!enabled) {
    hideInspectTooltip();
  }
}

function isNaturallyFocusable(element) {
  return element.matches('button, a[href], input, select, textarea, summary, [tabindex]:not([tabindex="-1"])');
}

function describeRealityElement(element) {
  if (element.matches('.nav-link')) {
    return describeViewReality(element.dataset.view);
  }

  if (element.matches('.button')) {
    return describeButtonReality(element);
  }

  if (element.matches('.hero-pill')) {
    return describeHeroPillReality(element);
  }

  if (element.matches('.pill')) {
    return describePillReality(element);
  }

  if (element.matches('.status-badge')) {
    return describeStatusBadgeReality(element);
  }

  if (element.matches('.result-surface')) {
    return describeResultSurfaceReality(element);
  }

  if (element.matches('.definition-row')) {
    return describeDefinitionRealityRow(element);
  }

  if (element.matches('.preview-frame')) {
    return buildRealityMeta('mock', 'Playback preview surface', 'Frontend-only playback emulation panel; it does not represent a real media playback engine.');
  }

  if (element.matches('.screen-indicator')) {
    return buildRealityMeta(
      'mock',
      compactWhitespace(element.textContent) || 'Preview indicator',
      'Derived from simulated B4/B5 preview state rather than live screen hardware state.',
    );
  }

  if (element.matches('.worker-row')) {
    const stageName = compactWhitespace(element.querySelector('.worker-row__main strong')?.textContent) || 'Runtime worker';
    return buildRealityMeta('mock', `${stageName} worker row`, 'Frontend-only runtime preview row; no live worker process data is wired yet.');
  }

  if (element.matches('.notice')) {
    return describeNoticeReality(element);
  }

  if (element.matches('[data-log-entry-open]')) {
    return describeLogReality(element);
  }

  if (element.matches('[data-history-entry-open]')) {
    return describeHistoryReality(element);
  }

  return null;
}

function describeViewReality(viewId) {
  const view = VIEW_ORDER.find((entry) => entry.id === viewId);
  const meta = VIEW_REALITY_COPY[viewId];
  if (!view || !meta) {
    return buildRealityMeta('unknown', `Open view ${viewId ?? 'unknown'}`, 'No explicit real/mock classification metadata is defined for this navigation target yet.');
  }

  return buildRealityMeta(meta.state, `Open ${view.id} - ${view.name}`, meta.reason);
}

function describeButtonReality(element) {
  const label = compactWhitespace(element.textContent) || 'Button';
  const action = element.dataset.action;

  if (action && ACTION_REALITY_COPY[action]) {
    const meta = ACTION_REALITY_COPY[action];
    return buildRealityMeta(meta.state, label, meta.reason);
  }

  if (element.dataset.lastRunMode) {
    return buildRealityMeta('mock', label, 'Switches the C-view demo state; it does not call a live recovery or runtime endpoint.');
  }

  if (element.hasAttribute('data-modal-close')) {
    return buildRealityMeta('real', label, 'Implemented local UI action that closes the details modal.');
  }

  return buildRealityMeta('unknown', label, 'No explicit real/mock classification metadata is defined for this button yet.');
}

function describeHeroPillReality(element) {
  const label = compactWhitespace(element.textContent) || 'Hero pill';
  const text = label.toLowerCase();

  if (text.includes('backend contract wired')) {
    return buildRealityMeta('real', label, 'This statement reflects live backend wiring that already exists for View A init actions.');
  }
  if (text.includes('backend still required')) {
    return buildRealityMeta('mixed', label, 'View A has real endpoint wiring, but the broader dashboard is still only partially implemented.');
  }
  if (text.includes('simulation only') || text.includes('mock stage')) {
    return buildRealityMeta('mock', label, 'This view is intentionally documented as simulation-only in the current repo.');
  }
  if (text.includes('preview active') || text.includes('preview inactive')) {
    return buildRealityMeta('mock', label, 'This pill describes the frontend-only runtime preview, not a live runtime process.');
  }

  return buildRealityMeta('unknown', label, 'No explicit real/mock classification metadata is defined for this hero pill yet.');
}

function describePillReality(element) {
  const label = compactWhitespace(element.textContent) || 'Pill';
  const text = label.toLowerCase();

  if (text.includes('a wired') && text.includes('simulated')) {
    return buildRealityMeta('mixed', label, 'This summary intentionally describes a hybrid dashboard where View A is wired and Views B-D remain simulated.');
  }
  if (text.includes('live gateway traffic')) {
    return buildRealityMeta('real', label, 'The transit terminal is currently showing real gateway events produced by dashboard API traffic.');
  }
  if (text.includes('placeholder')) {
    return buildRealityMeta('mock', label, 'This panel is currently presenting placeholder output rather than live data.');
  }

  return buildRealityMeta('unknown', label, 'No explicit real/mock classification metadata is defined for this pill yet.');
}

function describeStatusBadgeReality(element) {
  const cardContext = getCardContext(element);
  if (!cardContext?.code) {
    return buildRealityMeta('unknown', compactWhitespace(element.textContent) || 'Status badge', 'No explicit real/mock classification metadata is defined for this status badge yet.');
  }

  return getSectionRealityByCode(cardContext.code, `${cardContext.code} status badge`);
}

function describeResultSurfaceReality(element) {
  const cardContext = getCardContext(element);
  if (!cardContext?.code) {
    return buildRealityMeta('unknown', 'Backend result panel', 'No explicit real/mock classification metadata is defined for this result panel yet.');
  }

  if (['1A', '2A', '3A'].includes(cardContext.code)) {
    return buildRealityMeta('real', `${cardContext.code} backend result panel`, 'Rendered from the latest real backend request made by this View A card.');
  }

  return getSectionRealityByCode(cardContext.code, `${cardContext.code} result panel`);
}

function describeDefinitionRealityRow(element) {
  const label = compactWhitespace(element.querySelector('dt')?.textContent) || 'Value';
  const sidePanelTitle = compactWhitespace(element.closest('.side-panel')?.querySelector('.side-panel__header h2')?.textContent);
  const cardContext = getCardContext(element);

  if (sidePanelTitle === 'Current truth') {
    return buildRealityMeta('mock', `${label} value`, 'Rendered from local in-memory dashboard truth state, not a live backend runtime truth source.');
  }

  if (cardContext?.code && ['1A', '2A', '3A'].includes(cardContext.code) && element.closest('.result-surface')) {
    return buildRealityMeta('real', `${label} value`, `Rendered from the latest real backend response captured for ${cardContext.code}.`);
  }

  if (cardContext?.code && ['C1', 'C2', 'C3', 'C4', 'C5'].includes(cardContext.code)) {
    return buildRealityMeta('mock', `${label} value`, 'Rendered from C-view demo state and placeholder recovery data.');
  }

  if (cardContext?.code && ['D2', 'D3'].includes(cardContext.code)) {
    return buildRealityMeta('mock', `${label} value`, 'Rendered from the frontend-only runtime preview state.');
  }

  if (element.closest('.modal-panel')) {
    return describeModalReality(label);
  }

  return buildRealityMeta('unknown', `${label} value`, 'No explicit real/mock classification metadata is defined for this displayed value yet.');
}

function describeNoticeReality(element) {
  const label = compactWhitespace(element.textContent) || 'Notice';
  return buildRealityMeta('mock', label, 'This notice belongs to a demo-only or preview-only area of the dashboard.');
}

function describeLogReality(element) {
  const sourceKey = element.dataset.logSourceKey;
  const label = `${sourceKey ?? 'Unknown'} log entry`;

  if (!sourceKey) {
    return buildRealityMeta('unknown', label, 'No explicit source key is available for this log entry.');
  }

  if (['1A', '2A', '3A'].includes(sourceKey)) {
    return buildRealityMeta('real', label, 'This log entry comes from a View A action that calls a live backend endpoint.');
  }

  if (sourceKey.startsWith('B') || sourceKey === 'C' || sourceKey === 'D') {
    return buildRealityMeta('mock', label, 'This log entry comes from a simulated, demo, or preview-only dashboard section.');
  }

  return buildRealityMeta('unknown', label, 'No explicit real/mock classification metadata is defined for this log source.');
}

function describeHistoryReality(element) {
  const index = Number(element.dataset.historyEntryIndex);
  const entry = getState().history[index];
  const source = entry?.source ?? 'Unknown';

  if (['INIT', 'DB', 'SCHEDULER', 'USER'].includes(source)) {
    return buildRealityMeta('real', `${source} history event`, 'This history event was produced by a real backend-backed or genuinely implemented local UI action.');
  }

  if (['TEST', 'PIPELINE', 'PLAYBACK', 'SCREEN', 'RUNTIME', 'DEMO', 'RECOVERY'].includes(source)) {
    return buildRealityMeta('mock', `${source} history event`, 'This history event comes from simulated, preview, or placeholder behavior.');
  }

  if (['BOOT', 'TRUTH'].includes(source)) {
    return buildRealityMeta('mixed', `${source} history event`, 'This history event describes real dashboard shell behavior, but not a live backend-backed runtime feature.');
  }

  return buildRealityMeta('unknown', `${source} history event`, 'No explicit real/mock classification metadata is defined for this history source.');
}

function describeModalReality(label) {
  const modal = getState().modal;

  if (modal?.kind === 'log') {
    const sourceKey = modal.entry?.sourceKey;
    if (['1A', '2A', '3A'].includes(sourceKey)) {
      return buildRealityMeta('real', `${label} modal value`, 'This modal is showing details for a real backend-backed View A log entry.');
    }
    if (typeof sourceKey === 'string' && (sourceKey.startsWith('B') || sourceKey === 'C' || sourceKey === 'D')) {
      return buildRealityMeta('mock', `${label} modal value`, 'This modal is showing details for a simulated, demo, or preview-only log entry.');
    }
  }

  if (modal?.kind === 'history') {
    const source = modal.entry?.source;
    if (['INIT', 'DB', 'SCHEDULER', 'USER'].includes(source)) {
      return buildRealityMeta('real', `${label} modal value`, 'This modal is showing details for a real backend-backed or genuinely implemented local UI history event.');
    }
    if (['TEST', 'PIPELINE', 'PLAYBACK', 'SCREEN', 'RUNTIME', 'DEMO', 'RECOVERY'].includes(source)) {
      return buildRealityMeta('mock', `${label} modal value`, 'This modal is showing details for simulated, preview, or placeholder history data.');
    }
  }

  return buildRealityMeta('unknown', `${label} modal value`, 'No explicit real/mock classification metadata is defined for this modal field yet.');
}

function getSectionRealityByCode(code, label) {
  if (['1A', '2A', '3A'].includes(code)) {
    return buildRealityMeta('real', label, 'This section is backed by live init or scheduler backend endpoints.');
  }

  if (code === 'IO') {
    return buildRealityMeta(
      transitHasLiveTraffic ? 'real' : 'mixed',
      label,
      transitHasLiveTraffic
        ? 'The terminal is currently showing real gateway traffic emitted by dashboard API requests.'
        : 'The terminal shell is implemented, but it is still showing placeholder output until live traffic appears.',
    );
  }

  if (typeof code === 'string' && code.startsWith('B')) {
    return buildRealityMeta('mock', label, 'This section belongs to the simulation-only test area.');
  }

  if (typeof code === 'string' && code.startsWith('C')) {
    return buildRealityMeta('mock', label, 'This section is driven by demo state and placeholder recovery behavior.');
  }

  if (typeof code === 'string' && code.startsWith('D')) {
    return buildRealityMeta('mock', label, 'This section belongs to the frontend-only runtime preview.');
  }

  return buildRealityMeta('unknown', label, 'No explicit real/mock classification metadata is defined for this section yet.');
}

function buildRealityMeta(state, label, description) {
  const title = REALITY_STATE_TITLES[state] ?? REALITY_STATE_TITLES.unknown;
  return {
    state,
    label: `${title}: ${label}`,
    description,
  };
}

function describeBackendStatusElement(element) {
  if (element.matches('.button')) {
    return describeButtonBackendStatus(element);
  }

  if (element.matches('.hero-pill')) {
    return describeHeroPillBackendStatus(element);
  }

  if (element.matches('.pill')) {
    return describePillBackendStatus(element);
  }

  if (element.matches('.status-badge')) {
    return describeStatusBadgeBackendStatus(element);
  }

  if (element.matches('.result-surface')) {
    return describeResultSurfaceBackendStatus(element);
  }

  if (element.matches('.definition-row')) {
    return describeDefinitionBackendStatusRow(element);
  }

  if (element.matches('.preview-frame')) {
    return buildBackendStatusMeta('missing', 'Playback preview surface', 'This preview stands in for backend/runtime support that is not implemented yet.');
  }

  if (element.matches('.screen-indicator')) {
    return buildBackendStatusMeta(
      'mock',
      compactWhitespace(element.textContent) || 'Preview indicator',
      'This indicator is driven by frontend simulation state rather than a real backend/hardware response.',
    );
  }

  if (element.matches('.worker-row')) {
    const stageName = compactWhitespace(element.querySelector('.worker-row__main strong')?.textContent) || 'Runtime worker';
    return buildBackendStatusMeta('missing', `${stageName} worker row`, 'This worker row previews runtime data that would normally come from a backend/runtime source that is not implemented yet.');
  }

  if (element.matches('.notice')) {
    return describeNoticeBackendStatus(element);
  }

  if (element.matches('[data-log-entry-open]')) {
    return describeLogBackendStatus(element);
  }

  if (element.matches('[data-history-entry-open]')) {
    return describeHistoryBackendStatus(element);
  }

  return null;
}

function describeButtonBackendStatus(element) {
  const label = compactWhitespace(element.textContent) || 'Button';
  const action = element.dataset.action;

  if (action && INIT_ACTION_TO_CODE[action]) {
    return getInitBackendStatusMeta(INIT_ACTION_TO_CODE[action], label);
  }

  if (action && ACTION_BACKEND_STATUS_COPY[action]) {
    const meta = ACTION_BACKEND_STATUS_COPY[action];
    return buildBackendStatusMeta(meta.state, label, meta.reason);
  }

  if (element.dataset.lastRunMode) {
    return buildBackendStatusMeta('mock', label, 'This button switches local demo state and is not intended to call backend support.');
  }

  if (element.matches('.inspect-toggle')) {
    return buildBackendStatusMeta('unknown', label, 'This is a local guide-mode toggle, not a backend-backed action.');
  }

  if (element.hasAttribute('data-modal-close')) {
    return buildBackendStatusMeta('unknown', label, 'This is a local UI action and does not represent backend wiring status.');
  }

  return buildBackendStatusMeta('unknown', label, 'No explicit backend-status classification metadata is defined for this button yet.');
}

function describeHeroPillBackendStatus(element) {
  const label = compactWhitespace(element.textContent) || 'Hero pill';
  const text = label.toLowerCase();

  if (text.includes('backend contract wired')) {
    return buildBackendStatusMeta('real', label, 'This pill describes a section that already calls live backend endpoints.');
  }
  if (text.includes('backend still required')) {
    return buildBackendStatusMeta('missing', label, 'The UI surface exists, but additional backend support is still missing.');
  }
  if (text.includes('simulation only') || text.includes('mock stage')) {
    return buildBackendStatusMeta('mock', label, 'This view or stage is explicitly simulation-only rather than backend-backed.');
  }
  if (text.includes('preview active') || text.includes('preview inactive')) {
    return buildBackendStatusMeta('missing', label, 'This preview exists because the real runtime backend support is not implemented here yet.');
  }

  return buildBackendStatusMeta('unknown', label, 'No explicit backend-status classification metadata is defined for this hero pill yet.');
}

function describePillBackendStatus(element) {
  const label = compactWhitespace(element.textContent) || 'Pill';
  const text = label.toLowerCase();

  if (text.includes('a wired') && text.includes('simulated')) {
    return buildBackendStatusMeta('unknown', label, 'This is a hybrid summary that mixes real and simulated backend states.');
  }
  if (text.includes('live gateway traffic')) {
    return buildBackendStatusMeta('real', label, 'The dashboard is currently receiving real API traffic through the gateway.');
  }
  if (text.includes('placeholder')) {
    return buildBackendStatusMeta('mock', label, 'This pill indicates placeholder output rather than a real backend-fed response.');
  }

  return buildBackendStatusMeta('unknown', label, 'No explicit backend-status classification metadata is defined for this pill yet.');
}

function describeStatusBadgeBackendStatus(element) {
  const cardContext = getCardContext(element);
  if (!cardContext?.code) {
    return buildBackendStatusMeta('unknown', compactWhitespace(element.textContent) || 'Status badge', 'No explicit backend-status classification metadata is defined for this status badge yet.');
  }

  return getSectionBackendStatusByCode(cardContext.code, `${cardContext.code} status badge`);
}

function describeResultSurfaceBackendStatus(element) {
  const cardContext = getCardContext(element);
  if (!cardContext?.code) {
    return buildBackendStatusMeta('unknown', 'Backend result panel', 'No explicit backend-status classification metadata is defined for this result panel yet.');
  }

  if (['1A', '2A', '3A'].includes(cardContext.code)) {
    return getInitBackendStatusMeta(cardContext.code, `${cardContext.code} backend result panel`);
  }

  return getSectionBackendStatusByCode(cardContext.code, `${cardContext.code} result panel`);
}

function describeDefinitionBackendStatusRow(element) {
  const label = compactWhitespace(element.querySelector('dt')?.textContent) || 'Value';
  const sidePanelTitle = compactWhitespace(element.closest('.side-panel')?.querySelector('.side-panel__header h2')?.textContent);
  const cardContext = getCardContext(element);

  if (sidePanelTitle === 'Current truth') {
    return buildBackendStatusMeta('mock', `${label} value`, 'This value is rendered from local dashboard truth state rather than a backend response.');
  }

  if (cardContext?.code && ['1A', '2A', '3A'].includes(cardContext.code) && element.closest('.result-surface')) {
    return getInitBackendStatusMeta(cardContext.code, `${label} value`);
  }

  if (cardContext?.code === 'B3.1') {
    return buildBackendStatusMeta('mock', `${label} value`, 'This value belongs to the explicit mock-download stage.');
  }

  if (cardContext?.code && ['B1', 'B2', 'B3', 'B3.2', 'B3.3', 'B3.4', 'B3.5', 'B4'].includes(cardContext.code)) {
    return buildBackendStatusMeta('missing', `${label} value`, 'This displayed value stands in for backend-backed test/pipeline data that is not implemented here yet.');
  }

  if (cardContext?.code === 'B5') {
    return buildBackendStatusMeta('mock', `${label} value`, 'This value is driven by frontend-only simulation controls.');
  }

  if (cardContext?.code && ['C1', 'C2', 'C3', 'C4', 'C5', 'D1', 'D2', 'D3', 'D4'].includes(cardContext.code)) {
    return buildBackendStatusMeta('missing', `${label} value`, 'This value represents runtime data that would normally come from backend/runtime APIs that are not implemented here yet.');
  }

  if (element.closest('.modal-panel')) {
    return describeModalBackendStatus(label);
  }

  return buildBackendStatusMeta('unknown', `${label} value`, 'No explicit backend-status classification metadata is defined for this displayed value yet.');
}

function describeNoticeBackendStatus(element) {
  const label = compactWhitespace(element.textContent) || 'Notice';
  const text = label.toLowerCase();

  if (text.includes('demo state')) {
    return buildBackendStatusMeta('mock', label, 'This notice is part of a local demo-state switch rather than backend behavior.');
  }

  if (text.includes('frontend-only runtime preview')) {
    return buildBackendStatusMeta('missing', label, 'This notice explicitly indicates the real runtime backend support is missing.');
  }

  if (text.includes('simulated runtime preview')) {
    return buildBackendStatusMeta('missing', label, 'This notice exists because the real runtime backend support is not implemented here yet.');
  }

  return buildBackendStatusMeta('mock', label, 'This notice is rendered from frontend-only state rather than a backend response.');
}

function describeLogBackendStatus(element) {
  const sourceKey = element.dataset.logSourceKey;
  const label = `${sourceKey ?? 'Unknown'} log entry`;
  const state = getState();
  const index = Number(element.dataset.logEntryIndex);
  const entry = sourceKey ? state.logs[sourceKey]?.[index] : null;

  if (!sourceKey) {
    return buildBackendStatusMeta('unknown', label, 'No explicit source key is available for this log entry.');
  }

  if (['1A', '2A', '3A'].includes(sourceKey)) {
    return getInitBackendStatusMeta(sourceKey, label, entry);
  }

  if (sourceKey === 'B3.1' || sourceKey === 'B5') {
    return buildBackendStatusMeta('mock', label, 'This log entry comes from frontend-only simulation behavior.');
  }

  if (sourceKey.startsWith('B') || sourceKey === 'C' || sourceKey === 'D') {
    return buildBackendStatusMeta('missing', label, 'This log entry comes from a UI surface that stands in for missing backend/runtime support.');
  }

  return buildBackendStatusMeta('unknown', label, 'No explicit backend-status classification metadata is defined for this log source.');
}

function describeHistoryBackendStatus(element) {
  const index = Number(element.dataset.historyEntryIndex);
  const entry = getState().history[index];
  const source = entry?.source ?? 'Unknown';

  if (['INIT', 'DB', 'SCHEDULER'].includes(source)) {
    return describeHistoryEntryFromDetails(`${source} history event`, entry);
  }

  if (['TEST', 'PIPELINE', 'PLAYBACK', 'RECOVERY', 'RUNTIME'].includes(source)) {
    return buildBackendStatusMeta('missing', `${source} history event`, 'This history event belongs to UI behavior that stands in for missing backend/runtime support.');
  }

  if (['SCREEN', 'DEMO'].includes(source)) {
    return buildBackendStatusMeta('mock', `${source} history event`, 'This history event comes from frontend-only simulation or demo-state behavior.');
  }

  if (['BOOT', 'TRUTH', 'USER'].includes(source)) {
    return buildBackendStatusMeta('unknown', `${source} history event`, 'This is a local dashboard shell event rather than a backend-status signal.');
  }

  return buildBackendStatusMeta('unknown', `${source} history event`, 'No explicit backend-status classification metadata is defined for this history source.');
}

function describeModalBackendStatus(label) {
  const modal = getState().modal;

  if (modal?.kind === 'log') {
    const sourceKey = modal.entry?.sourceKey;
    if (['1A', '2A', '3A'].includes(sourceKey)) {
      return getInitBackendStatusMeta(sourceKey, `${label} modal value`, modal.entry);
    }
    if (sourceKey === 'B3.1' || sourceKey === 'B5') {
      return buildBackendStatusMeta('mock', `${label} modal value`, 'This modal is showing details for frontend-only simulation data.');
    }
    if (typeof sourceKey === 'string' && (sourceKey.startsWith('B') || sourceKey === 'C' || sourceKey === 'D')) {
      return buildBackendStatusMeta('missing', `${label} modal value`, 'This modal is showing details for a UI surface that stands in for missing backend/runtime support.');
    }
  }

  if (modal?.kind === 'history') {
    return describeHistoryEntryFromDetails(`${label} modal value`, modal.entry);
  }

  return buildBackendStatusMeta('unknown', `${label} modal value`, 'No explicit backend-status classification metadata is defined for this modal field yet.');
}

function describeHistoryEntryFromDetails(label, entry) {
  const response = entry?.details?.response;
  if (isMissingBackendStatus(response?.status)) {
    return buildBackendStatusMeta('missing', label, 'The captured backend response indicates that the expected endpoint/implementation is missing.');
  }
  if (response) {
    return buildBackendStatusMeta('real', label, 'This event includes a real backend request/response record.');
  }
  return buildBackendStatusMeta('unknown', label, 'This event does not include enough backend response metadata to classify safely.');
}

function getSectionBackendStatusByCode(code, label) {
  if (['1A', '2A', '3A'].includes(code)) {
    return getInitBackendStatusMeta(code, label);
  }

  if (code === 'B3.1' || code === 'B5') {
    return buildBackendStatusMeta('mock', label, 'This section is intentionally frontend-only simulation rather than backend-backed.');
  }

  if (['B1', 'B2', 'B3', 'B3.2', 'B3.3', 'B3.4', 'B3.5', 'B4', 'C', 'C1', 'C2', 'C3', 'C4', 'C5', 'D1', 'D2', 'D3', 'D4'].includes(code)) {
    return buildBackendStatusMeta('missing', label, 'This section stands in for backend/runtime support that is not implemented here yet.');
  }

  if (code === 'IO') {
    return buildBackendStatusMeta(
      transitHasLiveTraffic ? 'real' : 'unknown',
      label,
      transitHasLiveTraffic
        ? 'This terminal is currently showing real gateway traffic from dashboard API calls.'
        : 'This terminal is implemented, but no live backend traffic has been observed yet.',
    );
  }

  return buildBackendStatusMeta('unknown', label, 'No explicit backend-status classification metadata is defined for this section yet.');
}

function getInitBackendStatusMeta(code, label, entry = null) {
  const state = getState();
  const result = state.initResults[code];
  const responseStatus = entry?.details?.response?.status ?? result?.status ?? null;

  if (isMissingBackendStatus(responseStatus)) {
    return buildBackendStatusMeta('missing', label, `The latest response for ${code} indicates the expected backend endpoint/implementation is missing.`);
  }

  if (result?.outcome === 'error') {
    return buildBackendStatusMeta('real', label, `This UI is wired to a live backend endpoint, but the latest request for ${code} failed for a non-missing reason.`);
  }

  if (result?.outcome === 'running') {
    return buildBackendStatusMeta('real', label, `This UI is currently waiting on a real backend request for ${code}.`);
  }

  if (result?.outcome === 'success') {
    return buildBackendStatusMeta('real', label, `This UI is backed by a live backend endpoint and has a captured response for ${code}.`);
  }

  return buildBackendStatusMeta('real', label, `This UI is wired to a live backend endpoint for ${code}, even if it has not been called yet.`);
}

function isMissingBackendStatus(status) {
  return [404, 405, 501].includes(Number(status));
}

function buildBackendStatusMeta(state, label, description) {
  const title = BACKEND_STATUS_TITLES[state] ?? BACKEND_STATUS_TITLES.unknown;
  return {
    state,
    label: `${title}: ${label}`,
    description,
  };
}

function describeInspectableElement(element) {
  if (element.matches('.nav-link')) {
    const viewId = element.dataset.view;
    const view = VIEW_ORDER.find((entry) => entry.id === viewId);
    if (view) {
      return {
        label: `Open ${view.id} - ${view.name}`,
        description: view.subtitle,
      };
    }
  }

  if (element.matches('[data-log-entry-open]')) {
    return {
      label: 'Open log entry details',
      description: 'Opens the selected log entry so you can inspect its timestamps, action metadata, and any captured request/response payloads.',
    };
  }

  if (element.matches('[data-history-entry-open]')) {
    return {
      label: 'Open history event details',
      description: 'Opens the selected history item so you can inspect its timeline and any captured context fields.',
    };
  }

  if (element.matches('.toggle-card')) {
    const input = element.querySelector('input');
    return describeSimulationControl(input);
  }

  if (element.matches('.selector-option')) {
    const input = element.querySelector('input');
    return describeSimulationControl(input);
  }

  if (element.matches('.field-label')) {
    const input = element.querySelector('input[name="inactivityTimeoutSeconds"]');
    if (input) {
      return {
        label: 'Set inactivity timeout',
        description: 'Changes how many seconds of inactivity B5 waits before the screen simulation flips to OFF and updates the checkpoint state.',
      };
    }
  }

  if (element.matches('[data-last-run-mode]')) {
    return LAST_RUN_MODE_INSPECT_COPY[element.dataset.lastRunMode] ?? fallbackInspectCopy(element);
  }

  if (element.matches('[data-action]')) {
    return ACTION_INSPECT_COPY[element.dataset.action] ?? fallbackInspectCopy(element);
  }

  if (element.matches('.button')) {
    return fallbackInspectCopy(element);
  }

  return null;
}

function describeSimulationControl(input) {
  if (!input) {
    return null;
  }

  const name = input.name;
  const value = input.value;

  if (name === 'execution-mode') {
    if (value === 'auto') {
      return {
        label: 'Execution mode: auto pipeline',
        description: 'B3 runs the full pipeline sequence automatically when you trigger the main auto-run control.',
      };
    }
    return {
      label: 'Execution mode: manual pipeline',
      description: 'B3 is configured for one-stage-at-a-time operation so each stage can be triggered individually.',
    };
  }

  if (name === 'input-mode') {
    if (value === 'single') {
      return {
        label: 'Mock input mode: one file at a time',
        description: 'Runs the mock download flow in a single-file mode so stage outputs are easier to inspect step by step.',
      };
    }
    return {
      label: 'Mock input mode: all files',
      description: 'Represents a future all-files mode. It stays disabled in the current prototype.',
    };
  }

  if (name === 'pirEnabled') {
    return {
      label: 'Toggle PIR sensor activity',
      description: 'Controls whether the motion-sensor activity source counts as active in the B5 screen simulation.',
    };
  }

  if (name === 'mouseEnabled') {
    return {
      label: 'Toggle mouse activity',
      description: 'Controls whether mouse movement counts as an activity source that keeps the simulated screen awake.',
    };
  }

  if (name === 'keyboardEnabled') {
    return {
      label: 'Toggle keyboard activity',
      description: 'Controls whether keyboard activity counts as a wake/keep-awake signal in the B5 simulation.',
    };
  }

  if (name === 'simulateAllEnabled') {
    return {
      label: 'Toggle all activity sources',
      description: 'Turns the major simulated activity sources on or off together so the screen state can be tested quickly.',
    };
  }

  return null;
}

function describeValueElement(element) {
  if (element.matches('.topbar h1')) {
    return buildValueMeta(
      'Current view title',
      element,
      'state.currentViewTitle, updated when the active navigation view changes.',
    );
  }

  if (element.matches('.status-badge')) {
    const cardContext = getCardContext(element);
    if (cardContext?.code) {
      return buildValueMeta(
        `${cardContext.code} status`,
        element,
        `state.statusByKey["${cardContext.code}"], updated when that section starts, succeeds, fails, or becomes disabled.`,
      );
    }
  }

  if (element.matches('.definition-row dd')) {
    return describeDefinitionValue(element);
  }

  if (element.matches('.result-surface .mini-badge')) {
    const cardContext = getCardContext(element);
    if (cardContext?.code) {
      return buildValueMeta(
        `${cardContext.code} backend outcome`,
        element,
        `state.initResults["${cardContext.code}"].outcome, derived from the latest backend request state for that card.`,
      );
    }
  }

  if (element.matches('.result-message, .result-json')) {
    const cardContext = getCardContext(element);
    if (cardContext?.code) {
      return buildValueMeta(
        `${cardContext.code} backend result`,
        element,
        `state.initResults["${cardContext.code}"], filled from the latest request/response payload for that backend action.`,
      );
    }
  }

  if (element.matches('.log-entry__message, .log-entry__meta > span:first-child, .log-entry__status-chip > span:first-child')) {
    const logEntry = element.closest('[data-log-source-key]');
    const sourceKey = logEntry?.dataset.logSourceKey ?? 'LOG';
    return buildValueMeta(
      `Log entry (${sourceKey})`,
      element,
      `state.logs["${sourceKey}"], appended whenever that section records a new log line.`,
    );
  }

  if (element.matches('.history-item__message, .history-item__meta > span:first-child, .history-item__status-chip > span:first-child')) {
    return buildValueMeta(
      'History event',
      element,
      'state.history, appended when dashboard actions, simulation changes, or backend calls create new history events.',
    );
  }

  if (element.matches('.preview-frame__bar .screen-indicator')) {
    const text = compactWhitespace(element.textContent).toLowerCase();
    if (text.startsWith('screen')) {
      return buildValueMeta(
        'Playback preview screen state',
        element,
        'state.truth.screenState, updated by B5 simulation controls and runtime preview state.',
      );
    }
    return buildValueMeta(
      'Playback preview queue readiness',
      element,
      'derived from state.truth.currentMedia; it changes when queue-stage actions create or remove the current media item.',
    );
  }

  if (element.matches('.preview-frame__content strong, .preview-frame__content span, .preview-frame__content small')) {
    return buildValueMeta(
      'Playback preview value',
      element,
      'state.truth.currentMedia and related playback truth, updated when media is queued or demo state changes.',
    );
  }

  if (element.matches('.worker-row__main span, .worker-row__meta .mini-badge, .worker-row__meta > span:last-child')) {
    const row = element.closest('.worker-row');
    const stageName = compactWhitespace(row?.querySelector('.worker-row__main strong')?.textContent) || 'pipeline stage';
    return buildValueMeta(
      `${stageName} worker value`,
      element,
      'state.runningProcess.pipelineStages, updated when the simulated runtime preview or demo seeding changes worker status.',
    );
  }

  if (element.matches('.notice')) {
    const viewPage = element.closest('.view-page');
    const eyebrow = compactWhitespace(viewPage?.querySelector('.eyebrow')?.textContent);
    if (eyebrow.startsWith('C')) {
      return buildValueMeta(
        'Last-run notice',
        element,
        'state.lastRunMode, updated by the C-view demo-mode buttons.',
      );
    }
    return buildValueMeta(
      'Runtime preview notice',
      element,
      'state.truth.realRunActive, updated when the simulated runtime preview starts.',
    );
  }

  if (element.matches('.modal-panel__subtitle, .modal-panel__json')) {
    return buildValueMeta(
      'Modal detail value',
      element,
      'state.modal.entry, populated from the selected log or history record when the modal opens.',
    );
  }

  return null;
}

function describeDefinitionValue(element) {
  const row = element.closest('.definition-row');
  const label = compactWhitespace(row?.querySelector('dt')?.textContent) || 'Value';
  const sidePanelTitle = compactWhitespace(element.closest('.side-panel')?.querySelector('.side-panel__header h2')?.textContent);

  if (sidePanelTitle === 'Current truth' && CURRENT_TRUTH_VALUE_SOURCES[label]) {
    return buildValueMeta(label, element, CURRENT_TRUTH_VALUE_SOURCES[label]);
  }

  const cardContext = getCardContext(element);
  if (cardContext?.code === 'C1') {
    return buildValueMeta(label, element, `state.lastRunData.media, updated when the C-view demo mode changes or demo state is seeded.`);
  }
  if (cardContext?.code === 'C2') {
    return buildValueMeta(label, element, `state.lastRunData.playback, updated when the C-view demo mode changes or demo state is seeded.`);
  }
  if (cardContext?.code === 'C3') {
    return buildValueMeta(label, element, `state.lastRunData.stage, updated when the C-view demo mode changes or demo state is seeded.`);
  }
  if (cardContext?.code === 'C4') {
    return buildValueMeta(label, element, `state.lastRunData.screen, updated when the C-view demo mode changes or demo state is seeded.`);
  }
  if (cardContext?.code === 'D2') {
    return buildValueMeta(label, element, `state.runningProcess.playbackWorker, updated when the simulated runtime preview starts or changes.`);
  }
  if (cardContext?.code === 'D3') {
    return buildValueMeta(label, element, `state.runningProcess.screenWorker, updated when the simulated runtime preview or screen simulation changes.`);
  }
  if (cardContext?.code && ['1A', '2A', '3A'].includes(cardContext.code) && element.closest('.result-surface')) {
    return buildValueMeta(label, element, `state.initResults["${cardContext.code}"], filled from the latest backend response metadata for that action.`);
  }
  if (element.closest('.modal-panel')) {
    return buildValueMeta(label, element, 'state.modal.entry, derived from the log or history entry you opened.');
  }

  return buildValueMeta(
    `${cardContext?.title ?? sidePanelTitle ?? label} value`,
    element,
    `the rendered state backing this section${cardContext?.code ? ` (${cardContext.code})` : ''}; it updates when the related dashboard state changes.`,
  );
}

function buildValueMeta(label, element, source) {
  const value = compactWhitespace(element.textContent) || 'Empty';
  return {
    label: `${label}: ${value}`,
    description: `Source: ${source}`,
  };
}

function getCardContext(element) {
  const card = element.closest('.card, .stage-card');
  if (!card) {
    return null;
  }

  return {
    code: compactWhitespace(card.querySelector('.card__code')?.textContent),
    title: compactWhitespace(card.querySelector('h3, h4')?.textContent),
  };
}

function fallbackInspectCopy(element) {
  const label = compactWhitespace(element.textContent) || 'Interactive control';
  return {
    label,
    description: 'Interactive control in the dashboard. Hover in explain-controls mode to identify what it does before you click it.',
  };
}

function compactWhitespace(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function handleInspectEnter(event) {
  if (!getState().inspectMode) {
    return;
  }

  const element = event.currentTarget;
  showGuideTooltip({
    element,
    label: element.dataset.inspectLabel,
    description: element.dataset.inspectDescription,
    eyebrow: 'Control guide',
  });
}

function handleValueInspectEnter(event) {
  if (!getState().valueInspectMode) {
    return;
  }

  const element = event.currentTarget;
  showGuideTooltip({
    element,
    label: element.dataset.valueLabel,
    description: element.dataset.valueDescription,
    eyebrow: 'Value source',
  });
}

function handleRealityInspectEnter(event) {
  if (!getState().realityInspectMode) {
    return;
  }

  const element = event.currentTarget;
  showGuideTooltip({
    element,
    label: element.dataset.realityLabel,
    description: element.dataset.realityDescription,
    eyebrow: 'Implementation truth',
  });
}

function handleBackendStatusInspectEnter(event) {
  if (!getState().backendStatusInspectMode) {
    return;
  }

  const element = event.currentTarget;
  showGuideTooltip({
    element,
    label: element.dataset.backendStatusLabel,
    description: element.dataset.backendStatusDescription,
    eyebrow: 'Backend status',
  });
}

function handleInspectLeave(event) {
  const element = event.currentTarget;
  if (activeInspectTarget === element) {
    hideInspectTooltip();
  }
}

function showGuideTooltip({ element, label, description, eyebrow }) {
  if (!label || !description) {
    return;
  }

  const tooltip = ensureInspectTooltip();
  clearInspectTargetState();

  inspectTooltipEyebrowElement.textContent = eyebrow ?? 'Guide';
  inspectTooltipTitleElement.textContent = label;
  inspectTooltipBodyElement.textContent = description;
  tooltip.hidden = false;
  activeInspectTarget = element;
  activeInspectTarget.dataset.inspectActive = 'true';
  positionInspectTooltip(element);
}

function hideInspectTooltip() {
  clearInspectTargetState();
  if (inspectTooltipElement) {
    inspectTooltipElement.hidden = true;
  }
}

function clearInspectTargetState() {
  if (activeInspectTarget) {
    delete activeInspectTarget.dataset.inspectActive;
    activeInspectTarget = null;
  }
}

function ensureInspectTooltip() {
  if (inspectTooltipElement) {
    return inspectTooltipElement;
  }

  inspectTooltipElement = document.createElement('aside');
  inspectTooltipElement.className = 'inspect-tooltip';
  inspectTooltipElement.hidden = true;
  inspectTooltipElement.innerHTML = `
    <p class="inspect-tooltip__eyebrow"></p>
    <h3 class="inspect-tooltip__title"></h3>
    <p class="inspect-tooltip__body"></p>
  `;
  inspectTooltipEyebrowElement = inspectTooltipElement.querySelector('.inspect-tooltip__eyebrow');
  inspectTooltipTitleElement = inspectTooltipElement.querySelector('.inspect-tooltip__title');
  inspectTooltipBodyElement = inspectTooltipElement.querySelector('.inspect-tooltip__body');
  document.body.appendChild(inspectTooltipElement);
  return inspectTooltipElement;
}

function positionInspectTooltip(element) {
  if (!inspectTooltipElement || inspectTooltipElement.hidden) {
    return;
  }

  const rect = element.getBoundingClientRect();
  const tooltipRect = inspectTooltipElement.getBoundingClientRect();
  const margin = 14;
  let top = rect.bottom + margin;
  let left = rect.left + rect.width / 2 - tooltipRect.width / 2;

  if (top + tooltipRect.height > window.innerHeight - margin) {
    top = rect.top - tooltipRect.height - margin;
  }

  if (top < margin) {
    top = margin;
  }

  if (left < margin) {
    left = margin;
  }

  if (left + tooltipRect.width > window.innerWidth - margin) {
    left = window.innerWidth - tooltipRect.width - margin;
  }

  inspectTooltipElement.style.top = `${Math.round(top)}px`;
  inspectTooltipElement.style.left = `${Math.round(left)}px`;
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
  const record = event?.detail;
  const line = formatTransitRecord(record);
  if (!line) {
    return;
  }

  transitHasLiveTraffic = true;
  transitLines.push(line);
  if (transitLines.length > MAX_TRANSIT_LINES) {
    transitLines.splice(0, transitLines.length - MAX_TRANSIT_LINES);
  }

  render();
});

function renderTransitTerminalLines() {
  if (!transitHasLiveTraffic) {
    return placeholderLines.join('\n');
  }
  if (!transitLines.length) {
    return '[transit] waiting for gateway traffic...';
  }
  return transitLines.join('\n');
}

function formatTransitRecord(record) {
  if (!record || typeof record !== 'object') {
    return '';
  }

  const atIso = typeof record.atIso === 'string' ? record.atIso : '';
  const time = atIso
    ? new Date(atIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const direction = record.direction === 'inbound' ? 'IN ' : record.direction === 'outbound' ? 'OUT' : 'IO ';
  const method = typeof record.method === 'string' ? record.method : 'GET';
  const path = typeof record.path === 'string' ? record.path : '';

  if (!path) {
    return '';
  }

  const op = typeof record.operation === 'string' ? record.operation : `${method} ${path}`;
  const hasBody = record.hasBody === true ? 'body=yes' : record.hasBody === false ? 'body=no' : 'body=?';

  if (record.direction === 'outbound') {
    return `${time} ${direction} ${method} ${path} ${hasBody} :: ${op}`;
  }

  const status = record.status === null || record.status === undefined ? '---' : String(record.status);
  const ok = record.ok === true ? 'OK ' : record.ok === false ? 'ERR' : '---';
  const err = typeof record.error === 'string' && record.error.trim() ? ` :: ${record.error.trim()}` : '';
  return `${time} ${direction} ${status} ${ok} ${method} ${path}${err} :: ${op}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
