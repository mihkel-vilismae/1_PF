import assert from 'node:assert/strict';
import test from 'node:test';
import { buildRegularWorkerProductEvidenceTemplate, evaluateRegularWorkerProductPipelineEvidence } from '../tools/raspberry-regular-stage-worker-product-pipeline-lib.mjs';

test('regular worker product evidence template is staged and non-production by default', () => {
  const template = buildRegularWorkerProductEvidenceTemplate();
  assert.equal(template.evidence_schema_version, 1);
  assert.equal(template.staged_write_mode, true);
  assert.equal(template.production_mutation_claimed, false);
  assert.match(template.required_proof_boundary, /template alone is not product proof/);
});

test('regular worker product evidence template cannot pass product proof by itself', () => {
  const template = buildRegularWorkerProductEvidenceTemplate();
  const evaluation = evaluateRegularWorkerProductPipelineEvidence({
    target: { raspberry_like: true },
    loadedEvidence: { source: 'injected', data: template, load_error: null },
  });
  assert.equal(evaluation.proofStatus, 'FAILED');
  assert.ok(evaluation.missingStages.includes('media_source_observed'));
  assert.ok(evaluation.missingStages.includes('worker_status_product_work_claimed'));
});
