/*
 * Verifies the extracted inspection route family keeps legacy route keys.
 * This protects version and .env verification endpoint compatibility.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { createInspectionRoutes } from '../server/routes/inspectionRoutes.ts';

function makeHandler(name) {
  // Creates a sentinel route handler so route-key wiring can be compared by identity.
  return () => ({ statusCode: 200, payload: { name } });
}

test('inspection route extraction preserves version and verify-env route keys', () => {
  const handlers = {
    versionHandler: makeHandler('versionHandler'),
    verifyEnvHandler: makeHandler('verifyEnvHandler'),
  };

  const routes = createInspectionRoutes(handlers);

  assert.deepEqual(Object.keys(routes), [
    'GET /api/version',
    'POST /api/init/verify-env',
  ]);
  assert.equal(routes['GET /api/version'], handlers.versionHandler);
  assert.equal(routes['POST /api/init/verify-env'], handlers.verifyEnvHandler);
});
