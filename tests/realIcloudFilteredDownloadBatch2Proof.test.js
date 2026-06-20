import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildSampleDownloadManifest } from '../tools/download-manifest-safe-schema-lib.mjs';
import { buildTwoBatchManifest } from '../tools/download-manifest-overlap-check-lib.mjs';
import { evaluateBatchProofFromEnv } from '../tools/real-icloud-filtered-download-batch-proof-lib.mjs';

test('real iCloud batch 2 proof is blocked without a manifest path', () => {
  const result = evaluateBatchProofFromEnv({}, { envVar: 'PF_REAL_ICLOUD_BATCH2_MANIFEST_FILE', expectedBatchIndex: 1, proofLabel: 'batch2' });
  assert.equal(result.proofStatus, 'BLOCKED');
});

test('real iCloud batch 2 proof passes with a two-batch manifest artifact', () => {
  const root = mkdtempSync(join(tmpdir(), 'pf-batch2-'));
  const manifestFile = join(root, 'manifest.json');
  const manifest = buildTwoBatchManifest();
  writeFileSync(manifestFile, JSON.stringify(manifest), 'utf8');
  const result = evaluateBatchProofFromEnv({ PF_REAL_ICLOUD_BATCH2_MANIFEST_FILE: manifestFile }, { envVar: 'PF_REAL_ICLOUD_BATCH2_MANIFEST_FILE', expectedBatchIndex: 1, proofLabel: 'batch2' });
  assert.equal(result.proofStatus, 'PASSED');
  assert.equal(result.manifest_summary.expected_batch_id, 'batch_002');
});

test('real iCloud batch 2 proof fails if the second batch is missing', () => {
  const root = mkdtempSync(join(tmpdir(), 'pf-batch2-missing-'));
  const manifestFile = join(root, 'manifest.json');
  writeFileSync(manifestFile, JSON.stringify(buildSampleDownloadManifest()), 'utf8');
  const result = evaluateBatchProofFromEnv({ PF_REAL_ICLOUD_BATCH2_MANIFEST_FILE: manifestFile }, { envVar: 'PF_REAL_ICLOUD_BATCH2_MANIFEST_FILE', expectedBatchIndex: 1, proofLabel: 'batch2' });
  assert.equal(result.proofStatus, 'FAILED');
  assert.ok(result.block_reasons.some((reason) => reason.includes('batch index 1')));
});
