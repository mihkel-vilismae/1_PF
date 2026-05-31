import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../dashboard/data/authButtonStatusCopy.ts', import.meta.url), 'utf8');

test('NEW AUTH backend-status metadata marks implemented routes as real', () => {
  const buttonKeys = [
    'new-auth-verify-icloudpd',
    'new-auth-verify-provider-session',
    'new-auth-login-using-env',
    'new-auth-check-login',
    'new-auth-logout-session',
    'new-auth-session-files',
    'new-auth-generate-artifact-pack',
    'new-auth-list-artifact-packs',
  ];

  for (const key of buttonKeys) {
    const entryStart = source.indexOf(`'${key}': {`);
    assert.notEqual(entryStart, -1, `${key} metadata entry missing`);
    const nextEntryStart = source.indexOf("\n  '", entryStart + 1);
    const entry = source.slice(entryStart, nextEntryStart === -1 ? undefined : nextEntryStart);

    assert.match(entry, /backendState:\s*'real'/, `${key} should be backend-real`);
    assert.doesNotMatch(entry, /backendState:\s*'missing'/, `${key} should not be backend-missing`);
    assert.match(entry, /real backend route/i, `${key} should explain the real backend route`);
  }
});
