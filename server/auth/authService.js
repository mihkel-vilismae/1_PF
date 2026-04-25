import { randomUUID } from 'node:crypto';
import {
  AUTH_PROVIDER,
  AUTH_STATUSES,
  TWO_FACTOR_STATUSES,
  createDefaultAuthState,
  projectPublicAuthState,
} from './authState.js';
import { createAuthPersistence } from './authPersistence.js';
import { verifyResumedAuthSession } from './authSessionService.js';
import {
  PROVIDER_OUTCOMES,
  defaultProviderRegistry,
  normalizeProviderOutcome,
} from './providers/providerRegistry.js';

const REQUIRED_AUTH_CHECK_KEYS = new Set(['user', 'pw', 'ICLOUDPD_COOKIE_DIR']);
const DEFAULT_OPERATION_TIMEOUT_MS = 120_000;

let currentAuthState = createDefaultAuthState();
let currentPersistence = createAuthPersistence();
let authOperationInProgress = false;

export function configureAuthServiceForTests({ state = createDefaultAuthState(), persistence = null } = {}) {
  currentAuthState = createDefaultAuthState(state);
  currentPersistence = persistence || createAuthPersistence();
  authOperationInProgress = false;
}

export function getRawAuthState() {
  return { ...currentAuthState };
}

export function getPublicAuthState() {
  return projectPublicAuthState(currentAuthState);
}

export async function loadPersistedAuthState({ persistence = currentPersistence } = {}) {
  const loadedState = await persistence.load();
  if (loadedState) {
    currentAuthState = createDefaultAuthState(loadedState);
  }
  return getPublicAuthState();
}

async function persistCurrentAuthState({ persistence = currentPersistence } = {}) {
  await persistence.save(currentAuthState);
  return getPublicAuthState();
}

export function resetAuthState({ now = new Date() } = {}) {
  currentAuthState = createDefaultAuthState({
    updatedAt: now.toISOString(),
    next_action: 'run_auth_preflight',
  });
  void persistCurrentAuthState().catch(() => {});
  return getPublicAuthState();
}

export async function runAuthPreflight({
  checks = [],
  now = new Date(),
  attemptId = randomUUID(),
  providerName = AUTH_PROVIDER,
  providerRegistry = defaultProviderRegistry,
  timeoutMs = DEFAULT_OPERATION_TIMEOUT_MS,
  envValues = {},
} = {}) {
  if (authOperationInProgress) {
    return createConcurrentAuthState({ now, providerName });
  }

  return withAuthOperationLock(async () => {
    const updatedAt = now.toISOString();
    const authChecks = selectAuthReadinessChecks(checks);
    const missingOrInvalidRequiredChecks = authChecks.filter((check) => check.required && (!check.present || !check.valid));

    if (missingOrInvalidRequiredChecks.length > 0) {
      currentAuthState = createMissingAuthConfigState({
        attemptId,
        updatedAt,
        providerName,
        missingOrInvalidRequiredChecks,
      });
      await persistCurrentAuthState();
      return getPublicAuthState();
    }

    const provider = providerRegistry.getProvider(providerName);
    if (!provider || typeof provider.startLogin !== 'function') {
      currentAuthState = createProviderUnavailableState({
        attemptId,
        updatedAt,
        providerName,
        message: `No auth provider is registered for ${providerName}.`,
        internalEvent: 'provider_registry_miss',
      });
      await persistCurrentAuthState();
      return getPublicAuthState();
    }

    try {
      const providerOutcome = normalizeProviderOutcome(await withTimeout(provider.startLogin({
        attemptId,
        provider: providerName,
        checks: authChecks,
        envValues,
      }), timeoutMs, 'provider_start_timeout'));
      currentAuthState = mapProviderOutcomeToAuthState({
        attemptId,
        updatedAt,
        providerName,
        providerOutcome,
      });
      await persistCurrentAuthState();
      return getPublicAuthState();
    } catch (error) {
      currentAuthState = createProviderFailedState({
        attemptId,
        updatedAt,
        providerName,
        code: error?.code || 'provider_start_failed',
        message: 'Provider login attempt failed before a usable auth state was produced.',
        detailMessage: null,
      });
      await persistCurrentAuthState();
      return getPublicAuthState();
    }
  });
}

export async function submitAuthTwoFactor({
  code,
  now = new Date(),
  providerName = currentAuthState.provider || AUTH_PROVIDER,
  providerRegistry = defaultProviderRegistry,
  timeoutMs = DEFAULT_OPERATION_TIMEOUT_MS,
  envValues = {},
} = {}) {
  if (authOperationInProgress) {
    return createConcurrentAuthState({ now, providerName });
  }

  return withAuthOperationLock(async () => {
    const updatedAt = now.toISOString();
    if (!currentAuthState.attemptId || currentAuthState.requires_2fa !== true || currentAuthState.two_factor_status !== TWO_FACTOR_STATUSES.REQUIRED) {
      currentAuthState = createProviderFailedState({
        attemptId: currentAuthState.attemptId,
        updatedAt,
        providerName,
        code: 'auth_2fa_not_expected',
        message: '2FA submission was rejected because the auth state is not waiting for a 2FA code.',
        internalEvent: '2fa_rejected_without_pending_challenge',
      });
      await persistCurrentAuthState();
      return getPublicAuthState();
    }

    if (typeof code !== 'string' || code.trim() === '') {
      currentAuthState = createProviderFailedState({
        attemptId: currentAuthState.attemptId,
        updatedAt,
        providerName,
        code: 'auth_2fa_code_missing',
        message: '2FA submission requires a non-empty code.',
        internalEvent: '2fa_missing_code',
      });
      await persistCurrentAuthState();
      return getPublicAuthState();
    }

    const provider = providerRegistry.getProvider(providerName);
    if (!provider || typeof provider.submitTwoFactor !== 'function') {
      currentAuthState = createProviderUnavailableState({
        attemptId: currentAuthState.attemptId,
        updatedAt,
        providerName,
        message: `No 2FA submission provider is registered for ${providerName}.`,
        nextAction: 'provider_2fa_unavailable',
        internalEvent: 'provider_2fa_registry_miss',
      });
      await persistCurrentAuthState();
      return getPublicAuthState();
    }

    try {
      const providerOutcome = normalizeProviderOutcome(await withTimeout(provider.submitTwoFactor({
        attemptId: currentAuthState.attemptId,
        provider: providerName,
        twoFactorCode: code,
        envValues,
        providerSessionRef: currentAuthState.providerSessionRef || null,
      }), timeoutMs, 'provider_2fa_timeout'));
      currentAuthState = mapProviderOutcomeToAuthState({
        attemptId: currentAuthState.attemptId,
        updatedAt,
        providerName,
        providerOutcome,
      });
      await persistCurrentAuthState();
      return getPublicAuthState();
    } catch (error) {
      currentAuthState = createProviderFailedState({
        attemptId: currentAuthState.attemptId,
        updatedAt,
        providerName,
        code: error?.code || 'provider_2fa_failed',
        message: 'Provider 2FA submission failed before a usable auth state was produced.',
        detailMessage: null,
      });
      await persistCurrentAuthState();
      return getPublicAuthState();
    }
  });
}


export async function resumeAuthSession({
  now = new Date(),
  providerName = currentAuthState.provider || AUTH_PROVIDER,
  providerRegistry = defaultProviderRegistry,
  timeoutMs = DEFAULT_OPERATION_TIMEOUT_MS,
  envValues = {},
  persistence = currentPersistence,
} = {}) {
  if (authOperationInProgress) {
    return createConcurrentAuthState({ now, providerName });
  }

  return withAuthOperationLock(async () => {
    const persistedState = await persistence.load();
    currentAuthState = await verifyResumedAuthSession({
      persistedState,
      providerRegistry,
      providerName,
      envValues,
      now,
      timeoutMs,
      mapProviderOutcomeToAuthState,
      withTimeout,
    });
    await persistCurrentAuthState({ persistence });
    return getPublicAuthState();
  });
}

export async function logoutAuth({
  now = new Date(),
  providerName = currentAuthState.provider || AUTH_PROVIDER,
  providerRegistry = defaultProviderRegistry,
  timeoutMs = DEFAULT_OPERATION_TIMEOUT_MS,
  envValues = {},
} = {}) {
  const updatedAt = now.toISOString();
  const previousAttemptId = currentAuthState.attemptId;
  const provider = providerRegistry.getProvider(providerName);
  let logoutResult = {
    providerLogoutPerformed: false,
    providerLogoutStatus: 'provider_unavailable',
    message: 'Local auth state was cleared. Provider logout is unavailable for this provider.',
  };

  if (provider && typeof provider.logout === 'function') {
    try {
      const providerOutcome = normalizeProviderOutcome(await withTimeout(provider.logout({
        attemptId: previousAttemptId,
        provider: providerName,
        envValues,
        providerSessionRef: currentAuthState.providerSessionRef || null,
      }), timeoutMs, 'provider_logout_timeout'));
      logoutResult = {
        providerLogoutPerformed: providerOutcome.outcome === PROVIDER_OUTCOMES.AUTHENTICATED || providerOutcome.outcome === PROVIDER_OUTCOMES.STARTED,
        providerLogoutStatus: providerOutcome.outcome,
        message: providerOutcome.message || 'Provider logout boundary completed.',
      };
    } catch (error) {
      logoutResult = {
        providerLogoutPerformed: false,
        providerLogoutStatus: 'provider_logout_failed',
        message: error?.message || 'Provider logout failed; local auth state was still cleared.',
      };
    }
  }

  currentAuthState = createDefaultAuthState({
    updatedAt,
    next_action: 'run_auth_preflight',
  });
  await currentPersistence.clear().catch(() => {});
  await persistCurrentAuthState();
  return {
    ...logoutResult,
    auth: getPublicAuthState(),
  };
}

export function mapProviderOutcomeToAuthState({ attemptId, updatedAt, providerName = AUTH_PROVIDER, providerOutcome }) {
  const outcome = normalizeProviderOutcome(providerOutcome);

  if (outcome.outcome === PROVIDER_OUTCOMES.MISSING_CONFIG) {
    return createDefaultAuthState({
      status: AUTH_STATUSES.PREFLIGHT_FAILED,
      has_required_files: false,
      requires_2fa: 'unknown',
      two_factor_status: TWO_FACTOR_STATUSES.NOT_STARTED,
      two_factor_method: null,
      next_action: 'fix_auth_configuration',
      attemptId,
      updatedAt,
      error: {
        code: outcome.code || 'provider_missing_config',
        message: outcome.message || 'Provider reported missing auth configuration.',
      },
      authenticatedUser: null,
      provider: providerName,
      lastProviderEvent: outcome.outcome,
    });
  }

  if (outcome.outcome === PROVIDER_OUTCOMES.PROVIDER_UNAVAILABLE) {
    return createProviderUnavailableState({
      attemptId,
      updatedAt,
      providerName,
      message: outcome.message || 'Provider login execution is unavailable.',
      nextAction: outcome.next_action || 'provider_login_unavailable',
      internalEvent: outcome.outcome,
      code: outcome.code || 'provider_unavailable',
    });
  }

  if (outcome.outcome === PROVIDER_OUTCOMES.STARTED) {
    return createDefaultAuthState({
      status: AUTH_STATUSES.BLOCKED,
      has_required_files: true,
      requires_2fa: 'unknown',
      two_factor_status: TWO_FACTOR_STATUSES.UNKNOWN,
      two_factor_method: null,
      next_action: outcome.next_action || 'await_provider_login_result',
      attemptId,
      updatedAt,
      error: null,
      authenticatedUser: null,
      provider: providerName,
      internalAttempt: outcome.internalAttempt || null,
      providerRawStatus: outcome.providerRawStatus || null,
      lastProviderEvent: outcome.outcome,
    });
  }

  if (outcome.outcome === PROVIDER_OUTCOMES.REQUIRES_2FA) {
    return createDefaultAuthState({
      status: AUTH_STATUSES.BLOCKED,
      has_required_files: true,
      requires_2fa: true,
      two_factor_status: TWO_FACTOR_STATUSES.REQUIRED,
      two_factor_method: outcome.two_factor_method || outcome.method || null,
      next_action: outcome.next_action || 'submit_two_factor_code',
      attemptId,
      updatedAt,
      error: null,
      authenticatedUser: null,
      provider: providerName,
      internalAttempt: outcome.internalAttempt || null,
      providerSessionRef: outcome.providerSessionRef || null,
      providerRawStatus: outcome.providerRawStatus || null,
      lastProviderEvent: outcome.outcome,
    });
  }

  if (outcome.outcome === PROVIDER_OUTCOMES.AUTHENTICATED) {
    return createDefaultAuthState({
      status: AUTH_STATUSES.AUTHENTICATED,
      has_required_files: true,
      requires_2fa: false,
      two_factor_status: TWO_FACTOR_STATUSES.COMPLETE,
      two_factor_method: outcome.two_factor_method || null,
      next_action: 'auth_ready',
      attemptId,
      updatedAt,
      error: null,
      authenticatedUser: outcome.authenticatedUser || null,
      provider: providerName,
      providerSessionRef: outcome.providerSessionRef || null,
      providerRawStatus: outcome.providerRawStatus || null,
      lastProviderEvent: outcome.outcome,
    });
  }

  return createProviderFailedState({
    attemptId,
    updatedAt,
    providerName,
    code: outcome.code || 'provider_login_failed',
    message: outcome.message || 'Provider login attempt failed.',
    detailMessage: outcome.detailMessage,
    internalEvent: outcome.outcome,
  });
}

function createConcurrentAuthState({ now, providerName }) {
  currentAuthState = createDefaultAuthState({
    ...currentAuthState,
    status: AUTH_STATUSES.BLOCKED,
    updatedAt: now.toISOString(),
    next_action: 'wait_for_current_auth_operation',
    error: {
      code: 'auth_operation_in_progress',
      message: 'Another auth operation is already running. Wait for it to finish before starting a new one.',
    },
    provider: providerName,
  });
  void persistCurrentAuthState().catch(() => {});
  return getPublicAuthState();
}

async function withAuthOperationLock(operation) {
  authOperationInProgress = true;
  try {
    return await operation();
  } finally {
    authOperationInProgress = false;
  }
}

async function withTimeout(promise, timeoutMs, code) {
  if (!Number.isFinite(Number(timeoutMs)) || Number(timeoutMs) <= 0) {
    return promise;
  }
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error(`Provider operation timed out after ${timeoutMs}ms.`);
      error.code = code;
      reject(error);
    }, timeoutMs);
    timeoutId.unref?.();
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

function createMissingAuthConfigState({ attemptId, updatedAt, providerName, missingOrInvalidRequiredChecks }) {
  return createDefaultAuthState({
    status: AUTH_STATUSES.PREFLIGHT_FAILED,
    has_required_files: false,
    requires_2fa: 'unknown',
    two_factor_status: TWO_FACTOR_STATUSES.NOT_STARTED,
    two_factor_method: null,
    next_action: 'fix_auth_configuration',
    attemptId,
    updatedAt,
    error: {
      code: 'auth_preflight_missing_required_inputs',
      message: 'Auth preflight failed because required auth configuration is missing or invalid.',
      missingRequiredKeys: missingOrInvalidRequiredChecks.map((check) => check.key),
      checks: missingOrInvalidRequiredChecks.map((check) => ({
        key: check.key,
        label: check.label,
        present: check.present,
        valid: check.valid,
        message: check.message,
        severity: check.severity,
        details: check.details,
      })),
    },
    authenticatedUser: null,
    provider: providerName,
  });
}

function createProviderUnavailableState({ attemptId, updatedAt, providerName, message, nextAction, internalEvent, code = 'provider_unavailable' }) {
  return createDefaultAuthState({
    status: AUTH_STATUSES.BLOCKED,
    has_required_files: true,
    requires_2fa: 'unknown',
    two_factor_status: TWO_FACTOR_STATUSES.UNKNOWN,
    two_factor_method: null,
    next_action: nextAction || 'provider_login_unavailable',
    attemptId,
    updatedAt,
    error: {
      code,
      message,
    },
    authenticatedUser: null,
    provider: providerName,
    lastProviderEvent: internalEvent || PROVIDER_OUTCOMES.PROVIDER_UNAVAILABLE,
  });
}

function createProviderFailedState({ attemptId, updatedAt, providerName, code, message, detailMessage, internalEvent }) {
  return createDefaultAuthState({
    status: AUTH_STATUSES.PROVIDER_FAILED,
    has_required_files: true,
    requires_2fa: 'unknown',
    two_factor_status: TWO_FACTOR_STATUSES.UNKNOWN,
    two_factor_method: null,
    next_action: 'inspect_provider_auth_failure',
    attemptId,
    updatedAt,
    error: {
      code,
      message,
      detailMessage: detailMessage || null,
    },
    authenticatedUser: null,
    provider: providerName,
    lastProviderEvent: internalEvent || PROVIDER_OUTCOMES.FAILED,
  });
}

export function selectAuthReadinessChecks(checks) {
  return checks.filter((check) => REQUIRED_AUTH_CHECK_KEYS.has(check.key));
}

export { REQUIRED_AUTH_CHECK_KEYS };
