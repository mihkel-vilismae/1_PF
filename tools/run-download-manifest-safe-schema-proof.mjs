#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createProofEnvelope, runCommand, writeProofArtifact } from './proof-utils.mjs';
import { buildSampleDownloadManifest, validateDownloadManifestSafeSchema } from './download-manifest-safe-schema-lib.mjs';

async function meta() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const git = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: git.stdout.trim() || 'unknown' };
}
const sample = buildSampleDownloadManifest();
const validation = validateDownloadManifestSafeSchema(sample);
const { version, gitCommit } = await meta();
const envelope = createProofEnvelope({
  proofKind: 'download_manifest_safe_schema',
  baselineVersion: version,
  gitCommit,
  proofStatus: validation.status,
  runtimeMode: 'local_contract',
  evidence: { sample, validation },
  knownLimitations: ['This validates manifest shape only; it does not download real files.'],
});
const outputPath = await writeProofArtifact('download_manifest_safe_schema', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, validation }, null, 2));
process.exit(envelope.proof_status === 'PASSED' ? 0 : 1);
