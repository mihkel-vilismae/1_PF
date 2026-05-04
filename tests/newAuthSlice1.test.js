import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('Slice 1 NEW AUTH card renders required controls and modal input', () => {
  const initView = read('dashboard/views/initView.ts');
  const app = read('dashboard/app.ts');
  const renderers = read('dashboard/services/renderers.ts');

  assert.match(initView, /1A-STASH-OFF/);
  for (const label of [
    'Verify iCloudPD',
    'Login using .env values',
    'Check login',
    'Log out and remove existing session',
    'Show auth/session paths and files',
  ]) {
    assert.match(initView, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(initView, /auth-button-status-dot/);
  assert.match(initView, /new-auth-action-row__status/);
  assert.match(renderers, /data-new-auth-2fa-code/);
  assert.match(renderers, /new-auth-submit-2fa/);
  assert.match(renderers, /Requested input/);
  assert.match(renderers, /2FA code or device index/);
  assert.match(renderers, /Enter device index, for example a/);
  assert.match(renderers, /Enter SMS six-digit code/);
  assert.match(app, /data-new-auth-2fa-code/);
});

test('Slice 1 NEW AUTH frontend helpers target only new endpoints', () => {
  const service = read('dashboard/services/newAuthService.ts');
  const requiredEndpoints = [
    '/api/auth/new/status',
    '/api/auth/new/verify-icloudpd',
    '/api/auth/new/login',
    '/api/auth/new/submit-2fa',
    '/api/auth/new/logout',
    '/api/auth/new/session-files',
  ];

  for (const endpoint of requiredEndpoints) {
    assert.match(service, new RegExp(endpoint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.doesNotMatch(service, /\/api\/auth\/(status|verify-icloudpd|run|resume|logout|2fa\/submit)/);
});
