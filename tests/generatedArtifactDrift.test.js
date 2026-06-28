import assert from 'node:assert/strict';
import test from 'node:test';
import {
  analyzeGeneratedArtifactTextDrift,
  analyzeGeneratedHandoffManifest,
  analyzeGeneratedHandoffReferenceConsistency,
  buildAcceptedGeneratedArtifactText,
} from '../tools/generated-artifact-drift-lib.mjs';

test('generated artifact drift scanner accepts current version/head/sha identity text', () => {
  const result = analyzeGeneratedArtifactTextDrift({
    artifactName: 'README_PROOFRUNNER.md',
    text: buildAcceptedGeneratedArtifactText({ version: '0.10.91', head: 'abcdef1', sha256: 'feedbeef' }),
    expectedVersion: '0.10.91',
    expectedHead: 'abcdef1',
    expectedSha256: 'feedbeef',
  });
  assert.equal(result.status, 'PASSED');
});

test('generated artifact drift scanner rejects stale version and missing current head', () => {
  const result = analyzeGeneratedArtifactTextDrift({
    artifactName: 'PROOF_RASPBERRYOS.SH',
    text: '# PF_login v0.10.84\nRepo ZIP SHA-256: feedbeef\nHEAD: oldhead',
    expectedVersion: '0.10.91',
    expectedHead: 'abcdef1',
    expectedSha256: 'feedbeef',
  });
  assert.equal(result.status, 'FAILED');
  assert.equal(result.checks.find((check) => check.name === 'contains_current_version').passed, false);
  assert.equal(result.checks.find((check) => check.name === 'contains_current_head').passed, false);
  assert.equal(result.checks.find((check) => check.name === 'rejects_known_stale_versions').passed, false);
});

test('generated handoff manifest scanner accepts one repo plus two launchers and checksum', () => {
  const result = analyzeGeneratedHandoffManifest([
    'PF_login_v0.10.91_group2_static_contracts_full_git.zip',
    'PF_login_v0.10.91_group2_static_contracts_full_git.zip.sha256',
    'PROOF_RASPBERRYOS.SH',
    'PROOF_WIN.PS1',
    'README_PROOFRUNNER.md',
    'seeded_visual_evidence/README.md',
  ]);
  assert.equal(result.status, 'PASSED');
});

test('generated handoff manifest scanner rejects extracted repo/runtime noise', () => {
  const result = analyzeGeneratedHandoffManifest([
    'PF_login_v0.10.91_group2_static_contracts_full_git.zip',
    'PF_login_v0.10.91_group2_static_contracts_full_git.zip.sha256',
    'PROOF_RASPBERRYOS.SH',
    'PROOF_WIN.PS1',
    'README_PROOFRUNNER.md',
    'runtime_data/proofs/proof.json',
    'repo/.git/config',
    'repo/package.json',
    'repo/package-lock.json',
  ]);
  assert.equal(result.status, 'FAILED');
  assert.equal(result.checks.find((check) => check.name === 'excludes_runtime_and_repo_expansion_noise').passed, false);
});


test('generated handoff reference scanner rejects launcher repo ZIP name drift', () => {
  const accepted = analyzeGeneratedHandoffReferenceConsistency({
    entries: ['PF_login_v0.10.91_group2_static_contracts_full_git.zip'],
    texts: [
      '# Repo ZIP: PF_login_v0.10.91_group2_static_contracts_full_git.zip',
      'REPO_ZIP_NAME="PF_login_v0.10.91_group2_static_contracts_full_git.zip"',
    ],
  });
  assert.equal(accepted.status, 'PASSED');

  const stale = analyzeGeneratedHandoffReferenceConsistency({
    entries: ['PF_login_v0.10.91_group2_static_contracts_full_git.zip'],
    texts: ['REPO_ZIP_NAME="PF_login_v0.10.90_group1_proofrunner_modes_full_git.zip"'],
  });
  assert.equal(stale.status, 'FAILED');
  assert.equal(stale.checks.find((check) => check.name === 'launcher_and_readme_repo_zip_references_match_manifest').passed, false);
});
