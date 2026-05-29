/*
 * Verifies the NEW AUTH provider-verification UX reconciliation flow.
 * These tests keep passive status read-only while proving the active iCloudPD
 * verification action uses the shared API/transit path and safe UI copy.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { renderInitView } from '../dashboard/views/initView.ts';
import { subscribeTransit } from '../dashboard/services/apiClient.ts';
import { createRuntimeTruthBehavior } from '../dashboard/services/runtimeTruth/runtimeTruthBehavior.ts';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';

// Waits for the async runtime-truth action fire-and-forget wrapper to finish its first request cycle.
function flushActionQueue() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// Builds a runtime-truth behavior harness with injectable fetch behavior and captured side effects.
function createNewAuthHarness(fetchHandler) {
  let state = createInitialState();
  const history = [];
  const logs = [];
  const requests = [];
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url, method: init.method ?? 'GET', body: init.body ?? null });
    return fetchHandler(url, init);
  };

  const behavior = createRuntimeTruthBehavior({
    getState: () => state,
    patchState: (mutator) => {
      const nextState = structuredClone(state);
      mutator(nextState);
      state = nextState;
    },
    pushHistory: (...args) => history.push(args),
    pushLog: (...args) => logs.push(args),
    setStatus: (key, status) => {
      state.statusByKey[key] = status;
    },
    stamp: () => '12:00:00',
  });

  return {
    behavior,
    history,
    logs,
    requests,
    restore: () => {
      globalThis.fetch = originalFetch;
    },
    getState: () => state,
  };
}

// Returns the passive skipped-proof payload used when local session files exist but proof was not run.
function createPassiveProofSkippedPayload() {
  return {
    ok: false,
    state: 'unverified',
    errorCode: 'NEW_AUTH_PROVIDER_PROOF_SKIPPED',
    message: 'Local session files exist, but passive status check did not start provider proof.',
    details: {
      provider: 'icloudpd',
      envPresence: {
        user: true,
        pw: true,
      },
      providerProof: {
        attempted: false,
        verified: false,
        reasonCode: 'NEW_AUTH_PROVIDER_PROOF_SKIPPED',
        message: 'Local session files exist, but passive status check did not start provider proof.',
        providerOutputShown: 'none',
      },
    },
  };
}

// Verifies the passive skipped-proof result renders as a clear, actionable state.
test('NEW AUTH passive skipped proof renders actionable verification copy and button', async () => {
  const harness = createNewAuthHarness(async () => new Response(JSON.stringify(createPassiveProofSkippedPayload()), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  }));

  try {
    harness.behavior.runAction('new-auth-check-login');
    await flushActionQueue();

    const markup = renderInitView(harness.getState());

    assert.equal(harness.requests[0].url, '/api/auth/new/status?mode=passive');
    assert.equal(markup.includes('Session files found, provider verification not run yet.'), true);
    assert.equal(markup.includes('Local iCloudPD session files exist, but passive status did not contact iCloudPD.'), true);
    assert.equal(markup.includes('data-action="new-auth-verify-provider-session"'), true);
    assert.equal(markup.includes('Verify with iCloudPD'), true);
    assert.equal(markup.includes('data-auth-button-status="blocked"'), true);
  } finally {
    harness.restore();
  }
});

// Verifies Test Mode keeps the NEW AUTH section visible but disables real login controls.
test('NEW AUTH card is visible and disabled in Test Mode', () => {
  const markup = renderInitView(createInitialState(), 'test');

  assert.equal(markup.includes('data-new-auth-card="1A-STASH-OFF"'), true);
  assert.equal(markup.includes('data-new-auth-disabled="test-mode"'), true);
  assert.equal(markup.includes('NEW AUTH login is disabled in Test Mode'), true);
  assert.equal(markup.includes('data-action="new-auth-login-using-env"'), true);
  assert.match(markup, /data-action="new-auth-login-using-env"[^>]*disabled/);
  assert.equal(markup.includes('data-disabled-reason="test-mode-new-auth-login-disabled"'), true);
});

// Verifies Real Mode preserves the NEW AUTH controls as active buttons.
test('NEW AUTH card remains active in Real Mode', () => {
  const markup = renderInitView(createInitialState(), 'real');

  assert.equal(markup.includes('data-new-auth-card="1A-STASH-OFF"'), true);
  assert.equal(markup.includes('data-new-auth-disabled="test-mode"'), false);
  assert.doesNotMatch(markup, /data-action="new-auth-login-using-env"[^>]*disabled/);
});

// Verifies the active provider-proof button uses the non-passive status path through transit logging.
test('NEW AUTH active provider verification uses shared transit logging and non-passive status path', async () => {
  const transitRecords = [];
  const unsubscribe = subscribeTransit((record) => transitRecords.push(record));
  const harness = createNewAuthHarness(async () => new Response(JSON.stringify({
    ok: true,
    state: 'authenticated',
    message: 'Existing iCloudPD session was verified by active provider proof.',
    details: {
      provider: 'icloudpd',
      providerProof: {
        attempted: true,
        verified: true,
        providerOutputShown: 'safe_summary',
      },
    },
  }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

  try {
    harness.behavior.runAction('new-auth-verify-provider-session');
    await flushActionQueue();

    assert.deepEqual(harness.requests.map((request) => `${request.method} ${request.url}`), [
      'GET /api/auth/new/status',
    ]);
    assert.equal(harness.requests.some((request) => request.url === '/api/auth/new/status?mode=passive'), false);
    assert.equal(transitRecords.length, 2);
    assert.equal(transitRecords[0].direction, 'outbound');
    assert.equal(transitRecords[0].path, '/api/auth/new/status');
    assert.equal(transitRecords[1].direction, 'inbound');
    assert.equal(transitRecords[1].path, '/api/auth/new/status');
    assert.equal(harness.history.at(-1)?.[3]?.endpoint, 'GET /api/auth/new/status');
  } finally {
    unsubscribe();
    harness.restore();
  }
});

// Verifies passive login checks stay passive and do not report attempted provider proof.
test('NEW AUTH passive check does not start provider proof when proof is skipped', async () => {
  const harness = createNewAuthHarness(async () => new Response(JSON.stringify(createPassiveProofSkippedPayload()), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  }));

  try {
    harness.behavior.runAction('new-auth-check-login');
    await flushActionQueue();

    const latestPayload = harness.getState().newAuth.latestResult.payload;

    assert.equal(harness.requests.length, 1);
    assert.equal(harness.requests[0].url, '/api/auth/new/status?mode=passive');
    assert.equal(latestPayload.details.providerProof.attempted, false);
    assert.equal(latestPayload.details.providerProof.verified, false);
    assert.equal(harness.getState().newAuth.buttonStates['new-auth-check-login'].status, 'blocked');
    assert.equal(harness.getState().newAuth.buttonStates['new-auth-verify-provider-session'].status, 'neutral');
  } finally {
    harness.restore();
  }
});

// Verifies displayed iCloudPD communication remains redacted after active provider verification.
test('NEW AUTH provider communication remains redacted in modal and history', async () => {
  const harness = createNewAuthHarness(async () => new Response(JSON.stringify({
    ok: true,
    state: 'pending_2fa',
    message: 'Provider requires 2FA.',
    details: {
      twoFactorPromptKind: 'verification_code',
      requestedInput: 'Six-digit verification code',
      providerOutputPreview: [
        'Processing user: person@example.com',
        'password=apple-secret-password',
        'Cookie: raw-session-cookie',
        'Please enter code 123456',
      ].join('\n'),
    },
  }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

  try {
    harness.behavior.runAction('new-auth-login-using-env');
    await flushActionQueue();

    const serializedState = JSON.stringify(harness.getState());
    const serializedHistory = JSON.stringify(harness.history);
    const serializedLogs = JSON.stringify(harness.logs);

    assert.equal(harness.getState().modal.providerOutputPreview.includes('pe***@example.com'), true);
    assert.equal(serializedState.includes('person@example.com'), false);
    assert.equal(serializedState.includes('apple-secret-password'), false);
    assert.equal(serializedState.includes('raw-session-cookie'), false);
    assert.equal(serializedState.includes('123456'), false);
    assert.equal(serializedHistory.includes('apple-secret-password'), false);
    assert.equal(serializedLogs.includes('raw-session-cookie'), false);
  } finally {
    harness.restore();
  }
});
