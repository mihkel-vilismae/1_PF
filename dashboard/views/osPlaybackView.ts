/*
 * Renders the Windows and Raspberry OS playback view shells.
 * This renderer presents the playback layout, browser-side queue rotation controls,
 * and fullscreen overlay without changing backend selection or scheduler execution.
 */
import { renderSourceBadge } from '../services/renderers.ts';
import { escapeHtml } from '../services/renderers/sharedRendererUtils.ts';
import {
  buildOsPlaybackViewModel,
  OS_PLAYBACK_PLATFORMS,
  type OsPlaybackPlatform,
  type PlaybackLogEntryViewModel,
  type PlaybackStageViewModel,
  type PlaybackWorkerViewModel,
} from '../services/osPlaybackViewModel.ts';

type RuntimeState = Parameters<typeof buildOsPlaybackViewModel>[0];

/**
 * Renders one OS-specific playback view from the shared playback view model.
 */
export function renderOsPlaybackView(state: RuntimeState, platform: OsPlaybackPlatform): string {
  const view = buildOsPlaybackViewModel(state, platform);
  return `
    <section class="view-page os-playback-view os-playback-view--${escapeHtml(view.platform)}">
      <div class="view-hero view-hero--${view.platform === OS_PLAYBACK_PLATFORMS.windows ? 'hybrid' : 'real'}">
        <div>
          <p class="eyebrow">${escapeHtml(view.eyebrow)}</p>
          <h2>${escapeHtml(view.title)}</h2>
          <p class="hero-copy">${escapeHtml(view.description)}</p>
        </div>
        <div class="hero-pill-group">
          ${renderSourceBadge(view.sourceBadge, view.sourceLabel)}
          <span class="hero-pill">${escapeHtml(view.modeLabel)}</span>
        </div>
      </div>

      <article class="card card--feature os-playback-stage-card">
        <header class="card__header">
          <div>
            <p class="card__code">${escapeHtml(view.code)}</p>
            <h3>Playback surface</h3>
          </div>
          <div class="card__header-tags">${renderSourceBadge(view.sourceBadge, 'PLAYBACK QUEUE')}</div>
        </header>
        <div class="os-playback-stage" data-os-playback-stage="${escapeHtml(view.platform)}">
          <div class="os-playback-stage__media" aria-label="Playback queue media preview">
            ${renderPlaybackMediaSurface(view.currentMediaUrl, view.currentMediaType, view.currentMediaName)}
            <span class="os-playback-stage__media-type">${escapeHtml(view.currentMediaType)} • ${escapeHtml(view.rotation.status)}</span>
            <strong>${escapeHtml(view.currentMediaName)}</strong>
            <small>${escapeHtml(view.queueSummary)}</small>
          </div>
          <div class="os-playback-stage__caption">
            <div>
              <span class="mini-badge">Resolved address</span>
              <strong>${escapeHtml(view.resolvedAddress)}</strong>
            </div>
            <span>${escapeHtml(view.nextIn)}</span>
          </div>
        </div>
        <div class="os-playback-controls" aria-label="Playback controls">
          <button class="button button--primary" type="button" data-playback-view-fullscreen-platform="${escapeHtml(view.platform)}">Switch to Full Screen</button>
          <button class="button button--secondary" type="button" data-os-playback-step-platform="${escapeHtml(view.platform)}" data-os-playback-step="-1" ${view.rotation.canRotate ? '' : 'disabled'}>Previous</button>
          <button class="button button--secondary" type="button" data-os-playback-step-platform="${escapeHtml(view.platform)}" data-os-playback-step="1" ${view.rotation.canRotate ? '' : 'disabled'}>Next</button>
          <button class="button button--secondary" type="button" data-os-playback-toggle-rotation-platform="${escapeHtml(view.platform)}" ${view.rotation.canRotate ? '' : 'disabled'}>${escapeHtml(view.rotation.toggleLabel)}</button>
          <button class="button button--secondary" type="button" data-os-playback-refresh-platform="${escapeHtml(view.platform)}">Refresh queue</button>
          ${view.resume.canRestoreFullscreen ? `<button class="button button--secondary" type="button" data-os-playback-restore-fullscreen-platform="${escapeHtml(view.platform)}">Restore fullscreen playback</button>` : ''}
        </div>
        <p class="notice notice--neutral">${escapeHtml(view.playbackStatus)} Browser-side rotation uses the read-only playback queue contract; backend selection and OS scheduler behavior remain unchanged.</p>
        <p class="notice notice--neutral" data-os-playback-resume-status="${escapeHtml(view.platform)}">Resume checkpoint: ${escapeHtml(view.resume.status)} — ${escapeHtml(view.resume.message)}</p>
        ${renderActivityPanel(view)}
      </article>

      <article class="card os-playback-status-card">
        <header class="card__header card__header--tight">
          <div><p class="card__code">${escapeHtml(view.code)}-STAGES</p><h3>Media pipeline stage row</h3></div>
          <div class="card__header-tags">${renderSourceBadge('hybrid', 'Download → Index → GPS parser → Geocode → Queue')}</div>
        </header>
        <div class="os-stage-row">
          ${view.stageItems.map(renderStagePill).join('')}
        </div>
      </article>

      <article class="card os-playback-status-card">
        <header class="card__header card__header--tight">
          <div><p class="card__code">${escapeHtml(view.code)}-WORKERS</p><h3>Worker call status</h3></div>
          <div class="card__header-tags">${renderSourceBadge('hybrid', '3 WORKERS')}</div>
        </header>
        <div class="os-worker-row">
          ${view.workers.map(renderWorkerCard).join('')}
        </div>
      </article>

      ${renderNativePlaybackPanel(view)}

      <div class="section-grid section-grid--two os-log-grid">
        ${renderTerminalPanel(view.platform, `${view.code}-CRON`, view.schedulerTitle, view.schedulerSummary, view.schedulerLog, 'scheduler')}
        ${renderTerminalPanel(view.platform, `${view.code}-ERRORS`, 'Error-only log', 'Strictly error-level entries for playback/runtime work.', view.errorLog, 'error')}
      </div>
      ${renderTerminalPanel(view.platform, `${view.code}-MAIN`, 'Main runtime log', 'General playback, queue, worker, and scheduler information.', view.mainLog, 'main')}
    </section>
  `;
}




/**
 * Renders native OS player status and manual process controls.
 */
function renderNativePlaybackPanel(view: ReturnType<typeof buildOsPlaybackViewModel>): string {
  return `
    <article class="card os-playback-status-card" data-native-playback-card="${escapeHtml(view.platform)}">
      <header class="card__header card__header--tight">
        <div><p class="card__code">${escapeHtml(view.code)}-NATIVE</p><h3>Native fullscreen playback</h3></div>
        <div class="card__header-tags">${renderSourceBadge(view.nativePlayback.enabled ? 'real' : 'mock', view.nativePlayback.enabled ? 'ENABLED' : 'DISABLED')}</div>
      </header>
      <p class="card__copy">OS-native playback starts a backend-owned player process such as mpv. Browser playback stays available and Test Mode is protected by the disabled default.</p>
      <dl class="definition-list definition-list--compact">
        <div class="definition-row"><dt>Status</dt><dd>${escapeHtml(view.nativePlayback.status)}</dd></div>
        <div class="definition-row"><dt>Player</dt><dd>${escapeHtml(view.nativePlayback.player)} on ${escapeHtml(view.nativePlayback.platform)}</dd></div>
        <div class="definition-row"><dt>PID</dt><dd>${escapeHtml(view.nativePlayback.pid)}</dd></div>
        <div class="definition-row"><dt>Current item</dt><dd>${escapeHtml(view.nativePlayback.currentItem)}</dd></div>
        <div class="definition-row"><dt>Command</dt><dd>${escapeHtml(view.nativePlayback.commandSummary)}</dd></div>
      </dl>
      <div class="os-playback-controls" aria-label="Native playback controls">
        <button class="button button--secondary" type="button" data-native-playback-detect-platform="${escapeHtml(view.platform)}">${escapeHtml(view.nativePlayback.detectLabel)}</button>
        <button class="button button--primary" type="button" data-native-playback-start-platform="${escapeHtml(view.platform)}" ${view.nativePlayback.startDisabled ? 'disabled' : ''}>Start native fullscreen</button>
        <button class="button button--secondary" type="button" data-native-playback-stop-platform="${escapeHtml(view.platform)}" ${view.nativePlayback.stopDisabled ? 'disabled' : ''}>Stop native playback</button>
      </div>
      ${renderTerminalPanel(view.platform, `${view.code}-NATIVE-LOG`, 'Native playback log', 'Native player command/status evidence. Controls are local to the rendered terminal.', view.nativePlayback.log, 'native')}
    </article>
  `;
}

/**
 * Renders fullscreen activity monitoring status without changing playback selection.
 */
function renderActivityPanel(view: ReturnType<typeof buildOsPlaybackViewModel>): string {
  const statusLabel = view.activity.monitoring ? 'Monitoring selected sources' : 'Idle until fullscreen starts';
  const unavailable = view.activity.unavailableLabels.length > 0
    ? `<p class="notice notice--warning">Unavailable source: ${escapeHtml(view.activity.unavailableLabels.join(', '))}</p>`
    : '';

  return `
    <section class="os-playback-activity-panel" data-os-playback-activity-panel="${escapeHtml(view.platform)}" aria-label="Fullscreen activity monitoring">
      <div class="os-playback-activity-panel__header">
        <strong>Wake / keep-on activity</strong>
        <span class="mini-badge">${escapeHtml(statusLabel)}</span>
      </div>
      <dl class="definition-list definition-list--compact">
        <div class="definition-row"><dt>Sources</dt><dd>${escapeHtml(view.activity.selectedLabels.join(', ') || 'No sources selected')}</dd></div>
        <div class="definition-row"><dt>Last activity</dt><dd>${escapeHtml(view.activity.lastActivityLabel)}</dd></div>
        <div class="definition-row"><dt>Keep awake</dt><dd>${escapeHtml(view.activity.keepAwakeLabel)}</dd></div>
      </dl>
      <p class="card__copy">${escapeHtml(view.activity.statusMessage)}</p>
      ${unavailable}
    </section>
  `;
}

/**
 * Renders the active fullscreen playback overlay when an OS playback session requests it.
 */
export function renderOsPlaybackFullscreenOverlay(state: RuntimeState): string {
  const activePlatform = getActiveFullscreenPlatform(state);
  if (!activePlatform) {
    return '';
  }

  const view = buildOsPlaybackViewModel(state, activePlatform);
  return `
    <section class="os-playback-fullscreen-overlay" data-os-playback-fullscreen-overlay="${escapeHtml(view.platform)}" role="dialog" aria-modal="true" aria-label="${escapeHtml(view.title)} fullscreen playback">
      <div class="os-playback-fullscreen-overlay__media">
        ${renderPlaybackMediaSurface(view.currentMediaUrl, view.currentMediaType, view.currentMediaName)}
      </div>
      <div class="os-playback-fullscreen-overlay__hud">
        <div>
          <p class="eyebrow">${escapeHtml(view.title)}</p>
          <h2>${escapeHtml(view.currentMediaName)}</h2>
          <p>${escapeHtml(view.resolvedAddress)}</p>
          <small>${escapeHtml(view.rotation.status)} • ${escapeHtml(view.nextIn)}</small>
          <small>${escapeHtml(view.activity.statusMessage)} • ${escapeHtml(view.activity.keepAwakeLabel)}</small>
        </div>
        <div class="os-playback-fullscreen-overlay__actions">
          <button class="button button--secondary" type="button" data-os-playback-step-platform="${escapeHtml(view.platform)}" data-os-playback-step="-1" ${view.rotation.canRotate ? '' : 'disabled'}>Previous</button>
          <button class="button button--secondary" type="button" data-os-playback-toggle-rotation-platform="${escapeHtml(view.platform)}" ${view.rotation.canRotate ? '' : 'disabled'}>${escapeHtml(view.rotation.toggleLabel)}</button>
          <button class="button button--secondary" type="button" data-os-playback-step-platform="${escapeHtml(view.platform)}" data-os-playback-step="1" ${view.rotation.canRotate ? '' : 'disabled'}>Next</button>
          <button class="button button--primary" type="button" data-os-playback-exit-fullscreen="${escapeHtml(view.platform)}">Exit Full Screen</button>
        </div>
      </div>
    </section>
  `;
}

/**
 * Finds which playback platform currently owns the fullscreen overlay.
 */
function getActiveFullscreenPlatform(state: RuntimeState): OsPlaybackPlatform | null {
  const rotation = (state as { osPlaybackRotation?: Partial<Record<OsPlaybackPlatform, { fullscreen?: unknown }>> }).osPlaybackRotation;
  if (rotation?.windows?.fullscreen === true) {
    return OS_PLAYBACK_PLATFORMS.windows;
  }
  if (rotation?.raspberry?.fullscreen === true) {
    return OS_PLAYBACK_PLATFORMS.raspberry;
  }
  return null;
}

/**
 * Renders backend-served playback media when the API contract has a safe URL.
 */
function renderPlaybackMediaSurface(mediaUrl: string | null, mediaType: string, mediaName: string): string {
  if (!mediaUrl) {
    return '<div class="os-playback-stage__placeholder">Playback API has no media URL yet.</div>';
  }

  const safeUrl = escapeHtml(mediaUrl);
  const safeName = escapeHtml(mediaName);
  if (mediaType.toLowerCase() === 'video') {
    return `<video class="os-playback-stage__media-element" src="${safeUrl}" muted playsinline controls aria-label="${safeName}"></video>`;
  }

  return `<img class="os-playback-stage__media-element" src="${safeUrl}" alt="${safeName}" loading="lazy" />`;
}

/**
 * Renders a compact pipeline stage pill with status and future action hint.
 */
function renderStagePill(stage: PlaybackStageViewModel): string {
  return `
    <article class="os-stage-pill os-stage-pill--${escapeHtml(stage.status.toLowerCase())}" title="${escapeHtml(stage.actionHint)}">
      <strong>${escapeHtml(stage.label)}</strong>
      <span>${escapeHtml(stage.status)}</span>
    </article>
  `;
}

/**
 * Renders one worker status card with last-called information.
 */
function renderWorkerCard(worker: PlaybackWorkerViewModel): string {
  return `
    <article class="os-worker-card os-worker-card--${escapeHtml(worker.status.toLowerCase())}">
      <div class="os-worker-card__header">
        <strong>${escapeHtml(worker.label)}</strong>
        <span class="mini-badge">${escapeHtml(worker.status)}</span>
      </div>
      <dl class="definition-list definition-list--compact">
        <div class="definition-row"><dt>Last called</dt><dd>${escapeHtml(worker.lastCalled)}</dd></div>
        <div class="definition-row"><dt>Since last call</dt><dd>${escapeHtml(worker.sinceLastCall)}</dd></div>
      </dl>
      <p>${escapeHtml(worker.summary)}</p>
    </article>
  `;
}

/**
 * Renders a terminal-like playback panel with required copy, clear, and expand controls.
 */
function renderTerminalPanel(platform: OsPlaybackPlatform, code: string, title: string, summary: string, entries: PlaybackLogEntryViewModel[], logKind: string): string {
  return `
    <article class="card os-terminal-card" data-os-terminal-kind="${escapeHtml(logKind)}">
      <header class="card__header card__header--tight">
        <div><p class="card__code">${escapeHtml(code)}</p><h3>${escapeHtml(title)}</h3></div>
        <div class="side-panel__actions">
          <button class="button button--ghost" type="button" data-os-terminal-copy-all-platform="${escapeHtml(platform)}" data-os-terminal-copy-all-kind="${escapeHtml(logKind)}">copy all</button>
          <button class="button button--ghost" type="button" data-os-terminal-clear-platform="${escapeHtml(platform)}" data-os-terminal-clear-kind="${escapeHtml(logKind)}">clear</button>
        </div>
      </header>
      <p class="card__copy">${escapeHtml(summary)}</p>
      <div class="log-surface os-terminal-surface" data-scroll-preserve="os-playback-${escapeHtml(platform)}-${escapeHtml(logKind)}-terminal">
        ${entries.map((entry, index) => renderTerminalRow(platform, logKind, entry, index)).join('')}
      </div>
    </article>
  `;
}

/**
 * Renders one terminal row with an expand-row affordance.
 */
function renderTerminalRow(platform: OsPlaybackPlatform, logKind: string, entry: PlaybackLogEntryViewModel, index: number): string {
  return `
    <article class="log-entry log-entry--${escapeHtml(entry.type)} os-terminal-row">
      <div class="log-entry__meta">
        <span>${escapeHtml(entry.at)}</span>
        <span class="log-entry__status-chip"><span>${escapeHtml(entry.type.toUpperCase())}</span></span>
      </div>
      <div class="log-entry__message">${escapeHtml(entry.message)}</div>
      <button class="button button--ghost os-terminal-row__expand" type="button" data-os-terminal-row-expand-platform="${escapeHtml(platform)}" data-os-terminal-row-expand-kind="${escapeHtml(logKind)}" data-os-terminal-row-expand-index="${index}">expand row</button>
    </article>
  `;
}
