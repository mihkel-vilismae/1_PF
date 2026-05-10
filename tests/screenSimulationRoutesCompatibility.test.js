/*
 * Verifies the extracted screen-simulation route module keeps legacy route keys.
 * The screen simulator remains backend-owned simulation state, not hardware control.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { createScreenSimulationRoutes } from '../server/routes/screenSimulationRoutes.ts';

function makeDependencies() {
  // Creates route dependencies matching the server/index.ts error contract.
  return {
    createBadRequestError(code, message, details) {
      const error = new Error(message);
      error.statusCode = 400;
      error.code = code;
      error.details = details;
      return error;
    },
    isJsonObject(value) {
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    },
  };
}

test('screen simulation route extraction preserves legacy route keys', () => {
  const routes = createScreenSimulationRoutes(makeDependencies());

  assert.deepEqual(Object.keys(routes), [
    'GET /api/runtime/screen-simulation/state',
    'POST /api/runtime/screen-simulation/configure',
  ]);
  assert.equal(typeof routes['GET /api/runtime/screen-simulation/state'], 'function');
  assert.equal(typeof routes['POST /api/runtime/screen-simulation/configure'], 'function');
});

test('screen simulation route extraction preserves state and validation behavior', async () => {
  const routes = createScreenSimulationRoutes(makeDependencies());
  const configure = routes['POST /api/runtime/screen-simulation/configure'];
  const state = routes['GET /api/runtime/screen-simulation/state'];

  const configured = await configure({
    body: {
      simulation: {
        pirEnabled: false,
        mouseEnabled: false,
        keyboardEnabled: false,
        simulateAllEnabled: false,
        inactivityTimeoutSeconds: 12,
      },
    },
  });

  assert.equal(configured.statusCode, 200);
  assert.equal(configured.payload.screen.screenState, 'OFF');
  assert.equal(configured.payload.screen.inactivityTimeoutSeconds, 12);

  const current = await state({ body: {} });
  assert.deepEqual(current, configured);

  assert.throws(
    () => configure({ body: { simulation: { inactivityTimeoutSeconds: 0 } } }),
    /Screen simulation inactivityTimeoutSeconds must be an integer from 1 to 60/,
  );
});
