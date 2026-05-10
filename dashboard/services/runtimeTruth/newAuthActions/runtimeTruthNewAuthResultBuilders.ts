/*
 * Builds NEW AUTH button, result, log, and history projections.
 * The functions preserve existing runtime-truth payload shapes for dashboard consumers.
 */
import { buildTimelineDetails } from '../runtimeTruthActionUtils.ts';
import { sanitizeNewAuthPayload } from './runtimeTruthNewAuthSanitize.ts';

// Generates the timestamp format already used by the NEW AUTH runtime truth panel.
export function stampSafe() {
  return typeof Intl !== 'undefined' ? new Date().toLocaleString('et-EE', { timeZone: 'Europe/Tallinn' }) : new Date().toISOString();
}

// Builds one NEW AUTH button-state projection.
export function buildNewAuthButtonState(status, message, endpoint) {
  return {
    status,
    message,
    updatedAt: stampSafe(),
    endpoint: endpoint ? `${endpoint.method} ${endpoint.path}` : null,
  };
}

// Builds the latest-result payload stored in runtime truth state.
export function buildNewAuthResult({ operation, endpoint, outcome, message, payload, meta }) {
  return {
    operation,
    method: endpoint.method,
    endpoint: endpoint.path,
    outcome,
    message,
    status: meta?.response?.status ?? null,
    payload,
    receivedAt: stampSafe(),
  };
}

// Builds sanitized log details for NEW AUTH backend action events.
export function buildNewAuthLogDetails({ operation, endpoint, outcome, meta = null, payload = null }) {
  return {
    ...buildTimelineDetails(),
    operation,
    endpoint: `${endpoint.method} ${endpoint.path}`,
    outcome,
    request: sanitizeNewAuthPayload(meta?.request ?? { method: endpoint.method, path: endpoint.path, body: null }),
    response: sanitizeNewAuthPayload(meta?.response ?? (payload ? { body: payload } : null)),
  };
}

// Builds sanitized event-history details for NEW AUTH backend action events.
export function buildNewAuthHistoryDetails({ operation, endpoint, outcome, uiStatus, request, response }) {
  return {
    operation,
    endpoint: `${endpoint.method} ${endpoint.path}`,
    outcome,
    uiStatus,
    buttonStatus: uiStatus,
    request: sanitizeNewAuthPayload(request),
    response: sanitizeNewAuthPayload(response),
    recordedAt: stampSafe(),
  };
}
