import { statusBadge, renderDefinitionList, renderLogEntries, renderStepList } from '../services/renderers.js';

export function renderTestView(state) {
  const queueReady = !!state.truth.currentMedia;
  return `
    <section class="view-page">
      <div class="view-hero">
        <div>
          <p class="eyebrow">B — Test</p>
          <h2>Simulate critical flows without touching the real runtime.</h2>
          <p class="hero-copy">This entire view stays separate from real worker activity. B3 is staged, B4 previews media, and B5 simulates the screen rules that affect playback.</p>
        </div>
        <div class="hero-pill-group">
          <span class="hero-pill hero-pill--accent">Simulation only</span>
          <span class="hero-pill">B3.1 is the only mock stage</span>
        </div>
      </div>

      <div class="section-grid section-grid--two">
        <article class="card">
          <header class="card__header">
            <div><p class="card__code">B1</p><h3>Login flow</h3></div>
            ${statusBadge(state.statusByKey.B1)}
          </header>
          <p class="card__copy">Show the user exactly where the test flow is: login, required file preparation, and 2FA.</p>
          ${renderStepList(state.loginSteps)}
          <div class="button-row"><button class="button button--primary" data-action="run-b1">Run</button></div>
          <div class="log-surface">${renderLogEntries(state.logs.B1, { sourceKey: 'B1' })}</div>
        </article>

        <article class="card">
          <header class="card__header">
            <div><p class="card__code">B2</p><h3>Download 5 files</h3></div>
            ${statusBadge(state.statusByKey.B2)}
          </header>
          <p class="card__copy">A fast single-purpose test action that is visually lighter than the multi-stage pipeline panel below.</p>
          <div class="button-row"><button class="button button--primary" data-action="run-b2">Run</button></div>
          <div class="log-surface">${renderLogEntries(state.logs.B2, { sourceKey: 'B2' })}</div>
        </article>
      </div>

      <article class="card card--feature">
        <header class="card__header card__header--tight">
          <div><p class="card__code">B3</p><h3>Pipeline stages</h3></div>
          ${statusBadge(state.statusByKey.B3)}
        </header>
        <p class="card__copy">B3.1 is the only mock stage and reads from <code>/generated_test_data</code>. The remaining stages are framed as real-code-intended stages for later backend wiring.</p>
        <div class="toolbar-grid">
          <fieldset class="selector-card">
            <legend>Execution mode</legend>
            <label class="selector-option"><input type="radio" name="execution-mode" value="auto" ${state.simulation.executionMode === 'auto' ? 'checked' : ''}/> <span>Auto pipeline</span></label>
            <label class="selector-option"><input type="radio" name="execution-mode" value="manual" ${state.simulation.executionMode === 'manual' ? 'checked' : ''}/> <span>Manual pipeline</span></label>
          </fieldset>
          <fieldset class="selector-card">
            <legend>Mock input mode</legend>
            <label class="selector-option"><input type="radio" name="input-mode" value="single" ${state.simulation.inputMode === 'single' ? 'checked' : ''}/> <span>One file at a time</span></label>
            <label class="selector-option selector-option--disabled"><input type="radio" name="input-mode" value="all" disabled/> <span>All files (disabled)</span></label>
          </fieldset>
          <div class="selector-card selector-card--actions">
            <p class="selector-card__label">Auto run</p>
            <button class="button button--primary" data-action="run-b3-auto">Run all stages</button>
          </div>
        </div>
        <div class="stage-stack">
          ${renderStageCard('B3.1', 'Mock download', 'Source folder: /generated_test_data', state)}
          ${renderStageCard('B3.2', 'Index', 'Future real-code wiring point.', state)}
          ${renderStageCard('B3.3', 'Parse GPS', 'Future real-code wiring point.', state)}
          ${renderStageCard('B3.4', 'Geocode', 'Future real-code wiring point.', state)}
          ${renderStageCard('B3.5', 'Enqueue playback', 'Creates queued media for B4.', state)}
        </div>
      </article>

      <div class="section-grid section-grid--two-uneven">
        <article class="card card--feature">
          <header class="card__header">
            <div><p class="card__code">B4</p><h3>Playback emulation</h3></div>
            ${statusBadge(state.statusByKey.B4)}
          </header>
          <p class="card__copy">This preview should feel like an operator-grade media surface instead of a plain placeholder box.</p>
          <div class="preview-frame preview-frame--${state.truth.screenState.toLowerCase()}">
            <div class="preview-frame__bar">
              <span class="screen-indicator screen-indicator--${state.truth.screenState.toLowerCase()}">Screen ${state.truth.screenState}</span>
              <span class="screen-indicator">${queueReady ? 'Queue ready' : 'Queue empty'}</span>
            </div>
            <div class="preview-frame__content ${queueReady ? '' : 'preview-frame__content--empty'}">
              ${queueReady ? `<strong>${state.truth.currentMedia.type}</strong><span>${state.truth.currentMedia.name}</span><small>${state.truth.currentMedia.overlay}</small>` : '<span>No queued media. Run B3.5 first.</span>'}
            </div>
          </div>
          <div class="stat-grid">${renderDefinitionList({
            'Current media': state.truth.currentMedia?.name ?? 'None',
            'Media type': state.truth.currentMedia?.type ?? 'None',
            'Queue position': state.truth.currentMedia?.position ?? 'Not queued',
            'Playback status': state.truth.playbackStatus,
          })}</div>
          <div class="button-row"><button class="button button--primary" data-action="run-b4" ${queueReady ? '' : 'disabled'}>Run</button></div>
          <div class="log-surface">${renderLogEntries(state.logs.B4, { sourceKey: 'B4' })}</div>
        </article>

        <article class="card card--feature">
          <header class="card__header">
            <div><p class="card__code">B5</p><h3>Screen on-off simulation</h3></div>
            ${statusBadge(state.statusByKey.B5)}
          </header>
          <p class="card__copy">Keep the toggles obvious. This panel is the cause; the playback preview on the left is the effect.</p>
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

function renderStageCard(code, title, subtitle, state) {
  return `
    <article class="stage-card">
      <div class="stage-card__header">
        <div>
          <p class="card__code">${code}</p>
          <h4>${title}</h4>
          <p class="stage-card__subtitle">${subtitle}</p>
        </div>
        ${statusBadge(state.statusByKey[code])}
      </div>
      <div class="button-row"><button class="button button--secondary" data-action="run-${code.toLowerCase().replace('.', '-')}">Run</button></div>
      <div class="log-surface">${renderLogEntries(state.logs[code], { sourceKey: code })}</div>
    </article>
  `;
}

function renderToggle(name, label, checked) {
  return `
    <label class="toggle-card">
      <input type="checkbox" name="${name}" ${checked ? 'checked' : ''} />
      <span class="toggle-card__body">
        <span class="toggle-card__label">${label}</span>
        <span class="toggle-card__meta">Simulation control</span>
      </span>
    </label>
  `;
}
