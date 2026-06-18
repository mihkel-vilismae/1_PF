import {
  buildDefaultDebugPageState,
  DEBUG_ROUTE,
  type DebugPageState,
} from '../services/debugPageModel.ts';

export function renderDebugView(state: Record<string, unknown>, frontendVersion: string): string {
  const debugState = normalizeDebugPageState(state.debugPage);
  return `
    <section class="view-grid debug-page" data-debug-page-route="${DEBUG_ROUTE}" aria-label="Debug Menu">
      <article class="card card--feature debug-page__hero">
        <header class="card__header">
          <div>
            <p class="card__code">DEBUG</p>
            <h2>Debug Menu</h2>
          </div>
          <span class="pill">runtime UI • local safe</span>
        </header>
        <p class="card__copy">Debug route <code>${DEBUG_ROUTE}</code> is available as a lightweight operator surface. This page is browser-local until a later slice wires proof-backed backend actions.</p>
        <dl class="definition-list">
          <div><dt>Route</dt><dd>${DEBUG_ROUTE}</dd></div>
          <div><dt>Frontend version source</dt><dd>v${escapeHtml(frontendVersion)}</dd></div>
          <div><dt>Runtime claim</dt><dd>Debug route/sidebar only; no real crontab, production media/database, worker process, provider, or Raspberry proof.</dd></div>
          <div><dt>Opened</dt><dd>${escapeHtml(debugState.openedAt ?? 'Not recorded yet')}</dd></div>
        </dl>
      </article>
    </section>
  `;
}

function normalizeDebugPageState(value: unknown): DebugPageState {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as DebugPageState;
  }
  return buildDefaultDebugPageState();
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
