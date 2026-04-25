import { randomUUID } from 'node:crypto';
import {
  AUTH_PROVIDER,
  AUTH_STATUSES,
  TWO_FACTOR_STATUSES,
  createDefaultAuthState,
} from './authState.js';
import {
  PROVIDER_OUTCOMES,
  normalizeProviderOutcome,
} from './providers/providerRegistry.js';

export async function verifyResumedAuthSession({
  persistedState,
  providerRegistry,
  providerName = AUTH_PROVIDER,
  envValues = {},
  now = new Date(),
  timeoutMs = 120_000,
  mapProviderOutcomeToAuthState,
  withTimeout,
} = {}) {
  const updatedAt = now.toISOString();
  const normalizedPersistedState = persistedState ? createDefaultAuthState(persistedState) : null;

  if (!normalizedPersistedState) {
    return createDefaultAuthState({
      status: AUTH_STATUSES.UNKNOWN,
      has_required_files: false,
      requires_2fa: 'unknown',
      two_factor_status: TWO_FACTOR_STATUSES.UNKNOWN,
      next_action: 'run_auth_preflight',
      updatedAt,
      provider: providerName,
      error: {
        code: 'auth_resume_no_persisted_state',
        message: 'No persisted auth state was available to resume.',
      },
    });
  }

  const shouldVerify = shouldVerifyPersistedSession(normalizedPersistedState);
  if (!shouldVerify) {
    return createDefaultAuthState(normalizedPersistedState);
  }

  const attemptId = normalizedPersistedState.attemptId || `resume-${randomUUID()}`;
  const provider = providerRegistry?.getProvider?.(providerName) || null;
  if (!provider || typeof provider.resumeSession !== 'function') {
    return createDefaultAuthState({
      status: AUTH_STATUSES.BLOCKED,
      has_required_files: Boolean(normalizedPersistedState.has_required_files),
      requires_2fa: 'unknown',
      two_factor_status: TWO_FACTOR_STATUSES.UNKNOWN,
      two_factor_method: null,
      next_action: 'provider_session_verification_unavailable',
      attemptId,
      updatedAt,
      error: {
        code: 'provider_resume_unavailable',
        message: `No session resume provider is registered for ${providerName}.`,
      },
      authenticatedUser: null,
      provider: providerName,
      lastProviderEvent: PROVIDER_OUTCOMES.PROVIDER_UNAVAILABLE,
    });
  }

  try {
    const providerOutcome = normalizeProviderOutcome(await withTimeout(provider.resumeSession({
      attemptId,
      provider: providerName,
      envValues,
      persistedAuthStatus: normalizedPersistedState.status,
    }), timeoutMs, 'provider_resume_timeout'));

    return mapProviderOutcomeToAuthState({
      attemptId,
      updatedAt,
      providerName,
      providerOutcome,
    });
  } catch (error) {
    return createDefaultAuthState({
      status: AUTH_STATUSES.UNKNOWN,
      has_required_files: Boolean(normalizedPersistedState.has_required_files),
      requires_2fa: 'unknown',
      two_factor_status: TWO_FACTOR_STATUSES.UNKNOWN,
      two_factor_method: null,
      next_action: 'inspect_provider_session_verification_failure',
      attemptId,
      updatedAt,
      error: {
        code: error?.code || 'provider_resume_failed',
        message: 'Provider session verification failed before a usable auth state was produced.',
        detailMessage: null,
      },
      authenticatedUser: null,
      provider: providerName,
      lastProviderEvent: PROVIDER_OUTCOMES.FAILED,
    });
  }
}

export function shouldVerifyPersistedSession(persistedState) {
  if (!persistedState) return false;
  if (persistedState.status === AUTH_STATUSES.AUTHENTICATED) return true;
  if (persistedState.next_action === 'verify_provider_session') return true;
  if (persistedState.error?.code === 'auth_resume_verification_required') return true;
  return false;
}
