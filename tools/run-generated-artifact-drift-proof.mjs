#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createProofEnvelope, runCommand, writeProofArtifact } from './proof-utils.mjs';
import {
  analyzeGeneratedArtifactTextDrift,
  analyzeGeneratedHandoffManifest,
  analyzeGeneratedHandoffReferenceConsistency,
  buildAcceptedGeneratedArtifactText,
} from './generated-artifact-drift-lib.mjs';

async function metadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const git = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: git.stdout.trim() || 'unknown' };
}

const meta = await metadata();
const textAnalysis = analyzeGeneratedArtifactTextDrift({
  artifactName: 'accepted generated handoff identity sample',
  text: buildAcceptedGeneratedArtifactText({ version: meta.version, head: meta.gitCommit, sha256: 'feedbeef' }),
  expectedVersion: meta.version,
  expectedHead: meta.gitCommit,
  expectedSha256: 'feedbeef',
});
const manifestAnalysis = analyzeGeneratedHandoffManifest([
  `PF_login_v${meta.version}_group2_static_contracts_full_git.zip`,
  `PF_login_v${meta.version}_group2_static_contracts_full_git.zip.sha256`,
  'PROOF_RASPBERRYOS.SH',
  'PROOF_WIN.PS1',
  'README_PROOFRUNNER.md',
  'seeded_visual_evidence/README.md',
]);

const referenceAnalysis = analyzeGeneratedHandoffReferenceConsistency({
  entries: [
    `PF_login_v${meta.version}_group2_static_contracts_full_git.zip`,
    `PF_login_v${meta.version}_group2_static_contracts_full_git.zip.sha256`,
  ],
  texts: [
    `Repo ZIP: PF_login_v${meta.version}_group2_static_contracts_full_git.zip`,
    `REPO_ZIP_NAME=\"PF_login_v${meta.version}_group2_static_contracts_full_git.zip\"`,
  ],
});

const checks = [
  { name: 'generated_artifact_identity_text', passed: textAnalysis.status === 'PASSED', detail: textAnalysis.checks },
  { name: 'generated_handoff_manifest_shape', passed: manifestAnalysis.status === 'PASSED', detail: manifestAnalysis.checks },
  { name: 'generated_handoff_reference_consistency', passed: referenceAnalysis.status === 'PASSED', detail: referenceAnalysis.checks },
];

const envelope = createProofEnvelope({
  proofKind: 'generated_artifact_drift',
  baselineVersion: meta.version,
  gitCommit: meta.gitCommit,
  proofStatus: checks.every((check) => check.passed) ? 'PASSED' : 'FAILED',
  runtimeMode: 'local_generated_artifact_drift_contract',
  evidence: { checks },
  knownLimitations: ['Static drift proof only; final packaged handoff ZIP is additionally verified during release packaging.'],
});

const outputPath = await writeProofArtifact('generated_artifact_drift', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, checks: envelope.evidence.checks }, null, 2));
process.exit(envelope.proof_status === 'PASSED' ? 0 : 1);
