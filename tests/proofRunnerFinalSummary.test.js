import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFinalProofRunnerSummary, parseProofSummaryTable } from '../tools/proof-runner-final-summary-lib.mjs';

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


test('final proof-runner summary fails when shell proof summary has nonzero exits', () => {
  const rows = parseProofSummaryTable('name,status,exit_code,log_file\nproof:full-test,FAIL,1,logs/019.log\nproof:raspberry-v1-readiness,PASS,0,logs/100.log\n');
  const summary = buildFinalProofRunnerSummary({ artifacts: [
    artifact('raspberry_v1_readiness', 'BLOCKED', '2026-06-18T10:02:00.000Z'),
  ], shellSummaryRows: rows });
  assert.equal(summary.proof_status, 'FAILED');
  assert.equal(summary.readiness_proof_status, 'PASSED');
  assert.equal(summary.shell_summary.failed_exit_nonzero_count, 1);
  assert.equal(summary.shell_summary.failed_rows[0].name, 'proof:full-test');
});

test('proof summary parser accepts tsv summary format', () => {
  const rows = parseProofSummaryTable('name\tstatus\texit_code\tlog_file\nproof:a\tPASS\t0\tlogs/a.log\nproof:b\tFAIL\t1\tlogs/b.log\n');
  assert.equal(rows.length, 2);
  assert.equal(rows[1].name, 'proof:b');
  assert.equal(rows[1].exit_code, 1);
});


test('proof summary parser accepts quoted Windows csv summary format', () => {
  const rows = parseProofSummaryTable('name,status,exit_code,log_file\n"npm install","PASS","0","Z:\\run\\logs\\000_npm_install.log"\n"proof:proof-runner-final-summary","FAIL","1","Z:\\run\\logs\\110.log"\n');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].name, 'npm install');
  assert.equal(rows[0].status, 'PASS');
  assert.equal(rows[0].exit_code, 0);
  assert.equal(rows[1].name, 'proof:proof-runner-final-summary');
  assert.equal(rows[1].status, 'FAIL');
  assert.equal(rows[1].exit_code, 1);
});

