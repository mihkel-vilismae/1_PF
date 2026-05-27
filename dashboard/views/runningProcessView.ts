import { renderDefinitionList, statusBadge, renderLogEntries, renderSourceBadge } from '../services/renderers.ts';

export function renderRunningProcessView(state) {
  const real = Boolean(state.truth.realRunActive);
  const mode = real ? 'real' : 'mock';
  const heroTitle = real
    ? 'Monitor the live runtime process'
    : 'Preview the runtime monitor without implying live backend worker activity.';
  // Provide richer hero copy explaining the origin of each field in the runtime projection.
  const heroCopy = real
    ? 'This view presents a combined runtime projection assembled from authoritative sources. Stage and worker statuses are computed from locks and current process state; heartbeats are read from worker heartbeat files; current media and screen state come from the SQLite database; summaries are computed; log entries display the latest worker log tail. Use Refresh to update statuses.'
    : 'This view is still a frontend‑only runtime preview. It shows the intended pipeline and watchdog layout, including field‑origin labels for status (computed), heartbeat (heartbeat file), state values (database) and summary (computed), but all worker data here remains simulated until real runtime monitor APIs exist.';
  const heroPillLabel = real ? 'Live monitor' : 'Preview inactive';
  const heroPillClass = real ? 'hero-pill--success' : '';
  const heroButtonAction = real ? 'refresh-running-process' : 'start-real-run';
  const heroButtonLabel = real ? 'Refresh monitor' : 'Start simulated runtime preview';
  const disabled = !real;
  return `
    <section class="view-page">
      <div class="view-hero view-hero--${mode}">
        <div>
          <p class="eyebrow">D — Running Process</p>
          <h2>${heroTitle}</h2>
          <p class="hero-copy">${heroCopy}</p>
        </div>
        <div class="hero-pill-group">
          ${renderSourceBadge(mode, mode.toUpperCase() + ' VIEW')}
          <span class="hero-pill ${heroPillClass}">${heroPillLabel}</span>
          <button class="button button--secondary" data-action="${heroButtonAction}">${heroButtonLabel}</button>
        </div>
      </div>

      ${
        real
          ? '<div class="notice notice--neutral">Live monitor is active. Worker rows below reflect backend worker state.</div>'
          : '<div class="notice notice--neutral notice--mock">No simulated runtime preview is currently active.</div>'
      }

      <div class="section-grid ${disabled ? 'section-grid--muted' : ''}">
        <article class="card ${mode === 'real' ? 'card--feature' : 'card--mock card--feature'} card--pending">
          <header class="card__header"><div><p class="card__code">D1</p><h3>Pipeline worker</h3></div><div class="card__header-tags">${renderSourceBadge(mode, mode.toUpperCase())}</div>${statusBadge(state.statusByKey.D1)}</header>
          <p class="card__copy">Sources: stage status & summary are computed; last run times come from the database.</p>
          <div class="worker-list">
            ${state.runningProcess.pipelineStages
              .map(
                (stage) => `
                  <article class="worker-row worker-row--mock ${stage.status === 'Running' ? 'worker-row--active' : ''}">
                    <div class="worker-row__main">
                      <strong>${stage.name}</strong>
                      <span>${stage.summary}</span>
                    </div>
                    <div class="worker-row__meta">
                      <span class="mini-badge">${stage.status}</span>
                      <span>${stage.lastRun}</span>
                    </div>
                  </article>
                `,
              )
              .join('')}
          </div>
        </article>

        <div class="section-grid section-grid--two">
          <article class="card ${mode === 'real' ? '' : 'card--mock'} card--pending">
            <header class="card__header"><div><p class="card__code">D2</p><h3>Playback worker</h3></div><div class="card__header-tags">${renderSourceBadge(mode, mode.toUpperCase())}</div>${statusBadge(state.statusByKey.D2)}</header>
            ${renderDefinitionList({
              Status: state.runningProcess.playbackWorker.status,
              Heartbeat: state.runningProcess.playbackWorker.heartbeat,
              'Current media': state.runningProcess.playbackWorker.currentMedia,
              Summary: state.runningProcess.playbackWorker.summary,
            })}
            <p class="card__copy">Sources: Status & summary are computed; Heartbeat comes from the worker heartbeat file; Current media comes from the database.</p>
          </article>
          <article class="card ${mode === 'real' ? '' : 'card--mock'} card--pending">
            <header class="card__header"><div><p class="card__code">D3</p><h3>Screen on-off worker</h3></div><div class="card__header-tags">${renderSourceBadge(mode, mode.toUpperCase())}</div>${statusBadge(state.statusByKey.D3)}</header>
            ${renderDefinitionList({
              Status: state.runningProcess.screenWorker.status,
              Heartbeat: state.runningProcess.screenWorker.heartbeat,
              'Screen state': state.runningProcess.screenWorker.screenState,
              'Last activity': state.runningProcess.screenWorker.lastActivity,
              Timeout: state.runningProcess.screenWorker.timeout,
              Summary: state.runningProcess.screenWorker.summary,
            })}
            <p class="card__copy">Sources: Status & summary are computed; Heartbeat comes from the worker heartbeat file; Screen state & last activity are stored in the database; Timeout reflects lock duration.</p>
          </article>
        </div>
      </div>

      <article class="card ${mode === 'real' ? '' : 'card--mock'} card--pending">
        <header class="card__header"><div><p class="card__code">D4</p><h3>${mode === 'real' ? 'Monitor log' : 'Preview log'}</h3></div><div class="card__header-tags">${renderSourceBadge(mode, mode.toUpperCase())}</div></header>
        <p class="card__copy">Sources: Log entries are taken from the application log tail${mode === 'real' ? '' : '; in preview mode the log lines are simulated'}.</p>
        <div class="log-surface">${renderLogEntries(state.logs.D, { sourceKey: 'D' })}</div>
      </article>
    </section>
  `;
}
