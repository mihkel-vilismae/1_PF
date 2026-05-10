/*
 * Verifies dashboard button workflows from rendered controls to service calls.
 * The harness keeps runtime-truth state local so View B action wiring is focused.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { createRuntimeTruthBehavior } from '../dashboard/services/runtimeTruth/runtimeTruthBehavior.ts';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';
import { renderInitView } from '../dashboard/views/initView.ts';
import { renderTestView } from '../dashboard/views/testView.ts';
import {
  PLAYBACK_RENDERING_LIBRARY,
  PLAYBACK_RENDERING_MODES,
  PLAYBACK_RENDERING_PLATFORMS,
} from '../dashboard/services/playbackRenderer.ts';

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

    if (path === '/api/runtime/orchestration/run' && method === 'POST') {
      queuePrepared = true;
      return new Response(
        JSON.stringify({
          run_id: 7,
          status: 'SUCCEEDED',
          current_stage: 'playback_select',
          last_successful_stage: 'playback_select',
          started_at: '2026-04-23T09:59:00.000Z',
          finished_at: '2026-04-23T10:00:00.000Z',
          failed_stage: null,
          failure_reason: null,
          stage_order_executed: ['download', 'index', 'gps', 'geocode', 'queue_prepare', 'playback_select'],
          stage_results: {
            download: { messages: ['Mock download copied 1 file(s) from generated_test_data into the test download directory.'] },
            index: { indexing: { insertedCanonicalCount: 1 } },
            gps: { processed_count: 1, success_count: 1 },
            geocode: { processed_count: 1, success_count: 1 },
            queue_prepare: { queue: { insertedCount: 1 } },
            playback_select: {
              playback: {
                selected: {
                  mediaAssetId: 42,
                  canonicalPath: '/tmp/test-media/sample.jpg',
                  addressText: 'Tallinn, Harjumaa, Estonia',
                  selectedAt: '2026-04-23T10:00:00.000Z',
                },
              },
            },
          },
          selected_asset_summary: {
            mediaAssetId: 42,
            canonicalPath: '/tmp/test-media/sample.jpg',
            addressText: 'Tallinn, Harjumaa, Estonia',
            selectedAt: '2026-04-23T10:00:00.000Z',
          },
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
        { path: '/api/runtime/orchestration/run', method: 'POST' },
        { path: '/api/runtime/playback/select-current', method: 'POST' },
      ],
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test('View B renders pipeline maintenance buttons between toolbar and stage cards', () => {
  const markup = renderTestView(createInitialState());
  const toolbarIndex = markup.indexOf('class="toolbar-grid"');
  const maintenanceIndex = markup.indexOf('Pipeline maintenance');
  const stageStackIndex = markup.indexOf('class="stage-stack"');

  assert.ok(toolbarIndex >= 0, 'expected View B toolbar to render');
  assert.ok(maintenanceIndex > toolbarIndex, 'expected maintenance section after toolbar');
  assert.ok(stageStackIndex > maintenanceIndex, 'expected stage cards after maintenance section');
  assert.match(markup, /data-action="detect-pipeline-issues"/);
  assert.match(markup, /data-action="clear-stale-pipeline-locks"/);
});

test('pipeline maintenance actions call backend endpoints and sync returned lock truth', async () => {
  const originalFetch = global.fetch;
  const requests = [];

  global.fetch = async (path, init = {}) => {
    const method = init.method ?? 'GET';
    requests.push({ path, method });

    if (path === '/api/runtime/pipeline/issues/detect' && method === 'POST') {
      return new Response(
        JSON.stringify({
          status: 'warning',
          messages: ['Detected 1 stale pipeline lock issue(s).'],
          pipeline: {
            issueCount: 1,
            staleLockDetected: true,
            cleared: false,
          },
          truth: {
            pipelineActiveKey: 'B3.2',
            pipelineLockAcquiredAt: null,
            stageLock: 'Pipeline lock held by B3.2',
          },
          schemaVersion: 1,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    if (path === '/api/runtime/pipeline/stale-locks/clear' && method === 'POST') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          messages: ['Cleared 1 stale pipeline lock issue(s).'],
          pipeline: {
            issueCount: 1,
            staleLockDetected: true,
            cleared: true,
          },
          truth: {
            pipelineActiveKey: null,
            pipelineLockAcquiredAt: null,
            stageLock: 'Cleared stale pipeline lock held by B3.2',
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

    behavior.runAction('detect-pipeline-issues');
    await waitFor(() => harness.state.statusByKey['B3-DIAGNOSTICS'] === 'info');
    assert.equal(harness.state.truth.pipelineActiveKey, 'B3.2');
    assert.equal(harness.state.truth.stageLock, 'Pipeline lock held by B3.2');

    behavior.runAction('clear-stale-pipeline-locks');
    await waitFor(() => harness.state.statusByKey['B3-DIAGNOSTICS'] === 'success');
    assert.equal(harness.state.truth.pipelineActiveKey, null);
    assert.equal(harness.state.truth.stageLock, 'Cleared stale pipeline lock held by B3.2');

    assert.deepEqual(requests, [
      { path: '/api/runtime/pipeline/issues/detect', method: 'POST' },
      { path: '/api/runtime/pipeline/stale-locks/clear', method: 'POST' },
    ]);
  } finally {
    global.fetch = originalFetch;
  }
});

test('B3 auto surfaces backend orchestration failure without fabricated success', async () => {
  const originalFetch = global.fetch;
  const requests = [];

  global.fetch = async (path, init = {}) => {
    const method = init.method ?? 'GET';
    requests.push({ path, method });

    if (path === '/api/runtime/orchestration/run' && method === 'POST') {
      return new Response(
        JSON.stringify({
          run_id: 8,
          status: 'FAILED',
          current_stage: 'download',
          last_successful_stage: null,
          started_at: '2026-04-23T09:59:00.000Z',
          finished_at: '2026-04-23T10:00:00.000Z',
          failed_stage: 'download',
          failure_reason: 'mock_source_missing',
          stage_order_executed: ['download'],
          stage_results: {},
          selected_asset_summary: null,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    throw new Error(`Unexpected request: ${method} ${path}`);
  };

  try {
    const harness = createRuntimeTruthHarness();
    const behavior = createRuntimeTruthBehavior(harness.actions);

    behavior.runAction('run-b3-auto');
    await waitFor(() => harness.state.statusByKey.B3 === 'error');

    assert.deepEqual(requests, [{ path: '/api/runtime/orchestration/run', method: 'POST' }]);
    assert.equal(harness.state.logs.B3[0]?.type, 'error');
    assert.match(harness.state.logs.B3[0]?.message ?? '', /mock_source_missing/);
    assert.equal(harness.state.history[0]?.type, 'error');
  } finally {
    global.fetch = originalFetch;
  }
});

test('individual B3 stage buttons keep their existing backend endpoints', async () => {
  const originalFetch = global.fetch;
  const requests = [];

  global.fetch = async (path, init = {}) => {
    const method = init.method ?? 'GET';
    requests.push({ path, method });

    const responseByPath = {
      '/api/runtime/download/run': { status: 'ok', messages: ['Downloaded.'], download: { newMediaFiles: 1 } },
      '/api/runtime/index/run': { status: 'ok', messages: ['Indexed.'], indexing: { insertedCanonicalCount: 1 } },
      '/api/runtime/gps/run': { status: 'ok', messages: ['Parsed GPS.'], processed_count: 1 },
      '/api/runtime/geocode/run': { status: 'ok', messages: ['Geocoded with deterministic placeholder.'], processed_count: 1 },
      '/api/runtime/queue/prepare': { status: 'ok', message: 'Inserted 1 slideshow queue row.', queue: { insertedCount: 1 } },
    };

    if (method === 'POST' && responseByPath[path]) {
      return new Response(JSON.stringify(responseByPath[path]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    throw new Error(`Unexpected request: ${method} ${path}`);
  };

  try {
    const harness = createRuntimeTruthHarness();
    const behavior = createRuntimeTruthBehavior(harness.actions);

    for (const action of ['run-b3-1', 'run-b3-2', 'run-b3-3', 'run-b3-4', 'run-b3-5']) {
      behavior.runAction(action);
      await waitFor(() => harness.state.statusByKey.B3 !== 'running');
    }

    assert.deepEqual(
      requests.map(({ path, method }) => ({ path, method })),
      [
        { path: '/api/runtime/download/run', method: 'POST' },
        { path: '/api/runtime/index/run', method: 'POST' },
        { path: '/api/runtime/gps/run', method: 'POST' },
        { path: '/api/runtime/geocode/run', method: 'POST' },
        { path: '/api/runtime/queue/prepare', method: 'POST' },
      ],
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test('B5 screen simulation calls backend configure endpoint and uses returned simulation state', async () => {
  const originalFetch = global.fetch;
  const requests = [];

  global.fetch = async (path, init = {}) => {
    const method = init.method ?? 'GET';
    const body = init.body ? JSON.parse(String(init.body)) : null;
    requests.push({ path, method, body });

    if (path === '/api/runtime/screen-simulation/configure' && method === 'POST') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          simulationOnly: true,
          simulation: {
            pirEnabled: false,
            mouseEnabled: false,
            keyboardEnabled: false,
            simulateAllEnabled: false,
            inactivityTimeoutSeconds: 9,
          },
          screen: {
            screenState: 'OFF',
            lastActivitySource: 'No simulated activity sources enabled',
            inactivityTimeoutSeconds: 9,
            playbackStatus: 'Paused by backend screen simulation',
            lastCheckpoint: '2026-04-23T10:00:00.000Z backend screen-simulation checkpoint saved',
            updatedAt: '2026-04-23T10:00:00.000Z',
          },
          messages: ['Backend-owned screen simulation state updated.'],
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
    harness.state.simulation = {
      ...harness.state.simulation,
      pirEnabled: false,
      mouseEnabled: false,
      keyboardEnabled: false,
      simulateAllEnabled: false,
      inactivityTimeoutSeconds: 9,
    };

    behavior.runAction('configure-screen-simulation');
    await waitFor(() => harness.state.statusByKey.B5 === 'success');

    assert.equal(requests.length, 1);
    assert.equal(requests[0].path, '/api/runtime/screen-simulation/configure');
    assert.equal(requests[0].body.simulation.inactivityTimeoutSeconds, 9);
    assert.equal(harness.state.truth.screenState, 'OFF');
    assert.equal(harness.state.truth.lastActivitySource, 'No simulated activity sources enabled');
    assert.equal(harness.state.truth.inactivityTimeoutSeconds, 9);
    assert.equal(harness.state.truth.playbackStatus, 'Paused by backend screen simulation');
  } finally {
    global.fetch = originalFetch;
  }
});

test('B5 backend failure is surfaced as an error without changing screen truth', async () => {
  const originalFetch = global.fetch;

  global.fetch = async (path, init = {}) => {
    const method = init.method ?? 'GET';
    if (path === '/api/runtime/screen-simulation/configure' && method === 'POST') {
      return new Response(
        JSON.stringify({
          status: 'error',
          error: 'invalid_screen_simulation_timeout',
          message: 'Screen simulation inactivityTimeoutSeconds must be an integer from 1 to 60.',
          schemaVersion: 1,
        }),
        { status: 400, headers: { 'content-type': 'application/json' } },
      );
    }

    throw new Error(`Unexpected request: ${method} ${path}`);
  };

  try {
    const harness = createRuntimeTruthHarness();
    const behavior = createRuntimeTruthBehavior(harness.actions);
    const originalScreenState = harness.state.truth.screenState;

    harness.state.simulation.inactivityTimeoutSeconds = 99;
    behavior.runAction('configure-screen-simulation');
    await waitFor(() => harness.state.statusByKey.B5 === 'error');

    assert.equal(harness.state.truth.screenState, originalScreenState);
    assert.equal(harness.state.logs.B5[0]?.type, 'error');
    assert.match(harness.state.logs.B5[0]?.message ?? '', /inactivityTimeoutSeconds/);
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


test('B4 rendering controls render default mode, platform tabs, and disabled state before playback is ready', () => {
  const markup = renderTestView(createInitialState());

  assert.match(markup, /B4 rendering controls/);
  assert.match(markup, /Playback without rendering/);
  assert.match(markup, /Show real rendering in preview window/);
  assert.match(markup, /Switch to fullscreen/);
  assert.match(markup, /data-playback-rendering-platform="windows"/);
  assert.match(markup, /data-playback-rendering-platform="raspberry-os"/);
  assert.match(markup, /Raspberry OS \(disabled\)/);
  assert.equal(markup.includes('Run B4 successfully before changing rendering mode or target.'), true);
  assert.match(markup, new RegExp(`Shared renderer: ${PLAYBACK_RENDERING_LIBRARY.id}`));

  const noRenderingButton = markup.match(/<button[^>]*data-playback-rendering-mode="playback-without-rendering"[^>]*>/)?.[0] ?? '';
  const previewButton = markup.match(/<button[^>]*data-playback-rendering-mode="show-real-rendering-in-preview-window"[^>]*>/)?.[0] ?? '';
  const fullscreenButton = markup.match(/<button[^>]*data-playback-rendering-mode="switch-to-fullscreen"[^>]*>/)?.[0] ?? '';

  assert.match(noRenderingButton, /disabled/);
  assert.match(previewButton, /disabled/);
  assert.match(fullscreenButton, /disabled/);
});

test('B4 rendering controls stay disabled after failed playback selection', async () => {
  const originalFetch = global.fetch;
  global.fetch = async (path, init = {}) => {
    const method = init.method ?? 'GET';
    if (path === '/api/runtime/playback/select-current' && method === 'POST') {
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
    throw new Error(`Unexpected request: ${method} ${path}`);
  };

  try {
    const harness = createRuntimeTruthHarness();
    const behavior = createRuntimeTruthBehavior(harness.actions);

    behavior.runAction('run-b4');
    await waitFor(() => harness.state.statusByKey.B4 === 'error');

    const markup = renderTestView(harness.state);
    const previewButton = markup.match(/<button[^>]*data-playback-rendering-mode="show-real-rendering-in-preview-window"[^>]*>/)?.[0] ?? '';
    assert.match(previewButton, /disabled/);
  } finally {
    global.fetch = originalFetch;
  }
});

test('B4 rendering controls enable after successful playback selection and keep backend endpoint unchanged', async () => {
  const originalFetch = global.fetch;
  const requests = [];
  global.fetch = async (path, init = {}) => {
    const method = init.method ?? 'GET';
    requests.push({ path, method });
    if (path === '/api/runtime/playback/select-current' && method === 'POST') {
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

    behavior.runAction('run-b4');
    await waitFor(() => harness.state.statusByKey.B4 === 'success');

    const markup = renderTestView(harness.state);
    const previewButton = markup.match(/<button[^>]*data-playback-rendering-mode="show-real-rendering-in-preview-window"[^>]*>/)?.[0] ?? '';
    const fullscreenButton = markup.match(/<button[^>]*data-playback-rendering-mode="switch-to-fullscreen"[^>]*>/)?.[0] ?? '';
    const raspberryTab = markup.match(/<button[^>]*data-playback-rendering-platform="raspberry-os"[^>]*>/)?.[0] ?? '';

    assert.doesNotMatch(previewButton, /disabled/);
    assert.doesNotMatch(fullscreenButton, /disabled/);
    assert.match(raspberryTab, /disabled/);
    assert.equal(harness.state.playbackRendering.mode, PLAYBACK_RENDERING_MODES.withoutRendering);
    assert.equal(harness.state.playbackRendering.platform, PLAYBACK_RENDERING_PLATFORMS.windows);
    assert.deepEqual(requests, [{ path: '/api/runtime/playback/select-current', method: 'POST' }]);
  } finally {
    global.fetch = originalFetch;
  }
});


test('View B renders B2 real-download companion disabled until auth is verified', () => {
  const state = createInitialState();
  const markup = renderTestView(state);
  const realDownloadButton = markup.match(/<button[^>]*data-action="run-b2-real-download"[^>]*>/)?.[0] ?? '';

  assert.match(markup, /B2-REAL_DOWNLOAD/);
  assert.match(markup, /name="realDownloadRecentCount"/);
  assert.match(realDownloadButton, /disabled/);
  assert.match(markup, /Real download requires an authenticated iCloudPD session/);
});

test('B2 real-download action calls the dedicated route with selected batch size', async () => {
  const originalFetch = global.fetch;
  const requests = [];

  global.fetch = async (path, init = {}) => {
    const method = init.method ?? 'GET';
    const body = init.body ? JSON.parse(String(init.body)) : null;
    requests.push({ path, method, body });

    if (path === '/api/runtime/download/real-run' && method === 'POST') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          messages: ['Real iCloudPD download requested 10 recent file(s).'],
          download: { mode: 'icloudpd_real_download', requestedRecentCount: 10 },
          auth: { status: 'authenticated' },
          testDownload: { requestedRecentCount: 10, status: 'authenticated' },
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
    harness.state.authPreflight.publicState = { status: 'authenticated' };
    harness.state.simulation.realDownloadRecentCount = 10;

    behavior.runAction('run-b2-real-download');
    await waitFor(() => harness.state.statusByKey['B2-REAL_DOWNLOAD'] === 'success');

    assert.deepEqual(requests, [{ path: '/api/runtime/download/real-run', method: 'POST', body: { recentCount: 10 } }]);
    assert.match(harness.state.logs['B2-REAL_DOWNLOAD'][0]?.message ?? '', /Real iCloudPD download requested 10/);
  } finally {
    global.fetch = originalFetch;
  }
});
