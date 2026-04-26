import assert from 'node:assert/strict';
import test from 'node:test';
import { createAuthRoutes } from '../server/auth/authRoutes.js';
import {
  configureAuthServiceForTests,
  resumeAuthSession,
} from '../server/auth/authService.js';
import { createDefaultAuthState } from '../server/auth/authState.js';
import { createProviderRegistry, PROVIDER_OUTCOMES } from '../server/auth/providers/providerRegistry.js';

function createMemoryPersistence(initialState = null) {
  return {
    savedState: null,
    async load() {
      return initialState;
    },
    async save(state) {
      this.savedState = state;
      return state;
    },
    async clear() {
      this.savedState = null;
    },
  };
}

function createPersistedVerificationRequiredState(overrides = {}) {
  return createDefaultAuthState(Object.assign({
    status: 'unknown',
    has_required_files: true,
    requires_2fa: 'unknown',
    two_factor_status: 'unknown',
    next_action: 'verify_provider_session',
    attemptId: 'attempt-resume',
    updatedAt: '2026-04-24T19:40:00.000Z',
    authenticatedUser: 'op***@example.com',
    provider: 'icloud',
    error: {
      code: 'auth_resume_verification_required',
      message: 'Persisted authenticated state requires provider verification before it can be trusted after restart.',
    },
  }, overrides));
}

function createRegistryWithResume(resumeSession) {
  return createProviderRegistry({
    providers: {
      icloud: { resumeSession },
    },
  });
}

test('resumeAuthSession does not call provider when no persisted state exists', async () => {
  configureAuthServiceForTests();
  let calls = 0;
  const persistence = createMemoryPersistence(null);
  const providerRegistry = createRegistryWithResume(async () => {
    calls += 1;
    return { outcome: PROVIDER_OUTCOMES.AUTHENTICATED };
  });

  const result = await resumeAuthSession({
    persistence,
    providerRegistry,
    now: new Date('2026-04-24T19:41:00.000Z'),
  });

  assert.equal(calls, 0);
  assert.equal(result.status, 'unknown');
  assert.equal(result.next_action, 'run_auth_preflight');
  assert.equal(result.error.code, 'auth_resume_no_persisted_state');
  assert.equal(result.authenticatedUser, null);
});

test('resumeAuthSession authenticates only after provider confirms the saved session', async () => {
  configureAuthServiceForTests();
  let calls = 0;
  const persistence = createMemoryPersistence(createPersistedVerificationRequiredState());
  const providerRegistry = createRegistryWithResume(async (context) => {
    calls += 1;
    assert.equal(context.attemptId, 'attempt-resume');
    return {
      outcome: PROVIDER_OUTCOMES.AUTHENTICATED,
      authenticatedUser: 'op***@example.com',
      providerSessionRef: 'secret-session-ref',
      providerRawStatus: { sanitizedOutput: 'valid session' },
    };
  });

  const result = await resumeAuthSession({
    persistence,
    providerRegistry,
    now: new Date('2026-04-24T19:42:00.000Z'),
  });

  assert.equal(calls, 1);
  assert.equal(result.status, 'authenticated');
  assert.equal(result.has_required_files, true);
  assert.equal(result.requires_2fa, false);
  assert.equal(result.next_action, 'auth_ready');
  assert.equal(result.authenticatedUser, 'op***@example.com');
  assert.equal(JSON.stringify(result).includes('secret-session-ref'), false);
});

test('resumeAuthSession maps provider 2FA requirement without faking success', async () => {
  configureAuthServiceForTests();
  const persistence = createMemoryPersistence(createPersistedVerificationRequiredState());
  const providerRegistry = createRegistryWithResume(async () => ({
    outcome: PROVIDER_OUTCOMES.REQUIRES_2FA,
    two_factor_method: 'trusted_device',
    next_action: 'submit_two_factor_code',
  }));

  const result = await resumeAuthSession({ persistence, providerRegistry });

  assert.equal(result.status, 'blocked');
  assert.equal(result.requires_2fa, true);
  assert.equal(result.two_factor_status, 'required');
  assert.equal(result.authenticatedUser, null);
});

test('resumeAuthSession handles provider unavailable without crashing or authenticating', async () => {
  configureAuthServiceForTests();
  const persistence = createMemoryPersistence(createPersistedVerificationRequiredState());
  const providerRegistry = createRegistryWithResume(async () => ({
    outcome: PROVIDER_OUTCOMES.PROVIDER_UNAVAILABLE,
    code: 'icloudpd_executable_unavailable',
    message: 'icloudpd executable is not available on PATH or could not be started.',
    next_action: 'install_or_configure_icloudpd',
  }));

  const result = await resumeAuthSession({ persistence, providerRegistry });

  assert.equal(result.status, 'blocked');
  assert.equal(result.next_action, 'install_or_configure_icloudpd');
  assert.equal(result.error.code, 'icloudpd_executable_unavailable');
  assert.equal(result.authenticatedUser, null);
});

test('resumeAuthSession handles missing config without crashing or authenticating', async () => {
  configureAuthServiceForTests();
  const persistence = createMemoryPersistence(createPersistedVerificationRequiredState());
  const providerRegistry = createRegistryWithResume(async () => ({
    outcome: PROVIDER_OUTCOMES.MISSING_CONFIG,
    code: 'icloudpd_missing_config',
    message: 'icloudpd auth is missing required configuration: user, ICLOUDPD_COOKIE_DIR.',
    missingRequiredKeys: ['user', 'ICLOUDPD_COOKIE_DIR'],
  }));

  const result = await resumeAuthSession({ persistence, providerRegistry });

  assert.equal(result.status, 'preflight_failed');
  assert.equal(result.next_action, 'fix_auth_configuration');
  assert.equal(result.error.code, 'icloudpd_missing_config');
  assert.equal(result.authenticatedUser, null);
});

test('resumeAuthSession handles provider throws without leaking secrets', async () => {
  configureAuthServiceForTests();
  const persistence = createMemoryPersistence(createPersistedVerificationRequiredState());
  const providerRegistry = createRegistryWithResume(async () => {
    throw new Error('super-secret-password token cookie session raw stderr');
  });

  const result = await resumeAuthSession({ persistence, providerRegistry });

  assert.equal(result.status, 'unknown');
  assert.equal(result.error.code, 'provider_resume_failed');
  assert.equal(result.authenticatedUser, null);
  assert.equal(JSON.stringify(result).includes('super-secret-password'), false);
  assert.equal(JSON.stringify(result).includes('raw stderr'), false);
});

test('resumeAuthSession leaves non-verification persisted states unpromoted', async () => {
  configureAuthServiceForTests();
  let calls = 0;
  const persistence = createMemoryPersistence(createDefaultAuthState({
    status: 'blocked',
    has_required_files: true,
    requires_2fa: true,
    two_factor_status: 'required',
    next_action: 'submit_two_factor_code',
    attemptId: 'attempt-2fa',
  }));
  const providerRegistry = createRegistryWithResume(async () => {
    calls += 1;
    return { outcome: PROVIDER_OUTCOMES.AUTHENTICATED };
  });

  const result = await resumeAuthSession({ persistence, providerRegistry });

  assert.equal(calls, 0);
  assert.equal(result.status, 'blocked');
  assert.equal(result.requires_2fa, true);
  assert.equal(result.authenticatedUser, null);
});

test('auth resume route uses injected session verification path', async () => {
  let calls = 0;
  const routes = createAuthRoutes({
    getAuthReadinessChecks: () => [],
    async resumeAuthSessionFn({ envValues }) {
      calls += 1;
      assert.equal(envValues.user, 'operator@example.com');
      return {
        status: 'authenticated',
        has_required_files: true,
        requires_2fa: false,
        two_factor_status: 'complete',
        two_factor_method: null,
        next_action: 'auth_ready',
        attemptId: 'attempt-route',
        updatedAt: '2026-04-24T19:43:00.000Z',
        error: null,
        authenticatedUser: 'op***@example.com',
        provider: 'icloud',
      };
    },
  });

  const response = await routes.resumeHandler({
    context: { envValues: { user: 'operator@example.com' } },
  });

  assert.equal(calls, 1);
  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.status, 'ok');
  assert.equal(response.payload.auth.status, 'authenticated');
});

test('auth single-file login test route uses injected download path', async () => {
  let calls = 0;
  const routes = createAuthRoutes({
    getAuthReadinessChecks: () => [],
    singleFileDownloadDirectory: 'runtime_data/tmp',
    async testAuthLoginByDownloadingSingleFileFn({ envValues, downloadDirectory }) {
      calls += 1;
      assert.equal(envValues.user, 'operator@example.com');
      assert.equal(downloadDirectory, 'runtime_data/tmp');
      return {
        auth: {
          status: 'authenticated',
          has_required_files: true,
          requires_2fa: false,
          two_factor_status: 'complete',
          two_factor_method: null,
          next_action: 'auth_ready',
          attemptId: 'attempt-route-download',
          updatedAt: '2026-04-24T19:44:00.000Z',
          error: null,
          authenticatedUser: 'op***@example.com',
          provider: 'icloud',
        },
        testDownload: {
          downloadDirectory: 'runtime_data/tmp',
          requestedRecentCount: 1,
          status: 'authenticated',
          code: 'icloudpd_authenticated',
          message: 'Downloaded one recent item.',
          next_action: null,
        },
      };
    },
  });

  const response = await routes.testLoginDownloadOneHandler({
    context: { envValues: { user: 'operator@example.com' } },
  });

  assert.equal(calls, 1);
  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.status, 'ok');
  assert.equal(response.payload.auth.status, 'authenticated');
  assert.equal(response.payload.testDownload.requestedRecentCount, 1);
});
