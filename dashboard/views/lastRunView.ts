import { renderDefinitionList, renderLogEntries, renderSourceBadge } from '../services/renderers.ts';

export function renderLastRunView(state) {
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
          The “Refresh” control reads the backend orchestration summary. The “Resume” control stays visible for discoverability but
          remains disabled as a placeholder and does not call any restore endpoint.
        </p>
        <div class="button-row">
          <button class="button button--secondary" data-action="refresh-last-run">Refresh last run</button>
          <button class="button button--primary" data-action="resume-last-run" ${detailsDisabled ? 'disabled' : ''}>Resume from saved state (placeholder)</button>
        </div>
        <div class="log-surface">${renderLogEntries(state.logs.C, { sourceKey: 'C' })}</div>
      </article>
    </section>
  `;
}
