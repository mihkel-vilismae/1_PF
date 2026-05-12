/*
 * Verifies dashboard runtime-truth behavior for NEW AUTH actions, including
 * safe request metadata, button status updates, and passive check-login wiring.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { createRuntimeTruthBehavior } from '../dashboard/services/runtimeTruth/runtimeTruthBehavior.ts';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';

test('runtime truth new auth login opens modal, updates button state, and records safe metadata', async () => {
  let state = createInitialState();
  const history = [];
  const logs = [];
  const requests = [];
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url, method: init.method, body: init.body });
    return new Response(JSON.stringify({
      ok: true,
      state: 'pending_2fa',
      message: 'Device index required.',
      details: {
        twoFactorPromptKind: 'device_index',
        requestedInput: 'Trusted-device index, such as "a"',
        providerOutputPreview: [
          'Processing user: person@example.com',
          'Authenticating...',
          'Authentication required for Account. (421)',
          'Two-factor authentication is required (2fa)',
          'Please enter two-factor authentication code:',
        ].join('\n'),
      },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
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

  try {
    behavior.runAction('new-auth-login-using-env');
    assert.equal(state.modal?.kind, 'new-auth-login');
    assert.equal(state.newAuth.buttonStates['new-auth-login-using-env'].status, 'running');
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, '/api/auth/new/login');
    assert.equal(requests[0].method, 'POST');
    assert.equal(state.newAuth.buttonStates['new-auth-login-using-env'].status, 'pending');
    assert.equal(state.modal?.twoFactorPromptKind, 'device_index');
    assert.equal(state.modal?.providerOutputPreview.includes('Processing user: pe***@example.com'), true);
    assert.equal(state.modal?.providerOutputPreview.includes('person@example.com'), false);
    assert.equal(state.modal?.providerOutputPreview.includes('Please enter two-factor authentication code:'), true);

    const details = history.at(-1)?.[3];
    assert.equal(details.endpoint, 'POST /api/auth/new/login');
    assert.equal(details.request.body, null);
    assert.equal(details.response.body.details.twoFactorPromptKind, 'device_index');
    assert.equal(JSON.stringify(logs).includes('Trusted-device index'), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('runtime truth new auth history stores request/response metadata without submitted 2FA value', async () => {
  let state = createInitialState();
  const history = [];
  const logs = [];
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (url, init = {}) => new Response(JSON.stringify({
    ok: true,
    state: 'pending_2fa',
    message: 'Prompt received.',
    details: {
      twoFactorPromptKind: 'verification_code',
      requestedInput: 'Six-digit verification code',
    },
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  const behavior = createRuntimeTruthBehavior({
    getState: () => state,
    patchState: (mutator) => {
      const nextState = structuredClone(state);
      mutator(nextState);
      state = nextState;
    },
    pushHistory: (...args) => history.push(args),
    pushLog: (...args) => logs.push(args),
    setStatus: () => {},
    stamp: () => '12:00:00',
  });

  try {
    behavior.runAction('new-auth-submit-2fa', { code: '218228' });
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.ok(history.length > 0);
    const details = history.at(-1)?.[3];
    assert.equal(details.endpoint, 'POST /api/auth/new/submit-2fa');
    assert.equal(details.request.body.code, undefined);
    assert.equal(JSON.stringify(details).includes('218228'), false);
    assert.equal(details.response.body.details.twoFactorPromptKind, 'verification_code');

    const serializedLogs = JSON.stringify(logs);
    assert.equal(serializedLogs.includes('218228'), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// Ensures the Check login button remains passive while mapping skipped proof to an actionable UI state.
test('runtime truth new auth check-login maps provider-proof skipped to blocked actionable state', async () => {
  let state = createInitialState();
  const originalFetch = globalThis.fetch;
  const requests = [];

  globalThis.fetch = async (url) => {
    requests.push(url);
    return new Response(JSON.stringify({
      ok: false,
      state: 'unverified',
      errorCode: 'NEW_AUTH_PROVIDER_PROOF_SKIPPED',
      message: 'Local session files exist, but passive status check did not start provider proof.',
      details: {
        provider: 'icloudpd',
        providerProof: {
          verified: false,
          attempted: false,
          reasonCode: 'NEW_AUTH_PROVIDER_PROOF_SKIPPED',
        },
      },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const behavior = createRuntimeTruthBehavior({
    getState: () => state,
    patchState: (mutator) => {
      const nextState = structuredClone(state);
      mutator(nextState);
      state = nextState;
    },
    pushHistory: () => {},
    pushLog: () => {},
    setStatus: (key, status) => {
      state.statusByKey[key] = status;
    },
    stamp: () => '12:00:00',
  });

  try {
    behavior.runAction('new-auth-check-login');
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(requests[0], '/api/auth/new/status?mode=passive');
    assert.equal(state.newAuth.buttonStates['new-auth-check-login'].status, 'blocked');
    assert.equal(state.newAuth.buttonStates['new-auth-login-using-env'].status, 'blocked');
    assert.match(state.newAuth.buttonStates['new-auth-check-login'].message, /Session files found, provider verification not run yet\./);
    assert.match(state.newAuth.buttonStates['new-auth-check-login'].message, /passive status did not contact iCloudPD/);
    assert.equal(state.statusByKey['1A-STASH-OFF'], 'info');
  } finally {
    globalThis.fetch = originalFetch;
  }
});


// Ensures the provider verification action uses active proof, not passive status.
test('runtime truth new auth verify-with-icloudpd calls active provider proof status path', async () => {
  let state = createInitialState();
  const originalFetch = globalThis.fetch;
  const requests = [];
  const history = [];

  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url, method: init.method ?? 'GET' });
    return new Response(JSON.stringify({
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
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const behavior = createRuntimeTruthBehavior({
    getState: () => state,
    patchState: (mutator) => {
      const nextState = structuredClone(state);
      mutator(nextState);
      state = nextState;
    },
    pushHistory: (...args) => history.push(args),
    pushLog: () => {},
    setStatus: (key, status) => {
      state.statusByKey[key] = status;
    },
    stamp: () => '12:00:00',
  });

  try {
    behavior.runAction('new-auth-verify-provider-session');
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, '/api/auth/new/status');
    assert.equal(requests[0].method, 'GET');
    assert.notEqual(requests[0].url, '/api/auth/new/status?mode=passive');
    assert.equal(state.newAuth.buttonStates['new-auth-verify-provider-session'].status, 'success');
    assert.equal(state.newAuth.buttonStates['new-auth-check-login'].status, 'success');
    assert.equal(history.at(-1)?.[3]?.endpoint, 'GET /api/auth/new/status');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('runtime truth new auth logout clears stale login and check-login button states', async () => {
  let state = createInitialState();
  const originalFetch = globalThis.fetch;

  state.newAuth.buttonStates['new-auth-login-using-env'] = {
    status: 'success',
    message: 'Stale authenticated success.',
    updatedAt: '11:59:00',
    endpoint: 'POST /api/auth/new/login',
  };
  state.newAuth.buttonStates['new-auth-check-login'] = {
    status: 'success',
    message: 'Stale authenticated status.',
    updatedAt: '11:59:01',
    endpoint: 'GET /api/auth/new/status',
  };

  globalThis.fetch = async () => new Response(JSON.stringify({
    ok: true,
    state: 'logged_out',
    message: 'Local iCloudPD session data was removed and the user is logged out locally. Remote Apple logout was not claimed.',
    details: {
      provider: 'icloudpd',
      removedFileCount: 1,
      remoteLogoutClaimed: false,
    },
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  const behavior = createRuntimeTruthBehavior({
    getState: () => state,
    patchState: (mutator) => {
      const nextState = structuredClone(state);
      mutator(nextState);
      state = nextState;
    },
    pushHistory: () => {},
    pushLog: () => {},
    setStatus: (key, status) => {
      state.statusByKey[key] = status;
    },
    stamp: () => '12:00:00',
  });

  try {
    behavior.runAction('new-auth-logout-session');
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(state.newAuth.buttonStates['new-auth-logout-session'].status, 'success');
    assert.equal(state.newAuth.buttonStates['new-auth-login-using-env'].status, 'neutral');
    assert.equal(state.newAuth.buttonStates['new-auth-check-login'].status, 'neutral');
    assert.equal(state.newAuth.buttonStates['new-auth-login-using-env'].endpoint, null);
    assert.equal(state.newAuth.buttonStates['new-auth-check-login'].endpoint, null);
    assert.match(state.newAuth.buttonStates['new-auth-check-login'].message, /Logged out locally/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('runtime truth new auth status recomputes stale login circle when backend reports logged out', async () => {
  let state = createInitialState();
  const originalFetch = globalThis.fetch;

  state.newAuth.buttonStates['new-auth-login-using-env'] = {
    status: 'success',
    message: 'Stale authenticated success.',
    updatedAt: '11:59:00',
    endpoint: 'POST /api/auth/new/login',
  };

  globalThis.fetch = async () => new Response(JSON.stringify({
    ok: true,
    state: 'logged_out',
    message: 'No active iCloudPD session files were found.',
    details: {
      provider: 'icloudpd',
    },
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  const behavior = createRuntimeTruthBehavior({
    getState: () => state,
    patchState: (mutator) => {
      const nextState = structuredClone(state);
      mutator(nextState);
      state = nextState;
    },
    pushHistory: () => {},
    pushLog: () => {},
    setStatus: (key, status) => {
      state.statusByKey[key] = status;
    },
    stamp: () => '12:00:00',
  });

  try {
    behavior.runAction('new-auth-check-login');
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(state.newAuth.buttonStates['new-auth-login-using-env'].status, 'neutral');
    assert.equal(state.newAuth.buttonStates['new-auth-login-using-env'].endpoint, null);
    assert.equal(state.newAuth.buttonStates['new-auth-check-login'].status, 'success');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('runtime truth new auth verify result does not make login circle green', async () => {
  let state = createInitialState();
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => new Response(JSON.stringify({
    ok: true,
    state: 'success',
    message: 'iCloudPD was found and can be executed.',
    details: {
      provider: 'icloudpd',
    },
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  const behavior = createRuntimeTruthBehavior({
    getState: () => state,
    patchState: (mutator) => {
      const nextState = structuredClone(state);
      mutator(nextState);
      state = nextState;
    },
    pushHistory: () => {},
    pushLog: () => {},
    setStatus: (key, status) => {
      state.statusByKey[key] = status;
    },
    stamp: () => '12:00:00',
  });

  try {
    behavior.runAction('new-auth-verify-icloudpd');
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(state.newAuth.buttonStates['new-auth-verify-icloudpd'].status, 'success');
    assert.equal(state.newAuth.buttonStates['new-auth-login-using-env'].status, 'neutral');
    assert.equal(state.newAuth.buttonStates['new-auth-check-login'].status, 'neutral');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
