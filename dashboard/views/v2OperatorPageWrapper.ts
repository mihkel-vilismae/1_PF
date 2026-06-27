import { type V2OperatorCenterPanelPage } from '../data/v2OperatorCenterPanel.ts';
import { type V2OperatorSidebarItem, type V2OperatorSidebarRoute } from '../data/v2OperatorSidebar.ts';
import { getV2ImplementationStatusElement, getV2PageStatusId } from '../data/v2ImplementationStatus.ts';
import { renderHistory, type HistoryEntry } from '../services/renderers.ts';
import { escapeHtml } from '../services/renderers/sharedRendererUtils.ts';

type V2OperatorPageWrapperOptions = {
  activeItem: V2OperatorSidebarItem;
  activeRoute: V2OperatorSidebarRoute;
  activePage: V2OperatorCenterPanelPage;
  sidebarMarkup: string;
  centerPanelMarkup: string;
  history: HistoryEntry[];
  historyCopyButtonLabel: string;
  inspectMode: boolean;
  valueInspectMode: boolean;
  implementationStatusMode: boolean;
};

export function renderV2OperatorPageWrapper(options: V2OperatorPageWrapperOptions): string {
  const pageStatusId = getV2PageStatusId(options.activeRoute);
  const pageStatus = getV2ImplementationStatusElement(pageStatusId);
  const pageStatusName = pageStatus?.status ?? 'in-progress';

  return `
    <div
      class="shell v2-operator-shell"
      data-v2-operator-shell
      data-v2-page-wrapper="1"
      ${renderV2ElementStatusAttributes('v2.shared.page-wrapper')}
    >
      <aside class="sidebar v2-operator-sidebar">
        <div class="brand-card v2-operator-brand">
          <p class="eyebrow">Photo frame operator workspace</p>
          <h1>V2</h1>
          <p class="brand-copy">Nine-item operator shell. Entry is visual-only and does not run auth, workers, crontab, database, troubleshooting, or recovery actions.</p>
        </div>

        ${options.sidebarMarkup}
      </aside>

      <main class="main-panel v2-operator-main" data-scroll-preserve="v2-operator-main">
        <header class="topbar v2-operator-topbar" ${renderV2ElementStatusAttributes(pageStatusId)}>
          <div>
            <p class="eyebrow">V2</p>
            <h1>${escapeHtml(options.activePage.title)}</h1>
            <p class="v2-operator-summary">${escapeHtml(options.activePage.summary)}</p>
          </div>
          <div class="v2-topbar-actions" aria-label="V2 explanation and status controls">
            ${renderV2ToolbarButton('toggle-inspect-mode', options.inspectMode ? 'Hide control guide' : 'Explain controls', options.inspectMode, 'Explain what visible V2 controls do.')}
            ${renderV2ToolbarButton('toggle-value-inspect-mode', options.valueInspectMode ? 'Hide value guide' : 'Explain values', options.valueInspectMode, 'Explain where visible V2 values come from.')}
            ${renderV2ToolbarButton('toggle-v2-implementation-status', options.implementationStatusMode ? 'Hide implementation status' : 'Implementation status', options.implementationStatusMode, 'Highlight V2 implementation status from the JSON metadata registry.')}
          </div>
          <!-- Readiness rings: .env, DB, login (placeholder statuses) -->
          <div class="v2-readiness-rings">
            ${renderV2ReadinessRing('env', options.activePage.route)}
            ${renderV2ReadinessRing('db', options.activePage.route)}
            ${renderV2ReadinessRing('login', options.activePage.route)}
          </div>
          <div class="v2-topbar-status">
            <span class="pill">Visual-only blocks</span>
            <span class="pill v2-implementation-pill v2-implementation-pill--${escapeHtml(pageStatusName)}">${escapeHtml(pageStatusName)}</span>
            ${renderV2StatusHelpButton(pageStatusId, options.activePage.title)}
          </div>
        </header>

        <section class="v2-center-panel" aria-label="V2 selected operator area" data-v2-center-panel data-v2-active-route="${escapeHtml(options.activeItem.route)}">
          <header class="card card--feature v2-center-panel__intro" ${renderV2ElementStatusAttributes(pageStatusId)}>
            <div>
              <p class="card__code">${escapeHtml(options.activeItem.order)}</p>
              <h3>${escapeHtml(options.activeItem.label)}</h3>
            </div>
            <span class="pill">${escapeHtml(options.activeItem.subtitle)}</span>
              ${renderV2StatusHelpButton(pageStatusId, options.activePage.title)}
          </header>
          ${options.centerPanelMarkup}
        </section>

        ${renderV2EventHistoryPanel(options.history, options.historyCopyButtonLabel)}
      </main>
    </div>
  `;
}

function renderV2ElementStatusAttributes(statusId: string): string {
  const status = getV2ImplementationStatusElement(statusId);
  const statusName = status?.status ?? 'in-progress';
  return `data-v2-status-id="${escapeHtml(statusId)}" data-v2-implementation-status="${escapeHtml(statusName)}" data-v2-status-label="${escapeHtml(status?.label ?? statusId)}" data-v2-status-help="${escapeHtml(status?.summary ?? 'Status/help metadata exists, but this item has no dedicated registry entry yet.')}"`;
}

function renderV2EventHistoryPanel(history: HistoryEntry[], historyCopyButtonLabel: string): string {
  return `
    <article
      class="card side-panel side-panel--history v2-event-history-panel"
      data-v2-event-history-panel
      ${renderV2ElementStatusAttributes('v2.shared.event-history')}
      data-scroll-preserve="v2-event-history-panel"
    >
      <div class="side-panel__header">
        <h2>Event history</h2>
        ${renderV2StatusHelpButton('v2.shared.event-history', 'Event history')}
        <div class="side-panel__actions">
          <button class="button button--ghost" data-action="copy-history">${escapeHtml(historyCopyButtonLabel)}</button>
          <button class="button button--ghost" data-action="clear-history">Clear</button>
        </div>
      </div>
      <div class="history-surface" data-scroll-preserve="v2-event-history-surface">${renderHistory(history)}</div>
    </article>
  `;
}

function renderV2ToolbarButton(action: string, label: string, active: boolean, title: string): string {
  return `
    <button
      class="button ${active ? 'button--primary' : 'button--secondary'} v2-topbar-action"
      type="button"
      data-action="${escapeHtml(action)}"
      aria-pressed="${active ? 'true' : 'false'}"
      title="${escapeHtml(title)}"
    >
      ${escapeHtml(label)}
    </button>
  `;
}

function renderV2StatusHelpButton(statusId: string, label: string): string {
  return `
    <button
      class="v2-status-help-button"
      type="button"
      data-action="show-v2-status-help"
      data-v2-help-status-id="${escapeHtml(statusId)}"
      aria-label="Show implementation status for ${escapeHtml(label)}"
      title="Show implementation status"
    >?</button>
  `;
}

/*
 * Renders a simple readiness ring. This is a placeholder implementation. In a future slice the
 * status argument should come from runtimeState.readiness to show whether the .env, database,
 * or login checks have passed. For now the status is hard-coded to `unknown` and the label
 * is derived from the type.
 */
function renderV2ReadinessRing(type: 'env' | 'db' | 'login', _route: string): string {
  const status = 'unknown';
  const label = type === 'env' ? '.env' : type === 'db' ? 'DB' : 'Login';
  return `
    <span class="readiness-ring readiness-ring--${escapeHtml(status)}" data-readiness-type="${escapeHtml(type)}" title="${escapeHtml(label)} readiness status">
      <span class="readiness-ring__label">${escapeHtml(label)}</span>
    </span>
  `;
}
