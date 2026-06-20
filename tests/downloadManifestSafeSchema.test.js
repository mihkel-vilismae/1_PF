import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSampleDownloadManifest, validateDownloadManifestSafeSchema } from '../tools/download-manifest-safe-schema-lib.mjs';

test('download manifest safe schema accepts redacted manifest', () => {
  const result = validateDownloadManifestSafeSchema(buildSampleDownloadManifest());
  assert.equal(result.status, 'PASSED');
});

test('download manifest safe schema rejects raw media and secret-like fields', () => {
  const manifest = buildSampleDownloadManifest({
    secret_safety: { raw_media_included: true, raw_provider_output_included: true },
    apple_id: 'person@example.com',
  });
  const result = validateDownloadManifestSafeSchema(manifest);
  assert.equal(result.status, 'FAILED');
  assert.ok(result.errors.some((error) => error.includes('raw_media')));
  assert.ok(result.errors.some((error) => error.includes('raw_provider')));
  assert.ok(result.errors.some((error) => error.includes('secret-like')));
});

test('download manifest safe schema rejects broken file records', () => {
  const manifest = buildSampleDownloadManifest();
  manifest.batches[0].items[0].size_bytes = 0;
  manifest.batches[0].items[0].safe_filename = '../private.jpg';
  const result = validateDownloadManifestSafeSchema(manifest);
  assert.equal(result.status, 'FAILED');
  assert.ok(result.errors.some((error) => error.includes('size_bytes')));
  assert.ok(result.errors.some((error) => error.includes('safe_filename')));
});
