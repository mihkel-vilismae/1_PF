#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createProofEnvelope, runCommand, writeProofArtifact } from './proof-utils.mjs';
import { createIcloudFilterSignature } from './icloud-filter-signature-lib.mjs';

async function meta() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const git = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: git.stdout.trim() || 'unknown' };
}

const first = createIcloudFilterSignature({ mediaType: 'photo', recentCount: 5, orderMode: 'newest_first' });
const equivalent = createIcloudFilterSignature({ order: 'newest_first', limit: 5, media_type: 'photo' });
const changed = createIcloudFilterSignature({ media_type: 'photo', limit: 10, order: 'newest_first' });
const checks = [
  { name: 'equivalent_filters_share_signature', passed: first.filter_signature === equivalent.filter_signature },
  { name: 'changed_limit_changes_signature', passed: first.filter_signature !== changed.filter_signature },
  { name: 'signature_uses_sha256_prefix', passed: /^sha256:[a-f0-9]{64}$/.test(first.filter_signature) },
  { name: 'canonical_json_excludes_secrets', passed: !/(password|token|cookie|apple|2fa|code)/i.test(first.canonical_json) },
];
const proofStatus = checks.every((check) => check.passed) ? 'PASSED' : 'FAILED';
const { version, gitCommit } = await meta();
const envelope = createProofEnvelope({
  proofKind: 'icloud_filter_signature',
  baselineVersion: version,
  gitCommit,
  proofStatus,
  runtimeMode: 'local_contract',
  evidence: { first, equivalent, changed, checks },
  knownLimitations: ['This proves filter normalization/signature behavior only; it does not query iCloud or download files.'],
});
const outputPath = await writeProofArtifact('icloud_filter_signature', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, checks }, null, 2));
process.exit(envelope.proof_status === 'PASSED' ? 0 : 1);
