/**
 * Tests real geocode provider proof safety behavior.
 * Verifies placeholder-only evidence cannot be marked as production proof.
 * Does not call network providers or a live backend.
 * Protects cache-first and disabled-by-default provider boundaries.
 * Runs through the standard Node test runner.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { collectProviderMentions, hasRealProviderEvidence, isRealGeocodeProofEnabled, runRealGeocodeProviderProof } from '../tools/geocode-provider-proof-lib.mjs';

/** Verifies real geocode proof is blocked by default. */
test('real geocode proof is blocked by default', async () => { const envelope = await runRealGeocodeProviderProof({ baseUrl: 'http://127.0.0.1:8787', expectedProvider: 'nominatim_osm', metadata: { version: '0.7.34', gitCommit: 'test' }, env: {} }); assert.equal(envelope.proof_status, 'BLOCKED'); assert.equal(envelope.evidence.placeholder_is_not_success, true); });

/** Verifies provider evidence scanning can find provider IDs in nested payloads. */
test('geocode proof collects provider mentions from nested payloads', () => { const mentions = collectProviderMentions({ queue: [{ geocode_provider: 'address_cache' }, { provider: 'nominatim_osm' }] }); assert.equal(mentions.has('address_cache'), true); assert.equal(mentions.has('nominatim_osm'), true); });

/** Verifies placeholder-only output is not production provider proof. */
test('geocode proof does not pass on placeholder-only provider evidence', () => { assert.equal(hasRealProviderEvidence(new Set(['deterministic_placeholder']), 'nominatim_osm'), false); assert.equal(hasRealProviderEvidence(new Set(['nominatim_osm', 'deterministic_placeholder']), 'nominatim_osm'), false); assert.equal(hasRealProviderEvidence(new Set(['nominatim_osm']), 'nominatim_osm'), true); });

/** Verifies only the exact string true enables real provider execution. */
test('real geocode proof opt-in flag is exact', () => { assert.equal(isRealGeocodeProofEnabled({ PF_PROOF_ENABLE_REAL_GEOCODE: 'true' }), true); assert.equal(isRealGeocodeProofEnabled({ PF_PROOF_ENABLE_REAL_GEOCODE: '1' }), false); assert.equal(isRealGeocodeProofEnabled({}), false); });
