#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createProofEnvelope, getProofEnvironment, runCommand, writeProofArtifact } from './proof-utils.mjs';
import { evaluateRealIcloudProofRunbook } from './real-icloud-proof-runbook-lib.mjs';
async function meta() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const git = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: git.stdout.trim() || 'unknown' };
}
const evaluation = evaluateRealIcloudProofRunbook();
const { version, gitCommit } = await meta();
const envelope = createProofEnvelope({
  proofKind: 'real_icloud_proof_runbook',
  baselineVersion: version,
  gitCommit,
  proofStatus: evaluation.proofStatus,
  runtimeMode: 'proof_driven_real_icloud_evidence_path',
  evidence: { environment: getProofEnvironment(), evaluation },
  knownLimitations: ["Documentation/runbook proof only; no provider call or download."],
});
const outputPath = await writeProofArtifact('real_icloud_proof_runbook', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, block_reasons: evaluation.block_reasons ?? [] }, null, 2));
process.exit(envelope.proof_status === 'FAILED' ? 1 : 0);
