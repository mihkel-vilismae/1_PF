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
  toggleInspectMode,
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
const ACTION_INSPECT_COPY = {
  'toggle-inspect-mode': {
    label: 'Explain controls mode',
    description: 'Highlights every interactive control and shows a tooltip that explains what it does when you hover or focus it.',
  },
  'toggle-value-inspect-mode': {
    label: 'Explain values mode',
    description: 'Highlights live values and shows a tooltip that explains where each value comes from.',
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

    if (enabled && !element.hasAttribute('tabindex')) {
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
