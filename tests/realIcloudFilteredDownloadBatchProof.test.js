import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSampleDownloadManifest } from '../tools/download-manifest-safe-schema-lib.mjs';
import { buildTwoBatchManifest } from '../tools/download-manifest-overlap-check-lib.mjs';
import { validateRealIcloudFilteredDownloadBatch } from '../tools/real-icloud-filtered-download-batch-proof-lib.mjs';

test('real iCloud batch 1 proof validates a safe manifest first batch', () => {
  const manifest = buildSampleDownloadManifest();
  const result = validateRealIcloudFilteredDownloadBatch({ manifest, expectedBatchIndex: 0, expectedFilterSignature: manifest.filter_signature });
  assert.equal(result.status, 'PASSED');
  assert.equal(result.batch.batch_id, 'batch_001');
});

test('real iCloud batch proof fails when expected batch is missing', () => {
  const manifest = buildSampleDownloadManifest();
  const result = validateRealIcloudFilteredDownloadBatch({ manifest, expectedBatchIndex: 1 });
  assert.equal(result.status, 'FAILED');
  assert.ok(result.errors.some((error) => error.includes('batch index 1')));
});

test('real iCloud batch proof validates a second batch from a two-batch manifest', () => {
  const manifest = buildTwoBatchManifest();
  const result = validateRealIcloudFilteredDownloadBatch({ manifest, expectedBatchIndex: 1, expectedFilterSignature: manifest.filter_signature });
  assert.equal(result.status, 'PASSED');
  assert.equal(result.batch.batch_id, 'batch_002');
});

test('real iCloud batch proof fails on filter signature mismatch', () => {
  const manifest = buildSampleDownloadManifest();
  const result = validateRealIcloudFilteredDownloadBatch({
    manifest,
    expectedBatchIndex: 0,
    expectedFilterSignature: 'sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
  });
  assert.equal(result.status, 'FAILED');
  assert.ok(result.errors.some((error) => error.includes('expected filter')));
});
