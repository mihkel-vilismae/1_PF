import { VIEW_ORDER } from '../shared/constants.js';
import {
  ACTION_INSPECT_COPY,
  CURRENT_TRUTH_VALUE_SOURCES,
  FALLBACK_INSPECT_DESCRIPTION,
  INSPECT_COPY,
  LAST_RUN_MODE_INSPECT_COPY,
} from './guideCopy.js';
import { getAuthButtonInspectCopy } from '../data/authButtonStatusCopy.ts';
import { buildValueMeta, compactWhitespace, getCardContext } from './guideUtils.ts';

export function describeInspectableElement(element) {
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
    return INSPECT_COPY.logEntry;
  }

  if (element.matches('[data-history-entry-open]')) {
    return INSPECT_COPY.historyEntry;
  }

  if (element.matches('.toggle-card, .selector-option')) {
    return describeSimulationControl(element.querySelector('input'));
  }

  if (element.matches('.field-label') && element.querySelector('input[name="inactivityTimeoutSeconds"]')) {
    return INSPECT_COPY.inactivityTimeout;
  }

  if (element.matches('[data-last-run-mode]')) {
    return LAST_RUN_MODE_INSPECT_COPY[element.dataset.lastRunMode] ?? fallbackInspectCopy(element);
  }

  if (element.matches('[data-db-table]')) {
    return {
      label: `Open table ${element.dataset.dbTable ?? ''}`.trim(),
      description: INSPECT_COPY.dbTableDescription,
    };
  }

  if (element.matches('[data-db-page-delta]')) {
    const direction = Number(element.dataset.dbPageDelta) < 0 ? 'previous' : 'next';
    return {
      label: `Load ${direction} row page`,
      description: INSPECT_COPY.dbPageDescriptions[direction],
    };
  }

  if (element.matches('[data-action]')) {
    return getAuthButtonInspectCopy(element.dataset.action) ?? ACTION_INSPECT_COPY[element.dataset.action] ?? fallbackInspectCopy(element);
  }

  if (element.matches('.button')) {
    return fallbackInspectCopy(element);
  }

  return null;
}

export function describeValueElement(element) {
  if (element.matches('.topbar h1')) {
    return buildValueMeta(
      'Current view title',
      element,
      'state.currentViewTitle, updated when the active navigation view changes.',
    );
  }

  if (element.matches('.auth-button-status-dot')) {
    const authButtonShell = element.closest('.auth-button-shell');
    const buttonKey = authButtonShell?.dataset.authButtonKey ?? 'unknown';
    return buildValueMeta(
      `Auth button ${buttonKey} status`,
      element,
      `state.authPreflight.buttonStates["${buttonKey}"].status/message, updated by the auth action runtime truth handlers.`,
    );
  }

  if (element.matches('.status-badge')) {
    const cardContext = getCardContext(element);
    if (cardContext?.code === '1A-AUTH') {
      return buildValueMeta(
        '1A-AUTH status',
        element,
        'state.statusByKey.B1 plus state.authPreflight.buttonStates, preserved through the legacy B1 compatibility key while the visible card is View A auth preflight.',
      );
    }
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
    if (cardContext?.code === '1A-AUTH') {
      return buildValueMeta(
        '1A-AUTH auth outcome',
        element,
        'state.authPreflight.latestResult.outcome, derived from the latest safe auth backend request.',
      );
    }
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
    if (cardContext?.code === '1A-AUTH') {
      return buildValueMeta(
        '1A-AUTH auth result',
        element,
        'state.authPreflight.latestResult and state.authPreflight.publicState, sanitized by the auth runtime truth handlers.',
      );
    }
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
    const eyebrow = compactWhitespace(element.closest('.view-page')?.querySelector('.eyebrow')?.textContent);
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

function describeSimulationControl(input) {
  if (!input) {
    return null;
  }

  const name = input.name;
  const value = input.value;
  const controlCopy = INSPECT_COPY.simulationControls[name];
  if (!controlCopy) {
    return null;
  }

  if (name === 'execution-mode') {
    return value === 'auto' ? controlCopy.auto : controlCopy.manual;
  }

  if (name === 'input-mode') {
    return value === 'single' ? controlCopy.single : controlCopy.all;
  }

  return controlCopy;
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
    return buildValueMeta(label, element, 'state.lastRunData.media, updated when the C-view demo mode changes or demo state is seeded.');
  }
  if (cardContext?.code === 'C2') {
    return buildValueMeta(label, element, 'state.lastRunData.playback, updated when the C-view demo mode changes or demo state is seeded.');
  }
  if (cardContext?.code === 'C3') {
    return buildValueMeta(label, element, 'state.lastRunData.stage, updated when the C-view demo mode changes or demo state is seeded.');
  }
  if (cardContext?.code === 'C4') {
    return buildValueMeta(label, element, 'state.lastRunData.screen, updated when the C-view demo mode changes or demo state is seeded.');
  }
  if (cardContext?.code === 'D2') {
    return buildValueMeta(label, element, 'state.runningProcess.playbackWorker, updated when the simulated runtime preview starts or changes.');
  }
  if (cardContext?.code === 'D3') {
    return buildValueMeta(label, element, 'state.runningProcess.screenWorker, updated when the simulated runtime preview or screen simulation changes.');
  }
  if (cardContext?.code === 'E1') {
    return buildValueMeta(label, element, 'state.databaseViewer.verification and state.databaseViewer.connection, updated by the live View E verification/connect responses.');
  }
  if (cardContext?.code === 'E2') {
    return buildValueMeta(label, element, 'state.databaseViewer.tables and state.databaseViewer.sqlite, updated by the live View E table-catalog response.');
  }
  if (cardContext?.code === 'E3') {
    return buildValueMeta(label, element, 'state.databaseViewer.rows, updated by the live View E paginated row response.');
  }
  if (cardContext?.code === 'E4') {
    return buildValueMeta(label, element, 'state.databaseViewer.logging, updated by the live View E logging start/stop responses.');
  }
  if (cardContext?.code === '1A-AUTH' && element.closest('.result-surface')) {
    return buildValueMeta(label, element, 'state.authPreflight.latestResult/publicState, filled from the latest sanitized auth backend response.');
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

function fallbackInspectCopy(element) {
  return {
    label: compactWhitespace(element.textContent) || 'Interactive control',
    description: FALLBACK_INSPECT_DESCRIPTION,
  };
}
