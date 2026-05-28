/**
 * Verifies legacy auth reset/logout service behavior.
 * Uses in-memory persistence so unit tests never touch shared runtime auth files.
 * Keeps provider logout assertions focused on service semantics.
 */
import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';
import { configureAuthServiceForTests, logoutAuth, resetAuthState, runAuthPreflight } from '../server/auth/authService.ts';
import { PROVIDER_OUTCOMES, createProviderRegistry } from '../server/auth/providers/providerRegistry.ts';

/**
 * Builds a positive readiness-check fixture used by auth service tests.
 */
function check(key) {
  return { key, label: key, required: true, present: true, valid: true, severity: 'info', message: 'ok', details: {} };
}

/**
 * Provides isolated auth persistence so Windows file locks cannot affect logout tests.
 */
function createMemoryAuthPersistence() {
  let savedState = null;
  return {
    async load() {
      return savedState;
    },
    async save(state) {
      savedState = { ...state };
      return savedState;
    },
    async clear() {
      savedState = null;
    },
  };
}

beforeEach(() => {
  configureAuthServiceForTests({ persistence: createMemoryAuthPersistence() });
});

test('reset clears local attempt state without claiming logout', async () => {
  await runAuthPreflight({ attemptId: 'attempt-reset', checks: [check('user'), check('pw'), check('ICLOUDPD_COOKIE_DIR')] });
  const reset = resetAuthState({ now: new Date('2026-04-24T14:20:00.000Z') });

  assert.equal(reset.status, 'idle');
  assert.equal(reset.attemptId, null);
  assert.equal(reset.next_action, 'run_auth_preflight');
});

test('logout clears auth state and reports provider cleanup outcome honestly', async () => {
  let logoutCalled = false;
  const providerRegistry = createProviderRegistry({ providers: { icloud: {
    async startLogin() { return { outcome: PROVIDER_OUTCOMES.REQUIRES_2FA, two_factor_method: 'trusted_device' }; },
    async logout() {
      logoutCalled = true;
      return { outcome: PROVIDER_OUTCOMES.STARTED, message: 'Provider cleanup request accepted.' };
    },
  } } });

  await runAuthPreflight({ attemptId: 'attempt-logout', checks: [check('user'), check('pw'), check('ICLOUDPD_COOKIE_DIR')], providerRegistry });
  const result = await logoutAuth({ now: new Date('2026-04-24T14:21:00.000Z'), providerRegistry });

  assert.equal(logoutCalled, true);
  assert.equal(result.providerLogoutPerformed, true);
  assert.equal(result.providerLogoutStatus, 'started');
  assert.equal(result.auth.status, 'idle');
  assert.equal(result.auth.attemptId, null);
});

test('logout clears local state even when provider logout is unavailable', async () => {
  await runAuthPreflight({ attemptId: 'attempt-logout-unavailable', checks: [check('user'), check('pw'), check('ICLOUDPD_COOKIE_DIR')] });
  const result = await logoutAuth({ now: new Date('2026-04-24T14:22:00.000Z') });

  assert.equal(result.providerLogoutPerformed, false);
  assert.equal(result.providerLogoutStatus, 'provider_unavailable');
  assert.equal(result.auth.status, 'idle');
  assert.equal(JSON.stringify(result).includes('session'), false);
  assert.equal(JSON.stringify(result).includes('token'), false);
});
