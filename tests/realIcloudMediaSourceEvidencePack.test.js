import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildSampleAuthSessionUsableEvidence } from '../tools/auth-session-usable-evidence-lib.mjs';
import { buildSampleDownloadManifest, validateDownloadManifestSafeSchema } from '../tools/download-manifest-safe-schema-lib.mjs';
import {
  buildContinuationEvidenceTemplate,
  buildDownloadEvidenceTemplate,
  buildDownloadManifestTemplate,
  buildRealIcloudEvidencePackEnvLines,
  buildUsableSessionEvidenceTemplate,
  evaluateRealIcloudMediaSourceEvidencePack,
  validateContinuationEvidence,
  validateDownloadEvidence,
  writeRealIcloudMediaSourceEvidencePack,
} from '../tools/real-icloud-media-source-evidence-pack-lib.mjs';

function fixtureDir() { return mkdtempSync(join(tmpdir(), 'pf-icloud-evidence-pack-')); }
function writeJson(dir, name, value) { const path = join(dir, name); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`); return path; }
function sha(char) { return `sha256:${char.repeat(64)}`; }

function buildValidDownloadEvidence() {
  return {
    schema_version: 1,
    evidence_kind: 'real_icloud_download_evidence',
    source_kind: 'real_icloudpd',
    download_status: 'completed',
    manifest_ready: true,
    downloaded_item_count: 2,
    safe_download_run_id: 'safe_run_001',
    manifest_file: 'redacted_manifest.json',
    redaction: {
      private_paths_redacted: true,
      secrets_redacted: true,
      raw_media_included: false,
      raw_provider_output_included: false,
      account_identifiers_included: false,
    },
    observed_at: '2026-06-21T00:00:00.000Z',
  };
}

function buildValidContinuationEvidence() {
  return {
    schema_version: 1,
    evidence_kind: 'real_icloud_download_continuation_evidence',
    continuation_status: 'safe',
    first_run: { downloaded_count: 2, unique_content_count: 2, safe_run_id_hash: sha('a') },
    second_run: { downloaded_count: 2, duplicate_content_added_count: 0, safe_run_id_hash: sha('b') },
    continuation_safe: true,
    redaction: {
      private_paths_redacted: true,
      secrets_redacted: true,
      raw_media_included: false,
      raw_provider_output_included: false,
      account_identifiers_included: false,
    },
    observed_at: '2026-06-21T00:00:00.000Z',
  };
}

test('iCloud evidence pack blocks safely without operator evidence while producing missing list', () => {
  const result = evaluateRealIcloudMediaSourceEvidencePack({}, { cwd: process.cwd() });
  assert.equal(result.proofStatus, 'BLOCKED');
  assert.ok(result.missing_for_real_icloud_media_source.includes('PF_AUTH_SESSION_USABLE_EVIDENCE_FILE'));
  assert.ok(result.missing_for_real_icloud_media_source.includes('PF_REAL_ICLOUD_DOWNLOAD_EVIDENCE_FILE'));
  assert.ok(result.next_steps.some((step) => /auth_session_usable_evidence_template/.test(step)));
});

test('iCloud evidence pack templates are non-claiming and secret-free by default', () => {
  const auth = buildUsableSessionEvidenceTemplate({ now: '2026-06-21T00:00:00.000Z' });
  const download = buildDownloadEvidenceTemplate({ now: '2026-06-21T00:00:00.000Z' });
  const continuation = buildContinuationEvidenceTemplate({ now: '2026-06-21T00:00:00.000Z' });
  const manifest = buildDownloadManifestTemplate({ now: '2026-06-21T00:00:00.000Z' });
  assert.equal(auth.session_state, 'REPLACE_WITH_usable_AFTER_OPERATOR_LOGIN');
  assert.equal(download.download_status, 'REPLACE_WITH_completed_AFTER_REAL_DOWNLOAD');
  assert.equal(download.redaction.raw_media_included, false);
  assert.equal(continuation.continuation_safe, false);
  assert.equal(validateDownloadManifestSafeSchema(manifest).status, 'PASSED');
  assert.equal(manifest.batches[0].items.length, 0);
  const serialized = JSON.stringify({ auth, download, continuation, manifest });
  assert.equal(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(serialized), false);
  assert.equal(/\b\d{6}\b/.test(serialized), false);
});

test('download and continuation evidence validators require real non-claiming facts', () => {
  assert.equal(validateDownloadEvidence(buildDownloadEvidenceTemplate()).status, 'FAILED');
  assert.equal(validateContinuationEvidence(buildContinuationEvidenceTemplate()).status, 'FAILED');
  assert.equal(validateDownloadEvidence(buildValidDownloadEvidence()).status, 'PASSED');
  assert.equal(validateContinuationEvidence(buildValidContinuationEvidence()).status, 'PASSED');
});

test('iCloud evidence pack passes when redacted session, download, manifest, and continuation evidence are supplied', () => {
  const dir = fixtureDir();
  const authPath = writeJson(dir, 'auth.json', buildSampleAuthSessionUsableEvidence());
  const downloadPath = writeJson(dir, 'download.json', buildValidDownloadEvidence());
  const manifestPath = writeJson(dir, 'manifest.json', buildSampleDownloadManifest());
  const continuationPath = writeJson(dir, 'continuation.json', buildValidContinuationEvidence());
  const result = evaluateRealIcloudMediaSourceEvidencePack({
    PF_PROOF_ENABLE_REAL_ICLOUD_MEDIA_SOURCE_EVIDENCE_PACK: 'true',
    PF_AUTH_SESSION_USABLE_EVIDENCE_FILE: authPath,
    PF_REAL_ICLOUD_DOWNLOAD_EVIDENCE_FILE: downloadPath,
    PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE: manifestPath,
    PF_REAL_ICLOUD_CONTINUATION_EVIDENCE_FILE: continuationPath,
  }, { cwd: dir });
  assert.equal(result.proofStatus, 'PASSED');
  assert.deepEqual(result.missing_for_real_icloud_media_source, []);
});

test('iCloud evidence pack blocks unsafe manifest instead of failing shell path', () => {
  const dir = fixtureDir();
  const authPath = writeJson(dir, 'auth.json', buildSampleAuthSessionUsableEvidence());
  const downloadPath = writeJson(dir, 'download.json', buildValidDownloadEvidence());
  const unsafeManifest = buildSampleDownloadManifest({ account: 'operator@example.test' });
  const manifestPath = writeJson(dir, 'unsafe-manifest.json', unsafeManifest);
  const continuationPath = writeJson(dir, 'continuation.json', buildValidContinuationEvidence());
  const result = evaluateRealIcloudMediaSourceEvidencePack({
    PF_PROOF_ENABLE_REAL_ICLOUD_MEDIA_SOURCE_EVIDENCE_PACK: 'true',
    PF_AUTH_SESSION_USABLE_EVIDENCE_FILE: authPath,
    PF_REAL_ICLOUD_DOWNLOAD_EVIDENCE_FILE: downloadPath,
    PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE: manifestPath,
    PF_REAL_ICLOUD_CONTINUATION_EVIDENCE_FILE: continuationPath,
  }, { cwd: dir });
  assert.equal(result.proofStatus, 'BLOCKED');
  assert.match(result.block_reasons.join('; '), /secret-like/);
});

test('latest.env contains exact real iCloud and downstream handoff variables', () => {
  const lines = buildRealIcloudEvidencePackEnvLines({
    authPath: '/repo/auth.json',
    downloadEvidencePath: '/repo/download.json',
    manifestPath: '/repo/manifest.json',
    continuationEvidencePath: '/repo/continuation.json',
    reportPath: '/repo/report.json',
  });
  assert.ok(lines.includes('PF_PROOF_ENABLE_REAL_ICLOUD_MEDIA_SOURCE_EVIDENCE_PACK=true'));
  assert.ok(lines.includes('PF_PROOF_ENABLE_REAL_ICLOUDPD=true'));
  assert.ok(lines.some((line) => line.startsWith('PF_AUTH_SESSION_USABLE_EVIDENCE_FILE=')));
  assert.ok(lines.some((line) => line.startsWith('PF_REAL_ICLOUD_DOWNLOAD_EVIDENCE_FILE=')));
  assert.ok(lines.some((line) => line.startsWith('PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE=')));
  assert.ok(lines.some((line) => line.startsWith('PF_REAL_ICLOUD_BATCH2_MANIFEST_FILE=')));
  assert.ok(lines.some((line) => line.startsWith('PF_REAL_ICLOUD_CONTINUATION_EVIDENCE_FILE=')));
  assert.ok(lines.some((line) => line.startsWith('PF_REGULAR_WORKER_PRODUCT_MANIFEST_FILE=')));
  assert.ok(lines.some((line) => line.startsWith('PF_REAL_GPS_GEOCODE_MANIFEST_FILE=')));
});

test('write iCloud evidence pack creates templates, latest env, report, and next steps', async () => {
  const out = fixtureDir();
  const result = evaluateRealIcloudMediaSourceEvidencePack({}, { cwd: process.cwd() });
  const written = await writeRealIcloudMediaSourceEvidencePack(result, { outputDirectory: out, now: '2026-06-21T00:00:00.000Z' });
  assert.match(readFileSync(written.authSessionTemplatePath, 'utf8'), /auth_session_usable_evidence/);
  assert.match(readFileSync(written.downloadEvidenceTemplatePath, 'utf8'), /real_icloud_download_evidence/);
  assert.match(readFileSync(written.downloadManifestTemplatePath, 'utf8'), /real_icloud_filtered_download_manifest/);
  assert.match(readFileSync(written.continuationEvidenceTemplatePath, 'utf8'), /real_icloud_download_continuation_evidence/);
  assert.match(readFileSync(written.latestEnvPath, 'utf8'), /PF_AUTH_SESSION_USABLE_EVIDENCE_FILE=/);
  assert.match(readFileSync(written.nextStepsPath, 'utf8'), /Review latest.env/);
});
