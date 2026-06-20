#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createProofEnvelope, runCommand, writeProofArtifact } from './proof-utils.mjs';

async function meta() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const git = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: git.stdout.trim() || 'unknown' };
}

const requiredPhrases = [
  'auth/session usable',
  'normalized filters',
  'filter_signature',
  'safe manifest',
  'safe_source_id_hash',
  'file_sha256',
  'no-loop/no-overlap',
  '1,2,3,4,5 -> 1,2,3,4,5',
  'must not include Apple ID',
  'does not claim live iCloud authentication',
];

const docPath = 'docs/20_architecture_and_specs/openspec/real_icloud_filtered_download_manifest_openspec.md';
const doc = await readFile(docPath, 'utf8');
const checks = requiredPhrases.map((phrase) => ({ name: phrase, passed: doc.includes(phrase) }));
const proofStatus = checks.every((check) => check.passed) ? 'PASSED' : 'FAILED';
const { version, gitCommit } = await meta();
const envelope = createProofEnvelope({
  proofKind: 'real_icloud_filtered_download_openspec',
  baselineVersion: version,
  gitCommit,
  proofStatus,
  runtimeMode: 'local_contract',
  evidence: { doc_path: docPath, checks },
  knownLimitations: ['This is an OpenSpec contract proof only; it does not run iCloudPD or download media.'],
});
const outputPath = await writeProofArtifact('real_icloud_filtered_download_openspec', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, checks }, null, 2));
process.exit(envelope.proof_status === 'PASSED' ? 0 : 1);
