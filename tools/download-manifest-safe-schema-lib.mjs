export const DOWNLOAD_MANIFEST_SCHEMA_VERSION = 1;
const SAFE_HASH = /^sha256:[a-f0-9]{64}$/i;
const SAFE_EXTENSION = /^\.[a-z0-9]{1,12}$/i;
const FORBIDDEN_VALUE = /(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|password|passwd|pwd|token|cookie|2fa|two.?factor|icloud\.com|appleid|session_path)/i;

export function buildSampleDownloadManifest(overrides = {}) {
  return {
    schema_version: DOWNLOAD_MANIFEST_SCHEMA_VERSION,
    proof_kind: 'real_icloud_filtered_download_manifest',
    filter_signature: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    batches: [
      {
        batch_id: 'batch_001',
        run_id: 'run_001',
        started_at: '2026-01-01T00:00:00.000Z',
        completed_at: '2026-01-01T00:01:00.000Z',
        downloaded_count: 2,
        items: [
          {
            safe_source_id_hash: 'sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
            file_sha256: 'sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
            safe_filename: 'IMG_0001.jpg',
            extension: '.jpg',
            size_bytes: 123456,
            downloaded_at: '2026-01-01T00:00:10.000Z',
          },
          {
            safe_source_id_hash: 'sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
            file_sha256: 'sha256:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            safe_filename: 'IMG_0002.jpg',
            extension: '.jpg',
            size_bytes: 234567,
            downloaded_at: '2026-01-01T00:00:20.000Z',
          },
        ],
      },
    ],
    overlap: { source_id_overlap_count: 0, file_hash_overlap_count: 0, filename_overlap_count: 0 },
    secret_safety: { raw_media_included: false, raw_provider_output_included: false, secrets_removed: false },
    ...overrides,
  };
}

export function validateDownloadManifestSafeSchema(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== 'object') errors.push('manifest must be an object');
  if (manifest?.schema_version !== DOWNLOAD_MANIFEST_SCHEMA_VERSION) errors.push('schema_version must be 1');
  if (manifest?.proof_kind !== 'real_icloud_filtered_download_manifest') errors.push('proof_kind must be real_icloud_filtered_download_manifest');
  if (!SAFE_HASH.test(manifest?.filter_signature ?? '')) errors.push('filter_signature must be sha256 hash');
  if (!Array.isArray(manifest?.batches) || manifest.batches.length === 0) errors.push('batches must be a non-empty array');
  if (manifest?.secret_safety?.raw_media_included !== false) errors.push('raw_media_included must be false');
  if (manifest?.secret_safety?.raw_provider_output_included !== false) errors.push('raw_provider_output_included must be false');
  for (const batch of manifest?.batches ?? []) {
    if (typeof batch.batch_id !== 'string' || !batch.batch_id) errors.push('batch_id is required');
    if (!Array.isArray(batch.items)) errors.push(`batch ${batch.batch_id ?? '<unknown>'} items must be an array`);
    if (Number(batch.downloaded_count) !== (batch.items?.length ?? NaN)) errors.push(`batch ${batch.batch_id ?? '<unknown>'} downloaded_count must match items length`);
    for (const item of batch.items ?? []) validateManifestItem(item, errors);
  }
  if (containsForbiddenValue(manifest)) errors.push('manifest contains secret-like or raw-provider text');
  return { status: errors.length === 0 ? 'PASSED' : 'FAILED', errors };
}

function validateManifestItem(item, errors) {
  if (!SAFE_HASH.test(item?.safe_source_id_hash ?? '')) errors.push('item.safe_source_id_hash must be sha256 hash');
  if (!SAFE_HASH.test(item?.file_sha256 ?? '')) errors.push('item.file_sha256 must be sha256 hash');
  if (!SAFE_EXTENSION.test(item?.extension ?? '')) errors.push('item.extension must be a safe extension');
  if (!Number.isInteger(item?.size_bytes) || item.size_bytes <= 0) errors.push('item.size_bytes must be positive integer');
  if (typeof item?.downloaded_at !== 'string' || !item.downloaded_at.includes('T')) errors.push('item.downloaded_at must be ISO-like timestamp');
  if (typeof item?.safe_filename !== 'string' || item.safe_filename.includes('/') || item.safe_filename.includes('\\')) errors.push('item.safe_filename must be basename only');
}

function containsForbiddenValue(value) {
  if (typeof value === 'string') {
    if (SAFE_HASH.test(value)) return false;
    return FORBIDDEN_VALUE.test(value);
  }
  if (Array.isArray(value)) return value.some(containsForbiddenValue);
  if (value && typeof value === 'object') return Object.values(value).some(containsForbiddenValue);
  return false;
}
