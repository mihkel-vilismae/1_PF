/** Secret-safe iCloudPD/auth readiness preflight helpers. */
import { createProofEnvelope, getProofEnvironment } from './proof-utils.mjs';
import { buildRealIcloudpdReadinessHints, isRealIcloudpdProofEnabled } from './real-icloudpd-pipeline-proof-lib.mjs';

const REQUIRED_CONFIG_KEYS = Object.freeze(['user', 'pw', 'ICLOUDPD_COOKIE_DIR']);
const OPERATOR_SAFE_ENV_KEYS = Object.freeze(['PF_PROOF_ENABLE_REAL_ICLOUDPD', ...REQUIRED_CONFIG_KEYS]);

function configuredKeySet(readiness) {
  return new Set(readiness.required_env.filter((entry) => entry.configured === true || entry.present === true).map((entry) => entry.key));
}

export function buildRealIcloudpdConfigReadiness({ env = process.env, baseUrl = 'http://127.0.0.1:8787', recentCount = 10 } = {}) {
  const readiness = buildRealIcloudpdReadinessHints({ env, baseUrl, recentCount });
  const configuredKeys = configuredKeySet(readiness);
  const missingRequiredConfigKeys = OPERATOR_SAFE_ENV_KEYS.filter((key) => !configuredKeys.has(key));
  const configGroups = [
    { group: 'proof_opt_in', required_keys: ['PF_PROOF_ENABLE_REAL_ICLOUDPD'], configured: configuredKeys.has('PF_PROOF_ENABLE_REAL_ICLOUDPD') },
    { group: 'icloudpd_credentials', required_keys: ['user', 'pw'], configured: configuredKeys.has('user') && configuredKeys.has('pw') },
    { group: 'cookie_dir', required_keys: ['ICLOUDPD_COOKIE_DIR'], configured: configuredKeys.has('ICLOUDPD_COOKIE_DIR') },
    { group: 'auth_checkpoint', required_state: 'AUTH_SESSION_USABLE', configured: readiness.auth_checkpoint_required_state === 'AUTH_SESSION_USABLE' },
  ];
  const readinessLevel = missingRequiredConfigKeys.length > 0
    ? 'missing_config'
    : configGroups.every((entry) => entry.configured) ? 'ready_inputs_present' : 'auth_checkpoint_missing';
  return {
    readiness,
    missing_required_config_keys: missingRequiredConfigKeys,
    required_config_groups: configGroups,
    operator_safe_env_keys: OPERATOR_SAFE_ENV_KEYS,
    readiness_level: readinessLevel,
    safe_diagnostics: [
      'Only key names and configured/missing booleans may be written to proof artifacts.',
      'Never write Apple ID, password, cookie contents, tokens, raw .env values, or raw session files.',
      'Use the auth checkpoint proof artifact to establish AUTH_SESSION_USABLE before real provider work.',
    ],
  };
}

export function buildRealIcloudpdReadinessChecks({ env = process.env, baseUrl = 'http://127.0.0.1:8787', recentCount = 10 } = {}) {
  const configReadiness = buildRealIcloudpdConfigReadiness({ env, baseUrl, recentCount });
  const { readiness, missing_required_config_keys: missingKeys } = configReadiness;
  const configuredKeys = configuredKeySet(readiness);
  const checks = [
    { name: 'real_icloudpd_opt_in_set', passed: isRealIcloudpdProofEnabled(env), detail: 'PF_PROOF_ENABLE_REAL_ICLOUDPD must equal true' },
    ...REQUIRED_CONFIG_KEYS.map((key) => ({ name: `${key}_configured`, passed: configuredKeys.has(key), detail: `required config key ${key}` })),
    { name: 'missing_required_config_keys_reported', passed: Array.isArray(missingKeys), detail: missingKeys.join(',') || 'none' },
    { name: 'auth_checkpoint_required_state_documented', passed: readiness.auth_checkpoint_required_state === 'AUTH_SESSION_USABLE', detail: readiness.auth_checkpoint_required_state },
    { name: 'secret_boundary_documented', passed: /must not include/.test(readiness.secret_boundary), detail: readiness.secret_boundary },
    { name: 'operator_safe_env_keys_only', passed: configReadiness.operator_safe_env_keys.every((key) => OPERATOR_SAFE_ENV_KEYS.includes(key)), detail: configReadiness.operator_safe_env_keys.join(',') },
  ];
  return { readiness, configReadiness, checks };
}

export function buildRealIcloudpdReadinessProof({ metadata, env = process.env, baseUrl = 'http://127.0.0.1:8787', recentCount = 10 } = {}) {
  const { readiness, configReadiness, checks } = buildRealIcloudpdReadinessChecks({ env, baseUrl, recentCount });
  const proofStatus = checks.every((check) => check.passed) && configReadiness.missing_required_config_keys.length === 0 ? 'PASSED' : 'BLOCKED';
  return createProofEnvelope({
    proofKind: 'real_icloudpd_readiness',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus,
    runtimeMode: 'real_icloudpd_auth_readiness_preflight',
    evidence: { environment: getProofEnvironment(), checks, readiness, config_readiness: configReadiness },
    knownLimitations: proofStatus === 'PASSED'
      ? ['This only proves local readiness inputs are present; it does not run iCloudPD or download media.']
      : ['Provide real iCloudPD config, an app-owned auth checkpoint, and explicit opt-in before running real iCloudPD proof.'],
  });
}
