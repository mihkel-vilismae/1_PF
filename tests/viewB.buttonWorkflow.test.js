import assert from 'node:assert/strict';
import test from 'node:test';

import { createRuntimeTruthBehavior } from '../dashboard/services/runtimeTruth/runtimeTruthBehavior.js';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.js';
import { renderInitView } from '../dashboard/views/initView.ts';

test('1A-AUTH verify and check login controls call backend-owned auth endpoints', async () => {
  const originalFetch = global.fetch;
  const requests = [];

  global.fetch = async (path, init = {}) => {
    const method = init.method ?? 'GET';
    requests.push({ path, method });

    if (path === '/api/auth/verify-icloudpd' && method === 'POST') {
      return new Response(
        JSON.stringify({
          status: 'error',
          readiness: {
            status: 'error',
            provider: 'icloud',
            icloudpdAvailable: false,
            hasRequiredConfig: true,
            missingRequiredKeys: [],
            executable: 'icloudpd',
            code: 'icloudpd_executable_unavailable',
            message: 'icloudpd executable is not available on PATH or could not be started.',
            next_action: 'install_or_configure_icloudpd',
            auth: {
              status: 'idle',
              has_required_files: false,
              requires_2fa: 'unknown',
              two_factor_status: 'not_started',
              two_factor_method: null,
              next_action: 'run_auth_preflight',
              attemptId: null,
              updatedAt: null,
              error: null,
              authenticatedUser: null,
              provider: 'icloud',
            },
          },
          auth: {
            status: 'idle',
            has_required_files: false,
            requires_2fa: 'unknown',
            two_factor_status: 'not_started',
            two_factor_method: null,
            next_action: 'run_auth_preflight',
            attemptId: null,
            updatedAt: null,
            error: null,
            authenticatedUser: null,
            provider: 'icloud',
          },
        }),
        { status: 400, headers: { 'content-type': 'application/json' } },
      );
    }

    if (path === '/api/auth/resume' && method === 'POST') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          auth: {
            status: 'unknown',
            has_required_files: false,
            requires_2fa: 'unknown',
            two_factor_status: 'unknown',
            two_factor_method: null,
            next_action: 'run_auth_preflight',
            attemptId: 'resume-attempt',
            updatedAt: '2026-04-26T00:30:00.000Z',
            error: { code: 'auth_resume_no_persisted_state', message: 'No persisted auth state was available to resume.' },
            authenticatedUser: null,
            provider: 'icloud',
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    throw new Error(`Unexpected request: ${method} ${path}`);
  };

  try {
    const harness = createRuntimeTruthHarness();
    const behavior = createRuntimeTruthBehavior(harness.actions);

    behavior.runAction('verify-icloudpd');
    await waitFor(() => harness.state.authPreflight.latestResult?.endpoint === '/api/auth/verify-icloudpd' && harness.state.statusByKey.B1 === 'error');
    assert.equal(harness.state.statusByKey.B1, 'error');
    assert.equal(harness.state.authPreflight.latestResult.payload.readiness.icloudpdAvailable, false);
    assert.equal(harness.state.authPreflight.publicState.status, 'idle');

    behavior.runAction('check-login');
    await waitFor(() => harness.state.authPreflight.latestResult?.endpoint === '/api/auth/resume' && harness.state.authPreflight.publicState?.status === 'unknown');
    assert.equal(harness.state.authPreflight.publicState.status, 'unknown');
    assert.equal(harness.state.authPreflight.publicState.authenticatedUser, null);

    assert.deepEqual(requests, [
      { path: '/api/auth/verify-icloudpd', method: 'POST' },
      { path: '/api/auth/resume', method: 'POST' },
    ]);
  } finally {
    global.fetch = originalFetch;
  }
});

test('B1 auth preflight now calls backend auth endpoints instead of frontend fake success timers', async () => {
  const originalFetch = global.fetch;
  const requests = [];

  global.fetch = async (path, init = {}) => {
    const method = init.method ?? 'GET';
    requests.push({ path, method });

    if (path === '/api/auth/status' && method === 'GET') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          auth: {
            status: 'idle',
            has_required_files: false,
            requires_2fa: 'unknown',
            two_factor_status: 'not_started',
            two_factor_method: null,
            next_action: 'run_auth_preflight',
            attemptId: null,
            updatedAt: null,
            error: null,
            authenticatedUser: null,
            provider: 'icloud',
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    if (path === '/api/auth/run' && method === 'POST') {
      return new Response(
        JSON.stringify({
          status: 'blocked',
          auth: {
            status: 'blocked',
            has_required_files: true,
            requires_2fa: 'unknown',
            two_factor_status: 'unknown',
            two_factor_method: null,
            next_action: 'provider_login_not_implemented',
            attemptId: 'attempt-123',
            updatedAt: '2026-04-24T13:00:00.000Z',
            error: {
              code: 'provider_login_not_implemented',
              message: 'Auth preflight passed, but real provider login is not implemented in this backend slice.',
            },
            authenticatedUser: null,
            provider: 'icloud',
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    throw new Error(`Unexpected request: ${method} ${path}`);
  };

  try {
    const harness = createRuntimeTruthHarness();
    const behavior = createRuntimeTruthBehavior(harness.actions);

    behavior.runAction('refresh-b1-auth-status');
    await waitFor(() => harness.state.authPreflight.loaded === true);

    behavior.runAction('run-b1');
    assert.equal(harness.state.statusByKey.B1, 'running');
    await waitFor(() => harness.state.statusByKey.B1 === 'info', 1500);

    assert.deepEqual(requests, [
      { path: '/api/auth/status', method: 'GET' },
      { path: '/api/auth/run', method: 'POST' },
    ]);
    assert.equal(harness.state.authPreflight.publicState.status, 'blocked');
    assert.equal(harness.state.authPreflight.publicState.next_action, 'provider_login_not_implemented');
    assert.equal(harness.state.loginSteps.find((step) => step.key === 'provider')?.status, 'active');
    assert.equal(harness.state.loginSteps.find((step) => step.key === '2fa')?.status, 'waiting');
    assert.equal(harness.state.logs.B1.some((entry) => entry.message.includes('2FA completed in placeholder mode')), false);
    assert.equal(harness.state.logs.B1.some((entry) => entry.message.includes('Primary credentials accepted')), false);
  } finally {
    global.fetch = originalFetch;
  }
});

test('B1 reset clears local attempt state through backend reset without claiming logout', async () => {
  const originalFetch = global.fetch;
  const requests = [];

  global.fetch = async (path, init = {}) => {
    const method = init.method ?? 'GET';
    requests.push({ path, method });

    if (path === '/api/auth/reset' && method === 'POST') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          resetType: 'local_auth_attempt_state_only',
          logoutPerformed: false,
          message: 'Cleared local auth preflight attempt state. Provider sessions are not invalidated by this slice.',
          auth: {
            status: 'idle',
            has_required_files: false,
            requires_2fa: 'unknown',
            two_factor_status: 'not_started',
            two_factor_method: null,
            next_action: 'run_auth_preflight',
            attemptId: null,
            updatedAt: '2026-04-24T13:00:00.000Z',
            error: null,
            authenticatedUser: null,
            provider: 'icloud',
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    throw new Error(`Unexpected request: ${method} ${path}`);
  };

  try {
    const harness = createRuntimeTruthHarness();
    const behavior = createRuntimeTruthBehavior(harness.actions);

    behavior.runAction('reset-b1-auth');
    await waitFor(() => harness.state.authPreflight.loaded === true);

    assert.deepEqual(requests, [{ path: '/api/auth/reset', method: 'POST' }]);
    assert.equal(harness.state.authPreflight.publicState.status, 'idle');
    assert.equal(harness.state.authPreflight.latestResult.payload.logoutPerformed, false);
    assert.equal(harness.state.authPreflight.latestResult.payload.resetType, 'local_auth_attempt_state_only');
  } finally {
    global.fetch = originalFetch;
  }
});

test('B1 single-file login test calls backend auth download endpoint', async () => {
  const originalFetch = global.fetch;
  const requests = [];

  global.fetch = async (path, init = {}) => {
    const method = init.method ?? 'GET';
    requests.push({ path, method });

    if (path === '/api/auth/test-login-download-one' && method === 'POST') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          message: 'Downloaded one recent iCloud item into runtime_data/tmp.',
          auth: {
            status: 'authenticated',
            has_required_files: true,
            requires_2fa: false,
            two_factor_status: 'complete',
            two_factor_method: null,
            next_action: 'auth_ready',
            attemptId: 'attempt-download-one',
            updatedAt: '2026-04-24T13:10:00.000Z',
            error: null,
            authenticatedUser: 'op***@example.com',
            provider: 'icloud',
          },
          testDownload: {
            downloadDirectory: 'runtime_data/tmp',
            requestedRecentCount: 1,
            status: 'authenticated',
            code: 'icloudpd_authenticated',
            message: 'Downloaded one recent item.',
            next_action: null,
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    throw new Error(`Unexpected request: ${method} ${path}`);
  };

  try {
    const harness = createRuntimeTruthHarness();
    const behavior = createRuntimeTruthBehavior(harness.actions);

    behavior.runAction('test-b1-login-download-one');
    await waitFor(() => harness.state.statusByKey.B1 === 'success');

    assert.deepEqual(requests, [{ path: '/api/auth/test-login-download-one', method: 'POST' }]);
    assert.equal(harness.state.authPreflight.publicState.status, 'authenticated');
    assert.equal(harness.state.authPreflight.latestResult.payload.testDownload.requestedRecentCount, 1);
    assert.equal(harness.state.logs.B1[0]?.message.includes('Downloaded one recent iCloud item'), true);
  } finally {
    global.fetch = originalFetch;
  }
});

test('B1 render uses safe backend auth projection and does not render secret-like fields', () => {
  const state = createInitialState();
  state.authPreflight.loaded = true;
  state.authPreflight.publicState = {
    status: 'blocked',
    has_required_files: true,
    requires_2fa: 'unknown',
    two_factor_status: 'unknown',
    two_factor_method: null,
    next_action: 'provider_login_not_implemented',
    attemptId: 'attempt-123',
    updatedAt: '2026-04-24T13:00:00.000Z',
    error: { code: 'provider_login_not_implemented', message: 'Real provider login is not implemented.' },
    authenticatedUser: null,
    provider: 'icloud',
  };
  state.authPreflight.latestResult = {
    operation: 'Run auth preflight',
    method: 'POST',
    endpoint: '/api/auth/run',
    outcome: 'success',
    message: 'Real provider login is not implemented.',
    receivedAt: '24.04.2026, 16:00:00',
    payload: {
      status: 'blocked',
      auth: state.authPreflight.publicState,
    },
  };

  const markup = renderInitView(state);

  assert.equal(markup.includes('/api/auth/run'), true);
  assert.equal(markup.includes('provider_login_not_implemented'), true);
  assert.equal(markup.includes('password'), false);
  assert.equal(markup.includes('token'), false);
  assert.equal(markup.includes('cookie'), false);
  assert.equal(markup.includes('raw 2FA'), false);
});

test('B2, B3 auto, and B4 actions call backend endpoints and update runtime truth state', async () => {
  const originalFetch = global.fetch;
  const requests = [];
  let queuePrepared = false;

  global.fetch = async (path, init = {}) => {
    const method = init.method ?? 'GET';
    requests.push({ path, method });

    if (path === '/api/runtime/download/run' && method === 'POST') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          messages: ['Mock download copied 1 file(s) from generated_test_data into the test download directory.'],
          download: { newMediaFiles: 1 },
          schemaVersion: 1,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    if (path === '/api/runtime/index/run' && method === 'POST') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          messages: ['Indexed 1 media file(s); inserted 1 canonical row(s).'],
          indexing: { insertedCanonicalCount: 1 },
          schemaVersion: 1,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    if (path === '/api/runtime/gps/run' && method === 'POST') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          messages: ['GPS parsing processed 1 queued asset(s): 1 success, 0 without GPS.'],
          processed_count: 1,
          success_count: 1,
          failure_count: 0,
          schemaVersion: 1,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    if (path === '/api/runtime/geocode/run' && method === 'POST') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          messages: ['Geocoding processed 1 queued asset(s): 1 success, 0 failed using the deterministic placeholder geocoder (not production).'],
          processed_count: 1,
          success_count: 1,
          failure_count: 0,
          schemaVersion: 1,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    if (path === '/api/runtime/queue/prepare' && method === 'POST') {
      queuePrepared = true;
      return new Response(
        JSON.stringify({
          inserted_count: 1,
          skipped_count: 0,
          inserted_ids: [42],
          skipped: [],
          message: 'Inserted 1 slideshow queue row.',
          queue: { insertedCount: 1 },
          schemaVersion: 1,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    if (path === '/api/runtime/playback/select-current' && method === 'POST') {
      if (!queuePrepared) {
        return new Response(
          JSON.stringify({
            status: 'error',
            error: 'no_ready_row',
            message: 'No READY slideshow rows exist for playback selection.',
            schemaVersion: 1,
          }),
          { status: 409, headers: { 'content-type': 'application/json' } },
        );
      }

      return new Response(
        JSON.stringify({
          status: 'ok',
          messages: ['Selected media asset 42 as the current playback item.'],
          playback: {
            selected: {
              mediaAssetId: 42,
              canonicalPath: '/tmp/test-media/sample.jpg',
              addressText: 'Tallinn, Harjumaa, Estonia',
              selectedAt: '2026-04-23T10:00:00.000Z',
            },
            failedCandidateCount: 0,
          },
          schemaVersion: 1,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    throw new Error(`Unexpected request: ${method} ${path}`);
  };

  try {
    const harness = createRuntimeTruthHarness();
    const behavior = createRuntimeTruthBehavior(harness.actions);

    behavior.runAction('run-b2');
    await waitFor(() => harness.state.statusByKey.B2 === 'success');
    assert.equal(harness.state.logs.B2[0]?.message.includes('Mock download copied 1 file(s)'), true);

    behavior.runAction('run-b3-auto');
    await waitFor(() => harness.state.statusByKey.B3 === 'success');
    assert.equal(harness.state.truth.lastStageCompleted, 'B3.5');

    behavior.runAction('run-b4');
    await waitFor(() => harness.state.statusByKey.B4 === 'success');
    assert.equal(harness.state.truth.currentMedia?.name, 'sample.jpg');
    assert.equal(harness.state.truth.currentMedia?.type, 'Image');
    assert.equal(harness.state.truth.currentMedia?.overlay, 'Tallinn, Harjumaa, Estonia');
    assert.deepEqual(
      requests.map(({ path, method }) => ({ path, method })),
      [
        { path: '/api/runtime/download/run', method: 'POST' },
        { path: '/api/runtime/download/run', method: 'POST' },
        { path: '/api/runtime/index/run', method: 'POST' },
        { path: '/api/runtime/gps/run', method: 'POST' },
        { path: '/api/runtime/geocode/run', method: 'POST' },
        { path: '/api/runtime/queue/prepare', method: 'POST' },
        { path: '/api/runtime/playback/select-current', method: 'POST' },
      ],
    );
  } finally {
    global.fetch = originalFetch;
  }
});

function createRuntimeTruthHarness() {
  const state = createInitialState();
  const fixedIso = '2026-04-23T10:00:00.000Z';
  const fixedTallinn = '23.04.2026, 13:00:00';
  const stamp = () => '13:00:00';

  const patchState = (mutate) => {
    mutate(state);
  };

  const pushHistory = (source, type, message, details = null) => {
    state.history.unshift({
      id: `history-${state.history.length + 1}`,
      at: stamp(),
      atIso: fixedIso,
      atTallinn: fixedTallinn,
      source,
      type,
      message,
      details,
    });
  };

  const pushLog = (key, type, message, details = null) => {
    state.logs[key] ??= [];
    state.logs[key].unshift({
      at: stamp(),
      atIso: fixedIso,
      atTallinn: fixedTallinn,
      type,
      message,
      details,
    });
  };

  const setStatus = (key, status) => {
    state.statusByKey[key] = status;
  };

  return {
    state,
    actions: {
      getState: () => state,
      patchState,
      pushHistory,
      pushLog,
      setStatus,
      stamp,
    },
  };
}

async function waitFor(predicate, timeoutMs = 1200) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Timed out while waiting for View B action to finish.');
}
