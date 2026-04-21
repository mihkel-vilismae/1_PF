const INSPECTABLE_SELECTOR = [
  '.nav-link',
  '.button',
  '.db-object-button',
  '.toggle-card',
  '.selector-option',
  '.field-label',
  '[data-log-entry-open]',
  '[data-history-entry-open]',
].join(', ');

const VALUE_INSPECTABLE_SELECTOR = [
  '.topbar h1',
  '.definition-row dd',
  '.status-badge',
  '.result-surface .mini-badge',
  '.result-message',
  '.result-json',
  '.log-entry__message',
  '.log-entry__meta > span:first-child',
  '.log-entry__status-chip > span:first-child',
  '.history-item__message',
  '.history-item__meta > span:first-child',
  '.history-item__status-chip > span:first-child',
  '.preview-frame__bar .screen-indicator',
  '.preview-frame__content strong',
  '.preview-frame__content span',
  '.preview-frame__content small',
  '.worker-row__main span',
  '.worker-row__meta .mini-badge',
  '.worker-row__meta > span:last-child',
  '.db-activity-entry__meta span',
  '.db-activity-entry p',
  '.notice',
  '.modal-panel__subtitle',
  '.modal-panel__json',
].join(', ');

const REALITY_INSPECTABLE_SELECTOR = [
  '.nav-link',
  '.button',
  '.db-object-button',
  '.hero-pill',
  '.pill',
  '.status-badge',
  '.notice',
  '.result-surface',
  '.db-table-shell',
  '.db-activity-entry',
  '.definition-row',
  '.preview-frame',
  '.screen-indicator',
  '.worker-row',
  '[data-log-entry-open]',
  '[data-history-entry-open]',
].join(', ');

const BACKEND_STATUS_INSPECTABLE_SELECTOR = [
  '.button',
  '.db-object-button',
  '.hero-pill',
  '.pill',
  '.status-badge',
  '.notice',
  '.result-surface',
  '.db-table-shell',
  '.db-activity-entry',
  '.definition-row',
  '.preview-frame',
  '.screen-indicator',
  '.worker-row',
  '[data-log-entry-open]',
  '[data-history-entry-open]',
].join(', ');

export function bindInspectMode({
  app,
  enabled,
  describeInspectableElement,
  handleInspectEnter,
  handleInspectLeave,
  hideInspectTooltip,
}) {
  const inspectables = Array.from(app.querySelectorAll(INSPECTABLE_SELECTOR));

  inspectables.forEach((element, index) => {
    const meta = describeInspectableElement(element);
    if (!meta) {
      return;
    }

    element.classList.add('inspectable-control');
    element.dataset.inspectIndex = String(index + 1);
    element.dataset.inspectLabel = meta.label;
    element.dataset.inspectDescription = meta.description;
    element.addEventListener('mouseenter', handleInspectEnter);
    element.addEventListener('mouseleave', handleInspectLeave);
    element.addEventListener('focus', handleInspectEnter);
    element.addEventListener('blur', handleInspectLeave);
  });

  document.body.classList.toggle('inspect-mode', Boolean(enabled));
  if (!enabled) {
    hideInspectTooltip();
  }
}

export function bindValueInspectMode({
  app,
  enabled,
  describeValueElement,
  handleValueInspectEnter,
  handleInspectLeave,
  hideInspectTooltip,
}) {
  bindFocusableInspectMode({
    app,
    enabled,
    selector: VALUE_INSPECTABLE_SELECTOR,
    bodyClass: 'value-inspect-mode',
    tabindexDatasetKey: 'valueGuideTabindexAdded',
    describeElement: describeValueElement,
    enterHandler: handleValueInspectEnter,
    leaveHandler: handleInspectLeave,
    hideInspectTooltip,
    applyMeta(element, meta) {
      element.classList.add('value-inspectable');
      element.dataset.valueLabel = meta.label;
      element.dataset.valueDescription = meta.description;
    },
  });
}

export function bindRealityInspectMode({
  app,
  enabled,
  describeRealityElement,
  handleRealityInspectEnter,
  handleInspectLeave,
  hideInspectTooltip,
}) {
  bindFocusableInspectMode({
    app,
    enabled,
    selector: REALITY_INSPECTABLE_SELECTOR,
    bodyClass: 'reality-inspect-mode',
    tabindexDatasetKey: 'realityGuideTabindexAdded',
    describeElement: describeRealityElement,
    enterHandler: handleRealityInspectEnter,
    leaveHandler: handleInspectLeave,
    hideInspectTooltip,
    applyMeta(element, meta) {
      element.classList.add('reality-inspectable');
      element.dataset.realityState = meta.state;
      element.dataset.realityLabel = meta.label;
      element.dataset.realityDescription = meta.description;
    },
  });
}

export function bindBackendStatusInspectMode({
  app,
  enabled,
  describeBackendStatusElement,
  handleBackendStatusInspectEnter,
  handleInspectLeave,
  hideInspectTooltip,
}) {
  bindFocusableInspectMode({
    app,
    enabled,
    selector: BACKEND_STATUS_INSPECTABLE_SELECTOR,
    bodyClass: 'backend-status-inspect-mode',
    tabindexDatasetKey: 'backendStatusGuideTabindexAdded',
    describeElement: describeBackendStatusElement,
    enterHandler: handleBackendStatusInspectEnter,
    leaveHandler: handleInspectLeave,
    hideInspectTooltip,
    applyMeta(element, meta) {
      element.classList.add('backend-status-inspectable');
      element.dataset.backendStatusState = meta.state;
      element.dataset.backendStatusLabel = meta.label;
      element.dataset.backendStatusDescription = meta.description;
    },
  });
}

function bindFocusableInspectMode({
  app,
  enabled,
  selector,
  bodyClass,
  tabindexDatasetKey,
  describeElement,
  enterHandler,
  leaveHandler,
  hideInspectTooltip,
  applyMeta,
}) {
  const elements = Array.from(app.querySelectorAll(selector));

  elements.forEach((element) => {
    const meta = describeElement(element);
    if (!meta) {
      return;
    }

    applyMeta(element, meta);
    element.addEventListener('mouseenter', enterHandler);
    element.addEventListener('mouseleave', leaveHandler);
    element.addEventListener('focus', enterHandler);
    element.addEventListener('blur', leaveHandler);

    if (enabled && !isNaturallyFocusable(element) && !element.hasAttribute('tabindex')) {
      element.dataset[tabindexDatasetKey] = 'true';
      element.tabIndex = 0;
    }

    if (!enabled && element.dataset[tabindexDatasetKey] === 'true') {
      element.removeAttribute('tabindex');
      delete element.dataset[tabindexDatasetKey];
    }
  });

  document.body.classList.toggle(bodyClass, Boolean(enabled));
  if (!enabled) {
    hideInspectTooltip();
  }
}

function isNaturallyFocusable(element) {
  return element.matches('button, a[href], input, select, textarea, summary, [tabindex]:not([tabindex="-1"])');
}
