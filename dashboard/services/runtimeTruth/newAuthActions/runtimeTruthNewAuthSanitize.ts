/*
 * Sanitizes NEW AUTH runtime-truth payloads before logs, history, or modal output.
 * This frontend pass preserves the backend secret-redaction boundary.
 */
import { SECRET_FIELD_PATTERN } from './runtimeTruthNewAuthConstants.ts';
import { sanitizeNewAuthProviderText } from '../../newAuthRedaction.ts';

export { sanitizeNewAuthProviderText };

// Extracts sanitized provider preview text from active NEW AUTH payload shapes.
export function extractSafeProviderCommunication(payload) {
  const details = payload?.details && typeof payload.details === 'object' ? payload.details : null;
  const providerProof = details?.providerProof && typeof details.providerProof === 'object' ? details.providerProof : null;
  const preview = typeof details?.providerOutputPreview === 'string'
    ? details.providerOutputPreview
    : typeof providerProof?.providerOutputPreview === 'string'
      ? providerProof.providerOutputPreview
      : null;
  return preview ? sanitizeNewAuthProviderText(preview) : null;
}

// Recursively removes secret-like fields from NEW AUTH payloads.
export function sanitizeNewAuthPayload(value) {
  if (Array.isArray(value)) return value.map((item) => sanitizeNewAuthPayload(item));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SECRET_FIELD_PATTERN.test(key))
      .map(([key, nestedValue]) => [key, sanitizeNewAuthPayloadEntry(key, nestedValue)]),
  );
}

// Sanitizes provider-output text fields before they can enter UI state, logs, or history.
function sanitizeNewAuthPayloadEntry(key, value) {
  if (typeof value === 'string' && isProviderCommunicationKey(key)) {
    return sanitizeNewAuthProviderText(value);
  }
  return sanitizeNewAuthPayload(value);
}

// Detects provider communication fields that may contain emails, codes, cookies, or secrets.
function isProviderCommunicationKey(key) {
  return /provider.*output|output.*provider|communication|raw/i.test(String(key));
}
