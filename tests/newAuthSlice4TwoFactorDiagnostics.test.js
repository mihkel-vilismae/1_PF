/*
 * Verifies NEW AUTH Slice 4 diagnostics for provider-proof timeout,
 * two-factor prompt extraction, and visible non-secret prompt rendering.
 */
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import test from 'node:test';

import { renderResultSurface } from '../dashboard/services/renderers.ts';
import { getNewAuthStatus } from '../server/auth/newAuthService.ts';

/*
 * Runs status with a fake provider process that emits output and then times out,
 * avoiding platform-specific shell scripts while exercising provider-proof code.
 */
async function withTimedOutProviderOutput(providerOutput, run) {
  const root = mkdtempSync(path.join(tmpdir(), 'new-auth-slice4-'));
  const sessionDir = path.join(root, 'icloud-session');

  try {
    await mkdir(sessionDir, { recursive: true });
    writeFileSync(path.join(sessionDir, 'cookie'), 'DO_NOT_EXPOSE_COOKIE_CONTENT');

    return await run({
      executablePath: 'fake-icloudpd',
      commandSpawner: commandSpawnerWithTimedOutput(providerOutput),
      envValues: {
        ICLOUDPD_COOKIE_DIR: sessionDir,
        ICLOUDPD_AUTH_TIMEOUT_MS: '20',
        user: 'person@example.com',
        pw: 'DO_NOT_EXPOSE_PASSWORD',
      },
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

/*
 * Creates a fake child-process spawner that writes provider output but never
 * closes, forcing the backend timeout path deterministically.
 */
function commandSpawnerWithTimedOutput(providerOutput) {
  return () => {
    const child = new EventEmitter();
    child.stdin = new PassThrough();
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    child.kill = () => true;
    child.unref = () => {};
    setImmediate(() => {
      child.stdout.write(providerOutput);
    });
    setTimeout(() => {}, 50);
    return child;
  };
}

// 2FA output must win over generic timeout and surface safe operator prompts.
test('provider-proof timeout with 2FA output is classified as requires 2FA with visible prompts', async () => {
  const status = await withTimedOutProviderOutput([
    'Processing user: person@example.com',
    'Two-factor authentication is required (2fa)',
    '  a: *** **76',
    'Please enter two-factor authentication code or device index (a) to send SMS with a code:',
  ].join('\n'), (context) => getNewAuthStatus(context));

  assert.equal(status.ok, false);
  assert.equal(status.state, 'requires_2fa');
  assert.equal(status.errorCode, 'NEW_AUTH_PROVIDER_REQUIRES_2FA');
  assert.match(status.message, /ENTER 6-DIGIT CODE/);
  assert.match(status.message, /ENTER DEVICE INDEX \(A\)/);
  assert.equal(status.details.providerProof.verified, false);
  assert.equal(status.details.providerProof.requires2fa, true);
  assert.equal(status.details.providerProof.canEnterSixDigitCode, true);
  assert.equal(status.details.providerProof.canEnterDeviceIndex, true);
  assert.deepEqual(status.details.providerProof.availableDeviceIndexes, ['a']);
  assert.deepEqual(status.details.providerProof.userPrompts, ['ENTER 6-DIGIT CODE', 'ENTER DEVICE INDEX (A)']);

  const serialized = JSON.stringify(status);
  assert.equal(serialized.includes('DO_NOT_EXPOSE_PASSWORD'), false);
  assert.equal(serialized.includes('DO_NOT_EXPOSE_COOKIE_CONTENT'), false);
  assert.equal(serialized.includes('person@example.com'), false);
});

// Generic provider timeouts without 2FA text must remain timeout/unverified.
test('generic provider-proof timeout without 2FA output remains timeout', async () => {
  const status = await withTimedOutProviderOutput('Checking existing session...', (context) => getNewAuthStatus(context));

  assert.equal(status.ok, false);
  assert.equal(status.state, 'unverified');
  assert.equal(status.errorCode, 'NEW_AUTH_PROVIDER_PROOF_TIMEOUT');
  assert.equal(status.details.providerProof.requires2fa, undefined);
});

// Result rendering should expose sanitized prompt labels outside the raw JSON.
test('result surface renders provider-proof user prompts outside raw JSON', () => {
  const markup = renderResultSurface({
    outcome: 'success',
    operation: 'Check new auth login status',
    method: 'GET',
    endpoint: '/api/auth/new/status',
    message: 'iCloudPD requires two-factor authentication.',
    payload: {
      ok: false,
      state: 'requires_2fa',
      details: {
        providerProof: {
          userPrompts: ['ENTER 6-DIGIT CODE', 'ENTER DEVICE INDEX (A)'],
        },
      },
    },
  });

  assert.match(markup, /User action prompts/);
  assert.match(markup, /ENTER 6-DIGIT CODE/);
  assert.match(markup, /ENTER DEVICE INDEX \(A\)/);
  assert.match(markup, /result-user-prompt/);
  assert.match(markup, /class="result-json" data-scroll-preserve="result-payload-check-new-auth-login-status-get-api-auth-new-status-response-payload"/);
});


// The runtime classifier must keep 2FA pending before evaluating failed states.
test('runtime action classifier checks 2FA before failed status', () => {
  const source = readFileSync(new URL('../dashboard/services/runtimeTruth/runtimeTruthNewAuthActions.ts', import.meta.url), 'utf8');
  const twoFactorIndex = source.indexOf("if (hasNewAuthTwoFactorPrompt(payload)) return 'pending';");
  const failedIndex = source.indexOf("if (payload?.ok === false || payload?.state === 'failed' || payload?.status === 'error') return 'failed';");
  assert.notEqual(twoFactorIndex, -1);
  assert.notEqual(failedIndex, -1);
  assert.equal(twoFactorIndex < failedIndex, true);
});
