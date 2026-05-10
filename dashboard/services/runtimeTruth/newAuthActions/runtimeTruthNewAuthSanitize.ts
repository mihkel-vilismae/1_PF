/*
 * Sanitizes NEW AUTH runtime-truth payloads before logs, history, or modal output.
 * This frontend pass preserves the backend secret-redaction boundary.
 */
import { SECRET_FIELD_PATTERN } from './runtimeTruthNewAuthConstants.ts';

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

// Performs a final frontend redaction pass for provider communication text.
export function sanitizeNewAuthProviderText(value) {
  return String(value)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, (email) => redactEmailForDisplay(email))
    .replace(/\b\d{6,8}\b/g, '[redacted-code]')
    .replace(/((?:password|passwd|authorization|bearer|token|cookie|session|secret)\s*[:=]\s*)([^\s]+)/gi, '$1[redacted]')
    .replace(/(Authorization:\s*)(.+)/gi, '$1[redacted]')
    .replace(/(Cookie:\s*)(.+)/gi, '$1[redacted]');
}

// Redacts an email address while preserving a recognizable account shape.
export function redactEmailForDisplay(email) {
  const [name, domain] = email.split('@');
  const prefix = name.length <= 2 ? `${name[0] ?? '*'}***` : `${name.slice(0, 2)}***`;
  return `${prefix}@${domain}`;
}

// Recursively removes secret-like fields from NEW AUTH payloads.
export function sanitizeNewAuthPayload(value) {
  if (Array.isArray(value)) return value.map((item) => sanitizeNewAuthPayload(item));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SECRET_FIELD_PATTERN.test(key))
      .map(([key, nestedValue]) => [key, sanitizeNewAuthPayload(nestedValue)]),
  );
}
