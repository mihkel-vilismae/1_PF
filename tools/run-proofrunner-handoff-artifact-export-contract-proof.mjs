#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createProofEnvelope, getProofEnvironment, runCommand, writeProofArtifact } from './proof-utils.mjs';
import { analyzeHandoffLauncherArtifactExportText, buildAcceptedArtifactExportSnippet } from './proofrunner-handoff-artifact-export-contract-lib.mjs';

async function metadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const git = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: git.stdout.trim() || 'unknown' };
}

const analysis = analyzeHandoffLauncherArtifactExportText(buildAcceptedArtifactExportSnippet());
const meta = await metadata();
const envelope = createProofEnvelope({
  proofKind: 'proofrunner_handoff_artifact_export_contract',
  baselineVersion: meta.version,
  gitCommit: meta.gitCommit,
  proofStatus: analysis.status,
  runtimeMode: 'local_handoff_contract_validation',
  evidence: {
    environment: getProofEnvironment(),
    checks: analysis.checks,
    required_launcher_contracts: [
      'pass PF_PROOF_SUMMARY_PATH to proof:proof-runner-final-summary',
      'record proof_scripts_failed_exit_nonzero in repo_identity.json',
      'package logs and runtime_data/proofs even when one proof command fails',
    ],
  },
  knownLimitations: ['Static handoff contract proof only; live Windows/Raspberry proofrunner execution remains operator-supplied.'],
});
const outputPath = await writeProofArtifact('proofrunner_handoff_artifact_export_contract', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, checks: envelope.evidence.checks }, null, 2));
process.exit(envelope.proof_status === 'PASSED' ? 0 : 1);
