import assert from 'node:assert/strict';
import test from 'node:test';
import { getRawAuthState, resetAuthState, runAuthPreflight, selectAuthReadinessChecks, testAuthLoginByDownloadingSingleFile } from '../server/auth/authService.js';
import { PROVIDER_OUTCOMES, createProviderRegistry } from '../server/auth/providers/providerRegistry.js';

function check(key, overrides = {}) {
  return {
    key,
    label: key,
    required: true,
    present: true,
    valid: true,
    severity: 'info',
    message: 'ok',
    details: { kind: 'string', nonEmpty: true },
    ...overrides,
  };
}

test('auth service selects only auth-relevant readiness checks', () => {
  const selected = selectAuthReadinessChecks([
    check('user'),
    check('pw'),
    check('ICLOUDPD_COOKIE_DIR'),
    check('DB_PATH'),
  ]);

  assert.deepEqual(selected.map((entry) => entry.key), ['user', 'pw', 'ICLOUDPD_COOKIE_DIR']);
});

test('runAuthPreflight fails honestly when required auth inputs are missing', async () => {
  resetAuthState({ now: new Date('2026-04-24T13:30:00.000Z') });
  const result = await runAuthPreflight({
    attemptId: 'attempt-missing',
    now: new Date('2026-04-24T13:31:00.000Z'),
    checks: [
      check('user'),
      check('pw', { present: false, valid: false, message: 'Missing required key.' }),
      check('ICLOUDPD_COOKIE_DIR'),
    ],
  });

  assert.equal(result.status, 'preflight_failed');
  assert.equal(result.has_required_files, false);
  assert.equal(result.attemptId, 'attempt-missing');
  assert.equal(result.updatedAt, '2026-04-24T13:31:00.000Z');
  assert.equal(result.next_action, 'fix_auth_configuration');
  assert.equal(result.error.code, 'auth_preflight_missing_required_inputs');
  assert.deepEqual(result.error.missingRequiredKeys, ['pw']);
  assert.equal(getRawAuthState().status, 'preflight_failed');
});

test('runAuthPreflight calls provider boundary and reports unavailable without faking success', async () => {
  resetAuthState({ now: new Date('2026-04-24T13:32:00.000Z') });
  const providerRegistry = createProviderRegistry({
    providers: {
      icloud: {
        async startLogin() {
          return {
            outcome: PROVIDER_OUTCOMES.PROVIDER_UNAVAILABLE,
            code: 'icloudpd_executable_unavailable',
            message: 'icloudpd executable is not available on PATH or could not be started.',
            next_action: 'install_or_configure_icloudpd',
          };
        },
      },
    },
  });
  const result = await runAuthPreflight({
    attemptId: 'attempt-present',
    now: new Date('2026-04-24T13:33:00.000Z'),
    checks: [check('user'), check('pw'), check('ICLOUDPD_COOKIE_DIR')],
    envValues: { user: 'operator@example.com', pw: 'super-secret-password', ICLOUDPD_COOKIE_DIR: 'runtime_data/icloudpd_cookies' },
    providerRegistry,
  });

  assert.equal(result.status, 'blocked');
  assert.equal(result.has_required_files, true);
  assert.equal(result.requires_2fa, 'unknown');
  assert.equal(result.two_factor_status, 'unknown');
  assert.equal(result.next_action, 'install_or_configure_icloudpd');
  assert.equal(result.error.code, 'icloudpd_executable_unavailable');
  assert.equal(result.authenticatedUser, null);
});

test('resetAuthState clears local attempt state without acting like logout', async () => {
  await runAuthPreflight({
    attemptId: 'attempt-to-clear',
    now: new Date('2026-04-24T13:34:00.000Z'),
    checks: [check('user'), check('pw'), check('ICLOUDPD_COOKIE_DIR')],
  });

  const result = resetAuthState({ now: new Date('2026-04-24T13:35:00.000Z') });

  assert.equal(result.status, 'idle');
  assert.equal(result.attemptId, null);
  assert.equal(result.error, null);
  assert.equal(result.authenticatedUser, null);
  assert.equal(result.updatedAt, '2026-04-24T13:35:00.000Z');
  assert.equal(result.next_action, 'run_auth_preflight');
});


test('runAuthPreflight maps provider failure to honest failed state', async () => {
  resetAuthState({ now: new Date('2026-04-24T13:36:00.000Z') });
  const providerRegistry = createProviderRegistry({
    providers: {
      icloud: {
        async startLogin() {
          return {
            outcome: PROVIDER_OUTCOMES.FAILED,
            code: 'icloud_login_failed',
            message: 'Provider rejected the login attempt.',
            detailMessage: 'Synthetic test detail only.',
          };
        },
      },
    },
  });

  const result = await runAuthPreflight({
    attemptId: 'attempt-provider-failed',
    now: new Date('2026-04-24T13:37:00.000Z'),
    checks: [check('user'), check('pw'), check('ICLOUDPD_COOKIE_DIR')],
    providerRegistry,
  });

  assert.equal(result.status, 'provider_failed');
  assert.equal(result.has_required_files, true);
  assert.equal(result.error.code, 'icloud_login_failed');
  assert.equal(result.next_action, 'inspect_provider_auth_failure');
  assert.equal(result.authenticatedUser, null);
});

test('runAuthPreflight maps provider 2FA requirement without faking completion', async () => {
  resetAuthState({ now: new Date('2026-04-24T13:38:00.000Z') });
  const providerRegistry = createProviderRegistry({
    providers: {
      icloud: {
        async startLogin() {
          return {
            outcome: PROVIDER_OUTCOMES.REQUIRES_2FA,
            two_factor_method: 'trusted_device',
            providerSessionRef: 'secret-session-ref',
            providerRawStatus: { token: 'secret-token' },
          };
        },
      },
    },
  });

  const result = await runAuthPreflight({
    attemptId: 'attempt-2fa',
    now: new Date('2026-04-24T13:39:00.000Z'),
    checks: [check('user'), check('pw'), check('ICLOUDPD_COOKIE_DIR')],
    providerRegistry,
  });

  assert.equal(result.status, 'blocked');
  assert.equal(result.requires_2fa, true);
  assert.equal(result.two_factor_status, 'required');
  assert.equal(result.two_factor_method, 'trusted_device');
  assert.equal(result.next_action, 'submit_two_factor_code');
  assert.equal(result.authenticatedUser, null);
  assert.equal(JSON.stringify(result).includes('secret-session-ref'), false);
  assert.equal(JSON.stringify(result).includes('secret-token'), false);
});

test('testAuthLoginByDownloadingSingleFile maps verified download to authenticated state and summary', async () => {
  resetAuthState({ now: new Date('2026-04-24T13:40:00.000Z') });
  let receivedDirectory = null;
  const providerRegistry = createProviderRegistry({
    providers: {
      icloud: {
        async testLoginByDownloadingSingleFile(context) {
          receivedDirectory = context.downloadDirectory;
          return {
            outcome: PROVIDER_OUTCOMES.AUTHENTICATED,
            code: 'icloudpd_authenticated',
            message: 'Downloaded one recent item.',
            authenticatedUser: 'op***@example.com',
          };
        },
      },
    },
  });

  const result = await testAuthLoginByDownloadingSingleFile({
    attemptId: 'attempt-single-file',
    now: new Date('2026-04-24T13:41:00.000Z'),
    checks: [check('user'), check('pw'), check('ICLOUDPD_COOKIE_DIR')],
    envValues: { user: 'operator@example.com', pw: 'super-secret-password', ICLOUDPD_COOKIE_DIR: 'runtime_data/icloudpd_cookies' },
    downloadDirectory: 'runtime_data/tmp',
    providerRegistry,
  });

  assert.equal(receivedDirectory, 'runtime_data/tmp');
  assert.equal(result.auth.status, 'authenticated');
  assert.equal(result.auth.authenticatedUser, 'op***@example.com');
  assert.equal(result.testDownload.downloadDirectory, 'runtime_data/tmp');
  assert.equal(result.testDownload.requestedRecentCount, 1);
  assert.equal(result.testDownload.status, 'authenticated');
  assert.equal(JSON.stringify(result).includes('super-secret-password'), false);
});

test('testAuthLoginByDownloadingSingleFile preserves 2FA-required state without faking download success', async () => {
  resetAuthState({ now: new Date('2026-04-24T13:42:00.000Z') });
  const providerRegistry = createProviderRegistry({
    providers: {
      icloud: {
        async testLoginByDownloadingSingleFile() {
          return {
            outcome: PROVIDER_OUTCOMES.REQUIRES_2FA,
            two_factor_method: 'sms',
            next_action: 'submit_two_factor_code',
          };
        },
      },
    },
  });

  const result = await testAuthLoginByDownloadingSingleFile({
    attemptId: 'attempt-single-file-2fa',
    now: new Date('2026-04-24T13:43:00.000Z'),
    checks: [check('user'), check('pw'), check('ICLOUDPD_COOKIE_DIR')],
    providerRegistry,
  });

  assert.equal(result.auth.status, 'blocked');
  assert.equal(result.auth.requires_2fa, true);
  assert.equal(result.auth.two_factor_status, 'required');
  assert.equal(result.testDownload.status, 'requires_2fa');
});
