/**
 * Verifies GPS/geocode enrichment preserves worker runtime proof authority.
 * Covers valid bridge evidence and instrumentation-only rejection.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildSampleDownloadManifest } from '../tools/download-manifest-safe-schema-lib.mjs';
import { normalizeGeocodeAddressArtifact } from '../tools/real-geocode-provider-adapter-lib.mjs';
import {
  evaluateRealGpsGeocodeProductBridge,
  resolveRealGpsSourceEvidence,
  validateMediaGpsEvidence,
} from '../tools/real-gps-geocode-product-bridge-lib.mjs';

/** Creates an isolated bridge fixture directory. */
function fixtureDir() { return mkdtempSync(join(tmpdir(), 'pf-gps-geocode-bridge-')); }
/** Writes one JSON fixture and returns its path. */
function writeJson(dir, name, value) { const path = join(dir, name); writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`); return path; }
/** Writes product-capable regular-worker runtime status with optional overrides. */
function writeWorkerStatus(dir, overrides = {}) {
  return writeJson(dir, 'regular-worker-status.json', {
    worker: 'regular_stage_worker',
    status: 'succeeded',
    invocation_observed: true,
    implementationStatus: 'product_work_implemented',
    productWork: { claimed: true, runId: 'runtime-bridge-run' },
    finishedAt: '2026-06-21T00:00:00.000Z',
    ...overrides,
  });
}

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
  const artifact = normalizeGeocodeAddressArtifact({
    providerId: 'nominatim_osm',
    fixture: { latitude: 59.437, longitude: 24.7536, languageCode: 'en' },
    providerResult: {
      address_text: 'Tallinn, Harju County, Estonia',
      provider_response: { address: { city: 'Tallinn', country: 'Estonia', country_code: 'ee' } },
    },
    payload: { cache_inserted: true, cache_miss: { provider_id: 'address_cache' }, cache_hit: { provider_id: 'address_cache' } },
  });
  return { ...artifact, source_level: 'readiness_approved_gps' };
}

test('real GPS geocode product bridge is blocked without opt-in and evidence', () => {
  const result = evaluateRealGpsGeocodeProductBridge({}, { cwd: process.cwd() });
  assert.equal(result.proofStatus, 'BLOCKED');
  assert.ok(result.block_reasons.some((reason) => /PF_PROOF_ENABLE_REAL_GPS_GEOCODE_PRODUCT_BRIDGE/.test(reason)));
});

test('bridge resolves GPS from redacted readiness manifest and writes enriched product evidence', () => {
  const dir = fixtureDir();
  const manifestPath = writeJson(dir, 'manifest.json', buildGpsManifest());
  const addressPath = writeJson(dir, 'address.json', buildAddressArtifact());
  const workerStatusPath = writeWorkerStatus(dir);
  const result = evaluateRealGpsGeocodeProductBridge({
    PF_PROOF_ENABLE_REAL_GPS_GEOCODE_PRODUCT_BRIDGE: 'true',
    PF_REAL_GPS_GEOCODE_MANIFEST_FILE: manifestPath,
    PF_REAL_GPS_GEOCODE_ADDRESS_EVIDENCE_FILE: addressPath,
    PF_REGULAR_WORKER_RUNTIME_STATUS_FILE: workerStatusPath,
    PF_REAL_GPS_GEOCODE_SOURCE_KIND: 'readiness_approved_manifest',
    PF_REAL_GPS_GEOCODE_PRODUCT_BRIDGE_RUN_ID: 'bridge-test-run',
  }, { cwd: dir, now: '2026-06-21T00:00:00.000Z' });
  assert.equal(result.proofStatus, 'PASSED');
  assert.equal(result.gps_evidence.status, 'PASSED');
  assert.equal(result.address_validation.status, 'PASSED');
  assert.equal(result.product_pipeline_evidence.gps_extraction_completed, true);
  assert.equal(result.product_pipeline_evidence.geocode_completed, true);
  assert.equal(result.product_pipeline_evidence.product_record.gps_status, 'present');
  assert.equal(result.product_pipeline_evidence.product_record.geocode_status, 'present');
  assert.equal(result.product_pipeline_evidence.geocode_bridge.non_claims.address_overlay_visibility_claimed, false);
  assert.equal(result.structured_evaluation.enrichedComplete, true);
});

test('bridge accepts a standalone readiness media GPS evidence file', () => {
  const dir = fixtureDir();
  const manifestPath = writeJson(dir, 'manifest.json', buildGpsManifest());
  const addressPath = writeJson(dir, 'address.json', buildAddressArtifact());
  const workerStatusPath = writeWorkerStatus(dir);
  const mediaEvidencePath = writeJson(dir, 'media-gps.json', {
    schema_version: 1,
    evidence_kind: 'readiness_approved_media_gps',
    source_kind: 'readiness_approved_manifest',
    media: { media_id: 'safe_media', media_type: 'image', source_provenance: 'readiness_approved' },
    gps: { latitude: 59.437, longitude: 24.7536, source_level: 'readiness_approved_gps' },
    redaction: { private_paths_redacted: true, secrets_redacted: true, raw_media_included: false },
  });
  assert.equal(validateMediaGpsEvidence(JSON.parse(JSON.stringify({
    schema_version: 1,
    evidence_kind: 'readiness_approved_media_gps',
    source_kind: 'readiness_approved_manifest',
    gps: { latitude: 59.437, longitude: 24.7536, source_level: 'readiness_approved_gps' },
    redaction: { private_paths_redacted: true, secrets_redacted: true, raw_media_included: false },
  }))).status, 'PASSED');
  const result = evaluateRealGpsGeocodeProductBridge({
    PF_PROOF_ENABLE_REAL_GPS_GEOCODE_PRODUCT_BRIDGE: 'true',
    PF_REGULAR_WORKER_PRODUCT_MANIFEST_FILE: manifestPath,
    PF_REAL_GPS_GEOCODE_MEDIA_EVIDENCE_FILE: mediaEvidencePath,
    PF_REAL_GPS_GEOCODE_ADDRESS_EVIDENCE_FILE: addressPath,
    PF_REGULAR_WORKER_RUNTIME_STATUS_FILE: workerStatusPath,
  }, { cwd: dir, now: '2026-06-21T00:00:00.000Z' });
  assert.equal(result.proofStatus, 'PASSED');
  assert.equal(result.gps_evidence.source, 'media_evidence_file');
});

test('bridge fails when normalized address coordinate does not match GPS evidence', () => {
  const dir = fixtureDir();
  const manifestPath = writeJson(dir, 'manifest.json', buildGpsManifest());
  const wrongAddress = buildAddressArtifact();
  wrongAddress.coordinate.latitude = 58.3776;
  const addressPath = writeJson(dir, 'wrong-address.json', wrongAddress);
  const workerStatusPath = writeWorkerStatus(dir);
  const result = evaluateRealGpsGeocodeProductBridge({
    PF_PROOF_ENABLE_REAL_GPS_GEOCODE_PRODUCT_BRIDGE: 'true',
    PF_REAL_GPS_GEOCODE_MANIFEST_FILE: manifestPath,
    PF_REAL_GPS_GEOCODE_ADDRESS_EVIDENCE_FILE: addressPath,
    PF_REGULAR_WORKER_RUNTIME_STATUS_FILE: workerStatusPath,
  }, { cwd: dir });
  assert.equal(result.proofStatus, 'BLOCKED');
  assert.match(result.address_validation.errors.join('; '), /latitude does not match/);
});

test('bridge cannot promote instrumentation-only runtime with a manual confirmation flag', () => {
  const dir = fixtureDir();
  const manifestPath = writeJson(dir, 'manifest.json', buildGpsManifest());
  const addressPath = writeJson(dir, 'address.json', buildAddressArtifact());
  const workerStatusPath = writeWorkerStatus(dir, {
    implementationStatus: 'instrumentation_only',
    productWork: { claimed: false },
  });
  const result = evaluateRealGpsGeocodeProductBridge({
    PF_PROOF_ENABLE_REAL_GPS_GEOCODE_PRODUCT_BRIDGE: 'true',
    PF_REGULAR_WORKER_PRODUCT_WORK_CONFIRMED: 'true',
    PF_REAL_GPS_GEOCODE_MANIFEST_FILE: manifestPath,
    PF_REAL_GPS_GEOCODE_ADDRESS_EVIDENCE_FILE: addressPath,
    PF_REGULAR_WORKER_RUNTIME_STATUS_FILE: workerStatusPath,
  }, { cwd: dir });

  assert.equal(result.proofStatus, 'BLOCKED');
  assert.equal(result.worker_runtime_evidence.confirmed, false);
  assert.equal(result.product_pipeline_evidence.readiness.regular_worker_product_pipeline_satisfied, false);
  assert.equal(result.product_pipeline_evidence.readiness.v1_gate_satisfied, false);
  assert.match(result.block_reasons.join('; '), /instrumentation_only/);
});

test('manifest GPS resolver refuses selected media without GPS evidence', () => {
  const result = resolveRealGpsSourceEvidence({ manifest: buildSampleDownloadManifest(), sourceKind: 'readiness_approved_manifest' });
  assert.equal(result.status, 'FAILED');
  assert.match(result.errors.join('; '), /does not include accepted GPS evidence/);
});
