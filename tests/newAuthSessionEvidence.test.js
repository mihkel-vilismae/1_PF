import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { mapNewAuthCommandResult } from '../server/auth/newAuthService.ts';

test('new auth command result keeps hsa2 challenge output pending for another 2FA response', async () => {
  const cookieDir = mkdtempSync(path.join(tmpdir(), 'new-auth-session-evidence-'));

  try {
    writeFileSync(path.join(cookieDir, 'person.session'), 'DO_NOT_EXPOSE_SESSION_CONTENT');

    const result = mapNewAuthCommandResult(
      {
        ok: true,
        exitCode: 0,
        signal: null,
        stdout: '{"content":{"authType":"hsa2"}}',
        stderr: '',
      },
      {
        username: 'person@example.com',
        password: 'DO_NOT_EXPOSE_PASSWORD',
        cookieDir,
        downloadDir: null,
        domain: null,
        timeoutMs: 120_000,
      },
      {
        successMessage: 'iCloudPD 2FA follow-up command completed and the local session was verified.',
        startedMessage: 'iCloudPD 2FA follow-up command completed, but authenticated session proof was not strong enough to report success.',
      },
      {
        hasSessionFiles: false,
        sessionFileCount: 0,
        latestModifiedMs: null,
        latestModifiedAt: null,
      },
    );

    assert.equal(result.ok, true);
    assert.equal(result.state, 'pending_2fa');
    assert.equal(result.details.nextAction, 'inspect_hsa2_prompt_then_submit_response');
    assert.equal(result.details.twoFactorPromptKind, 'apple_hsa2_challenge');
    assert.equal(result.details.requestedInput, 'Apple HSA2 challenge; exact prompt not visible');
    assert.equal(JSON.stringify(result).includes('DO_NOT_EXPOSE_PASSWORD'), false);
    assert.equal(JSON.stringify(result).includes('DO_NOT_EXPOSE_SESSION_CONTENT'), false);
  } finally {
    await rm(cookieDir, { recursive: true, force: true });
  }
});

test('new auth command result identifies device-index prompts', async () => {
  const result = mapNewAuthCommandResult(
    {
      ok: true,
      exitCode: 0,
      signal: null,
      stdout: 'Please enter two-factor authentication code or device index (a..b) to send SMS with a code:',
      stderr: '',
    },
    {
      username: 'person@example.com',
      password: 'DO_NOT_EXPOSE_PASSWORD',
      cookieDir: null,
      downloadDir: null,
      domain: null,
      timeoutMs: 120_000,
    },
    {
      successMessage: 'authenticated',
      startedMessage: 'unverified',
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.state, 'pending_2fa');
  assert.equal(result.details.twoFactorPromptKind, 'device_index_or_code');
  assert.equal(result.details.requestedInput, 'Device index or six-digit verification code');
  assert.match(result.message, /device index/);
});

test('new auth command result identifies verification-code prompts', async () => {
  const result = mapNewAuthCommandResult(
    {
      ok: true,
      exitCode: 0,
      signal: null,
      stdout: 'Please enter verification code:',
      stderr: '',
    },
    {
      username: 'person@example.com',
      password: 'DO_NOT_EXPOSE_PASSWORD',
      cookieDir: null,
      downloadDir: null,
      domain: null,
      timeoutMs: 120_000,
    },
    {
      successMessage: 'authenticated',
      startedMessage: 'unverified',
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.state, 'pending_2fa');
  assert.equal(result.details.twoFactorPromptKind, 'verification_code');
  assert.equal(result.details.requestedInput, 'Six-digit verification code');
  assert.match(result.message, /six-digit verification code/);
});

test('new auth command result accepts fresh session files when output has no active hsa2 challenge', async () => {
  const cookieDir = mkdtempSync(path.join(tmpdir(), 'new-auth-session-evidence-'));

  try {
    writeFileSync(path.join(cookieDir, 'person.session'), 'DO_NOT_EXPOSE_SESSION_CONTENT');

    const result = mapNewAuthCommandResult(
      {
        ok: true,
        exitCode: 0,
        signal: null,
        stdout: 'Command completed.',
        stderr: '',
      },
      {
        username: 'person@example.com',
        password: 'DO_NOT_EXPOSE_PASSWORD',
        cookieDir,
        downloadDir: null,
        domain: null,
        timeoutMs: 120_000,
      },
      {
        successMessage: 'iCloudPD 2FA follow-up command completed and the local session was verified.',
        startedMessage: 'iCloudPD 2FA follow-up command completed, but authenticated session proof was not strong enough to report success.',
      },
      {
        hasSessionFiles: false,
        sessionFileCount: 0,
        latestModifiedMs: null,
        latestModifiedAt: null,
      },
    );

    assert.equal(result.ok, true);
    assert.equal(result.state, 'authenticated');
    assert.equal(result.details.sessionFileCount, 1);
    assert.equal(JSON.stringify(result).includes('DO_NOT_EXPOSE_PASSWORD'), false);
    assert.equal(JSON.stringify(result).includes('DO_NOT_EXPOSE_SESSION_CONTENT'), false);
  } finally {
    await rm(cookieDir, { recursive: true, force: true });
  }
});
