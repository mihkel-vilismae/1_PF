#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createProofEnvelope, getProofEnvironment, runCommand, writeProofArtifact } from './proof-utils.mjs';
import { evaluateRealIcloudEvidenceRunPackage } from './real-icloud-evidence-run-package-lib.mjs';
async function meta() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const git = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: git.stdout.trim() || 'unknown' };
}
const evaluation = evaluateRealIcloudEvidenceRunPackage(process.env, { cwd: process.cwd() });
const { version, gitCommit } = await meta();
const envelope = createProofEnvelope({
  proofKind: 'real_icloud_evidence_run_package', baselineVersion: version, gitCommit, proofStatus: evaluation.proofStatus,
  runtimeMode: 'real_icloud_evidence_package_contract', evidence: { environment: getProofEnvironment(), evaluation },
  knownLimitations: ["Grouped evidence package proof; stays BLOCKED until operator-machine evidence is supplied."],
});
const outputPath = await writeProofArtifact('real_icloud_evidence_run_package', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, block_reasons: evaluation.block_reasons ?? [] }, null, 2));
process.exit(envelope.proof_status === 'FAILED' ? 1 : 0);
