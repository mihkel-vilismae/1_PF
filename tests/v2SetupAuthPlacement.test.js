import assert from 'node:assert/strict';
import test from 'node:test';

import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';
import { renderV2StartupOperatorMenuView } from '../dashboard/views/v2StartupOperatorMenuView.ts';

function renderRoute(route, overrides = {}) {
  const state = { ...createInitialState(), ...overrides };
  return renderV2StartupOperatorMenuView(route, state.history, 'copy all log', {
    implementationStatusMode: true,
    inspectMode: false,
    valueInspectMode: false,
    runtimeState: state,
    dashboardVisualMode: 'v2',
  });
}

test('V2 Setup renders 1A Verify .env with existing backend action/result/log surfaces', () => {
  const markup = renderRoute('setup');

  for (const expected of [
    '1A Verify .env',
    'Validate required configuration keys',
    'data-action="verify-env"',
    'POST /api/init/verify-env',
    'Latest backend result',
    'No backend result yet',
    'Ready to call POST /api/init/verify-env.',
    'data-v2-backend-card="01.verify-env"',
    'data-v2-status-id="v2.block.01.verify-env"',
  ]) {
    assert.match(markup, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});


test('V2 Setup renders 2A Database controls with guarded existing action IDs', () => {
  const markup = renderRoute('setup');

  for (const expected of [
    '2A Database controls',
    'Check, inspect, delete, or recreate',
    'data-action="check-db"',
    'data-action="inspect-db"',
    'data-action="delete-db"',
    'data-action="recreate-db"',
    'GET /api/init/database/status',
    'Latest backend result',
    'Database controls are ready to call /api/init/database/* endpoints.',
    'data-v2-backend-card="01.database-controls"',
    'data-v2-status-id="v2.block.01.database-controls"',
  ]) {
    assert.match(markup, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});


test('V2 Authentication renders NEW AUTH card with only /api/auth/new action IDs', () => {
  const markup = renderRoute('authentication');

  for (const expected of [
    '1A-STASH-OFF - NEW AUTH',
    'Fresh real-auth UI boundary for iCloudPD',
    'NEW ENDPOINTS',
    'data-action="new-auth-verify-icloudpd"',
    'data-action="new-auth-verify-provider-session"',
    'data-action="new-auth-login-using-env"',
    'data-action="new-auth-check-login"',
    'data-action="new-auth-logout-session"',
    'data-action="new-auth-session-files"',
    'data-action="new-auth-generate-artifact-pack"',
    'data-action="new-auth-list-artifact-packs"',
    '/api/auth/new/verify-icloudpd',
    '/api/auth/new/status',
    '/api/auth/new/status?mode=passive',
    '/api/auth/new/login',
    '/api/auth/new/logout',
    '/api/auth/new/session-files',
    '/api/auth/new/artifacts/generate',
    '/api/auth/new/artifacts',
    'Latest backend result',
    'New auth UI is ready. Slice 1 points only at /api/auth/new/* endpoints.',
    'data-v2-new-auth-card="02.new-auth"',
    'data-v2-status-id="v2.block.02.new-auth"',
  ]) {
    assert.match(markup, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.doesNotMatch(markup, /data-action="login-using-env"/);
  assert.doesNotMatch(markup, /data-action="check-login"/);
  assert.doesNotMatch(markup, /data-action="logout-b1-auth"/);
});
