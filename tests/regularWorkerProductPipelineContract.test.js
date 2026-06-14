import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRegularWorkerProductPipelineContract, evaluateRegularWorkerProductEvidenceAgainstContract, REGULAR_WORKER_PRODUCT_PIPELINE_STAGES } from '../tools/regular-worker-product-pipeline-contract-lib.mjs';

test('regular worker product pipeline contract preserves v1 stage order', () => {
  const contract = buildRegularWorkerProductPipelineContract();
  assert.deepEqual(contract.stages.map((entry) => entry.stage), REGULAR_WORKER_PRODUCT_PIPELINE_STAGES);
  assert.equal(contract.sourcePriority, 'icloud_first');
  assert.equal(contract.missingGpsPolicy, 'mark_unknown_and_playable');
});

test('regular worker product evidence is incomplete until all v1 flags are true', () => {
  const partial = evaluateRegularWorkerProductEvidenceAgainstContract({ media_source_observed: true });
  assert.equal(partial.complete, false);
  assert.ok(partial.missingFlags.includes('queue_prepared'));
  const complete = evaluateRegularWorkerProductEvidenceAgainstContract({
    media_source_observed: true,
    download_or_import_completed: true,
    index_completed: true,
    gps_extraction_completed: true,
    geocode_completed: true,
    queue_prepared: true,
    worker_status_product_work_claimed: true,
  });
  assert.equal(complete.complete, true);
  assert.deepEqual(complete.missingFlags, []);
});
