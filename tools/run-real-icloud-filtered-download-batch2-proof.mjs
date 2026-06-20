#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createProofEnvelope, getProofEnvironment, runCommand, writeProofArtifact } from './proof-utils.mjs';
import { evaluateBatchProofFromEnv } from './real-icloud-filtered-download-batch-proof-lib.mjs';

async function meta() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const git = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: git.stdout.trim() || 'unknown' };
}
const evaluation = evaluateBatchProofFromEnv(process.env, { envVar: 'PF_REAL_ICLOUD_BATCH2_MANIFEST_FILE', expectedBatchIndex: 1, proofLabel: 'batch2' });
const { version, gitCommit } = await meta();
const envelope = createProofEnvelope({
  proofKind: 'real_icloud_filtered_download_batch2',
  baselineVersion: version,
  gitCommit,
  proofStatus: evaluation.proofStatus,
  runtimeMode: 'real_provider_artifact_contract',
  evidence: { environment: getProofEnvironment(), evaluation },
  knownLimitations: [
    'This proof consumes a real-download manifest artifact; it does not itself call iCloud or download media.',
    'It validates that a second batch artifact exists; no-overlap comparison is performed by proof:real-icloud-download-no-loop.',
  ],
});
const outputPath = await writeProofArtifact('real_icloud_filtered_download_batch2', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, evaluation }, null, 2));
process.exit(envelope.proof_status === 'FAILED' ? 1 : 0);
