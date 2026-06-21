#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createProofEnvelope, getProofEnvironment, runCommand, writeProofArtifact } from './proof-utils.mjs';
import { evaluateRealIcloudEvidenceZipContract } from './real-icloud-evidence-zip-contract-lib.mjs';
async function meta() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const git = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: git.stdout.trim() || 'unknown' };
}
const evaluation = evaluateRealIcloudEvidenceZipContract(process.env, { cwd: process.cwd() });
const { version, gitCommit } = await meta();
const envelope = createProofEnvelope({
  proofKind: 'real_icloud_evidence_zip_contract', baselineVersion: version, gitCommit, proofStatus: evaluation.proofStatus,
  runtimeMode: 'real_icloud_evidence_package_contract', evidence: { environment: getProofEnvironment(), evaluation },
  knownLimitations: ["Validates evidence ZIP/package manifest contract; does not extract private media or secrets."],
});
const outputPath = await writeProofArtifact('real_icloud_evidence_zip_contract', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, block_reasons: evaluation.block_reasons ?? [] }, null, 2));
process.exit(envelope.proof_status === 'FAILED' ? 1 : 0);
