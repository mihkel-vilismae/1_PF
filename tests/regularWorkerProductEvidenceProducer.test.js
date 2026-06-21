import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildSampleDownloadManifest } from '../tools/download-manifest-safe-schema-lib.mjs';
import { evaluateRegularWorkerProductEvidenceProducer } from '../tools/regular-worker-product-evidence-producer-lib.mjs';

function fixtureDir() { return mkdtempSync(join(tmpdir(), 'pf-product-evidence-')); }
function writeJson(dir, name, value) { const path = join(dir, name); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`); return path; }

test('regular worker product evidence producer is blocked without opt-in and confirmation', () => {
  assert.equal(evaluateRegularWorkerProductEvidenceProducer({}, { cwd: process.cwd() }).proofStatus, 'BLOCKED');
});

test('regular worker product evidence producer builds core-complete evidence from readiness manifest', () => {
  const dir = fixtureDir();
  const manifestPath = writeJson(dir, 'manifest.json', buildSampleDownloadManifest());
  const result = evaluateRegularWorkerProductEvidenceProducer({
    PF_PROOF_ENABLE_REGULAR_WORKER_PRODUCT_EVIDENCE: 'true',
    PF_REGULAR_WORKER_PRODUCT_WORK_CONFIRMED: 'true',
    PF_REGULAR_WORKER_PRODUCT_MANIFEST_FILE: manifestPath,
    PF_WORKER_INPUT_SOURCE_KIND: 'readiness_approved_manifest',
    PF_REGULAR_WORKER_PRODUCT_RUN_ID: 'operator-confirmed-run',
  }, { cwd: dir, now: '2026-01-01T00:00:00.000Z' });
  assert.equal(result.proofStatus, 'PASSED');
  assert.equal(result.product_pipeline_evidence.input.source_kind, 'readiness_approved_manifest');
  assert.equal(result.product_pipeline_evidence.product_record.created, true);
  assert.equal(result.product_pipeline_evidence.output.next_display_item_ready, true);
  assert.equal(result.structured_evaluation.complete, true);
  assert.equal(result.structured_evaluation.enrichedComplete, false);
});
