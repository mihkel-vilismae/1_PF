import assert from 'node:assert/strict';
import test from 'node:test';
import { buildRegularWorkerProductEvidenceTemplate, evaluateRegularWorkerProductPipelineEvidence } from '../tools/raspberry-regular-stage-worker-product-pipeline-lib.mjs';

test('regular worker product evidence template is staged v2 and non-production by default', () => {
  const template = buildRegularWorkerProductEvidenceTemplate();
  assert.equal(template.evidence_schema_version, 2);
  assert.equal(template.staged_write_mode, true);
  assert.equal(template.production_mutation_claimed, false);
  assert.equal(template.worker.mode, 'regular');
  assert.equal(template.input.source_kind, 'unset');
  assert.equal(template.product_record.created, false);
  assert.match(template.required_proof_boundary, /Template or fixture evidence alone is not product proof/);
});

test('regular worker product evidence template cannot pass product proof by itself', () => {
  const template = buildRegularWorkerProductEvidenceTemplate();
  const evaluation = evaluateRegularWorkerProductPipelineEvidence({
    target: { raspberry_like: true },
    loadedEvidence: { source: 'injected', data: template, load_error: null },
  });
  assert.equal(evaluation.proofStatus, 'FAILED');
  assert.ok(evaluation.missingCoreStages.includes('media_source_observed'));
  assert.ok(evaluation.missingCoreStages.includes('worker_status_product_work_claimed'));
});

test('regular worker product evidence can pass core pipeline while tracking GPS/geocode separately', () => {
  const template = buildRegularWorkerProductEvidenceTemplate();
  const evaluation = evaluateRegularWorkerProductPipelineEvidence({
    target: { raspberry_like: true },
    loadedEvidence: {
      source: 'injected',
      load_error: null,
      data: {
        ...template,
        source_kind: 'readiness_approved_manifest',
        media_source_observed: true,
        download_or_import_completed: true,
        index_completed: true,
        queue_prepared: true,
        worker_status_product_work_claimed: true,
        input: { ...template.input, source_kind: 'readiness_approved_manifest', items_seen: 1, items_eligible: 1, manifest_id: 'safe_manifest' },
        selected_media: { ...template.selected_media, media_id: 'safe_media', media_type: 'image', source_provenance: 'readiness_approved' },
        product_record: { ...template.product_record, created: true, record_id: 'safe_product', has_media_asset: true, has_display_asset: true, gps_status: 'blocked', geocode_status: 'blocked', overlay_status: 'partial' },
        output: { ...template.output, display_queue_written: true, next_display_item_ready: true, output_artifact_id: 'safe_output' },
      },
    },
  });
  assert.equal(evaluation.proofStatus, 'PASSED');
  assert.deepEqual(evaluation.missingCoreStages, []);
  assert.deepEqual(evaluation.missingEnrichmentStages, ['gps_extraction_completed', 'geocode_completed']);
});
