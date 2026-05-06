import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { renderResultSurface } from '../dashboard/services/renderers.ts';
import { getNewAuthStatus } from '../server/auth/newAuthService.ts';

async function withSessionScript(scriptBody, run) {
  const root = mkdtempSync(path.join(tmpdir(), 'new-auth-slice4-'));
  const sessionDir = path.join(root, 'icloud-session');
  const executablePath = path.join(root, 'icloudpd');

  try {
    await mkdir(sessionDir, { recursive: true });
    writeFileSync(path.join(sessionDir, 'cookie'), 'DO_NOT_EXPOSE_COOKIE_CONTENT');
    writeFileSync(executablePath, scriptBody);
    chmodSync(executablePath, 0o755);

    return await run({
      executablePath,
      envValues: {
        ICLOUDPD_COOKIE_DIR: sessionDir,
        ICLOUDPD_AUTH_TIMEOUT_MS: '500',
        user: 'person@example.com',
        pw: 'DO_NOT_EXPOSE_PASSWORD',
      },
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}


test('provider-proof timeout with 2FA output is classified as requires 2FA with visible prompts', async () => {
  const status = await withSessionScript(`#!/usr/bin/env sh
printf '%s\n' 'Processing user: person@example.com'
printf '%s\n' 'Two-factor authentication is required (2fa)'
printf '%s\n' '  a: *** **76'
printf '%s\n' 'Please enter two-factor authentication code or device index (a) to send SMS with a code:'
sleep 2
`, (context) => getNewAuthStatus(context));

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

test('generic provider-proof timeout without 2FA output remains timeout', async () => {
  const status = await withSessionScript(`#!/usr/bin/env sh
printf '%s\n' 'Checking existing session...'
sleep 2
`, (context) => getNewAuthStatus(context));

  assert.equal(status.ok, false);
  assert.equal(status.state, 'unverified');
  assert.equal(status.errorCode, 'NEW_AUTH_PROVIDER_PROOF_TIMEOUT');
  assert.equal(status.details.providerProof.requires2fa, undefined);
});

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
});


test('runtime action classifier checks 2FA before failed status', () => {
  const source = readFileSync(new URL('../dashboard/services/runtimeTruth/runtimeTruthNewAuthActions.ts', import.meta.url), 'utf8');
  const twoFactorIndex = source.indexOf("if (hasNewAuthTwoFactorPrompt(payload)) return 'pending';");
  const failedIndex = source.indexOf("if (payload?.ok === false || payload?.state === 'failed' || payload?.status === 'error') return 'failed';");
  assert.notEqual(twoFactorIndex, -1);
  assert.notEqual(failedIndex, -1);
  assert.equal(twoFactorIndex < failedIndex, true);
});
