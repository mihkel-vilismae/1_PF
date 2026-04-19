import { statusBadge, renderLogEntries } from '../services/renderers.js';

export function renderInitView(state) {
  return `
    <section class="view-page">
      <div class="view-hero">
        <div>
          <p class="eyebrow">A — Init</p>
          <h2>Prepare the system before any test or real run.</h2>
          <p class="hero-copy">This view groups environment readiness, database lifecycle controls, and cron setup into a clearer operator flow.</p>
        </div>
        <div class="hero-pill-group">
          <span class="hero-pill">Frontend only</span>
          <span class="hero-pill">Ready for future wiring</span>
        </div>
      </div>

      <div class="section-grid section-grid--two">
        ${renderCard('1A', 'Verify .env', state, '1A', '<button class="button button--primary" data-action="verify-env">Run</button>', 'Validate required configuration keys and display placeholder readiness feedback.')}
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
          'Keep the destructive path visible, but clearly separated from the safer inspection actions.',
        )}
      </div>

      ${renderCard(
        '3A',
        'Cron controls',
        state,
        '3A',
        `
          <button class="button button--secondary" data-action="install-cron">Install cron</button>
          <button class="button button--secondary" data-action="check-cron">Check cron</button>
          <button class="button button--secondary" data-action="print-cron">Print cron</button>
        `,
        'Future cron wiring should be shared across setup and runtime views, so this section surfaces the core actions cleanly.',
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
      <div class="log-surface">${renderLogEntries(state.logs[logKey])}</div>
    </article>
  `;
}
