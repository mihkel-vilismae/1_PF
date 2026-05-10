/*
 * Verifies the extracted runtime-truth route family preserves its public route keys.
 * The test keeps server/index.ts free to delegate these handlers safely.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createRuntimeTruthRoutes, normalizeRuntimeTruthPayload } from '../server/routes/runtimeTruthRoutes.ts';

function createDependencies() {
  return {
    runtimeTruthFilePath: '/tmp/runtime-truth.json',
    runtimeTruthRelativePath: 'conf/runtime-truth.json',
    createHttpError(statusCode, code, message, details) {
      const error = new Error(message);
      error.statusCode = statusCode;
      error.code = code;
      error.details = details;
      return error;
    },
  };
}

test('runtime-truth route extraction preserves existing route keys', () => {
  const routes = createRuntimeTruthRoutes(createDependencies());
  assert.deepEqual(Object.keys(routes).sort(), [
    'GET /api/runtime-truth',
    'POST /api/runtime-truth',
    'POST /api/runtime/pipeline/issues/detect',
    'POST /api/runtime/pipeline/stale-locks/clear',
  ].sort());
});

test('runtime-truth normalization preserves the source-of-truth contract', () => {
  const truth = normalizeRuntimeTruthPayload({ existing: true }, createDependencies(), { source: 'request' });
  assert.equal(truth.existing, true);
  assert.equal(truth.sourceOfTruth, 'conf/runtime-truth.json');
});

test('runtime-truth normalization preserves invalid request error shape', () => {
  assert.throws(
    () => normalizeRuntimeTruthPayload(null, createDependencies(), { source: 'request' }),
    (error) => {
      assert.equal(error.statusCode, 400);
      assert.equal(error.code, 'invalid_runtime_truth_payload');
      assert.deepEqual(error.details, { expected: { truth: { sourceOfTruth: 'conf/runtime-truth.json' } } });
      return true;
    },
  );
});
