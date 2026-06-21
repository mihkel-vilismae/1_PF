import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGeocodeCacheKey,
  buildProviderSafetyReadiness,
  normalizeGeocodeAddressArtifact,
  validateNormalizedGeocodeAddressArtifact,
} from '../tools/real-geocode-provider-adapter-lib.mjs';

test('Nominatim provider safety blocks without explicit User-Agent', () => {
  const readiness = buildProviderSafetyReadiness({ providerId: 'nominatim_osm', env: {} });
  assert.equal(readiness.proof_status, 'BLOCKED');
  assert.equal(readiness.required_env[0].key, 'GEOCODE_NOMINATIM_OSM_USER_AGENT');
  assert.equal(readiness.required_env[0].configured, false);
  assert.match(readiness.adapter.policy_summary, /User-Agent/);
});

test('Nominatim provider safety passes with explicit User-Agent without exposing its value', () => {
  const readiness = buildProviderSafetyReadiness({
    providerId: 'nominatim_osm',
    env: { GEOCODE_NOMINATIM_OSM_USER_AGENT: 'PF_login-test/0.10.4 contact@example.invalid' },
  });
  assert.equal(readiness.proof_status, 'PASSED');
  assert.equal(readiness.required_env[0].configured, true);
  assert.equal(readiness.required_env[0].value_redacted, '[CONFIGURED]');
  assert.equal(JSON.stringify(readiness).includes('contact@example.invalid'), false);
});

test('normalized geocode address artifact is upload-safe and cache keyed', () => {
  const fixture = { latitude: 59.437, longitude: 24.7536, languageCode: 'en' };
  const providerResult = {
    address_text: 'Tallinn, Harju County, Estonia',
    provider_response: { address: { city: 'Tallinn', country: 'Estonia', country_code: 'ee' } },
  };
  const payload = {
    cache_miss: { provider_id: 'address_cache' },
    cache_hit: { provider_id: 'address_cache' },
    cache_inserted: true,
  };
  const artifact = normalizeGeocodeAddressArtifact({ providerId: 'nominatim_osm', fixture, providerResult, payload });
  assert.equal(artifact.artifact_kind, 'normalized_real_geocode_address');
  assert.equal(artifact.cache.cache_key, buildGeocodeCacheKey({ providerId: 'nominatim_osm', ...fixture }));
  assert.equal(artifact.address.city, 'Tallinn');
  assert.equal(artifact.safety.raw_provider_payload_included, false);
  assert.equal(validateNormalizedGeocodeAddressArtifact(artifact).status, 'PASSED');
});
