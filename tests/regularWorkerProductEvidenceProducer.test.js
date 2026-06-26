/**
 * Verifies regular-worker product evidence requires runtime-owned authority.
 * Covers successful product-capable status and instrumentation-only rejection.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildSampleDownloadManifest } from '../tools/download-manifest-safe-schema-lib.mjs';
import { evaluateRegularWorkerProductEvidenceProducer } from '../tools/regular-worker-product-evidence-producer-lib.mjs';

/** Creates an isolated evidence fixture directory. */
function fixtureDir() { return mkdtempSync(join(tmpdir(), 'pf-product-evidence-')); }
/** Writes one JSON fixture and returns its path. */
function writeJson(dir, name, value) { const path = join(dir, name); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`); return path; }
/** Writes product-capable regular-worker runtime status with optional overrides. */
function writeWorkerStatus(dir, overrides = {}) {
  return writeJson(dir, 'regular-worker-status.json', {
    worker: 'regular_stage_worker',
    status: 'succeeded',
    invocation_observed: true,
    implementationStatus: 'product_work_implemented',
    productWork: { claimed: true, runId: 'runtime-product-run' },
    finishedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  });
}

test('regular worker product evidence producer is blocked without opt-in and confirmation', () => {
  assert.equal(evaluateRegularWorkerProductEvidenceProducer({}, { cwd: process.cwd() }).proofStatus, 'BLOCKED');
});

test('regular worker product evidence producer builds core-complete evidence from readiness manifest', () => {
  const dir = fixtureDir();
  const manifestPath = writeJson(dir, 'manifest.json', buildSampleDownloadManifest());
  const workerStatusPath = writeWorkerStatus(dir);
  const result = evaluateRegularWorkerProductEvidenceProducer({
    PF_PROOF_ENABLE_REGULAR_WORKER_PRODUCT_EVIDENCE: 'true',
    PF_REGULAR_WORKER_PRODUCT_MANIFEST_FILE: manifestPath,
    PF_REGULAR_WORKER_RUNTIME_STATUS_FILE: workerStatusPath,
    PF_WORKER_INPUT_SOURCE_KIND: 'readiness_approved_manifest',
  }, { cwd: dir, now: '2026-01-01T00:00:00.000Z' });
  assert.equal(result.proofStatus, 'PASSED');
  assert.equal(result.product_pipeline_evidence.input.source_kind, 'readiness_approved_manifest');
  assert.equal(result.product_pipeline_evidence.product_record.created, true);
  assert.equal(result.product_pipeline_evidence.output.next_display_item_ready, true);
  assert.equal(result.structured_evaluation.complete, true);
  assert.equal(result.structured_evaluation.enrichedComplete, false);
  assert.equal(result.product_pipeline_evidence.worker.run_id, 'runtime-product-run');
});

test('regular worker product evidence producer ignores manual confirmation while runtime is instrumentation only', () => {
  const dir = fixtureDir();
  const manifestPath = writeJson(dir, 'manifest.json', buildSampleDownloadManifest());
  const workerStatusPath = writeWorkerStatus(dir, {
    implementationStatus: 'instrumentation_only',
    productWork: { claimed: false },
  });
  const result = evaluateRegularWorkerProductEvidenceProducer({
    PF_PROOF_ENABLE_REGULAR_WORKER_PRODUCT_EVIDENCE: 'true',
    PF_REGULAR_WORKER_PRODUCT_WORK_CONFIRMED: 'true',
    PF_REGULAR_WORKER_PRODUCT_MANIFEST_FILE: manifestPath,
    PF_REGULAR_WORKER_RUNTIME_STATUS_FILE: workerStatusPath,
  }, { cwd: dir });

  assert.equal(result.proofStatus, 'BLOCKED');
  assert.equal(result.worker_runtime_evidence.confirmed, false);
  assert.equal(result.worker_runtime_evidence.manual_confirmation_ignored, true);
  assert.match(result.block_reasons.join('; '), /instrumentation_only/);
});
