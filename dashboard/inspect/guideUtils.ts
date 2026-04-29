import { BACKEND_STATUS_TITLES, REALITY_STATE_TITLES } from './guideCopy.ts';

export type CardContext = {
  code: string;
  title: string;
};

export type InspectValueMeta = {
  label: string;
  description: string;
};

export type InspectStateMeta<TState extends string = string> = {
  state: TState;
  label: string;
  description: string;
};

export function compactWhitespace(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function getCardContext(element: Element): CardContext | null {
  const card = element.closest('.card, .stage-card');
  if (!card) {
    return null;
  }

  return {
    code: compactWhitespace(card.querySelector('.card__code')?.textContent),
    title: compactWhitespace(card.querySelector('h3, h4')?.textContent),
  };
}

export function buildValueMeta(label: string, element: Element, source: string): InspectValueMeta {
  const value = compactWhitespace(element.textContent) || 'Empty';
  return {
    label: `${label}: ${value}`,
    description: `Source: ${source}`,
  };
}

export function buildRealityMeta<TState extends string>(state: TState, label: string, description: string): InspectStateMeta<TState> {
  const title = REALITY_STATE_TITLES[state as keyof typeof REALITY_STATE_TITLES] ?? REALITY_STATE_TITLES.unknown;
  return {
    state,
    label: `${title}: ${label}`,
    description,
  };
}

export function buildBackendStatusMeta<TState extends string>(state: TState, label: string, description: string): InspectStateMeta<TState> {
  const title = BACKEND_STATUS_TITLES[state as keyof typeof BACKEND_STATUS_TITLES] ?? BACKEND_STATUS_TITLES.unknown;
  return {
    state,
    label: `${title}: ${label}`,
    description,
  };
}

export function isMissingBackendStatus(status: unknown): boolean {
  return [404, 405, 501].includes(Number(status));
}
