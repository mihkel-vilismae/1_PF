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
