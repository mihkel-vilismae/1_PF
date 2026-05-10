/*
 * Provides NEW AUTH sanitization and value-normalization helpers.
 * These helpers keep passwords, tokens, cookies, 2FA codes, and provider secrets
 * out of dashboard responses, logs, and diagnostics.
 */
import { SENSITIVE_ENV_KEYS } from './newAuthConstants.js';
import type { NewAuthEnvValues, NewAuthIcloudpdConfig } from './newAuthTypes.js';

/*
 * Redacts credentials and provider secret material from combined command output.
 */
export function sanitizeCommandOutput(value: string, config: NewAuthIcloudpdConfig): string {
  let sanitized = value;
  const secrets = [config.username, config.password, config.cookieDir, config.downloadDir, config.domain].filter((entry): entry is string => Boolean(entry));
  for (const secret of secrets) {
    sanitized = sanitized.split(secret).join('[REDACTED]');
  }
  sanitized = sanitized.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]');
  sanitized = sanitized.replace(/\b\d{6}\b/g, '[REDACTED_2FA_CODE]');
  return sanitized;
}

/*
 * Normalizes unknown path-like values into non-empty strings or null.
 */
export function normalizeNewAuthPath(value: unknown): string | null {
  const resolved = stringValue(value);
  return resolved ? resolved : null;
}

/*
 * Converts unknown input into a trimmed string when it has content.
 */
export function stringValue(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/*
 * Reads positive numeric environment-style values with a safe fallback.
 */
export function positiveNumber(value: unknown, fallback: number): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}

/*
 * Redacts an email-like username while preserving enough context for recognition.
 */
export function redactEmail(value: string | null): string | null {
  if (!value) return null;
  const [name, domain] = value.split('@');
  if (!domain) return '[REDACTED_EMAIL]';
  return `${name.slice(0, 2)}***@${domain}`;
}

/*
 * Hides provider proof arguments that may contain account identifiers or paths.
 */
export function sanitizeProviderProofArgForDisplay(value: string): string {
  if (value.includes('@')) return '[REDACTED_EMAIL]';
  if (value.includes('runtime_data') || value.includes('icloud')) return '[REDACTED_PATH]';
  return value;
}

/*
 * Summarizes which environment values are present without exposing raw values.
 */
export function summarizeEnvPresence(envValues: NewAuthEnvValues): Record<string, boolean> {
  const summary: Record<string, boolean> = {};
  for (const key of SENSITIVE_ENV_KEYS) {
    summary[key] = Boolean(envValues[key]);
  }
  return summary;
}

/*
 * Builds a short redacted provider-output preview for UI diagnostics.
 */
export function sanitizePreview(value: string, maxLength = 500): string {
  const text = String(value ?? '')
    .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, '[redacted-email]')
    .replace(/password\s*=\s*[^\s]+/gi, 'password=[redacted]')
    .replace(/pw\s*=\s*[^\s]+/gi, 'pw=[redacted]')
    .replace(/apple[_\s-]?id\s*[:=]\s*[^\s]+/gi, 'apple_id=[redacted]')
    .replace(/(otp|2fa|mfa|verification|security)\s*(code)?\s*[:=]\s*[^\s]+/gi, '$1$2=[redacted]')
    .replace(/\b(otp|2fa|mfa|verification|security|sms)\s*(code)?\s*(?:is|was|:)?\s*\d{4,8}\b/gi, '$1$2 [redacted]')
    .replace(/\b\d{4,8}\s+(otp|2fa|mfa|verification|security|sms)\s*(code)?\b/gi, '[redacted] $1$2')
    .replace(/token\s*=\s*[^\s]+/gi, 'token=[redacted]')
    .replace(/cookie\s*=\s*[^\s]+/gi, 'cookie=[redacted]')
    .replace(/(session|cookie|token)[^\r\n]*(file|path|dir|directory)\s*[:=]\s*[^\r\n]+/gi, '$1_$2=[redacted-path]')
    .replace(/\b([A-Z][A-Z0-9_]{2,})\s*=\s*([^\s]+)/g, (full, key: string) => `${key}=${SENSITIVE_ENV_KEYS.has(key) ? '[redacted]' : '[present]'}`);
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

/*
 * Redacts sensitive path segments before paths are shown to the dashboard.
 */
export function sanitizePathForDisplay(value: string): string {
  const homeDir = process.env.HOME;
  if (homeDir && value.startsWith(homeDir)) {
    return value.replace(homeDir, '~');
  }
  return value;
}

/*
 * Reports whether sensitive environment keys have values without exposing them.
 */
export function buildSafeEnvPresence(envValues: NewAuthEnvValues): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const key of SENSITIVE_ENV_KEYS) {
    result[key] = Boolean(stringValue(envValues[key]));
  }
  return result;
}
