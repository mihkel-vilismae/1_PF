import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeHandoffLauncherArtifactExportText, buildAcceptedArtifactExportSnippet } from '../tools/proofrunner-handoff-artifact-export-contract-lib.mjs';

test('handoff artifact export contract accepts summary-aware launcher text', () => {
  const result = analyzeHandoffLauncherArtifactExportText(buildAcceptedArtifactExportSnippet());
  assert.equal(result.status, 'PASSED');
});

test('handoff artifact export contract rejects launchers that omit shell summary path', () => {
  const result = analyzeHandoffLauncherArtifactExportText('npm run proof:proof-runner-final-summary\nzip logs repo_identity.json');
  assert.equal(result.status, 'FAILED');
  assert.equal(result.checks.find((check) => check.name === 'passes_summary_path_to_final_summary').passed, false);
});

test('handoff artifact export contract rejects launchers that omit runtime proof artifacts', () => {
  const result = analyzeHandoffLauncherArtifactExportText('PF_PROOF_SUMMARY_PATH="$SUMMARY" npm run proof:proof-runner-final-summary\nproof_scripts_failed_exit_nonzero=1\nalways package logs');
  assert.equal(result.status, 'FAILED');
  assert.equal(result.checks.find((check) => check.name === 'exports_runtime_proof_artifacts').passed, false);
});
