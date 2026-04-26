import assert from 'node:assert/strict';
import test from 'node:test';
import { renderInitView } from '../dashboard/views/initView.js';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.js';
import { sanitizeAuthPayload } from '../dashboard/services/runtimeTruth/runtimeTruthAuthActions.js';

test('View A 1A-AUTH renders 2FA and logout controls only from backend-required 2FA state', () => {
  const state = createInitialState();
  state.authPreflight.loaded = true;
  state.authPreflight.publicState = {
    status: 'blocked',
    has_required_files: true,
    requires_2fa: true,
    two_factor_status: 'required',
    two_factor_method: 'trusted_device',
    next_action: 'submit_two_factor_code',
    attemptId: 'attempt-ui-2fa',
    updatedAt: '2026-04-24T14:40:00.000Z',
    error: null,
    authenticatedUser: null,
    provider: 'icloud',
  };

  const markup = renderInitView(state);

  assert.equal(markup.includes('data-auth-2fa-code'), true);
  assert.equal(markup.includes('data-action="submit-b1-2fa"'), true);
  assert.equal(markup.includes('data-action="logout-b1-auth"'), true);
});

test('View A 1A-AUTH renders icloudpd/login controls and keeps single-file test control', () => {
  const state = createInitialState();
  state.authPreflight.loaded = true;

  const markup = renderInitView(state);

  assert.equal(markup.includes('1A-AUTH'), true);
  assert.equal(markup.includes('Verify icloudpd'), true);
  assert.equal(markup.indexOf('Verify .env') < markup.indexOf('1A-AUTH'), true);
  assert.equal(markup.indexOf('1A-AUTH') < markup.indexOf('Database controls'), true);
  assert.equal(markup.includes('data-action="verify-icloudpd"'), true);
  assert.equal(markup.includes('data-action="check-login"'), true);
  assert.equal(markup.includes('data-action="login-using-env"'), true);
  assert.equal(markup.includes('data-action="logout-b1-auth"'), true);
  assert.equal(markup.includes('data-action="test-b1-login-download-one"'), true);
  assert.equal(markup.includes('TEST LOGIN BY DOWNLOADING A SINGLE FILE'), true);
});

test('auth payload sanitizer removes submitted 2FA code from request metadata', () => {
  const sanitized = sanitizeAuthPayload({ request: { body: { code: '123456' } } });
  assert.equal(JSON.stringify(sanitized).includes('123456'), false);
  assert.equal(sanitized.request.body.code, undefined);
});
