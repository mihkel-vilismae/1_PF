import assert from 'node:assert/strict';
import test from 'node:test';

import { renderModal } from '../dashboard/services/renderers.ts';

test('new auth modal renders exact device-index prompt copy from prompt kind', () => {
  const markup = renderModal({
    kind: 'new-auth-login',
    title: 'New auth',
    stage: 'waiting_for_2fa',
    message: 'Waiting for response.',
    twoFactorPromptKind: 'device_index_or_code',
    requestedInput: 'Device index or six-digit verification code',
  });

  assert.equal(markup.includes('Enter device index, for example a'), true);
  assert.equal(markup.includes('Device index</label>'), true);
  assert.equal(markup.includes('Submit device index'), true);
  assert.equal(markup.includes('Device index or six-digit verification code'), false);
  assert.equal(markup.includes('2FA code or device index'), false);
});

test('new auth modal renders exact SMS code prompt copy from prompt kind', () => {
  const markup = renderModal({
    kind: 'new-auth-login',
    title: 'New auth',
    stage: 'waiting_for_2fa',
    message: 'Waiting for response.',
    twoFactorPromptKind: 'verification_code',
    requestedInput: 'Six-digit verification code',
  });

  assert.equal(markup.includes('Enter SMS six-digit code'), true);
  assert.equal(markup.includes('Six-digit verification code</label>'), true);
  assert.equal(markup.includes('Submit code'), true);
  assert.equal(markup.includes('2FA code or device index'), false);
});

test('new auth modal does not render a live 2FA input after authentication', () => {
  const markup = renderModal({
    kind: 'new-auth-login',
    title: 'New auth',
    stage: 'authenticated',
    message: 'Login completed.',
  });

  assert.equal(markup.includes('No two-factor input is needed'), true);
  assert.equal(markup.includes('data-new-auth-2fa-code'), false);
  assert.equal(markup.includes('new-auth-submit-2fa'), false);
  assert.equal(markup.includes('2FA code or device index'), false);
});
