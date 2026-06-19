import test from 'node:test';
import assert from 'node:assert/strict';
import { AUTH_SESSION_STATES, buildAuthSessionSnapshot, buildManualLoginSnapshotPair, validateAuthSessionSnapshot } from '../tools/auth-session-snapshot-contract-lib.mjs';

test('auth session snapshot contract supports manual pre/post login states without secrets', () => {
  assert.ok(AUTH_SESSION_STATES.includes('AUTH_READY_FOR_OPERATOR'));
  assert.ok(AUTH_SESSION_STATES.includes('AUTH_SESSION_DETECTED'));
  const pair = buildManualLoginSnapshotPair();
  assert.equal(validateAuthSessionSnapshot(pair.pre_login).status, 'PASSED');
  assert.equal(validateAuthSessionSnapshot(pair.post_login).status, 'PASSED');
  assert.equal(pair.post_login.session_boundary.session_contents_collected, false);
});

test('auth session snapshot rejects invalid auth state', () => {
  assert.throws(() => buildAuthSessionSnapshot({ stage: 'bad', authState: 'LOGGED_IN_MAGIC' }), /Invalid auth state/);
});
