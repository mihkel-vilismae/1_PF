/*
 * Provides backend-support classifications for explain backend-status mode.
 * Action metadata is resolved from central backend-status copy registries.
 */
import { ACTION_BACKEND_STATUS_COPY, INIT_ACTION_TO_CODE } from '../guideCopy.ts';
import { getAuthButtonBackendStatusCopy } from '../../data/authButtonStatusCopy.ts';
import { getSchedulerEmulatorButtonBackendStatusCopy } from '../../data/schedulerEmulatorStatusCopy.ts';
import { buildBackendStatusMeta, compactWhitespace, getCardContext, isMissingBackendStatus } from '../guideUtils.ts';
import { createBackendStatusResolvers } from './statusResolvers.ts';

export function createDescribeBackendStatusElement({ getState, getTransitHasLiveTraffic }) {
  const {
    describeHistoryEntryFromDetails,
    getSectionBackendStatusByCode,
    getInitBackendStatusMeta,
    getAuthBackendStatusMeta,
    getDatabaseViewerBackendStatusMeta,
  } = createBackendStatusResolvers({ getState, getTransitHasLiveTraffic });

  function describeBackendStatusElement(element) {
    if (element.matches('.button, .db-object-button')) {
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
    if (element.matches('.db-table-shell')) {
      return buildBackendStatusMeta('real', 'Database row table', 'This table is filled from the live `/api/database-viewer/rows` endpoint.');
    }
    if (element.matches('.db-activity-entry')) {
      return buildBackendStatusMeta('real', 'DB activity entry', 'This entry is filled from the live View E logging session payload.');
    }
    if (element.matches('.preview-frame')) {
      return buildBackendStatusMeta('missing', 'Playback preview surface', 'This preview stands in for backend/runtime support that is not implemented yet.');
    }
    if (element.matches('.screen-indicator')) {
      return buildBackendStatusMeta(
        'real',
        compactWhitespace(element.textContent) || 'Preview indicator',
        'This indicator is driven by backend-owned simulation state. It is not real screen hardware telemetry.',
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

  // Describes whether an action button is wired to a backend endpoint or remains local.
  function describeButtonBackendStatus(element) {
    const label = compactWhitespace(element.textContent) || 'Button';
    const action = element.dataset.action;

    if (action && INIT_ACTION_TO_CODE[action]) {
      return getInitBackendStatusMeta(INIT_ACTION_TO_CODE[action], label);
    }
    if (action && getAuthButtonBackendStatusCopy(action)) {
      const meta = getAuthButtonBackendStatusCopy(action);
      return buildBackendStatusMeta(meta.state, label, meta.reason);
    }
    if (action && getSchedulerEmulatorButtonBackendStatusCopy(action)) {
      const meta = getSchedulerEmulatorButtonBackendStatusCopy(action);
      return buildBackendStatusMeta(meta.state, label, meta.reason);
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
    if (element.dataset.dbTable) {
      return buildBackendStatusMeta('real', label, 'This button triggers a live `/api/database-viewer/rows` request for the selected table.');
    }
    if (element.dataset.dbPageDelta) {
      return buildBackendStatusMeta('real', label, 'This button triggers a live `/api/database-viewer/rows` pagination request.');
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
    if (text.includes('mixed view')) {
      return buildBackendStatusMeta('unknown', label, 'This pill explicitly marks a view that mixes real backend actions with mock-only surfaces.');
    }
    if (text.includes('real actions present')) {
      return buildBackendStatusMeta('real', label, 'This pill marks a section that already has real backend-backed actions.');
    }
    if (text.includes('placeholders still visible') || text.includes('simulation only') || text.includes('mock stage') || text.includes('mock view')) {
      return buildBackendStatusMeta('mock', label, 'This view or stage is explicitly simulation-only rather than backend-backed.');
    }
    if (text.includes('preview active') || text.includes('preview inactive')) {
      return buildBackendStatusMeta('missing', label, 'This preview exists because the real runtime backend support is not implemented here yet.');
    }
    if (text.includes('backend-backed browsing')) {
      return buildBackendStatusMeta('real', label, 'This pill describes View E functionality that already calls real backend routes.');
    }
    if (text.includes('repo-local activity logging only')) {
      return buildBackendStatusMeta('real', label, 'This pill describes the real implemented scope of the View E logging backend.');
    }

    return buildBackendStatusMeta('unknown', label, 'No explicit backend-status classification metadata is defined for this hero pill yet.');
  }

  function describePillBackendStatus(element) {
    const label = compactWhitespace(element.textContent) || 'Pill';
    const text = label.toLowerCase();

    if (text.includes('wired') && text.includes('simulated')) {
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
    if (cardContext.code === '1A-AUTH') {
      return getAuthBackendStatusMeta('1A-AUTH backend result panel');
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
      return buildBackendStatusMeta('unknown', `${label} value`, 'This value comes from frontend dashboard truth state that is file-synced through the backend, not from a live runtime monitor endpoint.');
    }
    if (cardContext?.code === '1A-AUTH' && element.closest('.result-surface')) {
      return getAuthBackendStatusMeta(`${label} value`);
    }
    if (cardContext?.code && ['1A', '2A', '3A'].includes(cardContext.code) && element.closest('.result-surface')) {
      return getInitBackendStatusMeta(cardContext.code, `${label} value`);
    }
    if (cardContext?.code && ['B2', 'B3.1', 'B3.2', 'B3.5', 'B4'].includes(cardContext.code)) {
      return buildBackendStatusMeta('real', `${label} value`, 'This displayed value is updated from a real backend action response.');
    }
    if (cardContext?.code && ['B1', 'B3'].includes(cardContext.code)) {
      return buildBackendStatusMeta('mock', `${label} value`, 'This displayed value still comes from frontend-only placeholder state.');
    }
    if (cardContext?.code === 'B5') {
      return buildBackendStatusMeta('real', `${label} value`, 'This value is updated from the backend-owned screen simulation contract, not real hardware.');
    }
    if (cardContext?.code && ['E1', 'E2', 'E3', 'E4'].includes(cardContext.code)) {
      return getDatabaseViewerBackendStatusMeta(cardContext.code, `${label} value`);
    }
    if (cardContext?.code && ['C1', 'C2', 'C3'].includes(cardContext.code)) {
      return buildBackendStatusMeta('real', `${label} value`, 'This value is derived from the live orchestration last-run endpoint.');
    }
    if (cardContext?.code === 'C4') {
      return buildBackendStatusMeta('mock', `${label} value`, 'The orchestration last-run endpoint does not include real screen hardware state; this value is an honest fallback.');
    }
    if (cardContext?.code === 'C5') {
      return buildBackendStatusMeta('missing', `${label} value`, 'Restore remains unavailable because no real restore backend endpoint is implemented.');
    }
    if (cardContext?.code && ['D1', 'D2', 'D3', 'D4'].includes(cardContext.code)) {
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

    if (text.includes('backend last-run endpoint')) {
      return buildBackendStatusMeta('real', label, 'This notice is rendered from the read-only backend orchestration last-run response.');
    }
    if (text.includes('failed to load the backend last-run')) {
      return buildBackendStatusMeta('real', label, 'This notice reports a failed backend orchestration last-run request.');
    }
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
    const index = Number(element.dataset.logEntryIndex);
    const entry = sourceKey ? getState().logs[sourceKey]?.[index] : null;

    if (!sourceKey) {
      return buildBackendStatusMeta('unknown', label, 'No explicit source key is available for this log entry.');
    }
    if (sourceKey === 'B1') {
      return getAuthBackendStatusMeta(label, entry);
    }
    if (['1A', '2A', '3A'].includes(sourceKey)) {
      return getInitBackendStatusMeta(sourceKey, label, entry);
    }
    if (sourceKey.startsWith('E')) {
      return getDatabaseViewerBackendStatusMeta(sourceKey, label, entry);
    }
    if (['B2', 'B3.1', 'B3.2', 'B3.5', 'B4'].includes(sourceKey)) {
      return buildBackendStatusMeta('real', label, 'This log entry captures a real backend action response.');
    }
    if (sourceKey === 'B5') {
      return buildBackendStatusMeta('real', label, 'This log entry comes from the backend-owned screen simulation contract. It does not represent real hardware.');
    }
    if (sourceKey === 'C') {
      return buildBackendStatusMeta('real', label, 'This log source includes read-only backend orchestration last-run requests; restore entries remain placeholder-only.');
    }
    if (sourceKey.startsWith('B') || sourceKey === 'D') {
      return buildBackendStatusMeta('missing', label, 'This log entry comes from a UI surface that stands in for missing backend/runtime support.');
    }

    return buildBackendStatusMeta('unknown', label, 'No explicit backend-status classification metadata is defined for this log source.');
  }

  function describeHistoryBackendStatus(element) {
    const entry = getState().history[Number(element.dataset.historyEntryIndex)];
    const source = entry?.source ?? 'Unknown';

    if (['INIT', 'DB', 'SCHEDULER'].includes(source)) {
      return describeHistoryEntryFromDetails(`${source} history event`, entry);
    }
    if (source === 'RECOVERY' && entry?.details?.response) {
      return describeHistoryEntryFromDetails(`${source} history event`, entry);
    }
    if (['TEST', 'PIPELINE', 'PLAYBACK', 'RECOVERY', 'RUNTIME'].includes(source)) {
      return buildBackendStatusMeta('missing', `${source} history event`, 'This history event belongs to UI behavior that stands in for missing backend/runtime support.');
    }
    if (source === 'SCREEN' && entry?.details?.response) {
      return describeHistoryEntryFromDetails(`${source} history event`, entry);
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
      if (sourceKey === 'B1') {
        return getAuthBackendStatusMeta(`${label} modal value`, modal.entry);
      }
      if (['1A', '2A', '3A'].includes(sourceKey)) {
        return getInitBackendStatusMeta(sourceKey, `${label} modal value`, modal.entry);
      }
      if (sourceKey?.startsWith('E')) {
        return getDatabaseViewerBackendStatusMeta(sourceKey, `${label} modal value`, modal.entry);
      }
      if (sourceKey === 'B5') {
        return buildBackendStatusMeta('real', `${label} modal value`, 'This modal is showing details from the backend-owned screen simulation contract.');
      }
      if (sourceKey === 'B3.1') {
        return buildBackendStatusMeta('mock', `${label} modal value`, 'This modal is showing details for frontend-only simulation data.');
      }
      if (sourceKey === 'C') {
        return buildBackendStatusMeta('real', `${label} modal value`, 'This modal is showing read-only backend orchestration last-run details or an explicit restore placeholder log.');
      }
      if (typeof sourceKey === 'string' && (sourceKey.startsWith('B') || sourceKey === 'D')) {
        return buildBackendStatusMeta('missing', `${label} modal value`, 'This modal is showing details for a UI surface that stands in for missing backend/runtime support.');
      }
    }

    if (modal?.kind === 'history') {
      return describeHistoryEntryFromDetails(`${label} modal value`, modal.entry);
    }

    return buildBackendStatusMeta('unknown', `${label} modal value`, 'No explicit backend-status classification metadata is defined for this modal field yet.');
  }


  return describeBackendStatusElement;
}
