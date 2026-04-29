import { INSPECT_EYEBROWS } from './guideCopy.ts';

export function createGuideTooltipController({ getState }) {
  let inspectTooltipElement;
  let inspectTooltipEyebrowElement;
  let inspectTooltipTitleElement;
  let inspectTooltipBodyElement;
  let activeInspectTarget = null;

  function handleInspectEnter(event) {
    if (!getState().inspectMode) {
      return;
    }

    showGuideTooltip({
      element: event.currentTarget,
      label: event.currentTarget.dataset.inspectLabel,
      description: event.currentTarget.dataset.inspectDescription,
      eyebrow: INSPECT_EYEBROWS.control,
    });
  }

  function handleValueInspectEnter(event) {
    if (!getState().valueInspectMode) {
      return;
    }

    showGuideTooltip({
      element: event.currentTarget,
      label: event.currentTarget.dataset.valueLabel,
      description: event.currentTarget.dataset.valueDescription,
      eyebrow: INSPECT_EYEBROWS.value,
    });
  }

  function handleRealityInspectEnter(event) {
    if (!getState().realityInspectMode) {
      return;
    }

    showGuideTooltip({
      element: event.currentTarget,
      label: event.currentTarget.dataset.realityLabel,
      description: event.currentTarget.dataset.realityDescription,
      eyebrow: INSPECT_EYEBROWS.reality,
    });
  }

  function handleBackendStatusInspectEnter(event) {
    if (!getState().backendStatusInspectMode) {
      return;
    }

    showGuideTooltip({
      element: event.currentTarget,
      label: event.currentTarget.dataset.backendStatusLabel,
      description: event.currentTarget.dataset.backendStatusDescription,
      eyebrow: INSPECT_EYEBROWS.backend,
    });
  }

  function handleInspectLeave(event) {
    if (activeInspectTarget === event.currentTarget) {
      hideInspectTooltip();
    }
  }

  function showGuideTooltip({ element, label, description, eyebrow }) {
    if (!label || !description) {
      return;
    }

    const tooltip = ensureInspectTooltip();
    clearInspectTargetState();

    inspectTooltipEyebrowElement.textContent = eyebrow ?? INSPECT_EYEBROWS.fallback;
    inspectTooltipTitleElement.textContent = label;
    inspectTooltipBodyElement.textContent = description;
    tooltip.hidden = false;
    activeInspectTarget = element;
    activeInspectTarget.dataset.inspectActive = 'true';
    positionInspectTooltip(element);
  }

  function hideInspectTooltip() {
    clearInspectTargetState();
    if (inspectTooltipElement) {
      inspectTooltipElement.hidden = true;
    }
  }

  function clearInspectTargetState() {
    if (activeInspectTarget) {
      delete activeInspectTarget.dataset.inspectActive;
      activeInspectTarget = null;
    }
  }

  function ensureInspectTooltip() {
    if (inspectTooltipElement) {
      return inspectTooltipElement;
    }

    inspectTooltipElement = document.createElement('aside');
    inspectTooltipElement.className = 'inspect-tooltip';
    inspectTooltipElement.hidden = true;
    inspectTooltipElement.innerHTML = `
      <p class="inspect-tooltip__eyebrow"></p>
      <h3 class="inspect-tooltip__title"></h3>
      <p class="inspect-tooltip__body"></p>
    `;
    inspectTooltipEyebrowElement = inspectTooltipElement.querySelector('.inspect-tooltip__eyebrow');
    inspectTooltipTitleElement = inspectTooltipElement.querySelector('.inspect-tooltip__title');
    inspectTooltipBodyElement = inspectTooltipElement.querySelector('.inspect-tooltip__body');
    document.body.appendChild(inspectTooltipElement);
    return inspectTooltipElement;
  }

  function positionInspectTooltip(element) {
    if (!inspectTooltipElement || inspectTooltipElement.hidden) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const tooltipRect = inspectTooltipElement.getBoundingClientRect();
    const margin = 14;
    let top = rect.bottom + margin;
    let left = rect.left + rect.width / 2 - tooltipRect.width / 2;

    if (top + tooltipRect.height > window.innerHeight - margin) {
      top = rect.top - tooltipRect.height - margin;
    }
    if (top < margin) {
      top = margin;
    }
    if (left < margin) {
      left = margin;
    }
    if (left + tooltipRect.width > window.innerWidth - margin) {
      left = window.innerWidth - tooltipRect.width - margin;
    }

    inspectTooltipElement.style.top = `${Math.round(top)}px`;
    inspectTooltipElement.style.left = `${Math.round(left)}px`;
  }

  return {
    handleInspectEnter,
    handleValueInspectEnter,
    handleRealityInspectEnter,
    handleBackendStatusInspectEnter,
    handleInspectLeave,
    hideInspectTooltip,
  };
}
