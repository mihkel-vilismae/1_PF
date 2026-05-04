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
