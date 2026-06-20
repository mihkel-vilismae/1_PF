import test from 'node:test';
import assert from 'node:assert/strict';
import { checkDownloadManifestOverlap, buildTwoBatchManifest } from '../tools/download-manifest-overlap-check-lib.mjs';
import { validateDownloadManifestSafeSchema } from '../tools/download-manifest-safe-schema-lib.mjs';

test('real iCloud no-loop manifest passes with two unique batches', () => {
  const manifest = buildTwoBatchManifest();
  assert.equal(validateDownloadManifestSafeSchema(manifest).status, 'PASSED');
  const result = checkDownloadManifestOverlap(manifest);
  assert.equal(result.status, 'PASSED');
  assert.equal(result.overlap.source_id_overlap_count, 0);
  assert.equal(result.overlap.file_hash_overlap_count, 0);
  assert.equal(result.overlap.filename_overlap_count, 0);
});

test('real iCloud no-loop manifest fails when batch 2 repeats batch 1 artifacts', () => {
  const manifest = buildTwoBatchManifest({ duplicateSecondBatch: true });
  const result = checkDownloadManifestOverlap(manifest);
  assert.equal(result.status, 'FAILED');
  assert.ok(result.errors.some((error) => error.includes('source IDs')));
  assert.ok(result.errors.some((error) => error.includes('file hashes')));
});

test('real iCloud no-loop manifest fails when batch filters differ', () => {
  const manifest = buildTwoBatchManifest({ mismatchedFilter: true });
  const result = checkDownloadManifestOverlap(manifest);
  assert.equal(result.status, 'FAILED');
  assert.ok(result.errors.some((error) => error.includes('filter_signature')));
});
