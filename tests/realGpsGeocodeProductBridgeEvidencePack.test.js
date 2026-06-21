import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildSampleDownloadManifest } from '../tools/download-manifest-safe-schema-lib.mjs';
import { normalizeGeocodeAddressArtifact } from '../tools/real-geocode-provider-adapter-lib.mjs';
import {
  buildBridgeEnvLines,
  buildMediaGpsEvidenceTemplate,
  buildNormalizedGeocodeAddressTemplate,
  evaluateRealGpsGeocodeProductBridgeEvidencePack,
  writeRealGpsGeocodeEvidencePack,
} from '../tools/real-gps-geocode-product-bridge-evidence-pack-lib.mjs';

function fixtureDir() { return mkdtempSync(join(tmpdir(), 'pf-gps-geocode-pack-')); }
function writeJson(dir, name, value) { const path = join(dir, name); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`); return path; }

function buildGpsManifest() {
  const manifest = buildSampleDownloadManifest();
  manifest.batches[0].items[0].gps_evidence = {
    latitude: 59.437,
    longitude: 24.7536,
    source_level: 'readiness_approved_gps',
    coordinate_precision: 'redacted_media_metadata',
  };
  return manifest;
}

function buildAddressArtifact() {
  return normalizeGeocodeAddressArtifact({
    providerId: 'nominatim_osm',
    fixture: { latitude: 59.437, longitude: 24.7536, languageCode: 'en' },
    providerResult: {
      address_text: 'Tallinn, Harju County, Estonia',
      provider_response: { address: { city: 'Tallinn', country: 'Estonia', country_code: 'ee' } },
    },
    payload: { cache_inserted: true, cache_miss: { provider_id: 'address_cache' }, cache_hit: { provider_id: 'address_cache' } },
  });
}

test('evidence pack blocks safely without operator evidence while producing actionable missing list', () => {
  const result = evaluateRealGpsGeocodeProductBridgeEvidencePack({}, { cwd: process.cwd() });
  assert.equal(result.proofStatus, 'BLOCKED');
  assert.ok(result.missing_for_bridge.includes('PF_REAL_GPS_GEOCODE_MEDIA_EVIDENCE_FILE or PF_REAL_GPS_GEOCODE_MANIFEST_FILE'));
  assert.ok(result.next_steps.some((step) => /media_gps_evidence_template/.test(step)));
});

test('evidence pack templates are redacted and contain required safe fields', () => {
  const media = buildMediaGpsEvidenceTemplate({ latitude: 59.437, longitude: 24.7536 });
  const address = buildNormalizedGeocodeAddressTemplate({ latitude: 59.437, longitude: 24.7536 });
  assert.equal(media.redaction.private_paths_redacted, true);
  assert.equal(media.redaction.raw_media_included, false);
  assert.equal(address.safety.raw_provider_payload_included, false);
  assert.equal(address.coordinate.latitude, 59.437);
});

test('evidence pack passes when manifest GPS and normalized address evidence are supplied', () => {
  const dir = fixtureDir();
  const manifestPath = writeJson(dir, 'manifest.json', buildGpsManifest());
  const addressPath = writeJson(dir, 'address.json', buildAddressArtifact());
  const result = evaluateRealGpsGeocodeProductBridgeEvidencePack({
    PF_PROOF_ENABLE_REAL_GPS_GEOCODE_PRODUCT_BRIDGE_EVIDENCE_PACK: 'true',
    PF_PROOF_ENABLE_REAL_GPS_GEOCODE_PRODUCT_BRIDGE: 'true',
    PF_REGULAR_WORKER_PRODUCT_WORK_CONFIRMED: 'true',
    PF_REAL_GPS_GEOCODE_MANIFEST_FILE: manifestPath,
    PF_REAL_GPS_GEOCODE_ADDRESS_EVIDENCE_FILE: addressPath,
    PF_REAL_GPS_GEOCODE_SOURCE_KIND: 'readiness_approved_manifest',
  }, { cwd: dir });
  assert.equal(result.proofStatus, 'PASSED');
  assert.equal(result.gps_evidence.status, 'PASSED');
  assert.equal(result.address_gps_validation.status, 'PASSED');
  assert.deepEqual(result.missing_for_bridge, []);
});

test('evidence pack passes with standalone media GPS evidence file', () => {
  const dir = fixtureDir();
  const mediaPath = writeJson(dir, 'media-gps.json', {
    schema_version: 1,
    evidence_kind: 'readiness_approved_media_gps',
    source_kind: 'readiness_approved_manifest',
    media: { media_id: 'safe_media', media_type: 'image', source_provenance: 'readiness_approved' },
    gps: { latitude: 59.437, longitude: 24.7536, source_level: 'readiness_approved_gps' },
    redaction: { private_paths_redacted: true, secrets_redacted: true, raw_media_included: false },
  });
  const addressPath = writeJson(dir, 'address.json', buildAddressArtifact());
  const result = evaluateRealGpsGeocodeProductBridgeEvidencePack({
    PF_PROOF_ENABLE_REAL_GPS_GEOCODE_PRODUCT_BRIDGE_EVIDENCE_PACK: 'true',
    PF_PROOF_ENABLE_REAL_GPS_GEOCODE_PRODUCT_BRIDGE: 'true',
    PF_REGULAR_WORKER_PRODUCT_WORK_CONFIRMED: 'true',
    PF_REAL_GPS_GEOCODE_MEDIA_EVIDENCE_FILE: mediaPath,
    PF_REAL_GPS_GEOCODE_ADDRESS_EVIDENCE_FILE: addressPath,
  }, { cwd: dir });
  assert.equal(result.proofStatus, 'PASSED');
  assert.equal(result.gps_evidence.source, 'media_evidence_file');
});

test('generated latest.env contains exact bridge proof variables', () => {
  const lines = buildBridgeEnvLines({
    mediaEvidencePath: '/repo/runtime_data/operator_evidence/media.json',
    addressEvidencePath: '/repo/runtime_data/operator_evidence/address.json',
    sourceKind: 'readiness_approved_manifest',
  });
  assert.ok(lines.includes('PF_PROOF_ENABLE_REAL_GPS_GEOCODE_PRODUCT_BRIDGE=true'));
  assert.ok(lines.includes('PF_REGULAR_WORKER_PRODUCT_WORK_CONFIRMED=true'));
  assert.ok(lines.some((line) => line.startsWith('PF_REAL_GPS_GEOCODE_MEDIA_EVIDENCE_FILE=')));
  assert.ok(lines.some((line) => line.startsWith('PF_REAL_GPS_GEOCODE_ADDRESS_EVIDENCE_FILE=')));
  assert.ok(lines.some((line) => line.startsWith('PF_NORMALIZED_REAL_GEOCODE_ADDRESS_FILE=')));
});

test('write evidence pack creates templates, latest env, report, and next steps', async () => {
  const out = fixtureDir();
  const result = evaluateRealGpsGeocodeProductBridgeEvidencePack({}, { cwd: process.cwd() });
  const written = await writeRealGpsGeocodeEvidencePack(result, { outputDirectory: out, now: '2026-06-21T00:00:00.000Z' });
  assert.match(readFileSync(written.mediaGpsTemplatePath, 'utf8'), /readiness_approved_media_gps/);
  assert.match(readFileSync(written.normalizedAddressTemplatePath, 'utf8'), /normalized_real_geocode_address/);
  assert.match(readFileSync(written.latestEnvPath, 'utf8'), /PF_PROOF_ENABLE_REAL_GPS_GEOCODE_PRODUCT_BRIDGE=true/);
  assert.match(readFileSync(written.nextStepsPath, 'utf8'), /Review latest.env/);
});

test('coordinate mismatch keeps pack blocked instead of failed shell path', () => {
  const dir = fixtureDir();
  const manifestPath = writeJson(dir, 'manifest.json', buildGpsManifest());
  const address = buildAddressArtifact();
  address.coordinate.latitude = 58.3776;
  const addressPath = writeJson(dir, 'wrong-address.json', address);
  const result = evaluateRealGpsGeocodeProductBridgeEvidencePack({
    PF_PROOF_ENABLE_REAL_GPS_GEOCODE_PRODUCT_BRIDGE_EVIDENCE_PACK: 'true',
    PF_PROOF_ENABLE_REAL_GPS_GEOCODE_PRODUCT_BRIDGE: 'true',
    PF_REGULAR_WORKER_PRODUCT_WORK_CONFIRMED: 'true',
    PF_REAL_GPS_GEOCODE_MANIFEST_FILE: manifestPath,
    PF_REAL_GPS_GEOCODE_ADDRESS_EVIDENCE_FILE: addressPath,
  }, { cwd: dir });
  assert.equal(result.proofStatus, 'BLOCKED');
  assert.match(result.block_reasons.join('; '), /latitude does not match/);
});
