import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFinalProofRunnerSummary } from '../tools/proof-runner-final-summary-lib.mjs';

function artifact(kind, status, timestamp) {
  return { proof_kind: kind, proof_status: status, proof_timestamp: timestamp, evidence: { summary: { required_passed_count: 7 }, blocking_gate_ids: ['real_icloud_media_source'] } };
}

test('final proof-runner summary blocks when readiness has not been run', () => {
  const summary = buildFinalProofRunnerSummary({ artifacts: [artifact('real_icloudpd_pipeline', 'BLOCKED', '2026-06-18T10:00:00.000Z')] });
  assert.equal(summary.proof_status, 'BLOCKED');
  assert.equal(summary.latest_readiness, null);
  assert.ok(summary.next_steps[0].includes('proof:raspberry-v1-readiness'));
});

test('final proof-runner summary passes when readiness is after observed inputs', () => {
  const summary = buildFinalProofRunnerSummary({ artifacts: [
    artifact('real_icloudpd_pipeline', 'BLOCKED', '2026-06-18T10:00:00.000Z'),
    artifact('real_geocode_provider_chain', 'BLOCKED', '2026-06-18T10:01:00.000Z'),
    artifact('raspberry_v1_readiness', 'BLOCKED', '2026-06-18T10:02:00.000Z'),
  ] });
  assert.equal(summary.proof_status, 'PASSED');
  assert.equal(summary.readiness_after_observed_inputs, true);
  assert.deepEqual(summary.stale_input_artifacts_after_readiness, []);
});

test('final proof-runner summary blocks when a proof artifact is newer than readiness', () => {
  const summary = buildFinalProofRunnerSummary({ artifacts: [
    artifact('raspberry_v1_readiness', 'BLOCKED', '2026-06-18T10:02:00.000Z'),
    artifact('real_download_continuation', 'BLOCKED', '2026-06-18T10:03:00.000Z'),
  ] });
  assert.equal(summary.proof_status, 'BLOCKED');
  assert.equal(summary.stale_input_artifacts_after_readiness[0].proof_kind, 'real_download_continuation');
});
