/*
 * Renders the V2 startup-mode shell.
 * This first slice owns only the six left-sidebar rows and a blank center panel.
 */
import { V2_OPERATOR_SIDEBAR_ITEMS, type V2OperatorSidebarRoute } from '../data/v2OperatorSidebar.ts';
import { escapeHtml } from '../services/renderers/sharedRendererUtils.ts';

export function renderV2StartupOperatorMenuView(activeRoute: V2OperatorSidebarRoute): string {
  const activeItem = V2_OPERATOR_SIDEBAR_ITEMS.find((item) => item.route === activeRoute) ?? V2_OPERATOR_SIDEBAR_ITEMS[0];

  return `
    <div class="shell v2-operator-shell" data-v2-operator-shell>
      <aside class="sidebar v2-operator-sidebar">
        <div class="brand-card v2-operator-brand">
          <p class="eyebrow">Photo frame operator workspace</p>
          <h1>V2</h1>
          <p class="brand-copy">Six-item operator shell. Entry is visual-only and does not run auth, workers, crontab, database, or recovery actions.</p>
        </div>

        <nav class="nav-card v2-operator-nav" aria-label="V2 operator menu" data-v2-left-sidebar data-v2-sidebar-count="${V2_OPERATOR_SIDEBAR_ITEMS.length}">
          ${V2_OPERATOR_SIDEBAR_ITEMS.map((item) => renderV2SidebarItem(item, activeItem.route)).join('')}
        </nav>
      </aside>

      <main class="main-panel v2-operator-main" data-scroll-preserve="v2-operator-main">
        <header class="topbar v2-operator-topbar">
          <div>
            <p class="eyebrow">V2</p>
            <h1>${escapeHtml(activeItem.label)}</h1>
          </div>
          <span class="pill">Blank shell</span>
        </header>

        <section class="card card--feature v2-operator-blank-panel" aria-label="V2 selected operator area" data-v2-center-panel data-v2-active-route="${escapeHtml(activeItem.route)}">
          <header class="card__header">
            <div>
              <p class="card__code">${escapeHtml(activeItem.order)}</p>
              <h3>${escapeHtml(activeItem.label)}</h3>
            </div>
            <span class="pill">${escapeHtml(activeItem.subtitle)}</span>
          </header>
          <p class="card__copy">This V2 panel is intentionally blank until its center-panel contract is implemented in a later approved slice.</p>
        </section>
      </main>
    </div>
  `;
}

function renderV2SidebarItem(item: (typeof V2_OPERATOR_SIDEBAR_ITEMS)[number], activeRoute: V2OperatorSidebarRoute): string {
  const isActive = item.route === activeRoute;

  return `
    <button
      class="nav-link v2-operator-nav__item ${isActive ? 'nav-link--active v2-operator-nav__item--active' : ''}"
      type="button"
      data-v2-sidebar-route="${escapeHtml(item.route)}"
      data-v2-sidebar-order="${escapeHtml(item.order)}"
    >
      <span class="nav-link__code v2-operator-nav__order">${escapeHtml(item.order)}</span>
      <span class="nav-link__body v2-operator-nav__body">
        <strong data-v2-sidebar-label>${escapeHtml(item.label)}</strong>
        <small>${escapeHtml(item.subtitle)}</small>
      </span>
    </button>
  `;
}
