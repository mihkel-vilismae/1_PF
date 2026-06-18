/*
 * Renders View C, the last-run and restore-status dashboard surface.
 * The view is read-only for normal restore data and keeps placeholders explicit.
 * Test Mode may render a guarded TESTING panel for dirty-shutdown experiments.
 * Real Mode must hide destructive testing affordances from the DOM.
 */
import { renderDefinitionList, renderLogEntries, renderSourceBadge } from '../services/renderers.ts';

// Renders View C and includes Test Mode-only dirty-shutdown controls when selected.
export function renderLastRunView(state, dashboardVisualMode = null) {
  const mode = state.lastRunMode;
  const noRun = mode === 'none';
  const error = mode === 'error';
  const detailsDisabled = noRun || error;

  return `
    <section class="view-page">
      <div class="view-hero view-hero--hybrid">
        <div>
          <p class="eyebrow">C — Last Run Info</p>
          <!-- Updated copy clarifies that this page presents a read‑only snapshot and does not perform restore -->
          <h2>View the latest orchestration run summary from the backend.</h2>
          <p class="hero-copy">
            This page displays a <strong>read‑only</strong> snapshot retrieved from
            <code>GET /api/runtime/orchestration/last</code>.
            It does not perform any restore: the “Resume” control is disabled until a deliberate restore contract exists.
          </p>
          <p class="hero-copy">
            Values shown below reflect the durable runtime snapshot recorded in SQLite. Any missing or error states are reported
            honestly instead of implying success or restore support.
          </p>
        </div>
        <div class="hero-pill-group">
          ${renderSourceBadge('hybrid', 'PARTIAL VIEW')}
          ${renderSourceBadge('real', 'BACKEND LAST-RUN READ')}
          ${renderSourceBadge('mock', 'RESTORE PLACEHOLDER')}
        </div>
      </div>

      ${noRun ? '<div class="notice notice--neutral">No orchestration run has been recorded yet; refresh after running the pipeline to see details.</div>' : ''}
      ${error ? '<div class="notice notice--danger">Could not load the last-run summary from the backend; see logs for details.</div>' : ''}

      <div class="section-grid section-grid--two ${detailsDisabled ? 'section-grid--muted' : ''}">
        <article class="card card--hybrid"><header class="card__header"><div><p class="card__code">C1</p><h3>Last shown media</h3></div><div class="card__header-tags">${renderSourceBadge('hybrid', 'ORCHESTRATION')}</div></header>${renderDefinitionList(state.lastRunData.media)}</article>
        <article class="card card--hybrid"><header class="card__header"><div><p class="card__code">C2</p><h3>Playback state</h3></div><div class="card__header-tags">${renderSourceBadge('hybrid', 'ORCHESTRATION')}</div></header>${renderDefinitionList(state.lastRunData.playback)}</article>
        <article class="card card--hybrid"><header class="card__header"><div><p class="card__code">C3</p><h3>Stage context</h3></div><div class="card__header-tags">${renderSourceBadge('real', 'BACKEND')}</div></header>${renderDefinitionList(state.lastRunData.stage)}</article>
        <article class="card card--hybrid"><header class="card__header"><div><p class="card__code">C4</p><h3>Screen state</h3></div><div class="card__header-tags">${renderSourceBadge('mock', 'NOT IN PAYLOAD')}</div></header>${renderDefinitionList(state.lastRunData.screen)}</article>
      </div>

      <article class="card card--hybrid">
        <header class="card__header"><div><p class="card__code">C5</p><h3>Restore and evidence</h3></div><div class="card__header-tags">${renderSourceBadge('hybrid', 'PARTIAL')}</div></header>
        <p class="card__copy">
          The “Refresh” control reads the backend orchestration summary. Restore is deliberately read-only here: the placeholder control stays visible for discoverability, remains disabled when no valid run exists, and does not call any restore endpoint.
        </p>
        <div class="button-row">
          <button class="button button--secondary" data-action="refresh-last-run">Refresh last run</button>
          <button class="button button--primary" data-action="resume-last-run" data-restore-contract-status="not-implemented" disabled aria-disabled="true">Restore action not implemented</button>
        </div>
        <div class="log-surface" data-scroll-preserve="log-C">${renderLogEntries(state.logs.C, { sourceKey: 'C' })}</div>
      </article>

      ${renderTestingPanel(dashboardVisualMode)}
    </section>
  `;
}


// Renders the Test Mode-only dirty-shutdown testing panel for View C.
function renderTestingPanel(dashboardVisualMode) {
  if (dashboardVisualMode !== 'test') {
    return '';
  }
  return `
      <article class="card card--mock" data-testid="view-c-testing-panel">
        <header class="card__header"><div><p class="card__code">C-TEST</p><h3>TESTING</h3></div><div class="card__header-tags">${renderSourceBadge('mock', 'TEST MODE ONLY')}</div></header>
        <p class="card__copy">
          Test Mode only: plan or request a guarded dirty-shutdown simulation to exercise recovery behavior.
          The first safe version never kills the backend and does not use broad process-name matching.
        </p>
        <p class="notice notice--warning">
          This simulates unexpected shutdown conditions for software recovery tests. It does not prove real Raspberry hardware power loss.
        </p>
        <div class="button-row">
          <button class="button button--secondary" data-action="plan-dirty-shutdown-test">Plan dirty shutdown test</button>
          <button class="button button--danger" data-action="simulate-dirty-shutdown">Simulate dirty shutdown</button>
        </div>
      </article>
  `;
}
