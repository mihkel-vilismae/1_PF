/*
 * Characterizes the B2 real-download authentication handoff boundary.
 * These tests keep NEW AUTH provider proof separate from legacy single-file checks.
 * Slice 1 records the current mismatch before the backend bridge is implemented.
 */
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { resetAuthState, testAuthLoginByDownloadingSingleFile } from '../server/auth/authService.ts';
import { PROVIDER_OUTCOMES, createProviderRegistry } from '../server/auth/providers/providerRegistry.ts';
import { verifyNewAuthSessionForRuntimeDownload } from '../server/auth/newAuthService.ts';

// Builds a valid auth-readiness check while keeping test setup compact.
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

// Returns a fake command spawner whose output looks like verified iCloudPD auth proof.
function commandSpawnerWithOutput({ stdout = '', stderr = '', exitCode = 0 }) {
  return () => ({
    stdin: { write() {}, end() {} },
    stdout: { on(event, listener) { if (event === 'data' && stdout) setImmediate(() => listener(Buffer.from(stdout))); } },
    stderr: { on(event, listener) { if (event === 'data' && stderr) setImmediate(() => listener(Buffer.from(stderr))); } },
    on(event, listener) { if (event === 'close') setImmediate(() => listener(exitCode, null)); },
    kill() { return true; },
    unref() {},
  });
}

test('B2 handoff characterization: active NEW AUTH provider proof verifies the session', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'b2-handoff-proof-'));
  const sessionDir = path.join(root, 'icloud-session');

  try {
    await mkdir(sessionDir, { recursive: true });
    writeFileSync(path.join(sessionDir, 'cookie'), 'DO_NOT_EXPOSE_COOKIE_CONTENT');

    const status = await verifyNewAuthSessionForRuntimeDownload({
      executablePath: 'fake-icloudpd',
      commandSpawner: commandSpawnerWithOutput({ stdout: 'Authentication completed successfully' }),
      envValues: {
        ICLOUDPD_COOKIE_DIR: sessionDir,
        user: 'person@example.com',
        pw: 'DO_NOT_EXPOSE_PASSWORD',
      },
    });

    assert.equal(status.state, 'authenticated');
    assert.equal(status.details.provider, 'icloudpd');
    assert.equal(status.details.providerProof.verified, true);
    assert.equal(JSON.stringify(status).includes('DO_NOT_EXPOSE_PASSWORD'), false);
    assert.equal(JSON.stringify(status).includes('DO_NOT_EXPOSE_COOKIE_CONTENT'), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('B2 handoff characterization: legacy single-file auth test can still downgrade to blocked', async () => {
  resetAuthState({ now: new Date('2026-05-26T00:00:00.000Z') });
  const providerRegistry = createProviderRegistry({
    providers: {
      icloud: {
        async testLoginByDownloadingSingleFile() {
          return {
            outcome: PROVIDER_OUTCOMES.STARTED,
            code: 'icloudpd_started_unverified',
            message: 'icloudpd command completed, but the output did not prove an authenticated session.',
            next_action: 'inspect_icloudpd_auth_output',
          };
        },
      },
    },
  });

  const result = await testAuthLoginByDownloadingSingleFile({
    attemptId: 'attempt-b2-handoff-started',
    now: new Date('2026-05-26T00:00:01.000Z'),
    checks: [check('user'), check('pw'), check('ICLOUDPD_COOKIE_DIR')],
    envValues: {
      user: 'person@example.com',
      pw: 'DO_NOT_EXPOSE_PASSWORD',
      ICLOUDPD_COOKIE_DIR: 'runtime_data/icloudpd_cookies',
    },
    downloadDirectory: 'runtime_data/downloads',
    providerRegistry,
  });

  assert.equal(result.auth.status, 'blocked');
  assert.equal(result.auth.provider, 'icloud');
  assert.equal(result.auth.next_action, 'inspect_icloudpd_auth_output');
  assert.equal(result.testDownload.status, 'started');
  assert.equal(result.testDownload.code, 'icloudpd_started_unverified');
  assert.equal(JSON.stringify(result).includes('DO_NOT_EXPOSE_PASSWORD'), false);
});

test('TODO B2 handoff regression: verified NEW AUTH proof should allow the real-download gate', { skip: 'Slice 2 will implement the backend bridge and enable this route-level assertion.' }, () => {
  assert.fail('Expected future behavior: verified provider proof is not downgraded by legacy single-file output ambiguity.');
});
