import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGeocodeDryRunPlan } from '../tools/geocode-dry-run-from-sample-lib.mjs';

test('geocode dry-run plan passes with supported provider and redacted GPS class', () => {
  const result = buildGeocodeDryRunPlan({ providerId: 'nominatim_osm' });
  assert.equal(result.proof_status, 'PASSED');
  assert.equal(result.safety.provider_called, false);
  assert.equal(result.safety.exact_gps_returned, false);
});

test('geocode dry-run plan blocks unsupported provider', () => {
  const result = buildGeocodeDryRunPlan({ providerId: 'unknown_provider' });
  assert.equal(result.proof_status, 'BLOCKED');
});
