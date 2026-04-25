import assert from 'node:assert/strict';
import test from 'node:test';
import { createDefaultAuthState, projectPublicAuthState } from '../server/auth/authState.js';

const expectedPublicKeys = [
  'status',
  'has_required_files',
  'requires_2fa',
  'two_factor_status',
  'two_factor_method',
  'next_action',
  'attemptId',
  'updatedAt',
  'error',
  'authenticatedUser',
  'provider',
].sort();

test('default auth state has the backend-owned slice-1 shape', () => {
  const state = createDefaultAuthState();

  assert.deepEqual(Object.keys(projectPublicAuthState(state)).sort(), expectedPublicKeys);
  assert.equal(state.status, 'idle');
  assert.equal(state.has_required_files, false);
  assert.equal(state.requires_2fa, 'unknown');
  assert.equal(state.two_factor_status, 'not_started');
  assert.equal(state.two_factor_method, null);
  assert.equal(state.next_action, 'run_auth_preflight');
  assert.equal(state.attemptId, null);
  assert.equal(state.updatedAt, null);
  assert.equal(state.error, null);
  assert.equal(state.authenticatedUser, null);
  assert.equal(state.provider, 'icloud');
});

test('safe public auth projection redacts sensitive nested values', () => {
  const projected = projectPublicAuthState(createDefaultAuthState({
    status: 'preflight_failed',
    attemptId: 'attempt-1',
    updatedAt: '2026-04-24T13:30:00.000Z',
    error: {
      code: 'example_error',
      message: 'Operator-readable error remains visible.',
      password: 'must-not-leak',
      cookieValue: 'must-not-leak',
      nested: {
        token: 'must-not-leak',
        safeHint: 'visible',
      },
    },
    authenticatedUser: {
      email: 'user@example.com',
      sessionToken: 'must-not-leak',
    },
  }));

  assert.equal(projected.error.code, 'example_error');
  assert.equal(projected.error.message, 'Operator-readable error remains visible.');
  assert.equal(projected.error.password, '[redacted]');
  assert.equal(projected.error.cookieValue, '[redacted]');
  assert.equal(projected.error.nested.token, '[redacted]');
  assert.equal(projected.error.nested.safeHint, 'visible');
  assert.equal(projected.authenticatedUser.email, 'user@example.com');
  assert.equal(projected.authenticatedUser.sessionToken, '[redacted]');
  assert.equal(JSON.stringify(projected).includes('must-not-leak'), false);
});
