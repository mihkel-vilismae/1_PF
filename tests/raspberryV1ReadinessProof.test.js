/**
 * Verifies Raspberry v1 gate evaluation and proof-artifact collection.
 * Covers exact proof mapping, latest-artifact selection, and identity reporting.
 * Keeps identity diagnostics separate from gate pass/fail policy.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildGateFormalRefreshReport, buildProofIdentityReport, buildReadinessGapReport, collectLatestProofArtifacts, evaluateRaspberryV1Readiness, RASPBERRY_V1_RELEASE_GATES, RASPBERRY_V1_PROOF_COMMANDS } from '../tools/raspberry-v1-readiness-lib.mjs';

/** Builds a compact passing proof artifact fixture. */
function passArtifact(kind, timestamp = '2026-06-14T00:00:00.000Z') {
  return {
    proof_kind: kind,
    proof_status: 'PASSED',
    proof_timestamp: timestamp,
    runtime_mode: 'test',
    baseline_version: '0.10.17',
    git_commit: 'abcdef1',
  };
}

/** Builds a passing latest-artifact index for every required release gate. */
function latestPassedIndexForRequiredGates() {
  const latestByKind = {};
  for (const gate of RASPBERRY_V1_RELEASE_GATES) {
    if (!gate.requiredForV1) continue;
    for (const kind of gate.proofKinds) latestByKind[kind] = passArtifact(kind);
  }
  return latestByKind;
}

test('readiness can pass when all required gate proof kinds are passed', () => {
  const readiness = evaluateRaspberryV1Readiness({ latestByKind: latestPassedIndexForRequiredGates() });
  assert.equal(readiness.proofStatus, 'PASSED');
  assert.equal(readiness.blocking_gate_ids.length, 0);
});

test('non-v1 reboot and power-loss proofs do not block readiness when absent', () => {
  const latestByKind = latestPassedIndexForRequiredGates();
  delete latestByKind.raspberry_reboot_recovery;
  delete latestByKind.raspberry_power_loss_recovery_v2;
  const readiness = evaluateRaspberryV1Readiness({ latestByKind });
  assert.equal(readiness.proofStatus, 'PASSED');
});

test('latest proof artifact collector keeps newest artifact per proof kind', async () => {
  const root = await (await import('node:fs/promises')).mkdtemp(path.join(os.tmpdir(), 'pf-v1-readiness-'));
  try {
    await mkdir(path.join(root, 'runtime_data', 'proofs'), { recursive: true });
    await writeFile(path.join(root, 'runtime_data', 'proofs', 'one.json'), JSON.stringify(passArtifact('raspberry_tool_checker', '2026-06-14T00:00:00.000Z')), 'utf8');
    await writeFile(path.join(root, 'runtime_data', 'proofs', 'two.json'), JSON.stringify({ ...passArtifact('raspberry_tool_checker', '2026-06-14T01:00:00.000Z'), proof_status: 'BLOCKED' }), 'utf8');
    const index = await collectLatestProofArtifacts({ repoRoot: root });
    assert.equal(index.filesRead, 2);
    assert.equal(index.latestByKind.raspberry_tool_checker.proof_status, 'BLOCKED');
    assert.equal(index.latestByKind.raspberry_tool_checker.baseline_version, '0.10.17');
    assert.equal(index.latestByKind.raspberry_tool_checker.git_commit, 'abcdef1');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

/** Verifies report-only identity diagnostics expose old artifacts without changing gate status. */
test('identity report lists baseline and commit mismatches without changing gate status', () => {
  const latestByKind = latestPassedIndexForRequiredGates();
  latestByKind.raspberry_dashboard_status_view = {
    ...latestByKind.raspberry_dashboard_status_view,
    baseline_version: '0.10.15',
    git_commit: '1234567',
    source_file: 'old-dashboard-proof.json',
  };
  const readiness = evaluateRaspberryV1Readiness({ latestByKind });
  const report = buildProofIdentityReport({
    latestByKind,
    expectedBaselineVersion: '0.10.17',
    expectedGitCommit: 'abcdef1234567890',
  });

  assert.equal(readiness.gates.find((gate) => gate.id === 'dashboard_status_view').gate_status, 'PASSED');
  assert.equal(report.policy, 'report_only');
  assert.equal(report.gate_status_impact, 'none');
  assert.equal(report.identity_matches_current_baseline, false);
  assert.equal(report.mismatch_count, 1);
  assert.deepEqual(report.mismatches[0].mismatch_fields, ['baseline_version', 'git_commit']);
  assert.deepEqual(report.mismatches[0].gate_ids, ['dashboard_status_view']);
});

/** Verifies normal short proof hashes match the corresponding live full commit. */
test('identity report accepts short Git hashes that match the current full commit prefix', () => {
  const latestByKind = {
    raspberry_tool_checker: {
      ...passArtifact('raspberry_tool_checker'),
      git_commit: 'abcdef1',
      source_file: 'tool-checker.json',
    },
  };
  const report = buildProofIdentityReport({
    latestByKind,
    expectedBaselineVersion: '0.10.17',
    expectedGitCommit: 'abcdef1234567890',
  });

  assert.equal(report.mismatch_count, 0);
  assert.equal(report.missing_identity_count, 0);
  assert.equal(report.identity_matches_current_baseline, true);
});

/** Verifies an empty artifact set does not claim current-baseline identity coverage. */
test('identity report does not claim a match when no mapped artifacts were selected', () => {
  const report = buildProofIdentityReport({
    latestByKind: {},
    expectedBaselineVersion: '0.10.17',
    expectedGitCommit: 'abcdef1234567890',
  });

  assert.equal(report.selected_artifact_count, 0);
  assert.equal(report.identity_matches_current_baseline, false);
});

/** Verifies only passed gates with current version and commit identity are formally refreshed. */
test('formal refresh report distinguishes current passed gates from stale passed gates', () => {
  const latestByKind = latestPassedIndexForRequiredGates();
  latestByKind.raspberry_dashboard_status_view = {
    ...latestByKind.raspberry_dashboard_status_view,
    baseline_version: '0.10.16',
    git_commit: '1234567',
    source_file: 'stale-dashboard-proof.json',
  };
  delete latestByKind.raspberry_env_preflight;
  const readiness = evaluateRaspberryV1Readiness({ latestByKind });
  const report = buildGateFormalRefreshReport({
    readiness,
    expectedBaselineVersion: '0.10.17',
    expectedGitCommit: 'abcdef1234567890',
  });
  const stalePassedGate = report.gates.find((gate) => gate.gate_id === 'dashboard_status_view');
  const blockedGate = report.gates.find((gate) => gate.gate_id === 'install_runtime_preflight');
  const currentPassedGate = report.gates.find((gate) => gate.gate_id === 'screen_worker_non_blocking');

  assert.equal(stalePassedGate.gate_status, 'PASSED');
  assert.equal(stalePassedGate.formal_refresh_status, 'PASSED_NOT_FORMALLY_REFRESHED');
  assert.match(JSON.stringify(stalePassedGate.refresh_commands), /proof:raspberry-dashboard-status-view/);
  assert.equal(blockedGate.formal_refresh_status, 'NOT_PASSED');
  assert.equal(currentPassedGate.formal_refresh_status, 'FORMALLY_REFRESHED');
  assert.equal(report.release_baseline_formally_refreshed, false);
});

/** Verifies all required gates are formally refreshed only when every passed proof identity is current. */
test('formal refresh report recognizes a fully current passing release baseline', () => {
  const readiness = evaluateRaspberryV1Readiness({ latestByKind: latestPassedIndexForRequiredGates() });
  const report = buildGateFormalRefreshReport({
    readiness,
    expectedBaselineVersion: '0.10.17',
    expectedGitCommit: 'abcdef1234567890',
  });

  assert.equal(report.formally_refreshed_count, report.required_gate_count);
  assert.equal(report.passed_not_formally_refreshed_count, 0);
  assert.equal(report.not_passed_count, 0);
  assert.equal(report.release_baseline_formally_refreshed, true);
});


test('readiness gap report maps blocked required proofs to next commands', () => {
  const latestByKind = latestPassedIndexForRequiredGates();
  delete latestByKind.raspberry_env_preflight;
  const readiness = evaluateRaspberryV1Readiness({ latestByKind });
  const report = buildReadinessGapReport(readiness);
  const envGap = report.find((gap) => gap.gate_id === 'install_runtime_preflight');
  assert.ok(envGap);
  assert.match(JSON.stringify(envGap.next_commands), /proof:raspberry-env-preflight/);
});


test('readiness proof command map includes implemented dashboard screen and docs proof commands', () => {
  assert.equal(RASPBERRY_V1_PROOF_COMMANDS.raspberry_dashboard_status_view, 'npm run proof:raspberry-dashboard-status-view');
  assert.equal(RASPBERRY_V1_PROOF_COMMANDS.raspberry_screen_worker_non_blocking, 'npm run proof:raspberry-screen-worker-non-blocking');
  assert.equal(RASPBERRY_V1_PROOF_COMMANDS.raspberry_v1_docs_reconciliation, 'npm run proof:raspberry-v1-docs-reconciliation');
});
