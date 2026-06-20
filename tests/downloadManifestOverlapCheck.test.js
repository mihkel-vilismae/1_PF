import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTwoBatchManifest, checkDownloadManifestOverlap } from '../tools/download-manifest-overlap-check-lib.mjs';

test('download manifest overlap check passes when batch 2 is new content', () => {
  const result = checkDownloadManifestOverlap(buildTwoBatchManifest());
  assert.equal(result.status, 'PASSED');
  assert.equal(result.overlap.source_id_overlap_count, 0);
  assert.equal(result.overlap.file_hash_overlap_count, 0);
});

test('download manifest overlap check fails when batch 2 loops over batch 1 files', () => {
  const result = checkDownloadManifestOverlap(buildTwoBatchManifest({ duplicateSecondBatch: true }));
  assert.equal(result.status, 'FAILED');
  assert.ok(result.errors.some((error) => error.includes('source IDs')));
  assert.ok(result.errors.some((error) => error.includes('file hashes')));
});

test('download manifest overlap check fails when filters differ between batches', () => {
  const result = checkDownloadManifestOverlap(buildTwoBatchManifest({ mismatchedFilter: true }));
  assert.equal(result.status, 'FAILED');
  assert.ok(result.errors.some((error) => error.includes('filter_signature')));
});
