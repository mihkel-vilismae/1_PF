import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, writeFileSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { getNewAuthStatus } from '../server/auth/newAuthService.ts';

test('new auth status does not promote local session files without provider proof', async () => {
  const sessionDir = mkdtempSync(path.join(tmpdir(), 'new-auth-status-unverified-'));

  try {
    writeFileSync(path.join(sessionDir, 'cookie'), 'DO_NOT_EXPOSE_COOKIE_CONTENT');

    const status = await getNewAuthStatus({
      envValues: {
        ICLOUDPD_COOKIE_DIR: sessionDir,
        user: 'person@example.com',
        pw: 'DO_NOT_EXPOSE_PASSWORD',
      },
      executablePath: null,
    });

    assert.equal(status.ok, false);
    assert.equal(status.state, 'unverified');
    assert.equal(status.errorCode, 'ICLOUDPD_NOT_FOUND');
    assert.match(status.message, /iCloudPD could not be found/i);
    assert.equal(status.details.providerProof.verified, false);
    assert.equal(status.details.providerProof.secretValuesShown, false);
    assert.equal(JSON.stringify(status).includes('DO_NOT_EXPOSE_PASSWORD'), false);
    assert.equal(JSON.stringify(status).includes('DO_NOT_EXPOSE_COOKIE_CONTENT'), false);
    assert.equal(JSON.stringify(status).includes('person@example.com'), false);
    assert.equal(JSON.stringify(status).includes(sessionDir), false);
  } finally {
    await rm(sessionDir, { recursive: true, force: true });
  }
});

test('new auth status promotes authenticated only when provider proof verifies the session', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'new-auth-status-proof-'));
  const sessionDir = path.join(root, 'icloud-session');
  const executablePath = path.join(root, 'icloudpd');

  try {
    writeFileSync(path.join(root, 'placeholder'), 'ok');
    await import('node:fs/promises').then(({ mkdir }) => mkdir(sessionDir, { recursive: true }));
    writeFileSync(path.join(sessionDir, 'cookie'), 'DO_NOT_EXPOSE_COOKIE_CONTENT');
    writeFileSync(executablePath, '#!/usr/bin/env sh\necho "Using existing session. Valid session cookie."\n');
    chmodSync(executablePath, 0o755);

    const status = await getNewAuthStatus({
      executablePath,
      envValues: {
        ICLOUDPD_COOKIE_DIR: sessionDir,
        user: 'person@example.com',
        pw: 'DO_NOT_EXPOSE_PASSWORD',
      },
    });

    assert.equal(status.ok, true);
    assert.equal(status.state, 'authenticated');
    assert.equal(status.details.providerProof.verified, true);
    assert.equal(status.details.providerProof.reasonCode, 'NEW_AUTH_PROVIDER_VERIFIED');
    assert.match(status.message, /provider proof verified/i);
    assert.equal(JSON.stringify(status).includes('DO_NOT_EXPOSE_PASSWORD'), false);
    assert.equal(JSON.stringify(status).includes('DO_NOT_EXPOSE_COOKIE_CONTENT'), false);
    assert.equal(JSON.stringify(status).includes('person@example.com'), false);
    assert.equal(JSON.stringify(status).includes(sessionDir), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
