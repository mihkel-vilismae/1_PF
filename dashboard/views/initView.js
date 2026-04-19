import { statusBadge, renderLogEntries, renderResultSurface } from '../services/renderers.js';

export function renderInitView(state) {
  return `
    <section class="view-page">
      <div class="view-hero">
        <div>
          <p class="eyebrow">A — Init</p>
          <h2>Prepare the system before any test or real run.</h2>
          <p class="hero-copy">This view now calls the documented init endpoints for environment, database, and scheduler work, while the rest of the dashboard remains prototype-driven.</p>
        </div>
        <div class="hero-pill-group">
          <span class="hero-pill hero-pill--success">Backend contract wired</span>
          <span class="hero-pill">Backend still required</span>
        </div>
      </div>

      <div class="section-grid section-grid--two">
        ${renderCard('1A', 'Verify .env', state, '1A', '<button class="button button--primary" data-action="verify-env">Run</button>', 'Validate required configuration keys and render the backend response payload directly in this card.')}
        ${renderCard(
          '2A',
          'Database controls',
          state,
          '2A',
          `
            <button class="button button--secondary" data-action="check-db">Check DB</button>
            <button class="button button--secondary" data-action="inspect-db">Inspect DB</button>
            <button class="button button--danger" data-action="delete-db">Delete DB</button>
            <button class="button button--secondary" data-action="recreate-db">Recreate DB</button>
          `,
          'Database actions now target the documented init endpoints and should surface backend summaries or failures here.',
        )}
      </div>

      ${renderCard(
        '3A',
        'Scheduler controls',
        state,
        '3A',
          `
            <button class="button button--secondary" data-action="install-cron">Install scheduler</button>
            <button class="button button--secondary" data-action="check-cron">Check scheduler</button>
            <button class="button button--secondary" data-action="print-cron">Print scheduler</button>
          `,
          'The legacy cron routes now manage the real platform scheduler target and display the latest backend payload below the action row.',
      )}
    </section>
  `;
}

function renderCard(code, title, state, logKey, actions, copy) {
  return `
    <article class="card">
      <header class="card__header">
        <div>
          <p class="card__code">${code}</p>
          <h3>${title}</h3>
        </div>
        ${statusBadge(state.statusByKey[code])}
      </header>
      <p class="card__copy">${copy}</p>
      <div class="button-row">${actions}</div>
      ${renderResultSurface(state.initResults[code])}
      <div class="log-surface">${renderLogEntries(state.logs[logKey])}</div>
    </article>
  `;
}
