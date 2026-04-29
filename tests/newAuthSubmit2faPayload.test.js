import assert from 'node:assert/strict';
import test from 'node:test';

import { createRuntimeTruthBehavior } from '../dashboard/services/runtimeTruth/runtimeTruthBehavior.ts';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';

test('new auth 2FA action forwards the submitted code to the new auth endpoint', async () => {
  let state = createInitialState();
  const requests = [];
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (path, init = {}) => {
    requests.push({ path, body: init.body });
    return new Response(JSON.stringify({ ok: true, state: 'authenticated', message: '2FA accepted.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
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
    setStatus: () => {},
    stamp: () => '12:00:00',
  });

  try {
    behavior.runAction('new-auth-submit-2fa', { code: '218228' });
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(requests.length, 1);
    assert.equal(requests[0].path, '/api/auth/new/submit-2fa');
    assert.equal(requests[0].body, JSON.stringify({ code: '218228' }));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
