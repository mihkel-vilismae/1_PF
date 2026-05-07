/*
 * Verifies NEW AUTH status truth rules around local session evidence,
 * provider proof, passive checks, and logout-safe status projection.
 */
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { PassThrough } from 'node:stream';
import path from 'node:path';
import test from 'node:test';

import { createNewAuthRoutes } from '../server/auth/newAuthRoutes.ts';
import { getNewAuthStatus, logoutNewAuthSession, startNewAuthLogin } from '../server/auth/newAuthService.ts';

/*
 * Creates a fake child-process spawner that immediately returns configured
 * provider output without invoking any real executable.
 */
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

/*
 * Wraps the fake spawner with call recording so tests can prove passive status
 * did not start provider proof.
 */
function countingCommandSpawnerWithOutput({ stdout = '', stderr = '', exitCode = 0 }) {
  const calls = [];
  const spawner = (command, args) => {
    calls.push({ command, args });
    return commandSpawnerWithOutput({ stdout, stderr, exitCode })();
  };
  spawner.calls = calls;
  return spawner;
}

/*
 * Creates a controllable fake child process for active-login tests without
 * spawning iCloudPD or touching real provider state.
 */
function createControlledCommandSpawner() {
  const calls = [];
  const children = [];
  const spawner = (command, args) => {
    calls.push({ command, args });
    const child = new EventEmitter();
    child.stdin = new PassThrough();
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    child.stdinWrites = [];
    child.stdin.on('data', (chunk) => child.stdinWrites.push(String(chunk)));
    child.kill = () => {
      child.emit('close', null, 'SIGTERM');
      return true;
    };
    child.unref = () => {};
    children.push(child);
    return child;
  };
  spawner.calls = calls;
  spawner.children = children;
  return spawner;
}

/*
 * Waits until the fake login process exists so active-attempt tests do not race
 * the async login setup path.
 */
async function waitForControlledChild(commandSpawner) {
  for (let index = 0; index < 20; index += 1) {
    if (commandSpawner.children[0]) {
      return commandSpawner.children[0];
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Controlled NEW AUTH child process was not created.');
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

// Route-level coverage protects the real HTTP handler path used by the dashboard button.
test('new auth status route passive mode does not start provider proof', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'new-auth-status-route-passive-'));
  const sessionDir = path.join(root, 'icloud-session');
  const commandSpawner = countingCommandSpawnerWithOutput({ stdout: 'Using existing session. Valid session cookie.' });

  try {
    await mkdir(sessionDir, { recursive: true });
    writeFileSync(path.join(sessionDir, 'cookie'), 'DO_NOT_EXPOSE_COOKIE_CONTENT');

    const routes = createNewAuthRoutes();
    const response = await routes.statusHandler({
      context: {
        executablePath: 'fake-icloudpd',
        commandSpawner,
        envValues: {
          ICLOUDPD_COOKIE_DIR: sessionDir,
          user: 'person@example.com',
          pw: 'DO_NOT_EXPOSE_PASSWORD',
        },
      },
      url: new URL('http://localhost/api/auth/new/status?mode=passive'),
    });

    assert.equal(commandSpawner.calls.length, 0);
    assert.equal(response.statusCode, 200);
    assert.equal(response.payload.state, 'unverified');
    assert.equal(response.payload.errorCode, 'NEW_AUTH_PROVIDER_PROOF_SKIPPED');
    assert.equal(response.payload.details.providerProof.attempted, false);
    assert.equal(response.payload.details.providerProof.command, undefined);
    assert.equal(response.payload.details.providerProof.providerOutputPreview, undefined);
  } finally {
    await rm(root, { recursive: true, force: true });
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

// Passive status must not inspect fresh output from an active login process.
test('new auth passive status does not classify active provider output', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'new-auth-active-passive-'));
  const sessionDir = path.join(root, 'icloud-session');
  const commandSpawner = createControlledCommandSpawner();

  try {
    const context = {
      executablePath: 'fake-icloudpd',
      commandSpawner,
      envValues: {
        ICLOUDPD_COOKIE_DIR: sessionDir,
        ICLOUDPD_AUTH_TIMEOUT_MS: '500',
        user: 'person@example.com',
        pw: 'DO_NOT_EXPOSE_PASSWORD',
      },
    };

    const loginPromise = startNewAuthLogin(context);
    const child = await waitForControlledChild(commandSpawner);
    child.stdout.write('Please enter two-factor authentication code or device index (a) to send SMS with a code:');

    const status = await getNewAuthStatus(context, { providerProof: false });

    assert.equal(status.ok, true);
    assert.equal(status.state, 'logging_in');
    assert.equal(status.errorCode, 'NEW_AUTH_PASSIVE_ACTIVE_ATTEMPT');
    assert.equal(status.details.providerProof.attempted, false);
    assert.equal(status.details.providerProof.command, undefined);
    assert.equal(status.details.providerProof.providerOutputPreview, undefined);
    assert.equal(status.details.providerProof.userPrompts, undefined);
    assert.equal(child.stdinWrites.length, 0);

    child.emit('close', null, 'SIGTERM');
    await loginPromise;
  } finally {
    await logoutNewAuthSession({ envValues: { ICLOUDPD_COOKIE_DIR: sessionDir } });
    await rm(root, { recursive: true, force: true });
  }
});

test('new auth passive status reports session evidence without starting provider proof', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'new-auth-status-passive-'));
  const sessionDir = path.join(root, 'icloud-session');
  const commandSpawner = countingCommandSpawnerWithOutput({ stdout: 'Using existing session. Valid session cookie.' });

  try {
    await mkdir(sessionDir, { recursive: true });
    writeFileSync(path.join(sessionDir, 'cookie'), 'DO_NOT_EXPOSE_COOKIE_CONTENT');

    const status = await getNewAuthStatus({
      executablePath: 'fake-icloudpd',
      commandSpawner,
      envValues: {
        ICLOUDPD_COOKIE_DIR: sessionDir,
        user: 'person@example.com',
        pw: 'DO_NOT_EXPOSE_PASSWORD',
      },
    }, { providerProof: false });

    assert.equal(commandSpawner.calls.length, 0);
    assert.equal(status.ok, false);
    assert.equal(status.state, 'unverified');
    assert.equal(status.errorCode, 'NEW_AUTH_PROVIDER_PROOF_SKIPPED');
    assert.equal(status.details.providerProof.attempted, false);
    assert.equal(status.details.localSessionEvidence.hasSessionFiles, true);
    assert.equal(JSON.stringify(status).includes('DO_NOT_EXPOSE_PASSWORD'), false);
    assert.equal(JSON.stringify(status).includes('DO_NOT_EXPOSE_COOKIE_CONTENT'), false);
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
