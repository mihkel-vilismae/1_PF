/** Secret-safe real geocode provider readiness proof helpers. */
import { createProofEnvelope, getProofEnvironment } from './proof-utils.mjs';
import { buildRealGeocodeProviderReadinessHints, isRealGeocodeProviderChainProofEnabled, readRealGeocodeProofProvider } from './real-geocode-provider-chain-proof-lib.mjs';

function readinessChecks(env = process.env) {
  const hints = buildRealGeocodeProviderReadinessHints(env);
  const providerRequirement = hints.required_env.find((entry) => entry.key === 'PF_GEOCODE_CHAIN_PROOF_PROVIDER');
  const checks = [
    { name: 'real_geocode_opt_in_set', passed: isRealGeocodeProviderChainProofEnabled(env), detail: 'PF_PROOF_ENABLE_REAL_GEOCODE_CHAIN must equal true' },
    { name: 'provider_id_configured', passed: Boolean(readRealGeocodeProofProvider(env)), detail: 'PF_GEOCODE_CHAIN_PROOF_PROVIDER or PF_GEOCODE_PROOF_PROVIDER must be set' },
    { name: 'provider_id_is_supported', passed: Boolean(providerRequirement?.configured_provider_known), detail: providerRequirement?.configured_provider_id ?? null },
    { name: 'placeholder_policy_documented', passed: /never accepted/.test(hints.placeholder_policy), detail: hints.placeholder_policy },
    { name: 'secret_boundary_documented', passed: /must not/.test(hints.secret_boundary), detail: hints.secret_boundary },
  ];
  return { hints, checks };
}

export function buildRealGeocodeProviderReadinessProof({ metadata, env = process.env } = {}) {
  const { hints, checks } = readinessChecks(env);
  const proofStatus = checks.every((check) => check.passed) ? 'PASSED' : 'BLOCKED';
  return createProofEnvelope({
    proofKind: 'real_geocode_provider_readiness',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus,
    runtimeMode: 'real_geocode_provider_readiness_preflight',
    evidence: { environment: getProofEnvironment(), checks, readiness: hints },
    knownLimitations: proofStatus === 'PASSED'
      ? ['This only proves local configuration readiness; it does not call or prove a real geocode provider.']
      : ['Provide explicit real geocode opt-in and a supported provider id before running the provider-chain proof.'],
  });
}
