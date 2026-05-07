import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { PassThrough } from 'node:stream';
import path from 'node:path';
import {
  getNewAuthSessionFiles,
  getNewAuthStatus,
  verifyNewAuthIcloudpd,
} from '../server/auth/newAuthService.ts';

const read = (filePath) => readFileSync(new URL(`../${filePath}`, import.meta.url), 'utf8');

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

const index = read('server/index.ts');
const routes = read('server/auth/newAuthRoutes.ts');
assert.ok(index.includes("'GET /api/auth/new/status': newAuthRouteHandlers.statusHandler"));
assert.ok(index.includes("'POST /api/auth/new/verify-icloudpd': newAuthRouteHandlers.verifyIcloudpdHandler"));
assert.ok(index.includes("'GET /api/auth/new/session-files': newAuthRouteHandlers.sessionFilesHandler"));
assert.doesNotMatch(routes, /createAuthRoutes|authRouteHandlers|\/api\/auth\/(status|verify-icloudpd|run|logout|2fa\/submit)/);

const missingResult = await verifyNewAuthIcloudpd({ envValues: {}, executablePath: null });
assert.equal(missingResult.ok, false);
assert.equal(missingResult.state, 'failed');
assert.equal(missingResult.errorCode, 'ICLOUDPD_NOT_FOUND');
assert.doesNotMatch(JSON.stringify(missingResult), /password|super-secret|raw cookie/i);

const foundResult = await verifyNewAuthIcloudpd({
  envValues: {},
  executablePath: 'fake-icloudpd',
  commandSpawner: commandSpawnerWithOutput({ stdout: 'icloudpd 2026.1' }),
});
assert.equal(foundResult.ok, true);
assert.equal(foundResult.state, 'success');
assert.match(String(foundResult.message), /found and can be executed/i);
assert.doesNotMatch(JSON.stringify(foundResult), /super-secret|raw cookie/i);

const sessionDir = mkdtempSync(path.join(tmpdir(), 'new-auth-session-'));
mkdirSync(path.join(sessionDir, 'nested'));
writeFileSync(path.join(sessionDir, 'cookie'), 'DO_NOT_EXPOSE_COOKIE_CONTENT');
const statusResult = await getNewAuthStatus({
  envValues: {
    ICLOUDPD_COOKIE_DIR: sessionDir,
    user: 'person@example.com',
    pw: 'DO_NOT_EXPOSE_PASSWORD',
  },
});
assert.equal(statusResult.ok, false);
assert.equal(statusResult.state, 'unverified');
assert.equal(statusResult.details.providerProof.verified, false);
assert.doesNotMatch(JSON.stringify(statusResult), /DO_NOT_EXPOSE_PASSWORD|DO_NOT_EXPOSE_COOKIE_CONTENT/);

const filesResult = await getNewAuthSessionFiles({
  envValues: {
    ICLOUDPD_COOKIE_DIR: sessionDir,
    user: 'person@example.com',
    pw: 'DO_NOT_EXPOSE_PASSWORD',
    DOWNLOAD_DIR: sessionDir,
  },
});
const serializedFiles = JSON.stringify(filesResult);
assert.equal(filesResult.ok, true);
assert.equal(filesResult.state, 'success');
assert.ok(Array.isArray(filesResult.paths));
assert.match(serializedFiles, /contentsShown":false/);
assert.match(serializedFiles, /cookie/);
assert.doesNotMatch(serializedFiles, /DO_NOT_EXPOSE_PASSWORD|DO_NOT_EXPOSE_COOKIE_CONTENT|person@example\.com/);

console.log('newAuthSlice2 verification passed');
