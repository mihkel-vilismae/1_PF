import assert from 'node:assert/strict';
import test from 'node:test';
import { configureAuthServiceForTests, runAuthPreflight } from '../server/auth/authService.ts';
import { createProviderRegistry, PROVIDER_OUTCOMES } from '../server/auth/providers/providerRegistry.ts';

function check(key) {
  return { key, label: key, required: true, present: true, valid: true, severity: 'info', message: 'ok', details: {} };
}

test('concurrent auth runs are blocked without starting a duplicate provider run', async () => {
  configureAuthServiceForTests();
  let starts = 0;
  let release;
  const blocker = new Promise((resolve) => { release = resolve; });
  const providerRegistry = createProviderRegistry({ providers: { icloud: {
    async startLogin() {
      starts += 1;
      await blocker;
      return { outcome: PROVIDER_OUTCOMES.REQUIRES_2FA, two_factor_method: 'trusted_device' };
    },
  } } });
  const first = runAuthPreflight({ attemptId: 'attempt-first', checks: [check('user'), check('pw'), check('ICLOUDPD_COOKIE_DIR')], providerRegistry });
  const second = await runAuthPreflight({ attemptId: 'attempt-second', checks: [check('user'), check('pw'), check('ICLOUDPD_COOKIE_DIR')], providerRegistry });
  release();
  const firstResult = await first;

  assert.equal(starts, 1);
  assert.equal(second.error.code, 'auth_operation_in_progress');
  assert.equal(second.next_action, 'wait_for_current_auth_operation');
  assert.equal(firstResult.two_factor_status, 'required');
});

test('provider thrown errors are normalized into safe public errors', async () => {
  configureAuthServiceForTests();
  const providerRegistry = createProviderRegistry({ providers: { icloud: {
    async startLogin() {
      throw new Error('token secret cookie failure detail');
    },
  } } });
  const result = await runAuthPreflight({ attemptId: 'attempt-error', checks: [check('user'), check('pw'), check('ICLOUDPD_COOKIE_DIR')], providerRegistry });

  assert.equal(result.status, 'provider_failed');
  assert.equal(result.error.code, 'provider_start_failed');
  assert.equal(JSON.stringify(result).includes('token secret cookie failure detail'), false);
});
