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
    assert.equal(Array.isArray(result.details.events), true);
    assert.equal(result.details.events.some((event) => event.phase === 'provider_prompt_detected'), true);
    assert.equal(result.details.providerOutputShown, 'sanitized_preview');
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
  assert.equal(result.details.events.some((event) => event.promptKind === 'device_index_or_code'), true);
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

test('new auth command result redacts echoed SMS code from provider preview', async () => {
  const result = mapNewAuthCommandResult(
    {
      ok: true,
      exitCode: 0,
      signal: null,
      stdout: 'Apple verification code is 218228. Please enter verification code:',
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

  const serialized = JSON.stringify(result);
  assert.equal(result.state, 'pending_2fa');
  assert.equal(serialized.includes('218228'), false);
  assert.equal(serialized.includes('DO_NOT_EXPOSE_PASSWORD'), false);
});

test('new auth command result identifies SMS six-digit code prompts', async () => {
  const result = mapNewAuthCommandResult(
    {
      ok: true,
      exitCode: 0,
      signal: null,
      stdout: 'SMS sent to trusted phone. Please enter six-digit code:',
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
});

test('new auth command result does not authenticate on fresh session files alone', async () => {
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

    assert.equal(result.ok, false);
    assert.equal(result.state, 'unverified');
    assert.equal(result.errorCode, 'NEW_AUTH_UNVERIFIED_SESSION');
    assert.equal(result.details.sessionFileCount, 1);
    assert.equal(result.details.nextAction, 'check_login_status_or_retry_provider_proof');
    assert.equal(result.details.events.some((event) => event.phase === 'session_evidence_collected'), true);
    assert.equal(result.details.events.some((event) => event.stateAfter === 'unverified'), true);
    assert.equal(JSON.stringify(result).includes('DO_NOT_EXPOSE_PASSWORD'), false);
    assert.equal(JSON.stringify(result).includes('DO_NOT_EXPOSE_SESSION_CONTENT'), false);
  } finally {
    await rm(cookieDir, { recursive: true, force: true });
  }
});
