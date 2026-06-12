/**
 * Production GPS/geocode placeholder OpenSpec guard.
 * Keeps v1.0 acceptance docs explicit: real GPS extraction and real geocoding
 * are required, while deterministic placeholder geocoding remains test/dev only.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const openSpecPath = 'docs/20_architecture_and_specs/openspec/production_gps_geocode_placeholder_rules_openspec.md';

function read(path) {
  return readFileSync(path, 'utf8');
}

test('production GPS/geocode placeholder OpenSpec exists and defines v1.0 boundary', () => {
  assert.equal(existsSync(openSpecPath), true);
  const spec = read(openSpecPath);
  assert.match(spec, /production v1\.0 must not accept placeholder geocoding as success/i);
  assert.match(spec, /GPS must come from a real extraction provider/i);
  assert.match(spec, /address_cache.*checked before network providers/i);
  assert.match(spec, /deterministic_placeholder.*Not accepted for production v1\.0 success/is);
  assert.match(spec, /Lat: 58\.37763, Lon: 26\.72901/);
  assert.match(spec, /GEOCODE_ALLOW_PLACEHOLDER_FALLBACK=false/);
});

test('OpenSpec classifies real providers and rejects placeholder/cache-only success', () => {
  const spec = read(openSpecPath);
  for (const provider of [
    'nominatim_osm',
    'photon_komoot',
    'postcodes_io_uk',
    'pelias_self_hosted',
    'opencage',
    'geoapify',
    'mapbox',
    'google_geocoding',
  ]) {
    assert.match(spec, new RegExp('`' + provider + '`'));
  }
  assert.match(spec, /Cache-only success where the cached value is placeholder text or has no real-provider provenance/);
  assert.match(spec, /Cache hits where `cached_provider_name` is `deterministic_placeholder`/);
  assert.match(spec, /These rejection rules apply even if the process exits 0/);
});

test('related active docs preserve placeholder test-only and production rejection language', () => {
  const docs = [
    'docs/20_architecture_and_specs/media_pipeline_geocode_provider_chain.md',
    'docs/20_architecture_and_specs/media_pipeline_provider_interfaces.md',
    'docs/10_runbooks/geocode_provider_activation.md',
    'docs/proofs/geocode_provider_proof.md',
    'docs/proofs/address_display_proof.md',
    'docs/proofs/README.md',
  ].map((path) => `${path}\n${read(path)}`).join('\n---\n');

  assert.match(docs, /deterministic_placeholder[\s\S]*test\/dev/i);
  assert.match(docs, /must not count as v1\.0 production geocoding acceptance/i);
  assert.match(docs, /placeholder geocoding is forbidden as success/i);
  assert.match(docs, /coordinate-echo address/i);
  assert.match(docs, /production_gps_geocode_placeholder_rules_openspec\.md/);
});

test('documentation indexes expose the production placeholder OpenSpec', () => {
  for (const path of [
    'docs/20_architecture_and_specs/openspec/README.md',
    'docs/table_of_contents.md',
    'docs/DOC_INDEX.md',
    'docs/DOC_FRESHNESS_MATRIX.md',
  ]) {
    assert.match(read(path), /production_gps_geocode_placeholder_rules_openspec\.md/);
  }
});
