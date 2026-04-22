import { statusBadge, renderDefinitionList, renderLogEntries, renderSourceBadge, renderStepList } from '../services/renderers.js';

export function renderTestView(state) {
  const queueReady = !!state.truth.currentMedia;
  return `
    <section class="view-page">
      <div class="view-hero view-hero--hybrid">
        <div>
          <p class="eyebrow">B — Test</p>
        <h2>Use real runtime actions where they already exist, and keep the remaining placeholders unmistakable.</h2>
          <p class="hero-copy">B2, B3.1, B3.2, B3.3, B3.4, B3.5, and B4 now call documented backend runtime routes. B5 remains a frontend-only placeholder simulation. The login preflight has moved to View A.</p>
        </div>
        <div class="hero-pill-group">
          ${renderSourceBadge('hybrid', 'MIXED VIEW')}
          ${renderSourceBadge('real', 'REAL ACTIONS PRESENT')}
          ${renderSourceBadge('mock', 'PLACEHOLDERS STILL VISIBLE')}
        </div>
      </div>

      <div class="section-grid section-grid--two">
        <!-- Removed B1 login card as authentication preflight now lives in View A (Init) -->
        <article class="card card--real">
          <header class="card__header">
            <div><p class="card__code">B2</p><h3>Download test action</h3></div>
            <div class="card__header-tags">${renderSourceBadge('real', 'REAL')}</div>
            ${statusBadge(state.statusByKey.B2)}
          </header>
          <p class="card__copy">This quick action now calls <code>POST /api/runtime/download/run</code> instead of simulating a batch in the browser.</p>
          <div class="button-row"><button class="button button--primary" data-action="run-b2">Run</button></div>
          <div class="log-surface">${renderLogEntries(state.logs.B2, { sourceKey: 'B2' })}</div>
        </article>
      </div>

      <article class="card card--feature card--hybrid">
        <header class="card__header card__header--tight">
          <div><p class="card__code">B3</p><h3>Pipeline stages</h3></div>
          <div class="card__header-tags">${renderSourceBadge('hybrid', 'HYBRID')}</div>
          ${statusBadge(state.statusByKey.B3)}
        </header>
        <p class="card__copy">Real-backed now: B3.1 download, B3.2 index, B3.3 parse GPS, B3.4 geocode, and B3.5 queue prepare. The geocode endpoint still uses a deterministic placeholder geocoder and is not production.</p>
        <div class="toolbar-grid">
          <fieldset class="selector-card selector-card--mock">
            <legend>Execution mode</legend>
            <label class="selector-option"><input type="radio" name="execution-mode" value="auto" ${state.simulation.executionMode === 'auto' ? 'checked' : ''}/> <span>Auto pipeline</span></label>
            <label class="selector-option"><input type="radio" name="execution-mode" value="manual" ${state.simulation.executionMode === 'manual' ? 'checked' : ''}/> <span>Manual pipeline</span></label>
          </fieldset>
          <fieldset class="selector-card selector-card--mock">
            <legend>Mock input mode</legend>
            <label class="selector-option"><input type="radio" name="input-mode" value="single" ${state.simulation.inputMode === 'single' ? 'checked' : ''}/> <span>One file at a time</span></label>
            <label class="selector-option selector-option--disabled"><input type="radio" name="input-mode" value="all" disabled/> <span>All files (disabled)</span></label>
          </fieldset>
          <div class="selector-card selector-card--hybrid selector-card--actions">
            <p class="selector-card__label">Auto run</p>
            <button class="button button--primary" data-action="run-b3-auto">Run all stages</button>
          </div>
        </div>
        <div class="stage-stack">
          ${renderStageCard('B3.1', 'Download', 'Calls POST /api/runtime/download/run.', state, 'real')}
          ${renderStageCard('B3.2', 'Index', 'Calls POST /api/runtime/index/run.', state, 'real')}
          ${renderStageCard('B3.3', 'Parse GPS', 'Calls POST /api/runtime/gps/run.', state, 'real')}
          ${renderStageCard('B3.4', 'Geocode', 'Calls POST /api/runtime/geocode/run. Uses the deterministic placeholder geocoder only.', state, 'real')}
          ${renderStageCard('B3.5', 'Enqueue playback', 'Calls POST /api/runtime/queue/prepare.', state, 'real')}
        </div>
      </article>

      <div class="section-grid section-grid--two-uneven">
        <article class="card card--real card--feature">
          <header class="card__header">
            <div><p class="card__code">B4</p><h3>Playback selection</h3></div>
            <div class="card__header-tags">${renderSourceBadge('real', 'REAL')}</div>
            ${statusBadge(state.statusByKey.B4)}
          </header>
          <p class="card__copy">This surface still looks like an operator preview, but the Run action now calls <code>POST /api/runtime/playback/select-current</code> and shows the selected backend item.</p>
          <div class="preview-frame preview-frame--${state.truth.screenState.toLowerCase()}">
            <div class="preview-frame__bar">
              <span class="screen-indicator screen-indicator--${state.truth.screenState.toLowerCase()}">Screen ${state.truth.screenState}</span>
              <span class="screen-indicator">${queueReady ? 'Backend item selected' : 'No selected item yet'}</span>
            </div>
            <div class="preview-frame__content ${queueReady ? '' : 'preview-frame__content--empty'}">
              ${queueReady ? `<strong>${state.truth.currentMedia.type}</strong><span>${state.truth.currentMedia.name}</span><small>${state.truth.currentMedia.overlay}</small>` : '<span>No backend-selected media yet. Run B3.5 and then B4.</span>'}
            </div>
          </div>
          <div class="stat-grid">${renderDefinitionList({
            'Current media': state.truth.currentMedia?.name ?? 'None',
            'Media type': state.truth.currentMedia?.type ?? 'None',
            'Queue position': state.truth.currentMedia?.position ?? 'Not selected',
            'Playback status': state.truth.playbackStatus,
          })}</div>
          <div class="button-row"><button class="button button--primary" data-action="run-b4">Run</button></div>
          <div class="log-surface">${renderLogEntries(state.logs.B4, { sourceKey: 'B4' })}</div>
        </article>

        <article class="card card--mock card--feature">
          <header class="card__header">
            <div><p class="card__code">B5</p><h3>Screen on-off simulation</h3></div>
            <div class="card__header-tags">${renderSourceBadge('mock', 'MOCK')}</div>
            ${statusBadge(state.statusByKey.B5)}
          </header>
          <p class="card__copy">This panel remains frontend-only. It is intentionally loud because the toggles and the resulting screen/playback state are still simulated in the browser.</p>
          <div class="toggle-grid">
            ${renderToggle('pirEnabled', 'Enable PIR sensor', state.simulation.pirEnabled)}
            ${renderToggle('mouseEnabled', 'Enable mouse movement', state.simulation.mouseEnabled)}
            ${renderToggle('keyboardEnabled', 'Enable keyboard activity', state.simulation.keyboardEnabled)}
            ${renderToggle('simulateAllEnabled', 'Enable all', state.simulation.simulateAllEnabled)}
          </div>
          <label class="field-label">
            <span>Inactivity timeout</span>
            <div class="inline-field">
              <input class="number-input" type="number" min="1" max="60" name="inactivityTimeoutSeconds" value="${state.simulation.inactivityTimeoutSeconds}" />
              <span class="field-suffix">seconds</span>
            </div>
          </label>
          <div class="stat-grid">${renderDefinitionList({
            'Current screen state': state.truth.screenState,
            'Last activity source': state.truth.lastActivitySource,
            'Shared timeout': `${state.truth.inactivityTimeoutSeconds}s`,
            'Playback checkpoint': state.truth.lastCheckpoint,
          })}</div>
          <div class="log-surface">${renderLogEntries(state.logs.B5, { sourceKey: 'B5' })}</div>
        </article>
      </div>
    </section>
  `;
}

function renderStageCard(code, title, subtitle, state, sourceMode = 'hybrid') {
  return `
    <article class="stage-card stage-card--${sourceMode}">
      <div class="stage-card__header">
        <div>
          <p class="card__code">${code}</p>
          <h4>${title}</h4>
          <p class="stage-card__subtitle">${subtitle}</p>
        </div>
        <div class="card__header-tags">${renderSourceBadge(sourceMode, sourceMode.toUpperCase())}</div>
        ${statusBadge(state.statusByKey[code])}
      </div>
      <div class="button-row"><button class="button button--secondary" data-action="run-${code.toLowerCase().replace('.', '-')}">Run</button></div>
      <div class="log-surface">${renderLogEntries(state.logs[code], { sourceKey: code })}</div>
    </article>
  `;
}

function renderToggle(name, label, checked) {
  return `
    <label class="toggle-card toggle-card--mock">
      <input type="checkbox" name="${name}" ${checked ? 'checked' : ''} />
      <span class="toggle-card__body">
        <span class="toggle-card__label">${label}</span>
        <span class="toggle-card__meta">Simulation control</span>
      </span>
    </label>
  `;
}
