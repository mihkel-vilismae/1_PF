import { renderDefinitionList, statusBadge, renderLogEntries } from '../services/renderers.js';

export function renderRunningProcessView(state) {
  const disabled = !state.truth.realRunActive;
  return `
    <section class="view-page">
      <div class="view-hero">
        <div>
          <p class="eyebrow">D — Running Process</p>
          <h2>Monitor the real runtime without mixing it with simulation controls.</h2>
          <p class="hero-copy">The first worker loops through five stages in order. The playback and screen workers remain single-process watchdog-driven services.</p>
        </div>
        <div class="hero-pill-group">
          <span class="hero-pill ${disabled ? '' : 'hero-pill--success'}">${disabled ? 'No real run active' : 'Real run active'}</span>
        </div>
      </div>

      ${disabled ? '<div class="notice notice--neutral">No real run is currently active.</div>' : ''}

      <div class="section-grid ${disabled ? 'section-grid--muted' : ''}">
        <article class="card card--feature">
          <header class="card__header"><div><p class="card__code">D1</p><h3>Pipeline worker</h3></div>${statusBadge(state.statusByKey.D1)}</header>
          <div class="worker-list">
            ${state.runningProcess.pipelineStages
              .map(
                (stage) => `
                  <article class="worker-row ${stage.status === 'Running' ? 'worker-row--active' : ''}">
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
          <article class="card">
            <header class="card__header"><div><p class="card__code">D2</p><h3>Playback worker</h3></div>${statusBadge(state.statusByKey.D2)}</header>
            ${renderDefinitionList({
              Status: state.runningProcess.playbackWorker.status,
              Heartbeat: state.runningProcess.playbackWorker.heartbeat,
              'Current media': state.runningProcess.playbackWorker.currentMedia,
              Summary: state.runningProcess.playbackWorker.summary,
            })}
          </article>
          <article class="card">
            <header class="card__header"><div><p class="card__code">D3</p><h3>Screen on-off worker</h3></div>${statusBadge(state.statusByKey.D3)}</header>
            ${renderDefinitionList({
              Status: state.runningProcess.screenWorker.status,
              Heartbeat: state.runningProcess.screenWorker.heartbeat,
              'Screen state': state.runningProcess.screenWorker.screenState,
              'Last activity': state.runningProcess.screenWorker.lastActivity,
              Timeout: state.runningProcess.screenWorker.timeout,
              Summary: state.runningProcess.screenWorker.summary,
            })}
          </article>
        </div>
      </div>

      <article class="card">
        <header class="card__header"><div><p class="card__code">D4</p><h3>Runtime log</h3></div></header>
        <div class="log-surface">${renderLogEntries(state.logs.D)}</div>
      </article>
    </section>
  `;
}
