/*
 * Provides shared HTML renderer utilities for dashboard fragments.
 * Keeps escaping, payload formatting, and definition-list rendering in one place.
 * Renderer modules import these helpers to preserve deterministic markup.
 */

export type DefinitionListData = Record<string, unknown>;

export type TransportData = {
  requestId?: unknown;
  method?: unknown;
  path?: unknown;
  status?: unknown;
  statusText?: unknown;
  ok?: unknown;
  url?: unknown;
  headers?: unknown;
  body?: unknown;
};

export type TransportDetails = {
  operation?: unknown;
  endpoint?: unknown;
  outcome?: unknown;
  request?: TransportData;
  response?: TransportData;
  [key: string]: unknown;
};

// Renders key/value rows with escaped labels and inline values.
export function renderDefinitionList(data: DefinitionListData = {}): string {
  const rows = Object.entries(data)
    .map(([label, value]) => `<div class="definition-row"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(formatInlineValue(value))}</dd></div>`)
    .join('');
  return `<dl class="definition-list">${rows}</dl>`;
}

// Converts JSON-like payloads into stable pretty text for HTML pre blocks.
export function formatPayload(payload: unknown): string {
  if (typeof payload === 'string') {
    return payload;
  }
  return JSON.stringify(payload, null, 2);
}

// Converts scalar or object values into compact text for definition-list cells.
export function formatInlineValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    return formatPayload(value);
  }
  return String(value);
}

// Narrows arbitrary details into the transport metadata shape used by modals.
export function asTransportDetails(details: unknown): TransportDetails | null {
  if (!details || typeof details !== 'object' || Array.isArray(details)) {
    return null;
  }
  return details as TransportDetails;
}

// Escapes dynamic values before inserting them into string-built HTML.
export function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
