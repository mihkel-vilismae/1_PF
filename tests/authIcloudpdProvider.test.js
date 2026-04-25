import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createIcloudpdProvider, mapIcloudpdResultToOutcome } from '../server/auth/providers/icloudpdProvider.js';
import { buildAuthOnlyArgs, buildVerifySessionArgs, createIcloudpdProcessRunner, redactIcloudpdArgs } from '../server/auth/providers/icloudpdProcessRunner.js';
import { sanitizeIcloudpdText } from '../server/auth/providers/icloudpdSanitizer.js';

const envValues = {
  user: 'operator@example.com',
  pw: 'super-secret-password',
  ICLOUDPD_COOKIE_DIR: 'runtime_data/icloudpd_cookies',
  DOWNLOAD_DIR: 'runtime_data/downloads',
};

test('icloudpd provider reports provider_unavailable when executable is missing', async () => {
  const provider = createIcloudpdProvider({ runner: runner({ executableAvailable: false }) });
  const result = await provider.startLogin({ envValues });
  assert.equal(result.outcome, 'provider_unavailable');
  assert.equal(result.code, 'icloudpd_executable_unavailable');
});

test('icloudpd provider reports missing_config before provider execution', async () => {
  let called = false;
  const provider = createIcloudpdProvider({ runner: runner({ onStartAuth: () => { called = true; } }) });
  const result = await provider.startLogin({ envValues: { user: 'operator@example.com', ICLOUDPD_COOKIE_DIR: 'runtime_data/icloudpd_cookies' } });
  assert.equal(result.outcome, 'missing_config');
  assert.equal(result.missingRequiredKeys.includes('pw'), true);
  assert.equal(called, false);
});

test('icloudpd provider maps successful auth output to authenticated', async () => {
  const provider = createIcloudpdProvider({ runner: runner({ startResult: { exitCode: 0, sanitizedCombinedOutput: 'Authentication successful. Valid session cookie.' } }) });
  const result = await provider.startLogin({ envValues });
  assert.equal(result.outcome, 'authenticated');
  assert.equal(result.authenticatedUser, 'op***@example.com');
  assert.equal(result.providerSessionRef, 'icloudpd_cookie_directory_internal');
  assert.equal(JSON.stringify(result).includes('super-secret-password'), false);
});

test('icloudpd provider maps 2FA-required output honestly', async () => {
  const provider = createIcloudpdProvider({ runner: runner({ startResult: { exitCode: 1, sanitizedCombinedOutput: 'Two-factor authentication required. Enter verification code from trusted device.' } }) });
  const result = await provider.startLogin({ envValues });
  assert.equal(result.outcome, 'requires_2fa');
  assert.equal(result.next_action, 'submit_two_factor_code');
  assert.equal(result.two_factor_method, 'trusted_device');
});

test('icloudpd provider maps invalid credentials to failed', async () => {
  const provider = createIcloudpdProvider({ runner: runner({ startResult: { exitCode: 1, sanitizedCombinedOutput: 'Authentication error: invalid email/password combination.' } }) });
  const result = await provider.startLogin({ envValues });
  assert.equal(result.outcome, 'failed');
  assert.equal(result.code, 'icloudpd_invalid_credentials');
});

test('icloudpd provider submits 2FA only through runner and maps verified success', async () => {
  const provider = createIcloudpdProvider({ runner: runner({ submitResult: { exitCode: 0, sanitizedCombinedOutput: 'Authentication successful. Valid session cookie.' } }) });
  const result = await provider.submitTwoFactor({ envValues, twoFactorCode: '123456' });
  assert.equal(result.outcome, 'authenticated');
  assert.equal(JSON.stringify(result).includes('123456'), false);
});

test('icloudpd provider reports unsupported non-interactive 2FA honestly', async () => {
  const provider = createIcloudpdProvider({ runner: runner({ submitResult: { unsupportedTwoFactor: true, sanitizedCombinedOutput: 'interactive 2fa required' } }) });
  const result = await provider.submitTwoFactor({ envValues, twoFactorCode: '123456' });
  assert.equal(result.outcome, 'provider_unavailable');
  assert.equal(result.code, 'icloudpd_unsupported_2fa_flow');
  assert.equal(JSON.stringify(result).includes('123456'), false);
});

test('icloudpd provider resume only authenticates when session verification proves it', async () => {
  const provider = createIcloudpdProvider({ runner: runner({ verifyResult: { exitCode: 0, sanitizedCombinedOutput: 'Using existing session. Dry run complete.' } }) });
  const result = await provider.resumeSession({ envValues });
  assert.equal(result.outcome, 'authenticated');
});

test('icloudpd provider resume can verify session without password config', async () => {
  let verified = false;
  const provider = createIcloudpdProvider({ runner: runner({ onVerifySession: () => { verified = true; }, verifyResult: { exitCode: 0, sanitizedCombinedOutput: 'Using existing session. Dry run complete.' } }) });
  const result = await provider.resumeSession({ envValues: { user: 'operator@example.com', ICLOUDPD_COOKIE_DIR: 'runtime_data/icloudpd_cookies' } });
  assert.equal(result.outcome, 'authenticated');
  assert.equal(verified, true);
});

test('icloudpd session verification args do not pass the password on the command line', () => {
  const args = buildVerifySessionArgs({
    username: 'operator@example.com',
    password: 'super-secret-password',
    cookieDir: '/private/cookies',
    downloadDir: '/private/downloads',
    recentCount: '1',
  });
  assert.equal(args.includes('--password'), false);
  assert.equal(args.includes('super-secret-password'), false);
});

test('icloudpd process runner uses injected execFile implementation for auth command', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'icloudpd-runner-'));
  try {
    const calls = [];
    const processRunner = createIcloudpdProcessRunner({
      executable: 'icloudpd-test',
      async execFileImpl(file, args, options) {
        calls.push({ file, args, options });
        return { stdout: 'Authentication successful. Valid session cookie.', stderr: '' };
      },
    });

    const result = await processRunner.startAuth({
      config: {
        username: 'operator@example.com',
        password: 'super-secret-password',
        cookieDir: path.join(root, 'cookies'),
        downloadDir: path.join(root, 'downloads'),
        timeoutMs: 1_000,
      },
    });

    assert.equal(result.exitCode, 0);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].file, 'icloudpd-test');
    assert.equal(calls[0].args.includes('--auth-only'), true);
    assert.equal(calls[0].options.windowsHide, true);
    assert.equal(result.sanitizedCombinedOutput.includes('Authentication successful'), true);
    assert.equal(JSON.stringify(result).includes('super-secret-password'), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('icloudpd provider logout performs local cleanup without claiming remote Apple logout', async () => {
  let cleaned = false;
  const provider = createIcloudpdProvider({ runner: runner({ onCleanup: () => { cleaned = true; } }) });
  const result = await provider.logout({ envValues });
  assert.equal(result.outcome, 'started');
  assert.equal(result.code, 'icloudpd_local_cleanup_complete');
  assert.equal(cleaned, true);
  assert.equal(result.message.includes('Remote Apple logout') || result.message.includes('remote Apple logout'), true);
});

test('icloudpd sanitizers redact credentials, code, cookie directory, and password args', () => {
  const config = { username: 'operator@example.com', password: 'super-secret-password', twoFactorCode: '123456', cookieDir: '/private/cookies' };
  const text = sanitizeIcloudpdText('password=super-secret-password code=123456 cookie=/private/cookies operator@example.com', config);
  assert.equal(text.includes('super-secret-password'), false);
  assert.equal(text.includes('123456'), false);
  assert.equal(text.includes('/private/cookies'), false);
  assert.deepEqual(redactIcloudpdArgs(buildAuthOnlyArgs({ ...config, cookieDir: '/private/cookies' }), config).includes('super-secret-password'), false);
});

function runner({ executableAvailable = true, startResult, submitResult, verifyResult, onStartAuth, onVerifySession, onCleanup } = {}) {
  return {
    async checkExecutable() {
      return executableAvailable ? { available: true } : { available: false, code: 'icloudpd_executable_unavailable', message: 'icloudpd executable is not available on PATH or could not be started.' };
    },
    async startAuth({ config }) {
      onStartAuth?.(config);
      return startResult || { exitCode: 0, sanitizedCombinedOutput: 'Authentication successful. Valid session cookie.' };
    },
    async submitTwoFactor({ config }) {
      return submitResult || { exitCode: 1, sanitizedCombinedOutput: `invalid verification code ${config.twoFactorCode}` };
    },
    async verifySession({ config } = {}) {
      onVerifySession?.(config);
      return verifyResult || { exitCode: 1, sanitizedCombinedOutput: 'session expired' };
    },
    async cleanup({ config }) {
      onCleanup?.(config);
      return { localCleanupPerformed: true, message: 'Local icloudpd cookie directory was cleared and recreated.' };
    },
  };
}
