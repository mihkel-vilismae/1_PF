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
  assert.equal(markup.includes('Device index or six-digit verification code'), false);
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
  assert.equal(markup.includes('Six-digit verification code'), false);
});
