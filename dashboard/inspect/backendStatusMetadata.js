import { ACTION_BACKEND_STATUS_COPY, INIT_ACTION_TO_CODE } from './guideCopy.js';
import { getAuthButtonBackendStatusCopy } from '../data/authButtonStatusCopy.ts';
import { buildBackendStatusMeta, compactWhitespace, getCardContext, isMissingBackendStatus } from './guideUtils.ts';

export function createBackendStatusMetadataHelpers({ getState, getTransitHasLiveTraffic }) {
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
    if (action && getAuthButtonBackendStatusCopy(action)) {
      const meta = getAuthButtonBackendStatusCopy(action);
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
      return buildBackendStatusMeta('mock', `${label} value`, 'This value is driven by frontend-only simulation controls.');
    }
    if (cardContext?.code && ['E1', 'E2', 'E3', 'E4'].includes(cardContext.code)) {
      return getDatabaseViewerBackendStatusMeta(cardContext.code, `${label} value`);
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
      return buildBackendStatusMeta('mock', label, 'This log entry comes from frontend-only simulation behavior.');
    }
    if (sourceKey.startsWith('B') || sourceKey === 'C' || sourceKey === 'D') {
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
      if (sourceKey === 'B1') {
        return getAuthBackendStatusMeta(`${label} modal value`, modal.entry);
      }
      if (['1A', '2A', '3A'].includes(sourceKey)) {
        return getInitBackendStatusMeta(sourceKey, `${label} modal value`, modal.entry);
      }
      if (sourceKey?.startsWith('E')) {
        return getDatabaseViewerBackendStatusMeta(sourceKey, `${label} modal value`, modal.entry);
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
    if (code === '1A-AUTH') {
      return getAuthBackendStatusMeta(label);
    }
    if (['1A', '2A', '3A'].includes(code)) {
      return getInitBackendStatusMeta(code, label);
    }
    if (typeof code === 'string' && code.startsWith('E')) {
      return getDatabaseViewerBackendStatusMeta(code, label);
    }
    if (code === 'B3.1' || code === 'B5') {
      return buildBackendStatusMeta('mock', label, 'This section is intentionally frontend-only simulation rather than backend-backed.');
    }
    if (['B1', 'B2', 'B3', 'B3.2', 'B3.5', 'B4', 'C', 'C1', 'C2', 'C3', 'C4', 'C5', 'D1', 'D2', 'D3', 'D4'].includes(code)) {
      return buildBackendStatusMeta('missing', label, 'This section stands in for backend/runtime support that is not implemented here yet.');
    }
    if (code === 'IO') {
      return buildBackendStatusMeta(
        getTransitHasLiveTraffic() ? 'real' : 'unknown',
        label,
        getTransitHasLiveTraffic()
          ? 'This terminal is currently showing real gateway traffic from dashboard API calls.'
          : 'This terminal is implemented, but no live backend traffic has been observed yet.',
      );
    }

    return buildBackendStatusMeta('unknown', label, 'No explicit backend-status classification metadata is defined for this section yet.');
  }

  function getInitBackendStatusMeta(code, label, entry = null) {
    const result = getState().initResults[code];
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

  function getAuthBackendStatusMeta(label, entry = null) {
    const result = getState().authPreflight?.latestResult ?? null;
    const responseStatus = entry?.details?.response?.status ?? result?.status ?? null;

    if (isMissingBackendStatus(responseStatus)) {
      return buildBackendStatusMeta('missing', label, 'The latest auth response indicates the expected auth backend endpoint/implementation is missing.');
    }
    if (result?.outcome === 'error') {
      return buildBackendStatusMeta('real', label, 'This UI is wired to live auth backend endpoints, but the latest provider/auth request failed for a non-missing reason.');
    }
    if (result?.outcome === 'running') {
      return buildBackendStatusMeta('real', label, 'This UI is currently waiting on a live auth backend request.');
    }
    if (result?.outcome === 'success') {
      return buildBackendStatusMeta('real', label, 'This UI is backed by live auth endpoints and has a captured safe auth response.');
    }

    return buildBackendStatusMeta('real', label, 'This UI is wired to live /api/auth/* endpoints; icloudpd outcomes remain provider-dependent and 2FA may still be unsupported.');
  }

  function getDatabaseViewerBackendStatusMeta(code, label, entry = null) {
    const result = getState().databaseViewer?.results?.[code] ?? null;
    const responseStatus = entry?.details?.response?.status ?? result?.status ?? null;

    if (isMissingBackendStatus(responseStatus)) {
      return buildBackendStatusMeta('missing', label, `The latest response for ${code} indicates the expected database viewer backend endpoint is missing.`);
    }
    if (result?.outcome === 'error') {
      return buildBackendStatusMeta('real', label, `This UI is wired to a live database viewer endpoint, but the latest request for ${code} failed for a non-missing reason.`);
    }
    if (result?.outcome === 'running') {
      return buildBackendStatusMeta('real', label, `This UI is currently waiting on a real database viewer backend request for ${code}.`);
    }
    if (result?.outcome === 'success') {
      return buildBackendStatusMeta('real', label, `This UI is backed by a live database viewer backend endpoint and has a captured response for ${code}.`);
    }

    return buildBackendStatusMeta('real', label, `This UI is wired to a live database viewer backend endpoint for ${code}, even if it has not been called yet.`);
  }

  return { describeBackendStatusElement };
}
