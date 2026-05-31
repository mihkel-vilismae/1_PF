/**
 * Real geocode provider proof library.
 * Keeps network-provider proof opt-in and cache-first aware.
 * Uses the existing geocode runtime route instead of adding shortcuts.
 * Refuses to pass when only deterministic placeholder output is observed.
 * Sanitizes provider evidence before runtime artifacts are written.
 */
import { createProofEnvelope, sanitizeEvidence } from './proof-utils.mjs';
import { requestJson } from './real-icloudpd-pipeline-proof-lib.mjs';
const PLACEHOLDER_PROVIDER_ID = 'deterministic_placeholder';
const CACHE_PROVIDER_ID = 'address_cache';
const KNOWN_PROVIDERS = [CACHE_PROVIDER_ID, PLACEHOLDER_PROVIDER_ID, 'nominatim_osm', 'photon_komoot', 'postcodes_io_uk', 'pelias_self_hosted', 'opencage', 'geoapify', 'mapbox', 'google_geocoding'];

/** Tells callers whether real geocode proof execution is explicitly enabled. */
export function isRealGeocodeProofEnabled(env = process.env) { return env.PF_PROOF_ENABLE_REAL_GEOCODE === 'true'; }

/** Builds the route plan for the geocode proof around the existing runtime route. */
export function buildGeocodeProofRoutePlan() { return [{ key: 'geocode_first_run', method: 'POST', path: '/api/runtime/geocode/run' }, { key: 'geocode_cache_check_run', method: 'POST', path: '/api/runtime/geocode/run' }]; }

/** Recursively searches route payloads for provider IDs without relying on exact payload shape. */
export function collectProviderMentions(value, mentions = new Set()) {
  if (typeof value === 'string') { for (const provider of KNOWN_PROVIDERS) if (value.includes(provider)) mentions.add(provider); return mentions; }
  if (Array.isArray(value)) { for (const entry of value) collectProviderMentions(entry, mentions); return mentions; }
  if (value && typeof value === 'object') for (const entry of Object.values(value)) collectProviderMentions(entry, mentions);
  return mentions;
}

/** Returns true when provider mentions show a real provider rather than cache/placeholder only. */
export function hasRealProviderEvidence(providerMentions, expectedProvider) { return Boolean(expectedProvider && expectedProvider !== CACHE_PROVIDER_ID && expectedProvider !== PLACEHOLDER_PROVIDER_ID && providerMentions.has(expectedProvider) && !providerMentions.has(PLACEHOLDER_PROVIDER_ID)); }

/** Runs the real geocode proof against a live backend only when explicitly enabled. */
export async function runRealGeocodeProviderProof({ baseUrl, expectedProvider, metadata, env = process.env }) {
  const routePlan = buildGeocodeProofRoutePlan();
  if (!isRealGeocodeProofEnabled(env)) return createProofEnvelope({ proofKind: 'geocode_provider', baselineVersion: metadata.version, gitCommit: metadata.gitCommit, proofStatus: 'BLOCKED', runtimeMode: 'real', evidence: { reason: 'Set PF_PROOF_ENABLE_REAL_GEOCODE=true and PF_GEOCODE_PROOF_PROVIDER=<provider_id> to run real provider proof.', base_url: baseUrl, expected_provider: expectedProvider ?? null, route_plan: routePlan, placeholder_is_not_success: true }, knownLimitations: ['No network geocode provider was called because the opt-in flag was not set.'] });
  if (!expectedProvider) return createProofEnvelope({ proofKind: 'geocode_provider', baselineVersion: metadata.version, gitCommit: metadata.gitCommit, proofStatus: 'BLOCKED', runtimeMode: 'real', evidence: { reason: 'PF_GEOCODE_PROOF_PROVIDER is required for real geocode proof.', base_url: baseUrl }, knownLimitations: ['The proof did not know which real provider to verify.'] });
  const stageResults = [];
  for (const route of routePlan) { const result = await requestJson(baseUrl, route); stageResults.push(result); if (!result.ok) return createProofEnvelope({ proofKind: 'geocode_provider', baselineVersion: metadata.version, gitCommit: metadata.gitCommit, proofStatus: 'FAILED', runtimeMode: 'real', evidence: { expected_provider: expectedProvider, failed_stage: route.key, stage_results: stageResults }, knownLimitations: ['The proof stopped at the first failed geocode route.'] }); }
  const providerMentions = collectProviderMentions(sanitizeEvidence(stageResults));
  const proofPassed = hasRealProviderEvidence(providerMentions, expectedProvider);
  return createProofEnvelope({ proofKind: 'geocode_provider', baselineVersion: metadata.version, gitCommit: metadata.gitCommit, proofStatus: proofPassed ? 'PASSED' : 'PARTIAL', runtimeMode: 'real', evidence: { expected_provider: expectedProvider, provider_mentions: [...providerMentions].sort(), cache_first_expected: true, placeholder_is_not_success: true, stage_results: stageResults }, knownLimitations: proofPassed ? ['This proof depends on prepared local queue/database state and configured provider account/network.'] : ['The geocode route returned, but the expected real provider was not observed without placeholder fallback.'] });
}
