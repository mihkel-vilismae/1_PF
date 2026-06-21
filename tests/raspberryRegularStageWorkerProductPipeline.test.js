import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRegularWorkerProductEvidenceTemplate, evaluateRegularWorkerProductPipelineEvidence, REGULAR_STAGE_WORKER_PRODUCT_STAGES } from '../tools/raspberry-regular-stage-worker-product-pipeline-lib.mjs';
import { buildRegularWorkerProductEvidenceFromResolvedInput } from '../tools/regular-worker-product-evidence-lib.mjs';

test('regular worker product pipeline proof passes only with structured v2 product evidence on Raspberry', () => {
  const data = buildRegularWorkerProductEvidenceFromResolvedInput({
    resolvedInput: {
      status: 'PASSED',
      input: {
        source_kind: 'readiness_approved_manifest',
        manifest_id: 'sha256:test_manifest',
        manifest_schema_version: 1,
        items_seen: 1,
        items_eligible: 1,
        private_paths_redacted: true,
      },
      selected_media: {
        media_id: 'media_safe_id',
        file_sha256: 'sha256:test_media',
        media_type: 'image',
        source_provenance: 'readiness_approved',
        selection_reason: 'unit_test',
      },
    },
    workerRunId: 'worker_run_test',
    productWorkClaimed: true,
    now: '2026-06-21T00:00:00.000Z',
  });
  const loadedEvidence = { source: 'injected', load_error: null, data };
  assert.equal(evaluateRegularWorkerProductPipelineEvidence({ target: { raspberry_like: true }, loadedEvidence }).proofStatus, 'PASSED');
  assert.equal(evaluateRegularWorkerProductPipelineEvidence({ target: { raspberry_like: false }, loadedEvidence }).proofStatus, 'BLOCKED');
});

test('regular worker product pipeline proof fails incomplete supplied evidence', () => {
  const evaluation = evaluateRegularWorkerProductPipelineEvidence({ target: { raspberry_like: true }, loadedEvidence: { source: 'injected', load_error: null, data: { media_source_observed: true } } });
  assert.equal(evaluation.proofStatus, 'FAILED');
  assert.ok(evaluation.missingStages.includes('queue_prepared'));
});


test('regular worker product evidence template defaults to non-claiming false fields', () => {
  const template = buildRegularWorkerProductEvidenceTemplate();
  for (const stage of REGULAR_STAGE_WORKER_PRODUCT_STAGES) assert.equal(template[stage], false);
  assert.match(template.operator_note, /regular_stage_worker consumes real\/readiness-approved input and prepares product output/);
});
