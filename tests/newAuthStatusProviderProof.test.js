import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { PassThrough } from 'node:stream';
import path from 'node:path';
import test from 'node:test';

import { getNewAuthStatus, logoutNewAuthSession } from '../server/auth/newAuthService.ts';

function commandSpawnerWithOutput({ stdout = '', stderr = '', exitCode = 0 }) {
  return () => {
    const child = new EventEmitter();
    child.stdin = new PassThrough();
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    child.kill = () => true;
    child.unref = () => {};

    setImmediate(() => {
      if (stdout) child.stdout.write(stdout);
      if (stderr) child.stderr.write(stderr);
      child.emit('close', exitCode, null);
    });

    return child;
  };
}

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

  try {
    writeFileSync(path.join(root, 'placeholder'), 'ok');
    await mkdir(sessionDir, { recursive: true });
    writeFileSync(path.join(sessionDir, 'cookie'), 'DO_NOT_EXPOSE_COOKIE_CONTENT');

    const status = await getNewAuthStatus({
      executablePath: 'fake-icloudpd',
      commandSpawner: commandSpawnerWithOutput({ stdout: 'Using existing session. Valid session cookie.' }),
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

test('new auth status ignores session-like files outside the configured cookie directory', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'new-auth-status-ignore-'));
  const sessionDir = path.join(root, 'empty-session');
  const downloadDir = path.join(root, 'download-cache');

  try {
    await mkdir(sessionDir, { recursive: true });
    await mkdir(downloadDir, { recursive: true });
    writeFileSync(path.join(downloadDir, 'icloud-auth-token.txt'), 'DO_NOT_EXPOSE_TOKEN_CONTENT');

    const status = await getNewAuthStatus({
      executablePath: 'fake-icloudpd',
      commandSpawner: commandSpawnerWithOutput({ stdout: 'This provider proof should not run.' }),
      envValues: {
        ICLOUDPD_COOKIE_DIR: sessionDir,
        DOWNLOAD_DIR: downloadDir,
        user: 'person@example.com',
        pw: 'DO_NOT_EXPOSE_PASSWORD',
      },
    });

    assert.equal(status.ok, true);
    assert.equal(status.state, 'logged_out');
    assert.equal(status.details.sessionFileCount, 0);
    assert.equal(status.details.localSessionEvidence.hasSessionFiles, false);
    assert.equal(status.details.providerProof.attempted, false);
    assert.equal(JSON.stringify(status).includes('DO_NOT_EXPOSE_TOKEN_CONTENT'), false);
    assert.equal(JSON.stringify(status).includes('DO_NOT_EXPOSE_PASSWORD'), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('new auth logout removes configured session files and leaves status logged out', async () => {
  const sessionDir = mkdtempSync(path.join(tmpdir(), 'new-auth-logout-status-'));

  try {
    writeFileSync(path.join(sessionDir, 'cookie'), 'DO_NOT_EXPOSE_COOKIE_CONTENT');

    const context = {
      executablePath: null,
      envValues: {
        ICLOUDPD_COOKIE_DIR: sessionDir,
        user: 'person@example.com',
        pw: 'DO_NOT_EXPOSE_PASSWORD',
      },
    };

    const logout = await logoutNewAuthSession(context);
    const status = await getNewAuthStatus(context);

    assert.equal(logout.ok, true);
    assert.equal(logout.state, 'logged_out');
    assert.equal(logout.details.removedFileCount, 1);
    assert.equal(logout.details.remoteLogoutClaimed, false);
    assert.equal(status.ok, true);
    assert.equal(status.state, 'logged_out');
    assert.equal(status.details.sessionFileCount, 0);
    assert.equal(status.details.providerProof.attempted, false);
    assert.equal(JSON.stringify([logout, status]).includes('DO_NOT_EXPOSE_COOKIE_CONTENT'), false);
    assert.equal(JSON.stringify([logout, status]).includes('DO_NOT_EXPOSE_PASSWORD'), false);
  } finally {
    await rm(sessionDir, { recursive: true, force: true });
  }
});
