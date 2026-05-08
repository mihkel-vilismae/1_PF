/*
 * Verifies NEW AUTH modal prompt copy and adjacent communication panel markup.
 * These tests keep visible operator text stable for the iCloudPD login flow.
 */
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

// Verifies the NEW AUTH modal renders a sane terminal-style waiting state.
test('new auth modal renders waiting icloudpd communication panel beside login panel', () => {
  const markup = renderModal({
    kind: 'new-auth-login',
    title: 'New auth',
    stage: 'waiting_for_2fa',
    message: 'Waiting for response.',
  });

  assert.equal(markup.includes('modal-layout--new-auth'), true);
  assert.equal(markup.includes('modal-panel--terminal'), true);
  assert.equal(markup.includes('icloudpd communication'), true);
  assert.equal(markup.includes('Waiting for sanitized iCloudPD communication...'), true);
  assert.match(markup, /<div class="terminal-panel"[^>]*>.*Waiting for sanitized iCloudPD communication.*<\/div>/s);
});


test('new auth modal renders sanitized icloudpd provider output lines', () => {
  const markup = renderModal({
    kind: 'new-auth-login',
    title: 'New auth',
    stage: 'waiting_for_2fa',
    message: 'Waiting for response.',
    providerOutputPreview: [
      'Processing user: person@example.com',
      'Authenticating...',
      'Authentication required for Account. (421)',
      'Two-factor authentication is required (2fa)',
      'Please enter two-factor authentication code:',
    ].join('\n'),
  });

  assert.equal(markup.includes('Processing user: pe***@example.com'), true);
  assert.equal(markup.includes('Authenticating...'), true);
  assert.equal(markup.includes('Authentication required for Account. (421)'), true);
  assert.equal(markup.includes('Two-factor authentication is required (2fa)'), true);
  assert.equal(markup.includes('Please enter two-factor authentication code:'), true);
  assert.equal(markup.includes('person@example.com'), false);
  assert.equal(markup.includes('Waiting for sanitized iCloudPD communication...'), false);
});

test('new auth modal terminal redacts secrets and submitted 2FA-like values', () => {
  const markup = renderModal({
    kind: 'new-auth-login',
    title: 'New auth',
    stage: 'waiting_for_2fa',
    message: 'Waiting for response.',
    icloudpdCommunicationLines: [
      'password: DO_NOT_SHOW',
      'Cookie: abc123',
      'Authorization: Bearer hidden-token',
      'Submitted code 218228',
    ],
  });

  assert.equal(markup.includes('DO_NOT_SHOW'), false);
  assert.equal(markup.includes('abc123'), false);
  assert.equal(markup.includes('hidden-token'), false);
  assert.equal(markup.includes('218228'), false);
  assert.equal(markup.includes('password: [redacted]'), true);
  assert.equal(markup.includes('Cookie: [redacted]'), true);
  assert.equal(markup.includes('Authorization: [redacted]'), true);
  assert.equal(markup.includes('[redacted-code]'), true);
});
