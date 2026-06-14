import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRegularWorkerProductPipelineEvidence, REGULAR_STAGE_WORKER_PRODUCT_STAGES } from '../tools/raspberry-regular-stage-worker-product-pipeline-lib.mjs';

test('regular worker product pipeline proof passes only when all stages are true on Raspberry', () => {
  const data = Object.fromEntries(REGULAR_STAGE_WORKER_PRODUCT_STAGES.map((stage) => [stage, true]));
  const loadedEvidence = { source: 'injected', load_error: null, data };
  assert.equal(evaluateRegularWorkerProductPipelineEvidence({ target: { raspberry_like: true }, loadedEvidence }).proofStatus, 'PASSED');
  assert.equal(evaluateRegularWorkerProductPipelineEvidence({ target: { raspberry_like: false }, loadedEvidence }).proofStatus, 'BLOCKED');
});

test('regular worker product pipeline proof fails incomplete supplied evidence', () => {
  const evaluation = evaluateRegularWorkerProductPipelineEvidence({ target: { raspberry_like: true }, loadedEvidence: { source: 'injected', load_error: null, data: { media_source_observed: true } } });
  assert.equal(evaluation.proofStatus, 'FAILED');
  assert.ok(evaluation.missingStages.includes('queue_prepared'));
});
