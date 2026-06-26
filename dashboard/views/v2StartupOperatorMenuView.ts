/*
 * Renders the V2 startup-mode operator shell.
 * The left sidebar owns exactly nine top-level routes.
 * The center panel renders each route's original sub-items as typed visual blocks.
 */
import { V2_OPERATOR_CENTER_PANEL_PAGES, type V2OperatorActionItem, type V2OperatorCenterPanelBlock, type V2OperatorSectionItem } from '../data/v2OperatorCenterPanel.ts';
import { V2_OPERATOR_SIDEBAR_ITEMS, type V2OperatorSidebarRoute } from '../data/v2OperatorSidebar.ts';
import { getV2BlockStatusId, getV2ImplementationStatusElement } from '../data/v2ImplementationStatus.ts';
import { type HistoryEntry } from '../services/renderers.ts';
import { escapeHtml } from '../services/renderers/sharedRendererUtils.ts';
import { renderV2OperatorPageWrapper } from './v2OperatorPageWrapper.ts';

type V2StartupOperatorMenuRenderOptions = {
  inspectMode?: boolean;
  valueInspectMode?: boolean;
  implementationStatusMode?: boolean;
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
  const centerPanelMarkup = activePage.blocks.map(renderV2CenterPanelBlock).join('');

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

function renderV2CenterPanelBlock(block: V2OperatorCenterPanelBlock): string {
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
      ${renderBlockHeader(block.title, block.status, block.risk)}
      ${block.body ? `<p class="card__copy">${escapeHtml(block.body)}</p>` : ''}
      ${block.fields ? renderFieldList(block.fields) : ''}
    </article>
  `;
}

function renderActionListBlock(block: Extract<V2OperatorCenterPanelBlock, { type: 'actionList' | 'exampleList' }>): string {
  return `
    <article class="card v2-block v2-block--${escapeHtml(block.type)}" data-v2-block-type="${escapeHtml(block.type)}" data-v2-block-id="${escapeHtml(block.id)}" ${renderV2StatusAttributes(block.id)}>
      ${renderBlockHeader(block.title, block.type === 'exampleList' ? '*EX' : undefined, block.type === 'exampleList' ? 'future' : undefined)}
      ${block.body ? `<p class="card__copy">${escapeHtml(block.body)}</p>` : ''}
      <div class="v2-action-list" role="list">
        ${block.items.map((item) => renderActionItem(item, block.type)).join('')}
      </div>
    </article>
  `;
}

function renderSectionGroupBlock(block: Extract<V2OperatorCenterPanelBlock, { type: 'sectionGroup' }>): string {
  return `
    <article class="card v2-block v2-block--sectionGroup" data-v2-block-type="sectionGroup" data-v2-block-id="${escapeHtml(block.id)}" ${renderV2StatusAttributes(block.id)}>
      ${renderBlockHeader(block.title)}
      ${block.body ? `<p class="card__copy">${escapeHtml(block.body)}</p>` : ''}
      <div class="v2-section-grid">
        ${block.sections.map((section) => `
          <section class="v2-section-card" data-v2-section-id="${escapeHtml(section.id)}">
            <header>
              <p class="card__code">${escapeHtml(section.id)}</p>
              <h4>${escapeHtml(section.title)}</h4>
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
      ${renderBlockHeader(block.title, block.status)}
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
      ${renderBlockHeader(block.title, block.status, block.risk)}
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
      ${renderBlockHeader(block.title, block.status)}
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
  return `data-v2-status-id="${escapeHtml(statusId)}" data-v2-implementation-status="${escapeHtml(status?.status ?? 'in-progress')}" data-v2-status-help="${escapeHtml(status?.summary ?? 'Status/help metadata foundation is present; detailed control explanation arrives in a later V2 batch.')}"`;
}

function renderBlockHeader(title: string, status?: string, risk?: string): string {
  return `
    <header class="card__header v2-block__header">
      <div>
        <p class="card__code">typed block</p>
        <h3>${escapeHtml(title)}</h3>
      </div>
      <div class="v2-block__pills">
        ${status ? `<span class="pill">${escapeHtml(status)}</span>` : ''}
        ${risk ? `<span class="pill v2-risk-pill v2-risk-pill--${escapeHtml(risk)}">${escapeHtml(risk)}</span>` : ''}
      </div>
    </header>
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
