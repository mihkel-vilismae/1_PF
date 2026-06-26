import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { createRuntimeTruthBehavior } from '../dashboard/services/runtimeTruth/runtimeTruthBehavior.ts';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';
import { renderV2StartupOperatorMenuView } from '../dashboard/views/v2StartupOperatorMenuView.ts';

function esc(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function render(route, state = createInitialState()) {
  return renderV2StartupOperatorMenuView(route, state.history, 'copy all log', {
    runtimeState: state,
    dashboardVisualMode: 'v2',
    implementationStatusMode: true,
  });
}

const CONTROL_MATRIX = [
  { route: 'setup', label: '1A Verify .env', action: 'verify-env', endpoint: 'POST /api/init/verify-env' },
  { route: 'setup', label: 'Check DB', action: 'check-db', endpoint: 'GET /api/init/database/status' },
  { route: 'setup', label: 'Inspect DB', action: 'inspect-db', endpoint: '/api/init/database/*' },
  { route: 'setup', label: 'Delete DB', action: 'delete-db', endpoint: '/api/init/database/*' },
  { route: 'setup', label: 'Recreate DB', action: 'recreate-db', endpoint: '/api/init/database/*' },
  { route: 'authentication', label: 'Verify iCloudPD install', action: 'new-auth-verify-icloudpd', endpoint: '/api/auth/new/verify-icloudpd' },
  { route: 'authentication', label: 'Login using .env values', action: 'new-auth-login-using-env', endpoint: '/api/auth/new/login' },
  { route: 'startup', label: 'Check emulator scheduler', action: 'check-emulator-scheduler', endpoint: 'raspberry-real-crontab' },
  { route: 'startup', label: 'Install crontab', action: 'install-crontab', endpoint: 'raspberry-real-crontab' },
  { route: 'workers', label: 'B3.1 Download', action: 'run-b3-1', endpoint: 'POST /api/runtime/download/run' },
  { route: 'workers', label: 'B3.2 Index', action: 'run-b3-2', endpoint: 'POST /api/runtime/index/run' },
  { route: 'workers', label: 'B3.3 Parse GPS', action: 'run-b3-3', endpoint: 'POST /api/runtime/gps/run' },
  { route: 'workers', label: 'B3.4 Geocode', action: 'run-b3-4', endpoint: 'POST /api/runtime/geocode/run' },
  { route: 'workers', label: 'B3.5 Enqueue playback', action: 'run-b3-5', endpoint: 'POST /api/runtime/queue/prepare' },
  { route: 'troubleshooting', label: 'Detect issues in pipeline', action: 'detect-pipeline-issues', endpoint: 'PIPELINE MAINTENANCE' },
  { route: 'troubleshooting', label: 'Clear stale locks', action: 'clear-stale-pipeline-locks', endpoint: 'PIPELINE MAINTENANCE' },
  { route: 'recovery', label: 'SAVE STATE', action: 'v2-recovery-save-state', endpoint: '/api/runtime/recovery/state/save' },
  { route: 'recovery', label: 'LOAD STATE', action: 'v2-recovery-load-state', endpoint: '/api/runtime/recovery/state/load' },
  { route: 'recovery', label: 'EMULATE POWER OFF', action: 'v2-recovery-emulate-power-off', endpoint: '/api/runtime/recovery/state/save' },
];

test('B9.2 V2 button/action proof matrix stays visible in the rendered pages', () => {
  for (const row of CONTROL_MATRIX) {
    const markup = render(row.route);
    assert.match(markup, new RegExp(esc(row.label)), `missing label ${row.label}`);
    assert.match(markup, new RegExp(`data-action="${esc(row.action)}"`), `missing action ${row.action}`);
    if (row.endpoint.startsWith('/api/runtime/recovery/')) {
      assert.match(markup, /Recovery endpoints store same media\/queue context only|Latest backend result/, `missing recovery endpoint/result boundary ${row.endpoint}`);
    } else if (row.endpoint !== 'alert-only') {
      assert.match(markup, new RegExp(esc(row.endpoint)), `missing endpoint/target text ${row.endpoint}`);
    }
  }
});

test('B9.2 proof matrix document records V2 control action IDs and endpoint boundaries', () => {
  const doc = readFileSync('docs/50_audits_and_migrations/V2_ButtonActionProofMatrix.md', 'utf8');
  for (const row of CONTROL_MATRIX) {
    assert.match(doc, new RegExp(esc(row.label)), `matrix doc missing ${row.label}`);
    assert.match(doc, new RegExp(esc(row.action)), `matrix doc missing ${row.action}`);
  }
  assert.match(doc, /\/api\/auth\/new\/\*/);
  assert.match(doc, /Browser alert only|recovery\/state\/save/);
  assert.match(doc, /hardware crontab proof remains separate/i);
});

test('B9.2 V2 worker cards render graceful success and error result surfaces', async () => {
  const originalFetch = global.fetch;
  const requests = [];
  global.fetch = async (path, init = {}) => {
    requests.push({ path, method: init.method ?? 'GET' });
    if (path === '/api/runtime/download/run') {
      return new Response(JSON.stringify({
        status: 'ok',
        messages: ['Download stage proof completed.'],
        download: { newMediaFiles: 1 },
        schemaVersion: 1,
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    if (path === '/api/runtime/index/run') {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Index proof failed without crashing the V2 card.',
        schemaVersion: 1,
      }), { status: 500, headers: { 'content-type': 'application/json' } });
    }
    throw new Error(`Unexpected request ${path}`);
  };

  try {
    const harness = createRuntimeTruthHarness();
    harness.behavior.runAction('run-b3-1');
    await waitFor(() => harness.state.statusByKey['B3.1'] === 'success');
    harness.behavior.runAction('run-b3-2');
    await waitFor(() => harness.state.statusByKey['B3.2'] === 'error');

    assert.deepEqual(requests, [
      { path: '/api/runtime/download/run', method: 'POST' },
      { path: '/api/runtime/index/run', method: 'POST' },
    ]);

    const markup = render('workers', harness.state);
    assert.match(markup, /Download stage proof completed\./);
    assert.match(markup, /Success/);
    assert.match(markup, /Index proof failed without crashing the V2 card\./);
    assert.match(markup, /Error/);
    assert.match(markup, /Error payload/);
  } finally {
    global.fetch = originalFetch;
  }
});

function createRuntimeTruthHarness() {
  const state = createInitialState();
  const stamp = () => '16:40:00';
  const fixedIso = '2026-06-26T13:40:00.000Z';
  const fixedTallinn = '26.06.2026, 16:40:00';
  const patchState = (mutate) => mutate(state);
  const pushHistory = (source, type, message, details = null) => {
    state.history.unshift({ id: `history-${state.history.length + 1}`, at: stamp(), atIso: fixedIso, atTallinn: fixedTallinn, source, type, message, details });
  };
  const pushLog = (key, type, message, details = null) => {
    state.logs[key] ??= [];
    state.logs[key].unshift({ at: stamp(), atIso: fixedIso, atTallinn: fixedTallinn, type, message, details });
  };
  const setStatus = (key, status) => {
    state.statusByKey[key] = status;
  };
  return {
    state,
    behavior: createRuntimeTruthBehavior({ getState: () => state, patchState, pushHistory, pushLog, setStatus, stamp }),
  };
}

async function waitFor(predicate, timeoutMs = 1000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Timed out while waiting for V2 action proof.');
}
