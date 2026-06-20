import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildSampleAuthSessionUsableEvidence } from '../tools/auth-session-usable-evidence-lib.mjs';
import { evaluateRealIcloudDownloadPreflight } from '../tools/real-icloud-download-preflight-lib.mjs';

test('real iCloud download preflight is blocked by default', () => {
  const result = evaluateRealIcloudDownloadPreflight({}, { cwd: process.cwd() });
  assert.equal(result.proofStatus, 'BLOCKED');
  assert.ok(result.block_reasons.some((reason) => reason.includes('explicit_real_download_opt_in')));
});

test('real iCloud download preflight passes with explicit safe prerequisites', () => {
  const root = mkdtempSync(join(tmpdir(), 'pf-preflight-'));
  const downloadDir = join(root, 'downloads');
  mkdirSync(downloadDir);
  const evidenceFile = join(root, 'auth-session.json');
  writeFileSync(evidenceFile, JSON.stringify(buildSampleAuthSessionUsableEvidence()), 'utf8');
  const filter = { mediaType: 'photo', limit: 5, order: 'newest_first' };
  const result = evaluateRealIcloudDownloadPreflight({
    PF_PROOF_ENABLE_REAL_ICLOUD_FILTERED_DOWNLOAD: 'true',
    PF_AUTH_SESSION_USABLE_EVIDENCE_FILE: evidenceFile,
    PF_REAL_ICLOUD_FILTER_JSON: JSON.stringify(filter),
    PF_REAL_ICLOUD_DOWNLOAD_DIR: downloadDir,
    PF_REAL_ICLOUD_DOWNLOAD_LEDGER_FILE: join(root, 'ledger.json'),
  }, { cwd: process.cwd() });
  assert.equal(result.proofStatus, 'PASSED');
  assert.match(result.filter_signature, /^sha256:/);
});

test('real iCloud download preflight blocks secret-like configuration values', () => {
  const result = evaluateRealIcloudDownloadPreflight({
    PF_PROOF_ENABLE_REAL_ICLOUD_FILTERED_DOWNLOAD: 'true',
    PF_REAL_ICLOUD_FILTER_JSON: '{"limit":5}',
    PF_REAL_ICLOUD_DOWNLOAD_DIR: 'token=abc123',
  }, { cwd: process.cwd() });
  assert.equal(result.proofStatus, 'BLOCKED');
  assert.ok(result.block_reasons.some((reason) => reason.includes('preflight_inputs_are_secret_safe')));
});
