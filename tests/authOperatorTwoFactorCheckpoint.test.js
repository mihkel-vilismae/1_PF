/*
 * Verifies the operator-visible 2FA checkpoint marker for manual NEW AUTH runs.
 * This test does not automate real Apple/iCloud login. It proves the app emits
 * a secret-safe event at the exact point where the operator must enter 2FA/SMS.
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
import { AUTH_OPERATOR_2FA_CHECKPOINT_LOG } from '../server/auth/newAuth/newAuthStructuredEvents.ts';

test('new auth emits secret-safe operator 2FA checkpoint before manual SMS entry', async () => {
  const cookieDir = mkdtempSync(path.join(tmpdir(), 'auth-operator-2fa-checkpoint-'));
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
      child.stdout.write('Please enter two-factor authentication code or device index (a) to send SMS with a code:');
    });

    child.stdin.on('data', (chunk) => {
      const value = String(chunk).trim();
      if (value === 'a') {
        child.stdout.write('\nPlease enter two-factor authentication code that you received over SMS:');
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

    const events = login.details.events;
    assert.equal(Array.isArray(events), true);
    assert.equal(events.some((event) => event.phase === 'provider_prompt_detected'), true);

    const checkpoint = events.find((event) => event.phase === 'operator_2fa_checkpoint');
    assert.ok(checkpoint, 'operator_2fa_checkpoint event should be present');
    assert.equal(checkpoint.area, 'new-auth');
    assert.equal(checkpoint.secretValuesShown, false);
    assert.equal(checkpoint.providerOutputShown, 'classification_only');
    assert.equal(checkpoint.stateAfter, 'pending_2fa');
    assert.equal(checkpoint.promptKind, 'device_index_or_code');
    assert.equal(checkpoint.message.includes(AUTH_OPERATOR_2FA_CHECKPOINT_LOG), true);
    assert.equal(checkpoint.message.includes('operator_action=enter_2fa_outside_artifact_capture'), true);

    const deviceIndex = await submitNewAuthTwoFactor(context, { code: 'a' });
    assert.equal(deviceIndex.state, 'pending_2fa');

    const smsCode = await submitNewAuthTwoFactor(context, { code: '218228' });
    assert.equal(smsCode.ok, true);
    assert.equal(smsCode.state, 'authenticated');

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
