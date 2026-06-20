import { createHash } from 'node:crypto';

export const DOWNLOAD_BATCH_LEDGER_SCHEMA_VERSION = 1;
const SAFE_HASH = /^sha256:[a-f0-9]{64}$/i;
const ISO_LIKE = /T/;
const FORBIDDEN_VALUE = /(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|password|passwd|pwd|token|cookie|2fa|two.?factor|icloud\.com|appleid|session_path|\/home\/[^/\s]+|[A-Z]:\\Users\\)/i;

export function hashLedgerPayload(value) {
  return `sha256:${createHash('sha256').update(JSON.stringify(value)).digest('hex')}`;
}

export function buildEmptyDownloadBatchLedger({ filterSignature = 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' } = {}) {
  return {
    schema_version: DOWNLOAD_BATCH_LEDGER_SCHEMA_VERSION,
    proof_kind: 'real_icloud_download_batch_ledger',
    filter_signature: filterSignature,
    append_only: true,
    batches: [],
    secret_safety: { raw_media_included: false, raw_provider_output_included: false, secrets_removed: false },
  };
}

export function buildSampleDownloadBatchLedger() {
  const firstBatch = {
    batch_id: 'batch_001',
    run_id: 'run_001',
    manifest_hash: 'sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    item_count: 2,
    filter_signature: 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    appended_at: '2026-01-01T00:02:00.000Z',
    previous_ledger_hash: null,
  };
  return appendDownloadBatchToLedger(buildEmptyDownloadBatchLedger(), firstBatch).ledger;
}

export function appendDownloadBatchToLedger(ledger, batch) {
  const errors = validateDownloadBatchLedger(ledger).errors;
  if (errors.length) return { status: 'FAILED', errors: [`existing ledger invalid: ${errors.join('; ')}`], ledger };
  const nextBatch = {
    batch_id: String(batch?.batch_id ?? ''),
    run_id: String(batch?.run_id ?? ''),
    manifest_hash: String(batch?.manifest_hash ?? ''),
    item_count: Number(batch?.item_count),
    filter_signature: batch?.filter_signature ?? ledger.filter_signature,
    appended_at: String(batch?.appended_at ?? new Date().toISOString()),
    previous_ledger_hash: ledger.batches.length === 0 ? null : hashLedgerPayload(ledger),
  };
  const next = { ...ledger, batches: [...ledger.batches.map((entry) => ({ ...entry })), nextBatch] };
  const validation = validateDownloadBatchLedger(next);
  return { status: validation.status, errors: validation.errors, ledger: next, appendedBatch: nextBatch };
}

export function validateDownloadBatchLedger(ledger) {
  const errors = [];
  if (!ledger || typeof ledger !== 'object') errors.push('ledger must be an object');
  if (ledger?.schema_version !== DOWNLOAD_BATCH_LEDGER_SCHEMA_VERSION) errors.push('schema_version must be 1');
  if (ledger?.proof_kind !== 'real_icloud_download_batch_ledger') errors.push('proof_kind must be real_icloud_download_batch_ledger');
  if (ledger?.append_only !== true) errors.push('append_only must be true');
  if (!SAFE_HASH.test(ledger?.filter_signature ?? '')) errors.push('filter_signature must be sha256 hash');
  if (!Array.isArray(ledger?.batches)) errors.push('batches must be an array');
  if (ledger?.secret_safety?.raw_media_included !== false) errors.push('raw_media_included must be false');
  if (ledger?.secret_safety?.raw_provider_output_included !== false) errors.push('raw_provider_output_included must be false');
  const seenBatchIds = new Set();
  const seenRunIds = new Set();
  for (const batch of ledger?.batches ?? []) {
    if (typeof batch?.batch_id !== 'string' || !batch.batch_id) errors.push('batch_id is required');
    if (seenBatchIds.has(batch?.batch_id)) errors.push(`duplicate batch_id ${batch.batch_id}`);
    seenBatchIds.add(batch?.batch_id);
    if (typeof batch?.run_id !== 'string' || !batch.run_id) errors.push('run_id is required');
    if (seenRunIds.has(batch?.run_id)) errors.push(`duplicate run_id ${batch.run_id}`);
    seenRunIds.add(batch?.run_id);
    if (!SAFE_HASH.test(batch?.manifest_hash ?? '')) errors.push(`batch ${batch?.batch_id ?? '<unknown>'} manifest_hash must be sha256 hash`);
    if (!Number.isInteger(batch?.item_count) || batch.item_count < 0) errors.push(`batch ${batch?.batch_id ?? '<unknown>'} item_count must be non-negative integer`);
    if (batch?.filter_signature !== ledger?.filter_signature) errors.push(`batch ${batch?.batch_id ?? '<unknown>'} filter_signature must match ledger filter_signature`);
    if (typeof batch?.appended_at !== 'string' || !ISO_LIKE.test(batch.appended_at)) errors.push(`batch ${batch?.batch_id ?? '<unknown>'} appended_at must be ISO-like timestamp`);
    if (batch?.previous_ledger_hash !== null && !SAFE_HASH.test(batch?.previous_ledger_hash ?? '')) errors.push(`batch ${batch?.batch_id ?? '<unknown>'} previous_ledger_hash must be null or sha256 hash`);
  }
  if (containsForbiddenValue(ledger)) errors.push('ledger contains secret-like or raw-provider text');
  return { status: errors.length === 0 ? 'PASSED' : 'FAILED', errors };
}

function containsForbiddenValue(value) {
  if (typeof value === 'string') return FORBIDDEN_VALUE.test(value);
  if (Array.isArray(value)) return value.some(containsForbiddenValue);
  if (value && typeof value === 'object') return Object.values(value).some(containsForbiddenValue);
  return false;
}
