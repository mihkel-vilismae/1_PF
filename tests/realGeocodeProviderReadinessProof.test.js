import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRealGeocodeProviderReadinessProof } from '../tools/real-geocode-provider-readiness-proof-lib.mjs';

const metadata = { version: 'test', gitCommit: 'test' };

test('real geocode provider readiness blocks without opt-in and provider id', () => {
  const envelope = buildRealGeocodeProviderReadinessProof({ metadata, env: {} });
  assert.equal(envelope.proof_status, 'BLOCKED');
  assert.equal(envelope.evidence.checks.find((check) => check.name === 'real_geocode_opt_in_set').passed, false);
  assert.ok(envelope.evidence.readiness.supported_provider_ids.includes('nominatim_osm'));
});

test('real geocode provider readiness blocks when provider safety env is missing', () => {
  const envelope = buildRealGeocodeProviderReadinessProof({ metadata, env: { PF_PROOF_ENABLE_REAL_GEOCODE_CHAIN: 'true', PF_GEOCODE_CHAIN_PROOF_PROVIDER: 'nominatim_osm' } });
  assert.equal(envelope.proof_status, 'BLOCKED');
  assert.equal(envelope.evidence.checks.find((check) => check.name === 'provider_safety_configured').passed, false);
  assert.equal(envelope.evidence.readiness.provider_safety.required_env[0].key, 'GEOCODE_NOMINATIM_OSM_USER_AGENT');
  assert.equal(envelope.evidence.readiness.provider_safety.required_env[0].configured, false);
});

test('real geocode provider readiness passes for supported configured provider without network call', () => {
  const envelope = buildRealGeocodeProviderReadinessProof({
    metadata,
    env: {
      PF_PROOF_ENABLE_REAL_GEOCODE_CHAIN: 'true',
      PF_GEOCODE_CHAIN_PROOF_PROVIDER: 'nominatim_osm',
      GEOCODE_NOMINATIM_OSM_USER_AGENT: 'PF_login-test/0.10.4 contact@example.invalid',
    },
  });
  assert.equal(envelope.proof_status, 'PASSED');
  assert.equal(envelope.evidence.checks.every((check) => check.passed), true);
  assert.match(envelope.known_limitations[0], /does not call/);
});
