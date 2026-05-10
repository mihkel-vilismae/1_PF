/*
 * Holds NEW AUTH constants shared across the service facade and helper modules.
 * Keeping constants together prevents behavioral drift while the large service is
 * split into smaller internal files.
 */
import type { NewAuthSessionEvidence } from './newAuthTypes.js';

export const ICLOUDPD_TIMEOUT_MS = 8000;
export const ICLOUDPD_LOGIN_TIMEOUT_MS = 120_000;
export const MAX_STDIO_CHARS = 6000;
export const MAX_SESSION_CHILDREN = 25;
export const SENSITIVE_ENV_KEYS = new Set(['user', 'pw', 'APPLE_ID', 'APPLE_PASSWORD', 'ICLOUDPD_COOKIE_DIR']);
export const SESSION_FILE_HINT_PATTERN = /(cookie|session|token|auth|icloud|key|credential)/i;
export const INTERACTIVE_RESULT_POLL_MS = 50;

export const EMPTY_SESSION_EVIDENCE: NewAuthSessionEvidence = Object.freeze({
  hasSessionFiles: false,
  sessionFileCount: 0,
  latestModifiedMs: null,
  latestModifiedAt: null,
});
