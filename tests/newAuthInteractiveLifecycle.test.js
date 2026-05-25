/*
 * Verifies the NEW AUTH interactive iCloudPD process lifecycle.
 * These tests cover prompt detection, 2FA follow-up submission,
 * active child-process reuse, and safe redaction of auth details.
 */
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { mkdtempSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { PassThrough } from 'node:stream';
import path from 'node:path';
import test from 'node:test';

import {
  logoutNewAuthSession,
  startNewAuthLogin,
  submitNewAuthTwoFactor,
} from '../server/auth/newAuthService.ts';

test('new auth keeps one live icloudpd process across device index and SMS code submissions', async () => {
  const cookieDir = mkdtempSync(path.join(tmpdir(), 'new-auth-interactive-'));
  const spawned = [];

  const commandSpawner = () => {
    const child = new EventEmitter();
    child.stdin = new PassThrough();
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    child.kill = () => {
      child.emit('close', null, 'SIGTERM');
      return true;
    };
    child.unref = () => {};
    spawned.push(child);

    setImmediate(() => {
      child.stdout.write('Please enter device index (a..b) to send SMS with a code:');
    });

    child.stdin.on('data', (chunk) => {
      const value = String(chunk).trim();
      if (value === 'a') {
        child.stdout.write('\nSMS sent. Enter verification code:');
        return;
      }
      if (value === '218228') {
        child.stdout.write('\nAuthentication successful. Valid session cookie.');
        child.emit('close', 0, null);
      }
    });

    return child;
  };

  const context = {
    executablePath: 'fake-icloudpd',
    commandSpawner,
    envValues: {
      user: 'person@example.com',
      pw: 'DO_NOT_EXPOSE_PASSWORD',
      ICLOUDPD_COOKIE_DIR: cookieDir,
      ICLOUDPD_AUTH_TIMEOUT_MS: '2000',
    },
  };

  try {
    const login = await startNewAuthLogin(context);
    assert.equal(login.ok, true);
    assert.equal(login.state, 'pending_2fa');
    assert.equal(login.details.twoFactorPromptKind, 'device_index');

    const deviceIndex = await submitNewAuthTwoFactor(context, { code: 'a' });
    assert.equal(deviceIndex.ok, true);
    assert.equal(deviceIndex.state, 'pending_2fa');
    assert.equal(deviceIndex.details.twoFactorPromptKind, 'verification_code');

    const smsCode = await submitNewAuthTwoFactor(context, { code: '218228' });
    assert.equal(smsCode.ok, true);
    assert.equal(smsCode.state, 'authenticated');
    assert.equal(spawned.length, 1);
    assert.equal(Array.isArray(login?.details?.events), true);
    assert.equal(Array.isArray(deviceIndex?.details?.events), true);
    assert.equal(Array.isArray(smsCode?.details?.events), true);
    assert.equal(login.details.events.some((event) => event.phase === 'process_spawned'), true);
    assert.equal(login.details.events.some((event) => event.phase === 'provider_prompt_detected'), true);
    assert.equal(deviceIndex.details.events.some((event) => event.phase === 'response_submitted'), true);
    assert.equal(smsCode.details.events.some((event) => event.phase === 'process_close_cleanup'), true);
    assert.equal(login.details.secretValuesShown, false);
    assert.equal(deviceIndex.details.secretValuesShown, false);
    assert.equal(smsCode.details.secretValuesShown, false);

    const serialized = JSON.stringify([login, deviceIndex, smsCode]);
    assert.equal(serialized.includes('218228'), false);
    assert.equal(serialized.includes('DO_NOT_EXPOSE_PASSWORD'), false);
    assert.equal(serialized.includes('person@example.com'), false);
    assert.equal(serialized.includes(cookieDir), false);
  } finally {
    await logoutNewAuthSession(context);
    await rm(cookieDir, { recursive: true, force: true });
  }
});

/*
 * Replays iCloudPD's success transcript containing 2FA-expiry wording so the
 * mapper does not mistake completed auth for another pending prompt.
 */
test('new auth treats icloudpd success output as authenticated despite stale 2FA expiry wording', async () => {
  const cookieDir = mkdtempSync(path.join(tmpdir(), 'new-auth-interactive-success-'));
  const spawned = [];

  // Simulates the two-step SMS flow and then emits the real success wording.
  const commandSpawner = () => {
    const child = new EventEmitter();
    child.stdin = new PassThrough();
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    child.kill = () => {
      child.emit('close', null, 'SIGTERM');
      return true;
    };
    child.unref = () => {};
    spawned.push(child);

    setImmediate(() => {
      child.stdout.write('Please enter two-factor authentication code or device index (a) to send SMS with a code:');
    });

    child.stdin.on('data', (chunk) => {
      const value = String(chunk).trim();
      if (value === 'a') {
        child.stdout.write('\nPlease enter two-factor authentication code that you received over SMS:');
        return;
      }
      if (value === '218228') {
        child.stdout.write([
          "\nGreat, you're all set up. The script can now be run without user interaction until 2FA expires.",
          'You can set up email notifications for when the two-factor authentication expires.',
          'Authentication completed successfully',
        ].join('\n'));
      }
    });

    return child;
  };

  const context = {
    executablePath: 'fake-icloudpd',
    commandSpawner,
    envValues: {
      user: 'person@example.com',
      pw: 'DO_NOT_EXPOSE_PASSWORD',
      ICLOUDPD_COOKIE_DIR: cookieDir,
      ICLOUDPD_AUTH_TIMEOUT_MS: '2000',
    },
  };

  try {
    const login = await startNewAuthLogin(context);
    assert.equal(login.state, 'pending_2fa');

    const deviceIndex = await submitNewAuthTwoFactor(context, { code: 'a' });
    assert.equal(deviceIndex.state, 'pending_2fa');

    const smsCode = await submitNewAuthTwoFactor(context, { code: '218228' });
    assert.equal(smsCode.ok, true);
    assert.equal(smsCode.state, 'authenticated');
    assert.equal(smsCode.details.events.some((event) => event.stateAfter === 'authenticated'), true);
    assert.equal(spawned.length, 1);

    const serialized = JSON.stringify([login, deviceIndex, smsCode]);
    assert.equal(serialized.includes('218228'), false);
    assert.equal(serialized.includes('DO_NOT_EXPOSE_PASSWORD'), false);
    assert.equal(serialized.includes('person@example.com'), false);
    assert.equal(serialized.includes(cookieDir), false);
  } finally {
    await logoutNewAuthSession(context);
    await rm(cookieDir, { recursive: true, force: true });
  }
});

// Verifies generic 2FA text waits briefly for the concrete code prompt.
test('new auth waits for delayed verification-code prompt before rendering modal input metadata', async () => {
  const cookieDir = mkdtempSync(path.join(tmpdir(), 'new-auth-delayed-prompt-'));
  const spawned = [];

  const commandSpawner = () => {
    const child = new EventEmitter();
    child.stdin = new PassThrough();
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    child.kill = () => {
      child.emit('close', null, 'SIGTERM');
      return true;
    };
    child.unref = () => {};
    spawned.push(child);

    setImmediate(() => {
      child.stdout.write([
        'Processing user: person@example.com',
        'Authenticating...',
        'Authentication required for Account. (421)',
        'Two-factor authentication is required (2fa)',
      ].join('\n'));
    });
    setTimeout(() => {
      child.stdout.write('\nPlease enter two-factor authentication code: ');
    }, 100);

    return child;
  };

  const context = {
    executablePath: 'fake-icloudpd',
    commandSpawner,
    envValues: {
      user: 'person@example.com',
      pw: 'DO_NOT_EXPOSE_PASSWORD',
      ICLOUDPD_COOKIE_DIR: cookieDir,
      ICLOUDPD_AUTH_TIMEOUT_MS: '2000',
    },
  };

  try {
    const login = await startNewAuthLogin(context);

    assert.equal(login.ok, true);
    assert.equal(login.state, 'pending_2fa');
    assert.equal(login.details.twoFactorPromptKind, 'verification_code');
    assert.equal(login.details.canEnterSixDigitCode, true);
    assert.equal(login.details.canEnterDeviceIndex, false);
    assert.equal(spawned.length, 1);
    assert.equal(login.details.providerOutputPreview.includes('Please enter two-factor authentication code:'), true);

    const serialized = JSON.stringify(login);
    assert.equal(serialized.includes('DO_NOT_EXPOSE_PASSWORD'), false);
    assert.equal(serialized.includes('person@example.com'), false);
    assert.equal(serialized.includes(cookieDir), false);
  } finally {
    await logoutNewAuthSession(context);
    await rm(cookieDir, { recursive: true, force: true });
  }
});
