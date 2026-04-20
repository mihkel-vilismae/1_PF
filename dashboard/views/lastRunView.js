import { renderDefinitionList, renderLogEntries } from '../services/renderers.js';

export function renderLastRunView(state) {
  const mode = state.lastRunMode;
  const noRun = mode === 'none';
  const error = mode === 'error';
  const detailsDisabled = noRun || error;

  return `
    <section class="view-page">
      <div class="view-hero">
        <div>
          <p class="eyebrow">C — Last Run Info</p>
          <h2>Inspect the most recent known run and decide whether to resume.</h2>
          <p class="hero-copy">This view currently uses frontend demo state switches so the recovery layout can be reviewed before any real <code>/api/runtime/*</code> wiring exists.</p>
        </div>
        <div class="hero-pill-group">
          <button class="button button--secondary" data-last-run-mode="none">Show no-run demo</button>
          <button class="button button--secondary" data-last-run-mode="error">Show error demo</button>
          <button class="button button--secondary" data-last-run-mode="ready">Show ready demo</button>
        </div>
      </div>

      ${noRun ? '<div class="notice notice--neutral">Demo state: no saved run is available.</div>' : ''}
      ${error ? '<div class="notice notice--danger">Demo state: failed to load the last run source of truth.</div>' : ''}

      <div class="section-grid section-grid--two ${detailsDisabled ? 'section-grid--muted' : ''}">
        <article class="card"><header class="card__header"><div><p class="card__code">C1</p><h3>Last shown media</h3></div></header>${renderDefinitionList(state.lastRunData.media)}</article>
        <article class="card"><header class="card__header"><div><p class="card__code">C2</p><h3>Playback state</h3></div></header>${renderDefinitionList(state.lastRunData.playback)}</article>
        <article class="card"><header class="card__header"><div><p class="card__code">C3</p><h3>Stage context</h3></div></header>${renderDefinitionList(state.lastRunData.stage)}</article>
        <article class="card"><header class="card__header"><div><p class="card__code">C4</p><h3>Screen state</h3></div></header>${renderDefinitionList(state.lastRunData.screen)}</article>
      </div>

      <article class="card">
        <header class="card__header"><div><p class="card__code">C5</p><h3>Restore and evidence</h3></div></header>
        <p class="card__copy">The button stays visible so the eventual recovery path is easy to find, but it remains a placeholder until the runtime restore endpoints are implemented.</p>
        <div class="button-row">
          <button class="button button--primary" data-action="resume-last-run" ${detailsDisabled ? 'disabled' : ''}>Resume from saved state (placeholder)</button>
        </div>
        <div class="log-surface">${renderLogEntries(state.logs.C, { sourceKey: 'C' })}</div>
      </article>
    </section>
  `;
}
