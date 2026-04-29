import { INSPECT_EYEBROWS } from './guideCopy.ts';

type RuntimeInspectState = {
  inspectMode?: unknown;
  valueInspectMode?: unknown;
  realityInspectMode?: unknown;
  backendStatusInspectMode?: unknown;
};

type GuideTooltipControllerDependencies = {
  getState: () => RuntimeInspectState;
};

type GuideTooltipController = {
  handleInspectEnter: (event: Event) => void;
  handleValueInspectEnter: (event: Event) => void;
  handleRealityInspectEnter: (event: Event) => void;
  handleBackendStatusInspectEnter: (event: Event) => void;
  handleInspectLeave: (event: Event) => void;
  hideInspectTooltip: () => void;
};

type GuideTooltipDetails = {
  element: HTMLElement;
  label: string | undefined;
  description: string | undefined;
  eyebrow: string | undefined;
};

type InspectTooltipElements = {
  root: HTMLElement;
  eyebrow: HTMLElement;
  title: HTMLElement;
  body: HTMLElement;
};

export function createGuideTooltipController({ getState }: GuideTooltipControllerDependencies): GuideTooltipController {
  let inspectTooltipElements: InspectTooltipElements | null = null;
  let activeInspectTarget: HTMLElement | null = null;

  function handleInspectEnter(event: Event): void {
    if (!getState().inspectMode) {
      return;
    }

    const element = event.currentTarget as HTMLElement;
    showGuideTooltip({
      element,
      label: element.dataset.inspectLabel,
      description: element.dataset.inspectDescription,
      eyebrow: INSPECT_EYEBROWS.control,
    });
  }

  function handleValueInspectEnter(event: Event): void {
    if (!getState().valueInspectMode) {
      return;
    }

    const element = event.currentTarget as HTMLElement;
    showGuideTooltip({
      element,
      label: element.dataset.valueLabel,
      description: element.dataset.valueDescription,
      eyebrow: INSPECT_EYEBROWS.value,
    });
  }

  function handleRealityInspectEnter(event: Event): void {
    if (!getState().realityInspectMode) {
      return;
    }

    const element = event.currentTarget as HTMLElement;
    showGuideTooltip({
      element,
      label: element.dataset.realityLabel,
      description: element.dataset.realityDescription,
      eyebrow: INSPECT_EYEBROWS.reality,
    });
  }

  function handleBackendStatusInspectEnter(event: Event): void {
    if (!getState().backendStatusInspectMode) {
      return;
    }

    const element = event.currentTarget as HTMLElement;
    showGuideTooltip({
      element,
      label: element.dataset.backendStatusLabel,
      description: element.dataset.backendStatusDescription,
      eyebrow: INSPECT_EYEBROWS.backend,
    });
  }

  function handleInspectLeave(event: Event): void {
    if (activeInspectTarget === event.currentTarget) {
      hideInspectTooltip();
    }
  }

  function showGuideTooltip({ element, label, description, eyebrow }: GuideTooltipDetails): void {
    if (!label || !description) {
      return;
    }

    const tooltip = ensureInspectTooltip();
    clearInspectTargetState();

    tooltip.eyebrow.textContent = eyebrow ?? INSPECT_EYEBROWS.fallback;
    tooltip.title.textContent = label;
    tooltip.body.textContent = description;
    tooltip.root.hidden = false;
    activeInspectTarget = element;
    activeInspectTarget.dataset.inspectActive = 'true';
    positionInspectTooltip(element);
  }

  function hideInspectTooltip(): void {
    clearInspectTargetState();
    if (inspectTooltipElements) {
      inspectTooltipElements.root.hidden = true;
    }
  }

  function clearInspectTargetState(): void {
    if (activeInspectTarget) {
      delete activeInspectTarget.dataset.inspectActive;
      activeInspectTarget = null;
    }
  }

  function ensureInspectTooltip(): InspectTooltipElements {
    if (inspectTooltipElements) {
      return inspectTooltipElements;
    }

    const root = document.createElement('aside');
    root.className = 'inspect-tooltip';
    root.hidden = true;
    root.innerHTML = `
      <p class="inspect-tooltip__eyebrow"></p>
      <h3 class="inspect-tooltip__title"></h3>
      <p class="inspect-tooltip__body"></p>
    `;

    const eyebrow = root.querySelector<HTMLElement>('.inspect-tooltip__eyebrow')!;
    const title = root.querySelector<HTMLElement>('.inspect-tooltip__title')!;
    const body = root.querySelector<HTMLElement>('.inspect-tooltip__body')!;

    document.body.appendChild(root);
    inspectTooltipElements = { root, eyebrow, title, body };
    return inspectTooltipElements;
  }

  function positionInspectTooltip(element: HTMLElement): void {
    if (!inspectTooltipElements || inspectTooltipElements.root.hidden) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const tooltipRect = inspectTooltipElements.root.getBoundingClientRect();
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

    inspectTooltipElements.root.style.top = `${Math.round(top)}px`;
    inspectTooltipElements.root.style.left = `${Math.round(left)}px`;
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
