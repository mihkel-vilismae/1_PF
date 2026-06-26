/*
 * Renders the V2 startup-mode operator shell.
 * The left sidebar owns exactly nine top-level routes.
 * The center panel renders each route's original sub-items as typed visual blocks.
 */
import { V2_OPERATOR_CENTER_PANEL_PAGES, type V2OperatorActionItem, type V2OperatorBackendActionButton, type V2OperatorCenterPanelBlock, type V2OperatorSectionItem } from '../data/v2OperatorCenterPanel.ts';
import { B5_ACTIVITY_SOURCES, getB5ActivitySourceLabel, normalizeB5ActivityDetectionState, type B5ActivitySource } from '../services/viewBActivityDetection.ts';
import { buildPlaybackRenderingOptions, getSharedPlaybackRendererId, normalizePlaybackRenderingState, PLAYBACK_RENDERING_LIBRARY, PLAYBACK_RENDERING_PLATFORM_OPTIONS, PLAYBACK_RENDERING_PLATFORMS, PLAYBACK_RENDERING_MODES, type PlaybackRenderingMode, type PlaybackRenderingPlatform } from '../services/playbackRenderer.ts';
import { V2_OPERATOR_SIDEBAR_ITEMS, type V2OperatorSidebarRoute } from '../data/v2OperatorSidebar.ts';
import { getV2BlockStatusId, getV2ImplementationStatusElement } from '../data/v2ImplementationStatus.ts';
import { renderLogEntries, renderResultSurface, renderSourceBadge, statusBadge, type HistoryEntry } from '../services/renderers.ts';
import { escapeHtml } from '../services/renderers/sharedRendererUtils.ts';
import { renderV2OperatorPageWrapper } from './v2OperatorPageWrapper.ts';
import { NEW_AUTH_BUTTONS, renderNewAuthActionRow } from './newAuthActionRows.ts';
import { SCHEDULER_EMULATOR_BUTTONS, renderSchedulerActionButton } from './schedulerActionRows.ts';
import { SCHEDULER_TARGETS } from '../../shared/schedulerPlatformCapabilities.ts';

export type V2PlaybackQueueItem = {
  id: string;
  filename: string;
  mediaKind: 'video' | 'image' | 'other';
  durationLabel: string;
  gpsCoordinates: string;
  address: string;
  gpsStatus?: 'present' | 'missing';
  addressStatus?: 'present' | 'missing';
  metadataSource?: string;
  metadataMessage?: string;
  backendQueueStatus?: string;
  backendQueueMessage?: string;
};

type V2StartupOperatorMenuRenderOptions = {
  inspectMode?: boolean;
  valueInspectMode?: boolean;
  implementationStatusMode?: boolean;
  runtimeState?: Record<string, any>;
  dashboardVisualMode?: string | null;
  v2PlaybackQueueItems?: readonly V2PlaybackQueueItem[];
};

export function renderV2StartupOperatorMenuView(
  activeRoute: V2OperatorSidebarRoute,
  history: HistoryEntry[] = [],
  historyCopyButtonLabel = 'copy all log',
  renderOptions: V2StartupOperatorMenuRenderOptions = {},
): string {
  const activeItem = V2_OPERATOR_SIDEBAR_ITEMS.find((item) => item.route === activeRoute) ?? V2_OPERATOR_SIDEBAR_ITEMS[0];
  const activePage = V2_OPERATOR_CENTER_PANEL_PAGES[activeItem.route];

  const sidebarMarkup = `
    <nav class="nav-card v2-operator-nav" aria-label="V2 operator menu" data-v2-left-sidebar data-v2-sidebar-count="${V2_OPERATOR_SIDEBAR_ITEMS.length}">
      ${V2_OPERATOR_SIDEBAR_ITEMS.map((item) => renderV2SidebarItem(item, activeItem.route)).join('')}
    </nav>
  `;
  const centerPanelMarkup = activePage.blocks.map((block) => renderV2CenterPanelBlock(block, renderOptions.runtimeState, renderOptions.dashboardVisualMode, renderOptions.v2PlaybackQueueItems ?? [])).join('');

  return renderV2OperatorPageWrapper({
    activeItem,
    activeRoute: activeItem.route,
    activePage,
    sidebarMarkup,
    centerPanelMarkup,
    history,
    historyCopyButtonLabel,
    inspectMode: Boolean(renderOptions.inspectMode),
    valueInspectMode: Boolean(renderOptions.valueInspectMode),
    implementationStatusMode: Boolean(renderOptions.implementationStatusMode),
  });
}

function renderV2SidebarItem(item: (typeof V2_OPERATOR_SIDEBAR_ITEMS)[number], activeRoute: V2OperatorSidebarRoute): string {
  const isActive = item.route === activeRoute;

  return `
    <button
      class="nav-link v2-operator-nav__item ${isActive ? 'nav-link--active v2-operator-nav__item--active' : ''}"
      type="button"
      data-v2-sidebar-route="${escapeHtml(item.route)}"
      data-v2-sidebar-order="${escapeHtml(item.order)}"
    >
      <span class="nav-link__code v2-operator-nav__order">${escapeHtml(item.order)}</span>
      <span class="nav-link__body v2-operator-nav__body">
        <strong data-v2-sidebar-label>${escapeHtml(item.label)}</strong>
        <small>${escapeHtml(item.subtitle)}</small>
      </span>
    </button>
  `;
}

function renderV2CenterPanelBlock(block: V2OperatorCenterPanelBlock, runtimeState: Record<string, any> = {}, dashboardVisualMode: string | null = null, v2PlaybackQueueItems: readonly V2PlaybackQueueItem[] = []): string {
  switch (block.type) {
    case 'infoPanel':
    case 'statusCard':
    case 'snapshotViewer':
    case 'snapshotList':
    case 'futurePlaceholder':
      return renderSimpleBlock(block);
    case 'actionList':
    case 'exampleList':
      return renderActionListBlock(block);
    case 'backendActionCard':
      return renderBackendActionCard(block, runtimeState);
    case 'newAuthCard':
      return renderV2NewAuthCard(block, runtimeState, dashboardVisualMode);
    case 'rpiSchedulerControls':
      return renderRpiSchedulerControlsBlock(block, runtimeState);
    case 'rpiStagesRow':
      return renderRpiStagesRowBlock(block);
    case 'rpiWorkersRow':
      return renderRpiWorkersRowBlock(block);
    case 'recoveryPlaceholderActions':
      return renderRecoveryPlaceholderActionsBlock(block);
    case 'pirActivityTest':
      return renderPirActivityTestBlock(block, runtimeState);
    case 'playbackRenderingControls':
      return renderPlaybackRenderingControlsBlock(block, runtimeState);
    case 'playbackDropQueue':
      return renderPlaybackDropQueueBlock(block, v2PlaybackQueueItems);
    case 'sectionGroup':
      return renderSectionGroupBlock(block);
    case 'toggleGroup':
      return renderToggleGroupBlock(block);
    case 'multiComboRow':
      return renderMultiComboRowBlock(block);
    case 'stageTable':
      return renderStageTableBlock(block);
  }
}

function renderSimpleBlock(block: Extract<V2OperatorCenterPanelBlock, { type: 'infoPanel' | 'statusCard' | 'snapshotViewer' | 'snapshotList' | 'futurePlaceholder' }>): string {
  return `
    <article class="card v2-block v2-block--${escapeHtml(block.type)}" data-v2-block-type="${escapeHtml(block.type)}" data-v2-block-id="${escapeHtml(block.id)}" ${renderV2StatusAttributes(block.id)}>
      ${renderBlockHeader(block.title, getV2BlockStatusId(block.id), block.status, block.risk)}
      ${block.body ? `<p class="card__copy">${escapeHtml(block.body)}</p>` : ''}
      ${block.fields ? renderFieldList(block.fields) : ''}
    </article>
  `;
}

function renderActionListBlock(block: Extract<V2OperatorCenterPanelBlock, { type: 'actionList' | 'exampleList' }>): string {
  return `
    <article class="card v2-block v2-block--${escapeHtml(block.type)}" data-v2-block-type="${escapeHtml(block.type)}" data-v2-block-id="${escapeHtml(block.id)}" ${renderV2StatusAttributes(block.id)}>
      ${renderBlockHeader(block.title, getV2BlockStatusId(block.id), block.type === 'exampleList' ? '*EX' : undefined, block.type === 'exampleList' ? 'future' : undefined)}
      ${block.body ? `<p class="card__copy">${escapeHtml(block.body)}</p>` : ''}
      <div class="v2-action-list" role="list">
        ${block.items.map((item) => renderActionItem(item, block.type)).join('')}
      </div>
    </article>
  `;
}

function renderBackendActionCard(block: Extract<V2OperatorCenterPanelBlock, { type: 'backendActionCard' }>, runtimeState: Record<string, any>): string {
  const statusKey = block.statusKey;
  const result = runtimeState.initResults?.[block.resultKey] ?? null;
  const logs = runtimeState.logs?.[block.logKey] ?? [];
  const sourceBadge = block.sourceBadge ? renderSourceBadge(block.sourceBadge.mode, block.sourceBadge.label) : '';

  return `
    <article class="card card--hybrid v2-block v2-block--backendActionCard" data-v2-backend-card="${escapeHtml(block.id)}" data-v2-block-type="backendActionCard" data-v2-block-id="${escapeHtml(block.id)}" ${renderV2StatusAttributes(block.id)}>
      <header class="card__header v2-block__header">
        <div>
          <p class="card__code">${escapeHtml(statusKey)}</p>
          <h3>${escapeHtml(block.title)}</h3>
        </div>
        <div class="card__header-tags">${sourceBadge}</div>
        <div class="v2-block__pills">
          ${statusBadge(runtimeState.statusByKey?.[statusKey] ?? 'idle')}
          ${renderV2StatusHelpButton(getV2BlockStatusId(block.id), block.title)}
        </div>
      </header>
      ${block.body ? `<p class="card__copy">${escapeHtml(block.body)}</p>` : ''}
      <div class="button-row v2-backend-button-row">${block.actions.map(renderBackendActionButton).join('')}</div>
      ${renderV2BackendResultSurface(result)}
      <div class="log-surface" data-scroll-preserve="log-${escapeHtml(block.logKey)}">${renderLogEntries(logs, { sourceKey: block.logKey })}</div>
    </article>
  `;
}

function renderV2NewAuthCard(block: Extract<V2OperatorCenterPanelBlock, { type: 'newAuthCard' }>, runtimeState: Record<string, any>, dashboardVisualMode: string | null): string {
  const newAuth = runtimeState.newAuth ?? {};
  const disabledInTestMode = dashboardVisualMode === 'test';
  const disabledNotice = disabledInTestMode
    ? '<p class="notice notice--warning new-auth-disabled-notice">NEW AUTH login is disabled in Test Mode. Switch to Real Mode to use iCloudPD login controls.</p>'
    : '';
  const sourceBadge = block.sourceBadge ? renderSourceBadge(block.sourceBadge.mode, disabledInTestMode ? 'DISABLED IN TEST MODE' : block.sourceBadge.label) : '';

  return `
    <article class="card card--hybrid v2-block v2-block--newAuthCard ${disabledInTestMode ? 'card--new-auth-disabled' : ''}" data-v2-new-auth-card="${escapeHtml(block.id)}" data-new-auth-card="1A-STASH-OFF" data-v2-block-type="newAuthCard" data-v2-block-id="${escapeHtml(block.id)}" ${renderV2StatusAttributes(block.id)}${disabledInTestMode ? ' data-new-auth-disabled="test-mode" aria-disabled="true"' : ''}>
      <header class="card__header v2-block__header">
        <div>
          <p class="card__code">${escapeHtml(block.statusKey)}</p>
          <h3>${escapeHtml(block.title)}</h3>
        </div>
        <div class="card__header-tags">${sourceBadge}</div>
        <div class="v2-block__pills">
          ${statusBadge(runtimeState.statusByKey?.[block.statusKey] ?? 'idle')}
          ${renderV2StatusHelpButton(getV2BlockStatusId(block.id), block.title)}
        </div>
      </header>
      ${block.body ? `<p class="card__copy">${escapeHtml(block.body)}</p>` : ''}
      ${disabledNotice}
      <div class="new-auth-action-list">
        ${NEW_AUTH_BUTTONS.map((button) => renderNewAuthActionRow(button, newAuth.buttonStates ?? {}, disabledInTestMode)).join('')}
      </div>
      ${renderV2BackendResultSurface(newAuth.latestResult ?? null)}
      ${newAuth.sessionFilesResult ? renderResultSurface(newAuth.sessionFilesResult) : ''}
      ${newAuth.artifactPackResult ? renderResultSurface(newAuth.artifactPackResult) : ''}
      ${newAuth.artifactPackListResult ? renderResultSurface(newAuth.artifactPackListResult) : ''}
      <div class="log-surface" data-scroll-preserve="log-${escapeHtml(block.logKey)}">${renderLogEntries(runtimeState.logs?.[block.logKey] ?? [], { sourceKey: block.logKey })}</div>
    </article>
  `;
}

function renderRpiSchedulerControlsBlock(block: Extract<V2OperatorCenterPanelBlock, { type: 'rpiSchedulerControls' }>, runtimeState: Record<string, any>): string {
  const schedulerState = runtimeState.schedulerEmulator ?? {};
  const result = runtimeState.initResults?.[block.resultKey] ?? null;
  const logs = runtimeState.logs?.[block.logKey] ?? [];
  const sourceBadge = block.sourceBadge ? renderSourceBadge(block.sourceBadge.mode, block.sourceBadge.label) : '';

  return `
    <article class="card card--hybrid v2-block v2-block--rpiSchedulerControls" data-v2-rpi-scheduler-controls data-v2-block-type="rpiSchedulerControls" data-v2-block-id="${escapeHtml(block.id)}" ${renderV2StatusAttributes(block.id)}>
      <header class="card__header v2-block__header">
        <div>
          <p class="card__code">${escapeHtml(block.statusKey)}</p>
          <h3>${escapeHtml(block.title)}</h3>
        </div>
        <div class="card__header-tags">${sourceBadge}</div>
        <div class="v2-block__pills">
          ${statusBadge(runtimeState.statusByKey?.[block.statusKey] ?? 'idle')}
          ${renderV2StatusHelpButton(getV2BlockStatusId(block.id), block.title)}
        </div>
      </header>
      ${block.body ? `<p class="card__copy">${escapeHtml(block.body)}</p>` : ''}
      <div class="v2-rpi-scheduler-target-row">
        <span class="pill">Target: Raspberry real crontab</span>
        <span class="pill">No Windows CronEmulator target</span>
      </div>
      <div class="button-row scheduler-emulator-button-row v2-rpi-scheduler-button-row">
        ${SCHEDULER_EMULATOR_BUTTONS.map((button) => renderSchedulerActionButton(button, {
          buttonStates: schedulerState.buttonStates ?? {},
          schedulerTarget: SCHEDULER_TARGETS.raspberryRealCrontab,
        })).join('')}
      </div>
      <div class="scheduler-crontab-grid v2-rpi-crontab-grid">
        <label class="scheduler-crontab-field">
          <span>insert Raspberry crontab</span>
          <textarea class="terminal-textarea" data-scheduler-crontab-input spellcheck="false">${escapeHtml(schedulerState.editableCrontab ?? '')}</textarea>
        </label>
        <label class="scheduler-crontab-field">
          <span>active Raspberry crontab</span>
          <textarea class="terminal-textarea" data-scheduler-active-crontab readonly spellcheck="false">${escapeHtml(schedulerState.activeCrontab ?? "not checked, press 'Get active crontab'")}</textarea>
        </label>
      </div>
      ${renderV2BackendResultSurface(result)}
      <div class="log-surface" data-scroll-preserve="log-${escapeHtml(block.logKey)}">${renderLogEntries(logs, { sourceKey: block.logKey })}</div>
    </article>
  `;
}


function renderRpiStagesRowBlock(block: Extract<V2OperatorCenterPanelBlock, { type: 'rpiStagesRow' }>): string {
  return `
    <article class="card v2-block v2-block--rpiStagesRow" data-v2-rpi-stages-row data-v2-block-type="rpiStagesRow" data-v2-block-id="${escapeHtml(block.id)}" ${renderV2StatusAttributes(block.id)}>
      ${renderBlockHeader(block.title, getV2BlockStatusId(block.id), block.status)}
      ${block.body ? `<p class="card__copy">${escapeHtml(block.body)}</p>` : ''}
      <div class="v2-rpi-stage-flow" aria-label="DOWNLOAD to INDEX to GPS PARSER to GEOCODE to QUEUE">DOWNLOAD → INDEX → GPS PARSER → GEOCODE → QUEUE</div>
      <div class="v2-rpi-stage-card-row">
        ${block.stages.map((stage) => `
          <div class="v2-rpi-stage-card" data-v2-rpi-stage="${escapeHtml(stage.id)}">
            <strong>${escapeHtml(stage.label)}</strong>
            <span class="pill">${escapeHtml(stage.status)}</span>
          </div>
        `).join('')}
      </div>
    </article>
  `;
}


function renderRpiWorkersRowBlock(block: Extract<V2OperatorCenterPanelBlock, { type: 'rpiWorkersRow' }>): string {
  return `
    <article class="card v2-block v2-block--rpiWorkersRow" data-v2-rpi-workers-row data-v2-block-type="rpiWorkersRow" data-v2-block-id="${escapeHtml(block.id)}" ${renderV2StatusAttributes(block.id)}>
      ${renderBlockHeader(block.title, getV2BlockStatusId(block.id), block.status)}
      ${block.body ? `<p class="card__copy">${escapeHtml(block.body)}</p>` : ''}
      <div class="v2-rpi-worker-card-row">
        ${block.workers.map((worker) => `
          <div class="v2-rpi-worker-card" data-v2-rpi-worker="${escapeHtml(worker.id)}">
            <header>
              <strong>${escapeHtml(worker.label)}</strong>
              <span class="pill">${escapeHtml(worker.status)}</span>
            </header>
            <dl>
              <div><dt>Last called</dt><dd>${escapeHtml(worker.lastCalled)}</dd></div>
              <div><dt>Since last call</dt><dd>${escapeHtml(worker.sinceLastCall)}</dd></div>
            </dl>
          </div>
        `).join('')}
      </div>
    </article>
  `;
}


function renderRecoveryPlaceholderActionsBlock(block: Extract<V2OperatorCenterPanelBlock, { type: 'recoveryPlaceholderActions' }>): string {
  return `
    <article class="card v2-block v2-block--recoveryPlaceholderActions" data-v2-recovery-placeholder-actions data-v2-block-type="recoveryPlaceholderActions" data-v2-block-id="${escapeHtml(block.id)}" ${renderV2StatusAttributes(block.id)}>
      ${renderBlockHeader(block.title, getV2BlockStatusId(block.id), block.status, 'future')}
      ${block.body ? `<p class="card__copy">${escapeHtml(block.body)}</p>` : ''}
      <div class="button-row v2-recovery-placeholder-buttons">
        ${block.actions.map((action) => `
          <button class="button button--secondary" type="button" data-action="v2-placeholder-alert" data-v2-alert-text="${escapeHtml(action.label)}" data-v2-recovery-placeholder="${escapeHtml(action.id)}">${escapeHtml(action.label)}</button>
        `).join('')}
      </div>
    </article>
  `;
}


function renderPirActivityTestBlock(block: Extract<V2OperatorCenterPanelBlock, { type: 'pirActivityTest' }>, runtimeState: Record<string, any>): string {
  const activityDetection = normalizeB5ActivityDetectionState(runtimeState.simulation?.b5ActivityDetection);
  const timeoutSeconds = Number(runtimeState.simulation?.inactivityTimeoutSeconds ?? 5);
  const phaseLabel = activityDetection.phase === 'countdown' && activityDetection.countdownValue
    ? `Countdown: ${activityDetection.countdownValue}`
    : activityDetection.phase === 'detecting'
      ? `Detecting for ${activityDetection.detectionWindowSeconds} seconds`
      : activityDetection.phase === 'complete'
        ? 'Test complete'
        : 'Ready to start';
  const running = activityDetection.phase === 'countdown' || activityDetection.phase === 'detecting';

  return `
    <article class="card v2-block v2-block--pirActivityTest" data-v2-pir-activity-test data-v2-block-type="pirActivityTest" data-v2-block-id="${escapeHtml(block.id)}" ${renderV2StatusAttributes(block.id)}>
      ${renderBlockHeader(block.title, getV2BlockStatusId(block.id), block.status, block.risk)}
      ${block.body ? `<p class="card__copy">${escapeHtml(block.body)}</p>` : ''}
      <fieldset class="selector-card selector-card--hybrid b5-activity-test v2-pir-source-selector">
        <legend>B5 activity detection test sources</legend>
        <p class="stage-card__subtitle">Choose the sources watched by the next 3 → 2 → 1 activity test.</p>
        <div class="toggle-grid">
          ${B5_ACTIVITY_SOURCES.map((source) => renderPirActivitySourceOption(source, activityDetection.selectedSources[source])).join('')}
        </div>
      </fieldset>
      <section class="selector-card selector-card--hybrid b5-activity-runner" aria-label="Activity detection test">
        <div>
          <p class="selector-card__label">Activity detection test</p>
          <p class="stage-card__subtitle">Start Test runs a visible 3 → 2 → 1 countdown and then watches selected sources for a bounded test window.</p>
        </div>
        <div class="button-row">
          <button class="button button--primary" data-action="start-b5-activity-test" ${running ? 'disabled' : ''}>Start Test</button>
          <button class="button button--secondary" data-action="emulate-pir-signal">Emulate PIR signal</button>
        </div>
        <p class="notice notice--neutral b5-activity-phase">${escapeHtml(phaseLabel)}</p>
      </section>
      <section class="selector-card selector-card--hybrid b5-activity-results" aria-label="Activity detection results">
        <p class="selector-card__label">Activity detection results</p>
        <div class="b5-activity-results__grid">
          ${B5_ACTIVITY_SOURCES.map((source) => renderPirActivityResult(source, activityDetection.results[source])).join('')}
        </div>
      </section>
      <label class="v2-pir-timeout-row">
        <span>Inactivity timeout</span>
        <input type="number" min="1" step="1" name="inactivityTimeoutSeconds" value="${escapeHtml(timeoutSeconds)}" />
        <small>seconds</small>
      </label>
      ${renderFieldList([
        { label: 'Current screen state', value: runtimeState.truth?.screenState ?? 'ON' },
        { label: 'Last activity source', value: runtimeState.truth?.lastActivitySource ?? 'None' },
        { label: 'Shared timeout', value: `${timeoutSeconds}s` },
        { label: 'Playback checkpoint', value: runtimeState.truth?.lastCheckpoint ?? 'No checkpoint yet' },
      ])}
      <p class="notice notice--neutral">Screen simulation controls ready.</p>
    </article>
  `;
}

function renderPirActivitySourceOption(source: B5ActivitySource, checked: boolean): string {
  return `
    <label class="toggle-card toggle-card--hybrid b5-activity-source-option">
      <input type="checkbox" name="b5ActivitySource" value="${escapeHtml(source)}" ${checked ? 'checked' : ''} />
      <span class="toggle-card__body">
        <span class="toggle-card__label">${escapeHtml(getB5ActivitySourceLabel(source))}</span>
        <span class="toggle-card__meta">Included in the next V2 PIR test</span>
      </span>
    </label>
  `;
}

function renderPirActivityResult(source: B5ActivitySource, result: { status?: string; message?: string } | undefined): string {
  const status = result?.status ?? 'pending';
  const message = result?.message ?? 'Waiting for test run.';
  return `
    <div class="b5-activity-result b5-activity-result--${escapeHtml(status)}" data-b5-activity-result="${escapeHtml(source)}">
      <strong>${escapeHtml(getB5ActivitySourceLabel(source))}</strong>
      <span>${escapeHtml(status.replace('_', ' '))}</span>
      <small>${escapeHtml(message)}</small>
    </div>
  `;
}


function renderPlaybackRenderingControlsBlock(block: Extract<V2OperatorCenterPanelBlock, { type: 'playbackRenderingControls' }>, runtimeState: Record<string, any>): string {
  const playbackRenderingState = normalizePlaybackRenderingState(runtimeState.playbackRendering);
  const playbackReady = Boolean(runtimeState.truth?.playbackActive || runtimeState.statusByKey?.B4 === 'success');
  const renderingOptions = buildPlaybackRenderingOptions(playbackReady);
  return `
    <article class="card v2-block v2-block--playbackRenderingControls" data-v2-playback-rendering-controls data-v2-block-type="playbackRenderingControls" data-v2-block-id="${escapeHtml(block.id)}" ${renderV2StatusAttributes(block.id)}>
      ${renderBlockHeader(block.title, getV2BlockStatusId(block.id), block.status)}
      ${block.body ? `<p class="card__copy">${escapeHtml(block.body)}</p>` : ''}
      <section class="playback-rendering-panel selector-card selector-card--hybrid" aria-label="B4 rendering controls">
        <div>
          <p class="selector-card__label">Rendering target</p>
          <p class="stage-card__subtitle">Rendering tabs affect only preview/fullscreen presentation. Backend selection remains <code>POST /api/runtime/playback/select-current</code>.</p>
        </div>
        <div class="playback-rendering-tabs" role="tablist" aria-label="V2 playback rendering platform tabs">
          ${renderV2PlaybackRenderingPlatformTabs(playbackRenderingState.platform, playbackReady)}
        </div>
        <div>
          <p class="selector-card__label">Rendering mode</p>
          <p class="stage-card__subtitle">Preview and fullscreen use the same ${escapeHtml(PLAYBACK_RENDERING_LIBRARY.label)}. Controls unlock after B4 Run selects/activates playback.</p>
        </div>
        <div class="playback-rendering-options" role="group" aria-label="V2 playback rendering mode controls">
          ${renderV2PlaybackRenderingModeButtons(renderingOptions, playbackRenderingState.mode, playbackReady)}
        </div>
        <p class="notice playback-rendering-panel__notice">${playbackReady ? escapeHtml(getV2PlaybackRenderingReadyMessage(playbackRenderingState.mode)) : 'Run B4 successfully before changing rendering mode or target.'}</p>
      </section>
    </article>
  `;
}

function renderV2PlaybackRenderingPlatformTabs(activePlatform: PlaybackRenderingPlatform, playbackReady: boolean): string {
  return PLAYBACK_RENDERING_PLATFORM_OPTIONS.map((option) => {
    const isActive = option.value === activePlatform;
    const isRaspberry = option.value === PLAYBACK_RENDERING_PLATFORMS.raspberryOs;
    const disabled = !playbackReady || isRaspberry;
    const title = isRaspberry ? 'Raspberry OS rendering is disabled until Raspberry playback proof exists.' : option.description;
    return `<button
      class="button ${isActive ? 'button--primary' : 'button--secondary'} playback-rendering-tab"
      type="button"
      role="tab"
      aria-selected="${isActive ? 'true' : 'false'}"
      data-playback-rendering-platform="${escapeHtml(option.value)}"
      title="${escapeHtml(title)}"
      ${disabled ? 'disabled' : ''}
    >${escapeHtml(option.label)}${isRaspberry ? ' (disabled)' : ''}</button>`;
  }).join('');
}

function renderV2PlaybackRenderingModeButtons(options: ReturnType<typeof buildPlaybackRenderingOptions>, activeMode: PlaybackRenderingMode, playbackReady: boolean): string {
  return options.map((option) => {
    const isActive = option.value === activeMode;
    const disabled = !playbackReady || !option.enabled;
    const sharedRendererId = getSharedPlaybackRendererId(option.value);
    const sharedRendererText = sharedRendererId ? `Shared renderer: ${sharedRendererId}. ` : '';
    return `<button
      class="button ${isActive ? 'button--primary' : 'button--secondary'} playback-rendering-mode"
      type="button"
      data-playback-rendering-mode="${escapeHtml(option.value)}"
      title="${escapeHtml(sharedRendererText + option.description)}"
      ${disabled ? 'disabled' : ''}
    >${escapeHtml(option.label)}</button>`;
  }).join('');
}

function getV2PlaybackRenderingReadyMessage(mode: PlaybackRenderingMode): string {
  if (mode === PLAYBACK_RENDERING_MODES.previewWindow) {
    return 'Preview rendering mode is selected. Real media presentation remains browser-native and frontend-owned in this slice.';
  }
  if (mode === PLAYBACK_RENDERING_MODES.fullscreen) {
    return 'Fullscreen rendering mode is selected. OS-level or Raspberry hardware control is not implemented in this slice.';
  }
  return 'Playback can continue without rendering.';
}


function renderPlaybackDropQueueBlock(block: Extract<V2OperatorCenterPanelBlock, { type: 'playbackDropQueue' }>, queueItems: readonly V2PlaybackQueueItem[]): string {
  return `
    <article class="card v2-block v2-block--playbackDropQueue" data-v2-playback-drop-queue data-v2-block-type="playbackDropQueue" data-v2-block-id="${escapeHtml(block.id)}" ${renderV2StatusAttributes(block.id)}>
      ${renderBlockHeader(block.title, getV2BlockStatusId(block.id), block.status)}
      ${block.body ? `<p class="card__copy">${escapeHtml(block.body)}</p>` : ''}
      <label class="v2-playback-drop-zone" data-v2-playback-drop-zone>
        <input data-v2-playback-file-input type="file" multiple accept="image/*,video/*,*/*" />
        <span><strong>Drop files here</strong><small>Images, videos, and other files are accepted into this browser-local queue table.</small></span>
      </label>
      <div class="v2-playback-queue-table-wrap">
        <table class="v2-playback-queue-table">
          <thead>
            <tr>
              <th>filename</th>
              <th>is video</th>
              <th>is image</th>
              <th>is other</th>
              <th>duration</th>
              <th>GPS coordinates</th>
              <th>GPS status</th>
              <th>address string</th>
              <th>address status</th>
              <th>metadata source</th>
              <th>backend queue</th>
            </tr>
          </thead>
          <tbody>
            ${queueItems.length ? queueItems.map(renderPlaybackDropQueueRow).join('') : '<tr data-v2-playback-empty-queue><td colspan="11">No dropped files yet. Non-media files will be listed here and reported gracefully instead of played.</td></tr>'}
          </tbody>
        </table>
      </div>
    </article>
  `;
}

function renderPlaybackDropQueueRow(item: V2PlaybackQueueItem): string {
  return `
    <tr data-v2-playback-queue-item="${escapeHtml(item.id)}" data-v2-playback-media-kind="${escapeHtml(item.mediaKind)}">
      <td>${escapeHtml(item.filename)}</td>
      <td>${item.mediaKind === 'video' ? 'yes' : 'no'}</td>
      <td>${item.mediaKind === 'image' ? 'yes' : 'no'}</td>
      <td>${item.mediaKind === 'other' ? 'yes — report not playable' : 'no'}</td>
      <td>${escapeHtml(item.durationLabel)}</td>
      <td>${escapeHtml(item.gpsCoordinates)}</td>
      <td><span class="pill" data-v2-playback-gps-status="${escapeHtml(item.gpsStatus ?? 'missing')}">${escapeHtml(item.gpsStatus ?? 'missing')}</span></td>
      <td>${escapeHtml(item.address)}</td>
      <td><span class="pill" data-v2-playback-address-status="${escapeHtml(item.addressStatus ?? 'missing')}">${escapeHtml(item.addressStatus ?? 'missing')}</span></td>
      <td><small title="${escapeHtml(item.metadataMessage ?? 'No metadata message supplied.')}">${escapeHtml(item.metadataSource ?? 'browser-local-file')}</small></td>
      <td>${renderPlaybackDropQueueBackendCell(item)}</td>
    </tr>
  `;
}

function renderPlaybackDropQueueBackendCell(item: V2PlaybackQueueItem): string {
  const isMedia = item.mediaKind === 'image' || item.mediaKind === 'video';
  const status = item.backendQueueStatus ?? (isMedia ? 'local-only' : 'blocked');
  const message = item.backendQueueMessage ?? (isMedia
    ? 'Not sent to backend yet.'
    : 'Non-media cannot request backend queue prepare.');
  const action = isMedia
    ? `<button class="button button--secondary button--compact" type="button" data-action="v2-playback-queue-prepare-item" data-v2-playback-queue-item-id="${escapeHtml(item.id)}">Prepare backend queue</button>`
    : '<button class="button button--secondary button--compact" type="button" disabled aria-disabled="true">Not playable</button>';
  return `<div class="v2-playback-backend-cell"><span class="pill">${escapeHtml(status)}</span><small>${escapeHtml(message)}</small>${action}</div>`;
}

function renderSectionGroupBlock(block: Extract<V2OperatorCenterPanelBlock, { type: 'sectionGroup' }>): string {
  return `
    <article class="card v2-block v2-block--sectionGroup" data-v2-block-type="sectionGroup" data-v2-block-id="${escapeHtml(block.id)}" ${renderV2StatusAttributes(block.id)}>
      ${renderBlockHeader(block.title, getV2BlockStatusId(block.id))}
      ${block.body ? `<p class="card__copy">${escapeHtml(block.body)}</p>` : ''}
      <div class="v2-section-grid">
        ${block.sections.map((section) => `
          <section class="v2-section-card" data-v2-section-id="${escapeHtml(section.id)}" ${renderV2StatusAttributes(section.id)}>
            <header>
              <p class="card__code">${escapeHtml(section.id)}</p>
              <h4>${escapeHtml(section.title)}</h4>
              ${renderV2StatusHelpButton(getV2BlockStatusId(section.id), section.title)}
            </header>
            ${section.body ? `<p>${escapeHtml(section.body)}</p>` : ''}
            <div class="v2-action-list v2-action-list--compact" role="list">
              ${section.items.map((item) => renderSectionItem(item)).join('')}
            </div>
          </section>
        `).join('')}
      </div>
    </article>
  `;
}

function renderToggleGroupBlock(block: Extract<V2OperatorCenterPanelBlock, { type: 'toggleGroup' }>): string {
  return `
    <article class="card v2-block v2-block--toggleGroup" data-v2-block-type="toggleGroup" data-v2-block-id="${escapeHtml(block.id)}" ${renderV2StatusAttributes(block.id)}>
      ${renderBlockHeader(block.title, getV2BlockStatusId(block.id), block.status)}
      ${block.body ? `<p class="card__copy">${escapeHtml(block.body)}</p>` : ''}
      ${block.actions ? `<div class="v2-inline-actions">${block.actions.map((item) => renderVisualButton(item)).join('')}</div>` : ''}
      <div class="v2-toggle-list">
        ${block.toggles.map((toggle) => `
          <div class="v2-toggle-row" data-v2-toggle-row="${escapeHtml(toggle.id)}">
            <span><strong>${escapeHtml(toggle.label)}</strong><small>${escapeHtml(toggle.description ?? toggle.status ?? 'visual-only')}</small></span>
            <button type="button" disabled aria-disabled="true">${escapeHtml(toggle.status ?? 'not wired')}</button>
          </div>
        `).join('')}
      </div>
    </article>
  `;
}

function renderMultiComboRowBlock(block: Extract<V2OperatorCenterPanelBlock, { type: 'multiComboRow' }>): string {
  return `
    <article class="card v2-block v2-block--multiComboRow" data-v2-block-type="multiComboRow" data-v2-block-id="${escapeHtml(block.id)}" ${renderV2StatusAttributes(block.id)}>
      ${renderBlockHeader(block.title, getV2BlockStatusId(block.id), block.status, block.risk)}
      ${block.body ? `<p class="card__copy">${escapeHtml(block.body)}</p>` : ''}
      <div class="v2-multi-combo-row" data-v2-multi-combo-row>
        ${renderDisabledSelect('Worker type', block.workerOptions)}
        ${renderDisabledSelect('Schedule', block.scheduleOptions)}
        <div class="v2-combo-preview"><span>${escapeHtml(block.previewLabel)}</span></div>
        <button type="button" disabled aria-disabled="true">Install later</button>
      </div>
    </article>
  `;
}

function renderStageTableBlock(block: Extract<V2OperatorCenterPanelBlock, { type: 'stageTable' }>): string {
  return `
    <article class="card v2-block v2-block--stageTable" data-v2-block-type="stageTable" data-v2-block-id="${escapeHtml(block.id)}" ${renderV2StatusAttributes(block.id)}>
      ${renderBlockHeader(block.title, getV2BlockStatusId(block.id), block.status)}
      ${block.body ? `<p class="card__copy">${escapeHtml(block.body)}</p>` : ''}
      ${block.actions ? `<div class="v2-inline-actions">${block.actions.map((item) => renderVisualButton(item)).join('')}</div>` : ''}
      <div class="v2-stage-table-wrap">
        <table class="v2-stage-table">
          <thead>
            <tr>
              <th>Stage</th>
              <th>Current status</th>
              <th>Batch size</th>
              <th>Statistics</th>
            </tr>
          </thead>
          <tbody>
            ${block.stages.map((stage) => `
              <tr data-v2-stage-id="${escapeHtml(stage.id)}">
                <td><span class="card__code">${escapeHtml(stage.id)}</span><strong>${escapeHtml(stage.label)}</strong></td>
                <td>${escapeHtml(stage.status)}</td>
                <td><span class="v2-stage-setting">${escapeHtml(stage.batchSizeLabel)}</span></td>
                <td><span class="pill">${escapeHtml(stage.statisticsStatus)}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </article>
  `;
}

function renderV2StatusAttributes(blockId: string): string {
  const statusId = getV2BlockStatusId(blockId);
  const status = getV2ImplementationStatusElement(statusId);
  return `data-v2-status-id="${escapeHtml(statusId)}" data-v2-implementation-status="${escapeHtml(status?.status ?? 'in-progress')}" data-v2-status-label="${escapeHtml(status?.label ?? statusId)}" data-v2-status-help="${escapeHtml(status?.summary ?? 'Status/help metadata foundation is present; detailed control explanation arrives in a later V2 batch.')}"`;
}

function renderBlockHeader(title: string, statusId: string, status?: string, risk?: string): string {
  return `
    <header class="card__header v2-block__header">
      <div>
        <p class="card__code">typed block</p>
        <h3>${escapeHtml(title)}</h3>
      </div>
      <div class="v2-block__pills">
        ${status ? `<span class="pill">${escapeHtml(status)}</span>` : ''}
        ${risk ? `<span class="pill v2-risk-pill v2-risk-pill--${escapeHtml(risk)}">${escapeHtml(risk)}</span>` : ''}
        ${renderV2StatusHelpButton(statusId, title)}
      </div>
    </header>
  `;
}

function renderV2StatusHelpButton(statusId: string, label: string): string {
  return `
    <button
      class="v2-status-help-button"
      type="button"
      data-action="show-v2-status-help"
      data-v2-help-status-id="${escapeHtml(statusId)}"
      aria-label="Show implementation status for ${escapeHtml(label)}"
      title="Show implementation status"
    >?</button>
  `;
}

function renderFieldList(fields: readonly { label: string; value: string }[]): string {
  return `
    <dl class="v2-field-list">
      ${fields.map((field) => `
        <div>
          <dt>${escapeHtml(field.label)}</dt>
          <dd>${escapeHtml(field.value)}</dd>
        </div>
      `).join('')}
    </dl>
  `;
}

function renderActionItem(item: V2OperatorActionItem, parentType: 'actionList' | 'exampleList'): string {
  const tag = parentType === 'exampleList' ? 'article' : 'div';
  return `
    <${tag} class="v2-action-row" role="listitem" data-v2-child-item="${escapeHtml(item.id)}" data-v2-interaction="${escapeHtml(item.interaction ?? 'visualOnly')}" data-v2-risk="${escapeHtml(item.risk ?? 'safe')}">
      <span class="v2-action-row__id">${escapeHtml(item.id)}</span>
      <span class="v2-action-row__body"><strong>${escapeHtml(item.label)}</strong>${item.description ? `<small>${escapeHtml(item.description)}</small>` : ''}</span>
      <span class="pill">${escapeHtml(item.status ?? 'visual-only')}</span>
    </${tag}>
  `;
}

function renderSectionItem(item: V2OperatorSectionItem): string {
  return `
    <div class="v2-action-row" role="listitem" data-v2-child-item="${escapeHtml(item.id)}" data-v2-interaction="${escapeHtml(('interaction' in item ? item.interaction : undefined) ?? 'visualOnly')}" data-v2-risk="${escapeHtml(('risk' in item ? item.risk : undefined) ?? 'safe')}">
      <span class="v2-action-row__id">${escapeHtml(item.id)}</span>
      <span class="v2-action-row__body"><strong>${escapeHtml(item.label)}</strong>${item.description ? `<small>${escapeHtml(item.description)}</small>` : ''}</span>
      <span class="pill">${escapeHtml(item.status ?? 'visual-only')}</span>
    </div>
  `;
}

function renderV2BackendResultSurface(result: any): string {
  if (result) {
    return renderResultSurface(result);
  }
  return `
    <section class="v2-latest-backend-result" aria-label="Latest backend result">
      <h4>Latest backend result</h4>
      ${renderResultSurface(result)}
    </section>
  `;
}

function renderBackendActionButton(button: V2OperatorBackendActionButton): string {
  return `<button class="button button--${escapeHtml(button.variant)}" data-action="${escapeHtml(button.action)}">${escapeHtml(button.label)}</button>`;
}

function renderVisualButton(item: V2OperatorActionItem): string {
  return `
    <button type="button" disabled aria-disabled="true" data-v2-visual-action="${escapeHtml(item.id)}" data-v2-risk="${escapeHtml(item.risk ?? 'safe')}">
      ${escapeHtml(item.label)}
    </button>
  `;
}

function renderDisabledSelect(label: string, options: readonly string[]): string {
  return `
    <label>
      <span>${escapeHtml(label)}</span>
      <select disabled aria-disabled="true">
        ${options.map((option) => `<option>${escapeHtml(option)}</option>`).join('')}
      </select>
    </label>
  `;
}
