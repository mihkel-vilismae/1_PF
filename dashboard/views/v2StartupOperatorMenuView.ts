/*
 * Renders the V2 startup-mode operator shell.
 * The left sidebar owns exactly nine top-level routes.
 * The center panel renders each route's original sub-items as typed visual blocks.
 */
import { V2_OPERATOR_CENTER_PANEL_PAGES, type V2OperatorActionItem, type V2OperatorBackendActionButton, type V2OperatorCenterPanelBlock, type V2OperatorSectionItem } from '../data/v2OperatorCenterPanel.ts';
import { V2_OPERATOR_SIDEBAR_ITEMS, type V2OperatorSidebarRoute } from '../data/v2OperatorSidebar.ts';
import { getV2BlockStatusId, getV2ImplementationStatusElement } from '../data/v2ImplementationStatus.ts';
import { renderLogEntries, renderResultSurface, renderSourceBadge, statusBadge, type HistoryEntry } from '../services/renderers.ts';
import { escapeHtml } from '../services/renderers/sharedRendererUtils.ts';
import { renderV2OperatorPageWrapper } from './v2OperatorPageWrapper.ts';
import { NEW_AUTH_BUTTONS, renderNewAuthActionRow } from './newAuthActionRows.ts';
import { SCHEDULER_EMULATOR_BUTTONS, renderSchedulerActionButton } from './schedulerActionRows.ts';
import { SCHEDULER_TARGETS } from '../../shared/schedulerPlatformCapabilities.ts';

type V2StartupOperatorMenuRenderOptions = {
  inspectMode?: boolean;
  valueInspectMode?: boolean;
  implementationStatusMode?: boolean;
  runtimeState?: Record<string, any>;
  dashboardVisualMode?: string | null;
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
  const centerPanelMarkup = activePage.blocks.map((block) => renderV2CenterPanelBlock(block, renderOptions.runtimeState, renderOptions.dashboardVisualMode)).join('');

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

function renderV2CenterPanelBlock(block: V2OperatorCenterPanelBlock, runtimeState: Record<string, any> = {}, dashboardVisualMode: string | null = null): string {
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
