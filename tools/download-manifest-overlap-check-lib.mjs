import { buildSampleDownloadManifest } from './download-manifest-safe-schema-lib.mjs';

export function buildTwoBatchManifest({ duplicateSecondBatch = false, mismatchedFilter = false } = {}) {
  const manifest = buildSampleDownloadManifest();
  const first = manifest.batches[0];
  const secondItems = duplicateSecondBatch
    ? first.items.map((item, index) => ({ ...item, safe_filename: `COPY_${index + 1}${item.extension}` }))
    : [
        {
          safe_source_id_hash: 'sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
          file_sha256: 'sha256:1111111111111111111111111111111111111111111111111111111111111111',
          safe_filename: 'IMG_0003.jpg',
          extension: '.jpg',
          size_bytes: 345678,
          downloaded_at: '2026-01-01T00:02:10.000Z',
        },
      ];
  manifest.batches.push({
    batch_id: 'batch_002',
    run_id: 'run_002',
    started_at: '2026-01-01T00:02:00.000Z',
    completed_at: '2026-01-01T00:03:00.000Z',
    filter_signature: mismatchedFilter ? 'sha256:9999999999999999999999999999999999999999999999999999999999999999' : manifest.filter_signature,
    downloaded_count: secondItems.length,
    items: secondItems,
  });
  manifest.overlap = checkDownloadManifestOverlap(manifest).overlap;
  return manifest;
}

export function checkDownloadManifestOverlap(manifest) {
  const errors = [];
  const batches = manifest?.batches ?? [];
  if (batches.length < 2) errors.push('at least two batches are required for no-loop proof');
  const filterSignature = manifest?.filter_signature;
  for (const batch of batches) {
    if (batch.filter_signature && batch.filter_signature !== filterSignature) errors.push(`batch ${batch.batch_id} filter_signature does not match manifest filter_signature`);
  }
  const [first, second] = batches;
  const overlap = {
    source_id_overlap_count: countOverlap(first?.items ?? [], second?.items ?? [], 'safe_source_id_hash'),
    file_hash_overlap_count: countOverlap(first?.items ?? [], second?.items ?? [], 'file_sha256'),
    filename_overlap_count: countOverlap(first?.items ?? [], second?.items ?? [], 'safe_filename'),
  };
  if (overlap.source_id_overlap_count > 0) errors.push('batch 2 repeats batch 1 source IDs');
  if (overlap.file_hash_overlap_count > 0) errors.push('batch 2 repeats batch 1 file hashes');
  if (overlap.filename_overlap_count > 0) errors.push('batch 2 repeats batch 1 filenames');
  return { status: errors.length === 0 ? 'PASSED' : 'FAILED', overlap, errors };
}

function countOverlap(leftItems, rightItems, key) {
  const left = new Set(leftItems.map((item) => item?.[key]).filter(Boolean));
  return rightItems.filter((item) => left.has(item?.[key])).length;
}
