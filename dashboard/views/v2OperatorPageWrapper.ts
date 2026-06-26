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

  return `
    <div
      class="shell v2-operator-shell"
      data-v2-operator-shell
      data-v2-page-wrapper="1"
      data-v2-status-id="v2.shared.page-wrapper"
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
        <header class="topbar v2-operator-topbar" data-v2-status-id="${escapeHtml(pageStatusId)}" data-v2-implementation-status="${escapeHtml(pageStatus?.status ?? 'in-progress')}">
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
          <div class="v2-topbar-status">
            <span class="pill">Visual-only blocks</span>
            <span class="pill v2-implementation-pill v2-implementation-pill--${escapeHtml(pageStatus?.status ?? 'in-progress')}">${escapeHtml(pageStatus?.status ?? 'in-progress')}</span>
          </div>
        </header>

        <section class="v2-center-panel" aria-label="V2 selected operator area" data-v2-center-panel data-v2-active-route="${escapeHtml(options.activeItem.route)}">
          <header class="card card--feature v2-center-panel__intro" data-v2-status-id="${escapeHtml(pageStatusId)}" data-v2-implementation-status="${escapeHtml(pageStatus?.status ?? 'in-progress')}">
            <div>
              <p class="card__code">${escapeHtml(options.activeItem.order)}</p>
              <h3>${escapeHtml(options.activeItem.label)}</h3>
            </div>
            <span class="pill">${escapeHtml(options.activeItem.subtitle)}</span>
          </header>
          ${options.centerPanelMarkup}
        </section>

        ${renderV2EventHistoryPanel(options.history, options.historyCopyButtonLabel)}
      </main>
    </div>
  `;
}

function renderV2EventHistoryPanel(history: HistoryEntry[], historyCopyButtonLabel: string): string {
  const eventStatus = getV2ImplementationStatusElement('v2.shared.event-history');

  return `
    <article
      class="card side-panel side-panel--history v2-event-history-panel"
      data-v2-event-history-panel
      data-v2-status-id="v2.shared.event-history"
      data-v2-implementation-status="${escapeHtml(eventStatus?.status ?? 'in-progress')}"
      data-scroll-preserve="v2-event-history-panel"
    >
      <div class="side-panel__header">
        <h2>Event history</h2>
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
