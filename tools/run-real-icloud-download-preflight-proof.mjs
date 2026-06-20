#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createProofEnvelope, getProofEnvironment, runCommand, writeProofArtifact } from './proof-utils.mjs';
import { evaluateRealIcloudDownloadPreflight, REAL_ICLOUD_DOWNLOAD_PREFLIGHT_PROOF_KIND } from './real-icloud-download-preflight-lib.mjs';

async function meta() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const git = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: git.stdout.trim() || 'unknown' };
}
const evaluation = evaluateRealIcloudDownloadPreflight(process.env, { cwd: process.cwd() });
const { version, gitCommit } = await meta();
const envelope = createProofEnvelope({
  proofKind: REAL_ICLOUD_DOWNLOAD_PREFLIGHT_PROOF_KIND,
  baselineVersion: version,
  gitCommit,
  proofStatus: evaluation.proofStatus,
  runtimeMode: 'real_provider_preflight_no_download',
  evidence: { environment: getProofEnvironment(), evaluation },
  knownLimitations: [
    'This proof performs no iCloud provider call and downloads no files.',
    'It passes only when explicit real-download opt-in, usable auth-session evidence, normalized filters, download directory, and ledger path are present.',
  ],
});
const outputPath = await writeProofArtifact(REAL_ICLOUD_DOWNLOAD_PREFLIGHT_PROOF_KIND, envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, block_reasons: evaluation.block_reasons }, null, 2));
process.exit(envelope.proof_status === 'FAILED' ? 1 : 0);
