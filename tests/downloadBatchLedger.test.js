import test from 'node:test';
import assert from 'node:assert/strict';
import { appendDownloadBatchToLedger, buildEmptyDownloadBatchLedger, buildSampleDownloadBatchLedger, validateDownloadBatchLedger } from '../tools/download-batch-ledger-lib.mjs';

test('download batch ledger validates empty and sample ledgers', () => {
  assert.equal(validateDownloadBatchLedger(buildEmptyDownloadBatchLedger()).status, 'PASSED');
  assert.equal(validateDownloadBatchLedger(buildSampleDownloadBatchLedger()).status, 'PASSED');
});

test('download batch ledger appends without mutating previous records', () => {
  const ledger = buildSampleDownloadBatchLedger();
  const result = appendDownloadBatchToLedger(ledger, {
    batch_id: 'batch_002',
    run_id: 'run_002',
    manifest_hash: 'sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
    item_count: 1,
    appended_at: '2026-01-01T00:04:00.000Z',
  });
  assert.equal(result.status, 'PASSED');
  assert.equal(ledger.batches.length, 1);
  assert.equal(result.ledger.batches.length, 2);
  assert.equal(result.ledger.batches[0].batch_id, 'batch_001');
  assert.match(result.ledger.batches[1].previous_ledger_hash, /^sha256:/);
});

test('download batch ledger rejects duplicate batches and mismatched filters', () => {
  const ledger = buildSampleDownloadBatchLedger();
  const duplicate = appendDownloadBatchToLedger(ledger, {
    batch_id: 'batch_001',
    run_id: 'run_002',
    manifest_hash: 'sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
    item_count: 1,
    appended_at: '2026-01-01T00:04:00.000Z',
  });
  assert.equal(duplicate.status, 'FAILED');
  assert.ok(duplicate.errors.some((error) => error.includes('duplicate batch_id')));

  const mismatched = appendDownloadBatchToLedger(ledger, {
    batch_id: 'batch_002',
    run_id: 'run_002',
    manifest_hash: 'sha256:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    item_count: 1,
    filter_signature: 'sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    appended_at: '2026-01-01T00:05:00.000Z',
  });
  assert.equal(mismatched.status, 'FAILED');
  assert.ok(mismatched.errors.some((error) => error.includes('filter_signature')));
});
