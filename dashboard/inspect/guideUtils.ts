import { BACKEND_STATUS_TITLES, REALITY_STATE_TITLES } from './guideCopy.ts';

export function compactWhitespace(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function getCardContext(element) {
  const card = element.closest('.card, .stage-card');
  if (!card) {
    return null;
  }

  return {
    code: compactWhitespace(card.querySelector('.card__code')?.textContent),
    title: compactWhitespace(card.querySelector('h3, h4')?.textContent),
  };
}

export function buildValueMeta(label, element, source) {
  const value = compactWhitespace(element.textContent) || 'Empty';
  return {
    label: `${label}: ${value}`,
    description: `Source: ${source}`,
  };
}

export function buildRealityMeta(state, label, description) {
  const title = REALITY_STATE_TITLES[state] ?? REALITY_STATE_TITLES.unknown;
  return {
    state,
    label: `${title}: ${label}`,
    description,
  };
}

export function buildBackendStatusMeta(state, label, description) {
  const title = BACKEND_STATUS_TITLES[state] ?? BACKEND_STATUS_TITLES.unknown;
  return {
    state,
    label: `${title}: ${label}`,
    description,
  };
}

export function isMissingBackendStatus(status) {
  return [404, 405, 501].includes(Number(status));
}
