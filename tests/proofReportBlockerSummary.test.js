import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeProofReportBlockers, classifyBlocker } from '../tools/proof-report-blocker-summary-lib.mjs';

function artifact(kind, status, timestamp, evidence = {}) {
  return { proof_kind: kind, proof_status: status, proof_timestamp: timestamp, evidence };
}

test('proof report blocker summary blocks when there are no proof artifacts', () => {
  const summary = summarizeProofReportBlockers({ artifacts: [] });
  assert.equal(summary.proof_status, 'BLOCKED');
  assert.equal(summary.next_priority, 'run_proof_queue_first');
});

test('proof report blocker summary groups latest blocked proof artifacts', () => {
  const summary = summarizeProofReportBlockers({ artifacts: [
    artifact('real_geocode_provider_chain', 'BLOCKED', '2026-06-18T10:00:00.000Z', { reason: 'provider id not configured' }),
    artifact('full_test_suite_stability', 'FAILED', '2026-06-18T10:01:00.000Z', { reason: 'docs expectation drift' }),
    artifact('raspberry_v1_readiness', 'BLOCKED', '2026-06-18T10:02:00.000Z', { summary: { required_passed_count: 7 }, blocking_gate_ids: ['real_gps_geocode'] }),
  ] });
  assert.equal(summary.proof_status, 'PASSED');
  assert.equal(summary.blocker_count, 3);
  assert.equal(summary.category_counts.config_or_env, 2);
  assert.equal(summary.category_counts.test_or_docs, 1);
  assert.equal(summary.latest_readiness.blocking_gate_ids[0], 'real_gps_geocode');
});

test('blocker classifier recognizes operator evidence and product evidence', () => {
  assert.equal(classifyBlocker(artifact('raspberry_address_overlay_device_display', 'BLOCKED', '2026-06-18T10:00:00.000Z')), 'operator_evidence');
  assert.equal(classifyBlocker(artifact('raspberry_regular_stage_worker_product_pipeline', 'BLOCKED', '2026-06-18T10:00:00.000Z')), 'product_evidence');
});
