import { VIEW_ORDER } from '../shared/constants.ts';
import { ACTION_REALITY_COPY, VIEW_REALITY_COPY } from './guideCopy.ts';
import { getAuthButtonRealityCopy } from '../data/authButtonStatusCopy.ts';
import { buildRealityMeta, compactWhitespace, getCardContext } from './guideUtils.ts';

export function createRealityMetadataHelpers({ getState, getTransitHasLiveTraffic }) {
  function describeRealityElement(element) {
    if (element.matches('.nav-link')) {
      return describeViewReality(element.dataset.view);
    }

    if (element.matches('.button, .db-object-button')) {
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

    if (element.matches('.db-table-shell')) {
      return buildRealityMeta('real', 'Database row table', 'This table renders rows returned by the live View E backend row endpoint.');
    }

    if (element.matches('.db-activity-entry')) {
      return buildRealityMeta('real', 'DB activity entry', 'This entry comes from the bounded repo-local DB logging session returned by the live View E backend.');
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
      return buildRealityMeta('mock', compactWhitespace(element.textContent) || 'Notice', 'This notice belongs to a demo-only or preview-only area of the dashboard.');
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

    if (action && getAuthButtonRealityCopy(action)) {
      const meta = getAuthButtonRealityCopy(action);
      return buildRealityMeta(meta.state, label, meta.reason);
    }
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
    if (element.dataset.dbTable) {
      return buildRealityMeta('real', label, 'Loads paginated rows for the selected table through the live database viewer backend.');
    }
    if (element.dataset.dbPageDelta) {
      return buildRealityMeta('real', label, 'Requests the previous or next backend-owned page of rows for the currently selected table.');
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
    if (text.includes('backend-backed browsing')) {
      return buildRealityMeta('real', label, 'This statement reflects live backend wiring for the View E database viewer routes.');
    }
    if (text.includes('repo-local activity logging only')) {
      return buildRealityMeta('real', label, 'This statement intentionally narrows the DB logging claim to the real repo-local backend scope that is implemented.');
    }

    return buildRealityMeta('unknown', label, 'No explicit real/mock classification metadata is defined for this hero pill yet.');
  }

  function describePillReality(element) {
    const label = compactWhitespace(element.textContent) || 'Pill';
    const text = label.toLowerCase();

    if (text.includes('wired') && text.includes('simulated')) {
      return buildRealityMeta('mixed', label, 'This summary intentionally describes a hybrid dashboard where Views A and E are backend-wired while Views B-D remain simulated.');
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

    if (cardContext.code === '1A-AUTH') {
      return buildRealityMeta('real', '1A-AUTH backend result panel', 'Rendered from the latest real auth backend request through the safe auth preflight service.');
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
      return buildRealityMeta('mock', `${label} value`, 'Rendered from frontend dashboard truth state that is mirrored to conf/runtime-truth.json, not from a live runtime backend projection.');
    }
    if (cardContext?.code === '1A-AUTH' && element.closest('.result-surface')) {
      return buildRealityMeta('real', `${label} value`, 'Rendered from the latest safe auth backend response captured for 1A-AUTH.');
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
    const entry = getState().history[Number(element.dataset.historyEntryIndex)];
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
      if (['1A', '2A', '3A', 'B1'].includes(sourceKey)) {
        return buildRealityMeta('real', `${label} modal value`, 'This modal is showing details for a real backend-backed View A/auth log entry.');
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
    if (['1A', '2A', '3A', '1A-AUTH'].includes(code)) {
      return buildRealityMeta('real', label, 'This section is backed by live View A backend endpoints; 1A-AUTH remains provider-dependent for icloudpd outcomes.');
    }
    if (code === 'IO') {
      return buildRealityMeta(
        getTransitHasLiveTraffic() ? 'real' : 'mixed',
        label,
        getTransitHasLiveTraffic()
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
    if (typeof code === 'string' && code.startsWith('E')) {
      return buildRealityMeta('real', label, 'This section is backed by live database viewer backend endpoints or their direct UI projections.');
    }

    return buildRealityMeta('unknown', label, 'No explicit real/mock classification metadata is defined for this section yet.');
  }

  return { describeRealityElement };
}
