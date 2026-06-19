import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGeocodeProviderSelectionGuide, findGeocodeProvider, providerIdsFromMatrix } from '../tools/geocode-provider-selection-lib.mjs';
import { buildRealGeocodeProviderReadinessHints } from '../tools/real-geocode-provider-chain-proof-lib.mjs';

test('geocode provider matrix matches readiness supported providers', () => {
  assert.deepEqual(providerIdsFromMatrix(), [...buildRealGeocodeProviderReadinessHints({}).supported_provider_ids].sort());
});

test('geocode provider selection guide includes env keys and secret boundary', () => {
  const guide = buildGeocodeProviderSelectionGuide();
  assert.ok(guide.global_required_env.includes('PF_PROOF_ENABLE_REAL_GEOCODE_CHAIN=true'));
  assert.ok(guide.provider_matrix.every((provider) => provider.required_env.length > 0));
  assert.match(guide.secret_boundary, /must not be written/);
});

test('geocode provider matrix exposes known provider details', () => {
  assert.equal(findGeocodeProvider('nominatim_osm')?.recommended_for_first_run, true);
  assert.equal(findGeocodeProvider('mapbox')?.type, 'access_token');
});
