/*
 * Verifies the extracted runtime status route family keeps legacy route keys.
 * This protects View C orchestration status endpoint compatibility.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { createRuntimeStatusRoutes } from '../server/routes/runtimeStatusRoutes.ts';

function makeHandler(name) {
  // Creates a sentinel route handler so route-key wiring can be compared by identity.
  return () => ({ statusCode: 200, payload: { name } });
}

test('runtime status route extraction preserves orchestration status route keys', () => {
  const handlers = {
    runtimeOrchestrationCurrentHandler: makeHandler('runtimeOrchestrationCurrentHandler'),
    runtimeOrchestrationLastHandler: makeHandler('runtimeOrchestrationLastHandler'),
  };

  const routes = createRuntimeStatusRoutes(handlers);

  assert.deepEqual(Object.keys(routes), [
    'GET /api/runtime/orchestration/current',
    'GET /api/runtime/orchestration/last',
  ]);
  assert.equal(routes['GET /api/runtime/orchestration/current'], handlers.runtimeOrchestrationCurrentHandler);
  assert.equal(routes['GET /api/runtime/orchestration/last'], handlers.runtimeOrchestrationLastHandler);
});
