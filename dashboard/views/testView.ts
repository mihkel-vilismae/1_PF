/*
 * Renders View B for runtime test actions and pipeline controls.
 * The view keeps backend-backed actions visible beside explicit mock/simulation areas.
 * All interactive buttons dispatch through data-action handlers in runtime truth.
 */
import { statusBadge, renderDefinitionList, renderLogEntries, renderSourceBadge, renderStepList } from '../services/renderers.ts';
import {
  PLAYBACK_RENDERING_MODES,
  PLAYBACK_RENDERING_PLATFORMS,
  PLAYBACK_RENDERING_LIBRARY,
  PLAYBACK_RENDERING_PLATFORM_OPTIONS,
  buildPlaybackRenderingOptions,
  getSharedPlaybackRendererId,
  normalizePlaybackRenderingState,
} from '../services/playbackRenderer.ts';

// Renders the full View B page from runtime-truth state.
export function renderTestView(state) {
  const queueReady = !!state.truth.currentMedia;
  const playbackRenderingState = normalizePlaybackRenderingState(state.playbackRendering);
  const playbackRenderingReady = state.truth.playbackActive || state.statusByKey.B4 === 'success';
  const renderingOptions = buildPlaybackRenderingOptions(playbackRenderingReady);
  return `
    <section class="view-page">
      <div class="view-hero view-hero--hybrid">
        <div>
          <p class="eyebrow">B — Test</p>
        <h2>Use real runtime actions where they already exist, and keep the remaining placeholders unmistakable.</h2>
          <p class="hero-copy">B2, B3.1, B3.2, B3.3, B3.4, B3.5, B4, B3 auto-run orchestration, and B5 screen simulation now call documented backend runtime routes. B5 is simulation-only, not real hardware. The login preflight has moved to View A.</p>
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
        <p class="card__copy">Real-backed now: B3 auto-run calls backend orchestration; B3.1 download, B3.2 index, B3.3 parse GPS, B3.4 geocode, and B3.5 queue prepare remain individually runnable. The geocode endpoint still uses a deterministic placeholder geocoder and is not production.</p>
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
        <section class="pipeline-maintenance selector-card selector-card--hybrid" aria-label="Pipeline maintenance">
          <div>
            <p class="selector-card__label">Pipeline maintenance</p>
            <p class="stage-card__subtitle">Detects stale persisted pipeline locks and clears only stale locks.</p>
          </div>
          <div class="button-row pipeline-maintenance__actions">
            <button class="button button--secondary" data-action="detect-pipeline-issues">Detect issues in pipeline</button>
            <button class="button button--danger" data-action="clear-stale-pipeline-locks">Clear stale locks</button>
          </div>
        </section>
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
            'Rendering mode': getPlaybackRenderingModeLabel(playbackRenderingState.mode),
            'Rendering target': getPlaybackRenderingPlatformLabel(playbackRenderingState.platform),
          })}</div>
          <section class="playback-rendering-panel selector-card selector-card--hybrid" aria-label="B4 rendering controls">
            <div>
              <p class="selector-card__label">Rendering target</p>
              <p class="stage-card__subtitle">Rendering tabs affect only preview/fullscreen presentation. Backend selection remains <code>POST /api/runtime/playback/select-current</code>.</p>
            </div>
            <div class="playback-rendering-tabs" role="tablist" aria-label="B4 rendering platform tabs">
              ${renderPlaybackRenderingPlatformTabs(playbackRenderingState.platform, playbackRenderingReady)}
            </div>
            <div>
              <p class="selector-card__label">Rendering mode</p>
              <p class="stage-card__subtitle">Preview and fullscreen use the same ${PLAYBACK_RENDERING_LIBRARY.label}. Controls unlock after B4 Run selects/activates playback.</p>
            </div>
            <div class="playback-rendering-options" role="group" aria-label="B4 rendering mode controls">
              ${renderPlaybackRenderingModeButtons(renderingOptions, playbackRenderingState.mode, playbackRenderingReady)}
            </div>
            <p class="notice playback-rendering-panel__notice">${playbackRenderingReady ? getPlaybackRenderingReadyMessage(playbackRenderingState.mode) : 'Run B4 successfully before changing rendering mode or target.'}</p>
          </section>
          <div class="button-row"><button class="button button--primary" data-action="run-b4">Run</button></div>
          <div class="log-surface">${renderLogEntries(state.logs.B4, { sourceKey: 'B4' })}</div>
        </article>

        <article class="card card--hybrid card--feature">
          <header class="card__header">
            <div><p class="card__code">B5</p><h3>Screen on-off simulation</h3></div>
            <div class="card__header-tags">${renderSourceBadge('hybrid', 'BACKEND SIMULATION')}</div>
            ${statusBadge(state.statusByKey.B5)}
          </header>
          <p class="card__copy">These controls configure backend-owned simulation state only. The response updates the dashboard preview, but it does not represent real screen hardware.</p>
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
    <label class="toggle-card toggle-card--hybrid">
      <input type="checkbox" name="${name}" ${checked ? 'checked' : ''} />
      <span class="toggle-card__body">
        <span class="toggle-card__label">${label}</span>
        <span class="toggle-card__meta">Backend simulation control</span>
      </span>
    </label>
  `;
}


// Renders B4 platform tabs while keeping Raspberry OS disabled until implemented.
function renderPlaybackRenderingPlatformTabs(activePlatform, playbackReady) {
  return PLAYBACK_RENDERING_PLATFORM_OPTIONS.map((option) => {
    const isActive = option.value === activePlatform;
    const isRaspberry = option.value === PLAYBACK_RENDERING_PLATFORMS.raspberryOs;
    const disabled = !playbackReady || isRaspberry;
    const title = isRaspberry
      ? 'Raspberry OS rendering is planned but not implemented in this frontend slice.'
      : option.description;
    return `<button
      class="button ${isActive ? 'button--primary' : 'button--secondary'} playback-rendering-tab"
      type="button"
      role="tab"
      aria-selected="${isActive ? 'true' : 'false'}"
      data-playback-rendering-platform="${option.value}"
      title="${title}"
      ${disabled ? 'disabled' : ''}
    >${option.label}${isRaspberry ? ' (disabled)' : ''}</button>`;
  }).join('');
}

// Renders B4 rendering mode buttons from the shared playbackRenderer contract.
function renderPlaybackRenderingModeButtons(options, activeMode, playbackReady) {
  return options.map((option) => {
    const isActive = option.value === activeMode;
    const disabled = !playbackReady || !option.enabled;
    const sharedRendererId = getSharedPlaybackRendererId(option.value);
    const sharedRendererText = sharedRendererId ? `Shared renderer: ${sharedRendererId}. ` : '';
    return `<button
      class="button ${isActive ? 'button--primary' : 'button--secondary'} playback-rendering-mode"
      type="button"
      data-playback-rendering-mode="${option.value}"
      title="${sharedRendererText}${option.description}"
      ${disabled ? 'disabled' : ''}
    >${option.label}</button>`;
  }).join('');
}

// Returns a human-readable label for the active B4 rendering mode.
function getPlaybackRenderingModeLabel(mode) {
  return buildPlaybackRenderingOptions(true).find((option) => option.value === mode)?.label ?? 'Playback without rendering';
}

// Returns a human-readable label for the active B4 rendering platform tab.
function getPlaybackRenderingPlatformLabel(platform) {
  return PLAYBACK_RENDERING_PLATFORM_OPTIONS.find((option) => option.value === platform)?.label ?? 'Windows';
}

// Explains the current B4 rendering state without claiming backend/player support.
function getPlaybackRenderingReadyMessage(mode) {
  if (mode === PLAYBACK_RENDERING_MODES.previewWindow) {
    return 'Preview rendering mode is selected. Real media presentation remains browser-native and frontend-owned in this slice.';
  }
  if (mode === PLAYBACK_RENDERING_MODES.fullscreen) {
    return 'Fullscreen rendering mode is selected. OS-level or Raspberry hardware control is not implemented in this slice.';
  }
  return 'Playback is active. Backend selection can continue without rendering.';
}
