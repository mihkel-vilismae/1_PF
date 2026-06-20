#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createProofEnvelope, getProofEnvironment, runCommand, writeProofArtifact } from './proof-utils.mjs';
import { evaluateRegularWorkerConsumesDownloadManifest } from './regular-worker-consumes-download-manifest-lib.mjs';
async function meta() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const git = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: git.stdout.trim() || 'unknown' };
}
const evaluation = evaluateRegularWorkerConsumesDownloadManifest(process.env, { cwd: process.cwd() });
const { version, gitCommit } = await meta();
const envelope = createProofEnvelope({
  proofKind: 'regular_worker_consumes_download_manifest',
  baselineVersion: version,
  gitCommit,
  proofStatus: evaluation.proofStatus,
  runtimeMode: 'proof_driven_real_icloud_evidence_path',
  evidence: { environment: getProofEnvironment(), evaluation },
  knownLimitations: ["Worker consumption proof gate; requires opt-in and manifest evidence."],
});
const outputPath = await writeProofArtifact('regular_worker_consumes_download_manifest', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, block_reasons: evaluation.block_reasons ?? [] }, null, 2));
process.exit(envelope.proof_status === 'FAILED' ? 1 : 0);
