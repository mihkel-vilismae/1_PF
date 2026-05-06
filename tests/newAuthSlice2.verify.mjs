import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, chmodSync, readFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  getNewAuthSessionFiles,
  getNewAuthStatus,
  verifyNewAuthIcloudpd,
} from '../server/auth/newAuthService.ts';

const read = (filePath) => readFileSync(new URL(`../${filePath}`, import.meta.url), 'utf8');

const index = read('server/index.ts');
const routes = read('server/auth/newAuthRoutes.ts');
assert.ok(index.includes("'GET /api/auth/new/status': newAuthRouteHandlers.statusHandler"));
assert.ok(index.includes("'POST /api/auth/new/verify-icloudpd': newAuthRouteHandlers.verifyIcloudpdHandler"));
assert.ok(index.includes("'GET /api/auth/new/session-files': newAuthRouteHandlers.sessionFilesHandler"));
assert.doesNotMatch(routes, /createAuthRoutes|authRouteHandlers|\/api\/auth\/(status|verify-icloudpd|run|logout|2fa\/submit)/);

const originalPath = process.env.PATH;
const emptyPath = mkdtempSync(path.join(tmpdir(), 'new-auth-empty-path-'));
symlinkSync('/bin/sh', path.join(emptyPath, 'sh'));
process.env.PATH = emptyPath;
const missingResult = await verifyNewAuthIcloudpd({ envValues: {}, platform: process.platform });
process.env.PATH = originalPath;
assert.equal(missingResult.ok, false);
assert.equal(missingResult.state, 'failed');
assert.equal(missingResult.errorCode, 'ICLOUDPD_NOT_FOUND');
assert.doesNotMatch(JSON.stringify(missingResult), /password|super-secret|raw cookie/i);

const binDir = mkdtempSync(path.join(tmpdir(), 'new-auth-bin-'));
const executablePath = path.join(binDir, 'icloudpd');
writeFileSync(executablePath, '#!/usr/bin/env sh\necho icloudpd 2026.1\n');
chmodSync(executablePath, 0o755);
process.env.PATH = `${binDir}${path.delimiter}${originalPath ?? ''}`;
const foundResult = await verifyNewAuthIcloudpd({ envValues: {}, platform: process.platform });
process.env.PATH = originalPath;
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
