import test from 'node:test';
import assert from 'node:assert/strict';
import { createIcloudFilterSignature, normalizeIcloudDownloadFilter } from '../tools/icloud-filter-signature-lib.mjs';

test('iCloud filter normalization makes equivalent filters comparable', () => {
  const left = createIcloudFilterSignature({ mediaType: 'photo', recentCount: 5, orderMode: 'newest_first' });
  const right = createIcloudFilterSignature({ limit: 5, order: 'newest_first', media_type: 'photo' });
  assert.deepEqual(left.normalized, right.normalized);
  assert.equal(left.filter_signature, right.filter_signature);
});

test('iCloud filter signature changes when filter intent changes', () => {
  const left = createIcloudFilterSignature({ media_type: 'photo', limit: 5 });
  const right = createIcloudFilterSignature({ media_type: 'photo', limit: 6 });
  assert.notEqual(left.filter_signature, right.filter_signature);
});

test('iCloud filter normalization rejects ambiguous filter values', () => {
  assert.throws(() => normalizeIcloudDownloadFilter({ media_type: 'document' }), /Unsupported media_type/);
  assert.throws(() => normalizeIcloudDownloadFilter({ limit: 0 }), /limit/);
  assert.throws(() => normalizeIcloudDownloadFilter({ date_from: '20-01-01' }), /YYYY-MM-DD/);
});
