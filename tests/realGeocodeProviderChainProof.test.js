/**
 * Tests the real geocode provider-chain proof without network calls.
 * Verifies opt-in behavior, placeholder rejection, and semantic checks.
 * Uses mocked Python proof output to protect proof-envelope behavior.
 * Keeps real provider/network tests out of the normal local test suite.
 * Runs with the standard Node test runner.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  allChecksPassed,
  buildRealGeocodeChainChecks,
  collectMatchedAddressTerms,
  isHumanReadableAddress,
  isPlaceholderAddress,
  parseProviderChainPythonPayload,
  readRealGeocodeProofFixture,
  runRealGeocodeProviderChainProof,
  buildRealGeocodeProviderReadinessHints,
} from '../tools/real-geocode-provider-chain-proof-lib.mjs';

const metadata = { version: '0.7.43', gitCommit: 'test' };

/** Builds a mocked Python result with successful provider/cache evidence. */
function buildMockPythonResult(payload) {
  return () => ({
    commandResult: {
      command: 'python',
      args: ['-c', '[REAL_GEOCODE_PROVIDER_CHAIN_PROOF_SCRIPT]', '/repo'],
      attemptedCommands: [],
      exitCode: 0,
      signal: null,
      timedOut: false,
      durationMs: 12,
      stdout: `${JSON.stringify(payload)}\n`,
      stderr: '',
    },
  });
}

/** Verifies the proof is blocked unless explicitly opted in. */
test('real geocode provider-chain proof is blocked by default', async () => {
  const envelope = await runRealGeocodeProviderChainProof({ metadata, env: {}, runPython: buildMockPythonResult({}) });
  assert.equal(envelope.proof_status, 'BLOCKED');
  assert.match(envelope.evidence.reason, /PF_PROOF_ENABLE_REAL_GEOCODE_CHAIN=true/);
  assert.equal(envelope.evidence.readiness.required_env[0].key, 'PF_PROOF_ENABLE_REAL_GEOCODE_CHAIN');
  assert.equal(envelope.evidence.readiness.required_env[0].present, false);
  assert.ok(envelope.evidence.readiness.supported_provider_ids.includes('nominatim_osm'));
});

/** Verifies readiness hints are explicit while preserving provider secret boundaries. */
test('real geocode provider-chain readiness hints describe required env without secrets', () => {
  const readiness = buildRealGeocodeProviderReadinessHints({
    PF_PROOF_ENABLE_REAL_GEOCODE_CHAIN: 'true',
    PF_GEOCODE_CHAIN_PROOF_PROVIDER: 'nominatim_osm',
    GEOCODE_NOMINATIM_OSM_USER_AGENT: 'PF_login-test/0.10.4 contact@example.invalid',
  });
  assert.equal(readiness.required_env[0].present, true);
  assert.equal(readiness.required_env[1].configured_provider_id, 'nominatim_osm');
  assert.equal(readiness.required_env[1].configured_provider_known, true);
  assert.equal(readiness.provider_safety.proof_status, 'PASSED');
  assert.match(readiness.secret_boundary, /must not be written/);
});

/** Verifies cache/placeholder provider IDs are not accepted as real network proof targets. */
test('real geocode provider-chain proof requires a known real provider id', async () => {
  const envelope = await runRealGeocodeProviderChainProof({
    metadata,
    env: { PF_PROOF_ENABLE_REAL_GEOCODE_CHAIN: 'true', PF_GEOCODE_CHAIN_PROOF_PROVIDER: 'deterministic_placeholder' },
    runPython: buildMockPythonResult({}),
  });
  assert.equal(envelope.proof_status, 'BLOCKED');
  assert.ok(envelope.evidence.supported_provider_ids.includes('nominatim_osm'));
});


/** Verifies provider-chain proof blocks before subprocess when selected provider safety env is missing. */
test('real geocode provider-chain proof blocks when provider safety config is incomplete', async () => {
  let pythonCalled = false;
  const envelope = await runRealGeocodeProviderChainProof({
    metadata,
    env: { PF_PROOF_ENABLE_REAL_GEOCODE_CHAIN: 'true', PF_GEOCODE_CHAIN_PROOF_PROVIDER: 'nominatim_osm' },
    runPython: () => {
      pythonCalled = true;
      return buildMockPythonResult({})();
    },
  });
  assert.equal(envelope.proof_status, 'BLOCKED');
  assert.equal(pythonCalled, false);
  assert.equal(envelope.evidence.provider_safety.required_env[0].configured, false);
});

/** Verifies placeholder-like coordinate echo addresses are rejected. */
test('real geocode provider-chain helpers reject deterministic placeholder addresses', () => {
  assert.equal(isPlaceholderAddress('Lat: 58.37763, Lon: 26.72901'), true);
  assert.equal(isHumanReadableAddress('Lat: 58.37763, Lon: 26.72901'), false);
  assert.equal(isHumanReadableAddress('Tallinn, Harju County, Estonia'), true);
});

/** Verifies plausibility checks require expected address terms. */
test('real geocode provider-chain checks require expected human address terms', () => {
  const fixture = readRealGeocodeProofFixture({ PF_GEOCODE_CHAIN_EXPECTED_TERMS: 'Tallinn;Estonia' });
  const payload = {
    placeholder_allowed: 'false',
    cache_inserted: true,
    cache_miss: { provider_id: 'address_cache', status: 'NO_RESULT', failure_code: 'address_cache_miss' },
    forced_no_result: { provider_id: 'proof_forced_no_result', status: 'NO_RESULT', failure_code: 'proof_forced_no_result' },
    network_result: { provider_id: 'nominatim_osm', status: 'SUCCEEDED', address_text: 'Tallinn, Harju County, Estonia' },
    cache_hit: { provider_id: 'address_cache', status: 'SUCCEEDED', provider_response: { cached_provider_name: 'nominatim_osm' } },
  };
  const checks = buildRealGeocodeChainChecks(payload, 'nominatim_osm', fixture);
  assert.equal(allChecksPassed(checks), true);
  assert.deepEqual(collectMatchedAddressTerms(payload.network_result.address_text, fixture.expectedTerms), ['Tallinn', 'Estonia']);
});

/** Verifies semantic failures keep the proof from passing even with process success. */
test('real geocode provider-chain proof fails on placeholder-only successful process output', async () => {
  const fixture = readRealGeocodeProofFixture({});
  const payload = {
    placeholder_allowed: 'true',
    cache_inserted: false,
    cache_miss: { provider_id: 'address_cache', status: 'NO_RESULT', failure_code: 'address_cache_miss' },
    forced_no_result: { provider_id: 'proof_forced_no_result', status: 'NO_RESULT', failure_code: 'proof_forced_no_result' },
    network_result: { provider_id: 'deterministic_placeholder', status: 'SUCCEEDED', address_text: 'Lat: 59.43700, Lon: 24.75360' },
    cache_hit: { provider_id: 'deterministic_placeholder', status: 'SUCCEEDED', provider_response: {} },
  };
  const envelope = await runRealGeocodeProviderChainProof({
    metadata,
    env: {
      PF_PROOF_ENABLE_REAL_GEOCODE_CHAIN: 'true',
      PF_GEOCODE_CHAIN_PROOF_PROVIDER: 'nominatim_osm',
      GEOCODE_NOMINATIM_OSM_USER_AGENT: 'PF_login-test/0.10.4 contact@example.invalid',
    },
    runPython: buildMockPythonResult(payload),
  });
  assert.equal(envelope.proof_status, 'FAILED');
  assert.equal(envelope.evidence.provider_evidence.placeholder_used, true);
  assert.equal(allChecksPassed(buildRealGeocodeChainChecks(payload, 'nominatim_osm', fixture)), false);
});

/** Verifies a mocked real provider result can generate a PASSED proof envelope. */
test('real geocode provider-chain proof passes with mocked real provider and cache-hit evidence', async () => {
  const payload = {
    placeholder_allowed: 'false',
    cache_inserted: true,
    cache_miss: { provider_id: 'address_cache', status: 'NO_RESULT', failure_code: 'address_cache_miss' },
    forced_no_result: { provider_id: 'proof_forced_no_result', status: 'NO_RESULT', failure_code: 'proof_forced_no_result' },
    network_result: {
      provider_id: 'nominatim_osm',
      status: 'SUCCEEDED',
      address_text: 'Tallinn, Harju County, Estonia',
      provider_response: { provider: 'nominatim_osm', summary: { osm_type: 'node' } },
    },
    cache_hit: { provider_id: 'address_cache', status: 'SUCCEEDED', provider_response: { cached_provider_name: 'nominatim_osm' } },
  };
  const envelope = await runRealGeocodeProviderChainProof({
    metadata,
    env: {
      PF_PROOF_ENABLE_REAL_GEOCODE_CHAIN: 'true',
      PF_GEOCODE_CHAIN_PROOF_PROVIDER: 'nominatim_osm',
      GEOCODE_NOMINATIM_OSM_USER_AGENT: 'PF_login-test/0.10.4 contact@example.invalid',
    },
    runPython: buildMockPythonResult(payload),
  });
  assert.equal(envelope.proof_status, 'PASSED');
  assert.equal(envelope.evidence.provider_evidence.network_call_made, true);
  assert.equal(envelope.evidence.provider_evidence.cache_first_verified, true);
  assert.equal(envelope.evidence.provider_evidence.fallback_verified, true);
  assert.equal(envelope.evidence.normalized_address.artifact_kind, 'normalized_real_geocode_address');
  assert.equal(envelope.evidence.normalized_address.source_level, 'provider_coordinate_fixture');
  assert.equal(envelope.evidence.normalized_address_validation.status, 'PASSED');
});

/** Verifies parser reads the JSON payload from subprocess stdout with extra output. */
test('real geocode provider-chain proof parses final JSON stdout line', () => {
  const payload = parseProviderChainPythonPayload('noise\n{"provider_id":"nominatim_osm"}\n');
  assert.deepEqual(payload, { provider_id: 'nominatim_osm' });
});
