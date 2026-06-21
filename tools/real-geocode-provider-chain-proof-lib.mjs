/**
 * Opt-in real-network geocode provider-chain proof library.
 * Uses existing Python provider interfaces and provider-chain behavior.
 * Proves cache miss to network provider, cache hit, and address plausibility.
 * Refuses placeholder-only evidence as a production geocode proof.
 * Keeps secrets and raw provider payloads out of generated artifacts.
 */
import { createProofEnvelope, runPythonScriptWithFallback, sanitizeEvidence } from './proof-utils.mjs';
import {
  REAL_GEOCODE_PROVIDER_ADAPTERS,
  buildProviderSafetyReadiness,
  normalizeGeocodeAddressArtifact,
  validateNormalizedGeocodeAddressArtifact,
} from './real-geocode-provider-adapter-lib.mjs';

const DEFAULT_FIXTURE = Object.freeze({
  name: 'tallinn_known_point',
  latitude: 59.437,
  longitude: 24.7536,
  languageCode: 'en',
  expectedTerms: ['Tallinn', 'Estonia'],
});
const REAL_PROVIDER_IDS = new Set(Object.keys(REAL_GEOCODE_PROVIDER_ADAPTERS));
const BLOCKED_FAILURE_CODES = new Set([
  'provider_disabled',
  'network_providers_disabled',
  'api_key_missing',
  'access_token_missing',
  'base_url_missing',
]);
const PLACEHOLDER_ADDRESS_PATTERN = /^Lat:\s*-?\d+(?:\.\d+)?,\s*Lon:\s*-?\d+(?:\.\d+)?$/i;

/** Returns true only when the real network geocode-chain proof is explicitly enabled. */
export function isRealGeocodeProviderChainProofEnabled(env = process.env) {
  return env.PF_PROOF_ENABLE_REAL_GEOCODE_CHAIN === 'true';
}

/** Reads the configured real provider id for the proof without silently defaulting to placeholder. */
export function readRealGeocodeProofProvider(env = process.env) {
  return String(env.PF_GEOCODE_CHAIN_PROOF_PROVIDER ?? env.PF_GEOCODE_PROOF_PROVIDER ?? '').trim();
}


/** Builds operator-facing readiness diagnostics without exposing provider secrets. */
export function buildRealGeocodeProviderReadinessHints(env = process.env) {
  const providerId = readRealGeocodeProofProvider(env);
  const providerSafety = buildProviderSafetyReadiness({ providerId, env });
  return {
    required_env: [
      { key: 'PF_PROOF_ENABLE_REAL_GEOCODE_CHAIN', required_value: 'true', present: env.PF_PROOF_ENABLE_REAL_GEOCODE_CHAIN === 'true' },
      { key: 'PF_GEOCODE_CHAIN_PROOF_PROVIDER', fallback_key: 'PF_GEOCODE_PROOF_PROVIDER', configured: Boolean(providerId), configured_provider_id: providerId || null, configured_provider_known: providerId ? REAL_PROVIDER_IDS.has(providerId) : false },
    ],
    supported_provider_ids: [...REAL_PROVIDER_IDS].sort(),
    provider_safety: providerSafety,
    optional_fixture_env: [
      'PF_GEOCODE_CHAIN_FIXTURE_NAME',
      'PF_GEOCODE_CHAIN_PROOF_LATITUDE',
      'PF_GEOCODE_CHAIN_PROOF_LONGITUDE',
      'PF_GEOCODE_CHAIN_PROOF_LANGUAGE',
      'PF_GEOCODE_CHAIN_EXPECTED_TERMS',
    ],
    placeholder_policy: 'deterministic placeholder or coordinate echo output is never accepted as real geocode proof success',
    secret_boundary: 'provider API keys, access tokens, raw provider payloads, and .env values must not be written into proof artifacts',
    next_steps: [
      'Set PF_PROOF_ENABLE_REAL_GEOCODE_CHAIN=true only on the target environment that is allowed to call a real provider.',
      'Set PF_GEOCODE_CHAIN_PROOF_PROVIDER to one supported provider id.',
      'Configure the selected provider through its normal provider-specific environment variables outside proof artifacts.',
      'For public Nominatim, configure GEOCODE_NOMINATIM_OSM_USER_AGENT explicitly; do not rely on proof defaults.',
      'Rerun npm run proof:real-geocode-provider-chain and upload the proof report.',
    ],
  };
}

/** Reads and normalizes the coordinate/address fixture used for plausibility checks. */
export function readRealGeocodeProofFixture(env = process.env) {
  const latitude = Number.parseFloat(String(env.PF_GEOCODE_CHAIN_PROOF_LATITUDE ?? DEFAULT_FIXTURE.latitude));
  const longitude = Number.parseFloat(String(env.PF_GEOCODE_CHAIN_PROOF_LONGITUDE ?? DEFAULT_FIXTURE.longitude));
  const languageCode = String(env.PF_GEOCODE_CHAIN_PROOF_LANGUAGE ?? DEFAULT_FIXTURE.languageCode).trim() || DEFAULT_FIXTURE.languageCode;
  const rawTerms = String(env.PF_GEOCODE_CHAIN_EXPECTED_TERMS ?? DEFAULT_FIXTURE.expectedTerms.join(';'));
  const expectedTerms = rawTerms.split(/[;,]/).map((term) => term.trim()).filter(Boolean);
  return {
    name: String(env.PF_GEOCODE_CHAIN_FIXTURE_NAME ?? DEFAULT_FIXTURE.name).trim() || DEFAULT_FIXTURE.name,
    latitude: Number.isFinite(latitude) ? latitude : DEFAULT_FIXTURE.latitude,
    longitude: Number.isFinite(longitude) ? longitude : DEFAULT_FIXTURE.longitude,
    languageCode,
    expectedTerms: expectedTerms.length > 0 ? expectedTerms : [...DEFAULT_FIXTURE.expectedTerms],
  };
}

/** Returns true when an address looks like the deterministic placeholder format. */
export function isPlaceholderAddress(addressText) {
  return PLACEHOLDER_ADDRESS_PATTERN.test(String(addressText ?? '').trim());
}

/** Checks that a geocode address is human-readable and not just a coordinate echo. */
export function isHumanReadableAddress(addressText) {
  const text = String(addressText ?? '').trim();
  return text.length >= 10 && /[A-Za-zÀ-ž]/.test(text) && !isPlaceholderAddress(text);
}

/** Returns the expected terms found in the provider address text. */
export function collectMatchedAddressTerms(addressText, expectedTerms) {
  const normalizedAddress = String(addressText ?? '').toLocaleLowerCase();
  return expectedTerms.filter((term) => normalizedAddress.includes(String(term).toLocaleLowerCase()));
}

/** Classifies provider failures that should block rather than fail a real-world proof. */
export function isBlockedProviderOutcome(result) {
  if (!result || result.status === 'SKIPPED') return true;
  if (BLOCKED_FAILURE_CODES.has(result.failure_code)) return true;
  const message = String(result.message ?? '').toLocaleLowerCase();
  return result.failure_code === 'geocode_http_failed' && message.includes('network error');
}

/** Builds the Python script that exercises the existing provider chain interfaces. */
export function buildProviderChainPythonScript({ providerId, fixture }) {
  return String.raw`
import json
import os
import sqlite3
import sys
from dataclasses import asdict

repo_root = sys.argv[1]
sys.path.insert(0, os.path.join(repo_root, 'server', 'scripts'))

from media_pipeline.geocode_config import provider_env_prefix
from media_pipeline.geocode_address_cache_provider import AddressCacheGeocodeProvider
from media_pipeline.geocode_provider_registry import default_reverse_geocode_providers
from media_pipeline.provider_chain import run_reverse_geocode_provider_chain
from media_pipeline.provider_contracts import ReverseGeocodeInput, ReverseGeocodeResult

provider_id = ${JSON.stringify(providerId)}
fixture = ${JSON.stringify(fixture)}
prefix = provider_env_prefix(provider_id)

os.environ['GEOCODE_ALLOW_NETWORK_PROVIDERS'] = 'true'
os.environ['GEOCODE_NETWORK_PROVIDERS_ENABLED'] = 'true'
os.environ['GEOCODE_ALLOW_PLACEHOLDER_FALLBACK'] = 'false'
os.environ['GEOCODE_PROVIDER_ORDER'] = f'address_cache,{provider_id}'
os.environ[f'{prefix}_ENABLED'] = 'true'

connection = sqlite3.connect(':memory:')
connection.row_factory = sqlite3.Row
connection.execute('''
    CREATE TABLE address_cache (
        address_cache_key TEXT PRIMARY KEY,
        rounded_latitude REAL,
        rounded_longitude REAL,
        address_text TEXT,
        provider_name TEXT,
        provider_response_json TEXT,
        language_code TEXT,
        created_at TEXT,
        updated_at TEXT
    )
''')
connection.commit()

provider_input = ReverseGeocodeInput(
    float(fixture['latitude']),
    float(fixture['longitude']),
    fixture.get('languageCode') or 'en',
)

class ProofForcedNoResultGeocodeProvider:
    provider_id = 'proof_forced_no_result'

    def reverse_geocode(self, provider_input):
        return ReverseGeocodeResult.no_result(
            self.provider_id,
            'proof_forced_no_result',
            'Proof-only no-result provider used to verify fallback continues to the configured real provider.',
        )

def result_to_dict(result):
    return asdict(result)

registry_providers = default_reverse_geocode_providers(connection)
providers = [AddressCacheGeocodeProvider(connection), ProofForcedNoResultGeocodeProvider()]
providers.extend([provider for provider in registry_providers if provider.provider_id != 'address_cache'])
cache_miss = AddressCacheGeocodeProvider(connection).reverse_geocode(provider_input)
forced_no_result = ProofForcedNoResultGeocodeProvider().reverse_geocode(provider_input)
network_result = run_reverse_geocode_provider_chain(provider_input, providers)
cache_inserted = False
if network_result.status == 'SUCCEEDED' and network_result.provider_id == provider_id:
    connection.execute('''
        INSERT INTO address_cache (
            address_cache_key, rounded_latitude, rounded_longitude, address_text,
            provider_name, provider_response_json, language_code, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    ''', (
        network_result.address_cache_key,
        network_result.rounded_latitude,
        network_result.rounded_longitude,
        network_result.address_text,
        network_result.provider_id,
        json.dumps(network_result.provider_response, sort_keys=True),
        network_result.language_code,
    ))
    connection.commit()
    cache_inserted = True

cache_hit = run_reverse_geocode_provider_chain(provider_input, default_reverse_geocode_providers(connection))
print(json.dumps({
    'fixture': fixture,
    'provider_id': provider_id,
    'provider_ids': [provider.provider_id for provider in providers],
    'forced_no_result': result_to_dict(forced_no_result),
    'placeholder_allowed': os.environ.get('GEOCODE_ALLOW_PLACEHOLDER_FALLBACK'),
    'cache_miss': result_to_dict(cache_miss),
    'network_result': result_to_dict(network_result),
    'cache_inserted': cache_inserted,
    'cache_hit': result_to_dict(cache_hit),
}, sort_keys=True))
`;
}

/** Parses the final JSON object emitted by the Python provider-chain proof. */
export function parseProviderChainPythonPayload(stdout) {
  const lines = String(stdout ?? '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const lastJsonLine = [...lines].reverse().find((line) => line.startsWith('{') && line.endsWith('}'));
  if (!lastJsonLine) throw new Error('Python provider-chain proof did not emit JSON.');
  return JSON.parse(lastJsonLine);
}

/** Builds semantic checks for real provider, cache, placeholder, and address accuracy evidence. */
export function buildRealGeocodeChainChecks(payload, expectedProvider, fixture) {
  const networkResult = payload?.network_result ?? {};
  const cacheMiss = payload?.cache_miss ?? {};
  const cacheHit = payload?.cache_hit ?? {};
  const addressText = networkResult.address_text ?? '';
  const matchedTerms = collectMatchedAddressTerms(addressText, fixture.expectedTerms);
  const checks = [
    { name: 'provider_is_real', status: REAL_PROVIDER_IDS.has(expectedProvider) ? 'PASSED' : 'FAILED', detail: expectedProvider },
    { name: 'placeholder_fallback_disabled', status: payload?.placeholder_allowed === 'false' ? 'PASSED' : 'FAILED', detail: payload?.placeholder_allowed },
    { name: 'cache_first_miss_observed', status: cacheMiss.provider_id === 'address_cache' && cacheMiss.status === 'NO_RESULT' ? 'PASSED' : 'FAILED', detail: cacheMiss.failure_code ?? cacheMiss.status },
    { name: 'forced_no_result_provider_observed', status: payload?.forced_no_result?.provider_id === 'proof_forced_no_result' && payload?.forced_no_result?.status === 'NO_RESULT' ? 'PASSED' : 'FAILED', detail: payload?.forced_no_result?.failure_code ?? payload?.forced_no_result?.status },
    { name: 'network_provider_succeeded', status: networkResult.provider_id === expectedProvider && networkResult.status === 'SUCCEEDED' ? 'PASSED' : 'FAILED', detail: networkResult.failure_code ?? networkResult.status },
    { name: 'placeholder_not_used', status: networkResult.provider_id !== 'deterministic_placeholder' && !isPlaceholderAddress(addressText) ? 'PASSED' : 'FAILED', detail: networkResult.provider_id },
    { name: 'human_readable_address', status: isHumanReadableAddress(addressText) ? 'PASSED' : 'FAILED', detail: addressText },
    { name: 'expected_address_terms_matched', status: matchedTerms.length === fixture.expectedTerms.length ? 'PASSED' : 'FAILED', detail: { expected_terms: fixture.expectedTerms, matched_terms: matchedTerms } },
    { name: 'cache_inserted_from_real_provider', status: payload?.cache_inserted === true ? 'PASSED' : 'FAILED', detail: payload?.cache_inserted },
    { name: 'cache_hit_after_network_success', status: cacheHit.provider_id === 'address_cache' && cacheHit.status === 'SUCCEEDED' && cacheHit.provider_response?.cached_provider_name === expectedProvider ? 'PASSED' : 'FAILED', detail: cacheHit.provider_response ?? cacheHit.status },
  ];
  return checks;
}

/** Returns true when every semantic proof check passed. */
export function allChecksPassed(checks) {
  return checks.every((check) => check.status === 'PASSED');
}

/** Runs the opt-in real geocode provider-chain proof and returns a proof envelope. */
export async function runRealGeocodeProviderChainProof({ metadata, env = process.env, runPython = runPythonScriptWithFallback }) {
  const providerId = readRealGeocodeProofProvider(env);
  const fixture = readRealGeocodeProofFixture(env);
  const readiness = buildRealGeocodeProviderReadinessHints(env);
  const blockedEvidence = { provider_id: providerId || null, fixture, placeholder_is_not_success: true, readiness };

  if (!isRealGeocodeProviderChainProofEnabled(env)) {
    return createProofEnvelope({
      proofKind: 'real_geocode_provider_chain',
      baselineVersion: metadata.version,
      gitCommit: metadata.gitCommit,
      proofStatus: 'BLOCKED',
      runtimeMode: 'real_network_geocode',
      evidence: { ...blockedEvidence, reason: 'Set PF_PROOF_ENABLE_REAL_GEOCODE_CHAIN=true and PF_GEOCODE_CHAIN_PROOF_PROVIDER=<provider_id> to run this proof.' },
      knownLimitations: ['No network geocode provider was called because the real-provider-chain proof was not explicitly enabled.'],
    });
  }

  if (!REAL_PROVIDER_IDS.has(providerId)) {
    return createProofEnvelope({
      proofKind: 'real_geocode_provider_chain',
      baselineVersion: metadata.version,
      gitCommit: metadata.gitCommit,
      proofStatus: 'BLOCKED',
      runtimeMode: 'real_network_geocode',
      evidence: { ...blockedEvidence, reason: 'A known real provider id is required; cache and deterministic placeholder are not valid real-provider proof targets.', supported_provider_ids: [...REAL_PROVIDER_IDS].sort() },
      knownLimitations: ['The proof did not know which configured real provider to verify.'],
    });
  }

  const providerSafety = buildProviderSafetyReadiness({ providerId, env });
  if (providerSafety.proof_status !== 'PASSED') {
    return createProofEnvelope({
      proofKind: 'real_geocode_provider_chain',
      baselineVersion: metadata.version,
      gitCommit: metadata.gitCommit,
      proofStatus: 'BLOCKED',
      runtimeMode: 'real_network_geocode',
      evidence: { ...blockedEvidence, reason: 'Provider safety config is incomplete; configure required provider env outside proof artifacts.', provider_safety: providerSafety },
      knownLimitations: ['The proof did not call a real provider because required provider-specific safety/configuration was incomplete.'],
    });
  }

  const commandResult = runPython({ script: buildProviderChainPythonScript({ providerId, fixture }), scriptLabel: 'REAL_GEOCODE_PROVIDER_CHAIN_PROOF_SCRIPT', timeoutMs: 120000 }).commandResult;
  if (commandResult.exitCode !== 0 || commandResult.timedOut) {
    return createProofEnvelope({
      proofKind: 'real_geocode_provider_chain',
      baselineVersion: metadata.version,
      gitCommit: metadata.gitCommit,
      proofStatus: commandResult.timedOut ? 'TIMED_OUT' : 'FAILED',
      runtimeMode: 'real_network_geocode',
      evidence: { ...blockedEvidence, command_result: commandResult },
      knownLimitations: ['The provider-chain proof subprocess did not complete successfully.'],
    });
  }

  let payload;
  try {
    payload = parseProviderChainPythonPayload(commandResult.stdout);
  } catch (error) {
    return createProofEnvelope({
      proofKind: 'real_geocode_provider_chain',
      baselineVersion: metadata.version,
      gitCommit: metadata.gitCommit,
      proofStatus: 'FAILED',
      runtimeMode: 'real_network_geocode',
      evidence: { ...blockedEvidence, command_result: commandResult, parse_error: error instanceof Error ? error.message : String(error) },
      knownLimitations: ['The provider-chain proof subprocess completed but did not emit parseable JSON evidence.'],
    });
  }

  const checks = buildRealGeocodeChainChecks(payload, providerId, fixture);
  const providerOutcome = payload?.network_result ?? {};
  const normalizedAddress = normalizeGeocodeAddressArtifact({ providerId, fixture, providerResult: providerOutcome, payload });
  const normalizedAddressValidation = validateNormalizedGeocodeAddressArtifact(normalizedAddress);
  const normalizedChecks = [
    { name: 'normalized_address_artifact_valid', status: normalizedAddressValidation.status, detail: normalizedAddressValidation.errors },
    { name: 'normalized_address_is_provider_coordinate_fixture', status: normalizedAddress.source_level === 'provider_coordinate_fixture' ? 'PASSED' : 'FAILED', detail: normalizedAddress.source_level },
  ];
  const allProofChecks = [...checks, ...normalizedChecks];
  const proofStatus = allChecksPassed(allProofChecks) ? 'PASSED' : isBlockedProviderOutcome(providerOutcome) ? 'BLOCKED' : 'FAILED';

  return createProofEnvelope({
    proofKind: 'real_geocode_provider_chain',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus,
    runtimeMode: 'real_network_geocode',
    evidence: {
      fixture,
      provider_id: providerId,
      command_result: commandResult,
      provider_chain: sanitizeEvidence(payload),
      provider_safety: providerSafety,
      checks: allProofChecks,
      normalized_address: normalizedAddress,
      normalized_address_validation: normalizedAddressValidation,
      provider_evidence: {
        network_call_made: providerOutcome.provider_id === providerId,
        placeholder_used: providerOutcome.provider_id === 'deterministic_placeholder' || isPlaceholderAddress(providerOutcome.address_text),
        cache_first_verified: payload?.cache_miss?.provider_id === 'address_cache' && payload?.cache_hit?.provider_id === 'address_cache',
        fallback_verified: payload?.cache_miss?.status === 'NO_RESULT' && payload?.forced_no_result?.status === 'NO_RESULT' && providerOutcome.provider_id === providerId,
      },
    },
    knownLimitations: proofStatus === 'PASSED'
      ? ['This proof validates one configured coordinate fixture and one configured real provider path, not every provider/account combination.']
      : ['The proof is opt-in and requires working network/provider configuration for a PASSED result.'],
  });
}
