import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRegularWorkerProductPipelineContract, evaluateRegularWorkerProductEvidenceAgainstContract, REGULAR_WORKER_PRODUCT_PIPELINE_STAGES } from '../tools/regular-worker-product-pipeline-contract-lib.mjs';

test('regular worker product pipeline contract preserves v1 stage order', () => {
  const contract = buildRegularWorkerProductPipelineContract();
  assert.deepEqual(contract.stages.map((entry) => entry.stage), REGULAR_WORKER_PRODUCT_PIPELINE_STAGES);
  assert.equal(contract.sourcePriority, 'icloud_first');
  assert.equal(contract.missingGpsPolicy, 'mark_unknown_and_playable');
  assert.deepEqual(contract.acceptedSourceKinds, ['real_download_manifest', 'readiness_approved_manifest']);
});

test('regular worker product evidence is incomplete until all v1 flags are true', () => {
  const partial = evaluateRegularWorkerProductEvidenceAgainstContract({ media_source_observed: true });
  assert.equal(partial.complete, false);
  assert.equal(partial.coreComplete, false);
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

test('regular worker product evidence distinguishes core completion from enrichment completion', () => {
  const result = evaluateRegularWorkerProductEvidenceAgainstContract({
    source_kind: 'readiness_approved_manifest',
    media_source_observed: true,
    download_or_import_completed: true,
    index_completed: true,
    queue_prepared: true,
    worker_status_product_work_claimed: true,
    input: { source_kind: 'readiness_approved_manifest', items_seen: 1, items_eligible: 1 },
    selected_media: { media_id: 'safe_media' },
    product_record: { created: true, has_media_asset: true },
    output: { display_queue_written: true, next_display_item_ready: true },
    redaction: { private_paths_redacted: true, secrets_redacted: true, raw_media_included: false, raw_provider_output_included: false },
  });
  assert.equal(result.coreComplete, true);
  assert.equal(result.structuredComplete, true);
  assert.equal(result.enrichedComplete, false);
  assert.deepEqual(result.missingEnrichmentFlags, ['gps_extraction_completed', 'geocode_completed']);
});
