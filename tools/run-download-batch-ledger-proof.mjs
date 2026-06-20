#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createProofEnvelope, runCommand, writeProofArtifact } from './proof-utils.mjs';
import { appendDownloadBatchToLedger, buildEmptyDownloadBatchLedger, buildSampleDownloadBatchLedger, validateDownloadBatchLedger } from './download-batch-ledger-lib.mjs';

async function meta() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const git = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: git.stdout.trim() || 'unknown' };
}

const empty = buildEmptyDownloadBatchLedger();
const sample = buildSampleDownloadBatchLedger();
const initialBatchIds = sample.batches.map((batch) => batch.batch_id);
const appendResult = appendDownloadBatchToLedger(sample, {
  batch_id: 'batch_002',
  run_id: 'run_002',
  manifest_hash: 'sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
  item_count: 3,
  appended_at: '2026-01-01T00:04:00.000Z',
});
const duplicateResult = appendDownloadBatchToLedger(sample, {
  batch_id: 'batch_001',
  run_id: 'run_003',
  manifest_hash: 'sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
  item_count: 1,
  appended_at: '2026-01-01T00:05:00.000Z',
});
const mismatchedFilterResult = appendDownloadBatchToLedger(sample, {
  batch_id: 'batch_003',
  run_id: 'run_003',
  manifest_hash: 'sha256:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  item_count: 1,
  filter_signature: 'sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
  appended_at: '2026-01-01T00:05:00.000Z',
});
const checks = [
  { name: 'empty_ledger_is_valid', passed: validateDownloadBatchLedger(empty).status === 'PASSED' },
  { name: 'sample_ledger_is_valid', passed: validateDownloadBatchLedger(sample).status === 'PASSED' },
  { name: 'append_preserves_existing_batch_order', passed: appendResult.status === 'PASSED' && appendResult.ledger.batches[0].batch_id === initialBatchIds[0] && sample.batches.length === 1 },
  { name: 'duplicate_batch_id_fails', passed: duplicateResult.status === 'FAILED' && duplicateResult.errors.some((error) => error.includes('duplicate batch_id')) },
  { name: 'mismatched_filter_fails', passed: mismatchedFilterResult.status === 'FAILED' && mismatchedFilterResult.errors.some((error) => error.includes('filter_signature')) },
];
const { version, gitCommit } = await meta();
const proofStatus = checks.every((check) => check.passed) ? 'PASSED' : 'FAILED';
const envelope = createProofEnvelope({
  proofKind: 'download_batch_ledger',
  baselineVersion: version,
  gitCommit,
  proofStatus,
  runtimeMode: 'local_ledger_contract',
  evidence: { checks, empty, sample, appendResult, duplicateResult, mismatchedFilterResult },
  knownLimitations: ['This validates append-only ledger rules only; live iCloud download evidence is added by later real-provider proofs.'],
});
const outputPath = await writeProofArtifact('download_batch_ledger', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, checks }, null, 2));
process.exit(envelope.proof_status === 'PASSED' ? 0 : 1);
