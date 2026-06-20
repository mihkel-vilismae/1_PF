#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createProofEnvelope, getProofEnvironment, runCommand, writeProofArtifact } from './proof-utils.mjs';
import { readManifestFile } from './real-icloud-filtered-download-batch-proof-lib.mjs';
import { validateDownloadManifestSafeSchema } from './download-manifest-safe-schema-lib.mjs';
import { checkDownloadManifestOverlap } from './download-manifest-overlap-check-lib.mjs';

async function meta() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const git = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: git.stdout.trim() || 'unknown' };
}

function evaluateNoLoop(env = process.env, { cwd = process.cwd() } = {}) {
  const manifestPath = env.PF_REAL_ICLOUD_NO_LOOP_MANIFEST_FILE;
  const { manifest, reason } = readManifestFile(manifestPath, { cwd });
  if (!manifest) return { proofStatus: 'BLOCKED', manifest_path_configured: Boolean(manifestPath), block_reasons: [reason], schema: null, overlap: null };
  const schema = validateDownloadManifestSafeSchema(manifest);
  const overlap = checkDownloadManifestOverlap(manifest);
  const errors = [...schema.errors, ...overlap.errors];
  return {
    proofStatus: errors.length ? 'FAILED' : 'PASSED',
    manifest_path_configured: true,
    manifest_summary: {
      filter_signature: manifest.filter_signature ?? null,
      batch_count: manifest.batches?.length ?? 0,
      batch_ids: (manifest.batches ?? []).map((batch) => batch.batch_id),
      total_items: (manifest.batches ?? []).reduce((sum, batch) => sum + (batch.items?.length ?? 0), 0),
    },
    schema,
    overlap,
    block_reasons: errors,
  };
}

const evaluation = evaluateNoLoop(process.env, { cwd: process.cwd() });
const { version, gitCommit } = await meta();
const envelope = createProofEnvelope({
  proofKind: 'real_icloud_download_no_loop',
  baselineVersion: version,
  gitCommit,
  proofStatus: evaluation.proofStatus,
  runtimeMode: 'real_provider_artifact_no_loop_contract',
  evidence: { environment: getProofEnvironment(), evaluation },
  knownLimitations: ['This proof consumes safe manifest artifacts; it does not call iCloud or download files itself.'],
});
const outputPath = await writeProofArtifact('real_icloud_download_no_loop', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, evaluation }, null, 2));
process.exit(envelope.proof_status === 'FAILED' ? 1 : 0);
