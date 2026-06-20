#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createProofEnvelope, runCommand, writeProofArtifact } from './proof-utils.mjs';
import { buildTwoBatchManifest, checkDownloadManifestOverlap } from './download-manifest-overlap-check-lib.mjs';

async function meta() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const git = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: git.stdout.trim() || 'unknown' };
}
const safeManifest = buildTwoBatchManifest();
const duplicateManifest = buildTwoBatchManifest({ duplicateSecondBatch: true });
const mismatchedManifest = buildTwoBatchManifest({ mismatchedFilter: true });
const safe = checkDownloadManifestOverlap(safeManifest);
const duplicate = checkDownloadManifestOverlap(duplicateManifest);
const mismatched = checkDownloadManifestOverlap(mismatchedManifest);
const checks = [
  { name: 'safe_manifest_has_zero_overlap', passed: safe.status === 'PASSED' && safe.overlap.file_hash_overlap_count === 0 },
  { name: 'duplicate_second_batch_fails', passed: duplicate.status === 'FAILED' && duplicate.overlap.file_hash_overlap_count > 0 },
  { name: 'mismatched_filter_fails', passed: mismatched.status === 'FAILED' && mismatched.errors.some((error) => error.includes('filter_signature')) },
];
const { version, gitCommit } = await meta();
const proofStatus = checks.every((check) => check.passed) ? 'PASSED' : 'FAILED';
const envelope = createProofEnvelope({
  proofKind: 'download_manifest_overlap_check',
  baselineVersion: version,
  gitCommit,
  proofStatus,
  runtimeMode: 'local_contract',
  evidence: { checks, safe, duplicate, mismatched },
  knownLimitations: ['This validates local manifest comparison logic only; live provider batches are added in later slices.'],
});
const outputPath = await writeProofArtifact('download_manifest_overlap_check', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, checks }, null, 2));
process.exit(envelope.proof_status === 'PASSED' ? 0 : 1);
