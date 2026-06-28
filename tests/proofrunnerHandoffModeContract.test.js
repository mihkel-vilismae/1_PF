import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeHandoffModeSurfaceText,
  analyzeProofrunnerModeNormalization,
  buildAcceptedBashModeSelectionSnippet,
  buildAcceptedPowerShellModeSelectionSnippet,
  buildProofrunnerModeReadmeSection,
  analyzeGeneratedProofrunnerIdentitySurface,
  buildAcceptedGeneratedHandoffIdentityText,
} from '../tools/proofrunner-handoff-mode-contract-lib.mjs';

test('proofrunner handoff mode surface documents and exposes every tiered mode', () => {
  const analysis = analyzeHandoffModeSurfaceText({
    readmeText: buildProofrunnerModeReadmeSection(),
    bashText: buildAcceptedBashModeSelectionSnippet(),
    powershellText: buildAcceptedPowerShellModeSelectionSnippet(),
  });
  assert.equal(analysis.status, 'PASSED');
});

test('proofrunner handoff mode surface rejects old all/minimum-only menu', () => {
  const analysis = analyzeHandoffModeSurfaceText({
    readmeText: 'Interactive: 1 all/full proof queue, 2 minimum proof queue. PF_PROOF_LAUNCHER_MODE=all PF_PROOF_LAUNCHER_MODE=minimum',
    bashText: "case $choice in 1|all|full) PF_PROOF_MODE='full';; 2|min|minimum|quick) PF_PROOF_MODE='minimum';; esac",
    powershellText: "if ($choice -eq '1') {$env:PF_PROOF_MODE='full'} else {$env:PF_PROOF_MODE='minimum'}",
  });
  assert.equal(analysis.status, 'FAILED');
  assert.equal(analysis.checks.find((check) => check.name === 'documents_all_required_modes').passed, false);
  assert.equal(analysis.checks.find((check) => check.name === 'quick_is_not_mapped_to_minimum').passed, false);
});

test('proofrunner launcher selection normalization keeps quick separate from minimum', () => {
  const analysis = analyzeProofrunnerModeNormalization();
  assert.equal(analysis.status, 'PASSED');
});


test('proofrunner generated handoff identity guard rejects stale launcher identity versions', () => {
  const accepted = analyzeGeneratedProofrunnerIdentitySurface({
    texts: [buildAcceptedGeneratedHandoffIdentityText({ version: '0.10.90', head: 'abc1234', sha256: 'feedbeef' })],
    expectedVersion: '0.10.90',
    expectedHead: 'abc1234',
  });
  assert.equal(accepted.status, 'PASSED');

  const stale = analyzeGeneratedProofrunnerIdentitySurface({
    texts: ['# PF_login v0.10.84 prooflauncher\nRepo ZIP: PF_login_v0.10.86_batch2_recovery_strategy_proofs_full_git.zip\nSHA-256 missing current identity'],
    expectedVersion: '0.10.90',
    expectedHead: 'abc1234',
  });
  assert.equal(stale.status, 'FAILED');
  assert.equal(stale.checks.find((check) => check.name === 'contains_expected_version_marker').passed, false);
  assert.equal(stale.checks.find((check) => check.name === 'rejects_known_stale_launcher_versions').passed, false);
});
