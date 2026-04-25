import { sanitizeAuthValue } from './authLogSanitizer.js';

export const AUTH_PROVIDER = 'icloud';

export const AUTH_STATUSES = Object.freeze({
  IDLE: 'idle',
  PREFLIGHT_RUNNING: 'preflight_running',
  PREFLIGHT_FAILED: 'preflight_failed',
  BLOCKED: 'blocked',
  PROVIDER_FAILED: 'provider_failed',
  AUTHENTICATED: 'authenticated',
  EXPIRED: 'expired',
  UNKNOWN: 'unknown',
});

export const TWO_FACTOR_STATUSES = Object.freeze({
  NOT_STARTED: 'not_started',
  REQUIRED: 'required',
  COMPLETE: 'complete',
  UNKNOWN: 'unknown',
});

export function createDefaultAuthState(overrides = {}) {
  return {
    status: AUTH_STATUSES.IDLE,
    has_required_files: false,
    requires_2fa: 'unknown',
    two_factor_status: TWO_FACTOR_STATUSES.NOT_STARTED,
    two_factor_method: null,
    next_action: 'run_auth_preflight',
    attemptId: null,
    updatedAt: null,
    error: null,
    authenticatedUser: null,
    provider: AUTH_PROVIDER,
    ...overrides,
  };
}

export function projectPublicAuthState(rawState) {
  const state = rawState || createDefaultAuthState();
  return sanitizeAuthValue({
    status: state.status ?? AUTH_STATUSES.IDLE,
    has_required_files: Boolean(state.has_required_files),
    requires_2fa: state.requires_2fa ?? 'unknown',
    two_factor_status: state.two_factor_status ?? TWO_FACTOR_STATUSES.NOT_STARTED,
    two_factor_method: state.two_factor_method ?? null,
    next_action: state.next_action ?? 'run_auth_preflight',
    attemptId: state.attemptId ?? null,
    updatedAt: state.updatedAt ?? null,
    error: state.error ?? null,
    authenticatedUser: state.authenticatedUser ?? null,
    provider: state.provider ?? AUTH_PROVIDER,
  });
}
