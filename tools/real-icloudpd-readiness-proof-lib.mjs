/** Secret-safe iCloudPD/auth readiness preflight helpers. */
import { createProofEnvelope, getProofEnvironment } from './proof-utils.mjs';
import { buildRealIcloudpdReadinessHints, isRealIcloudpdProofEnabled } from './real-icloudpd-pipeline-proof-lib.mjs';

const REQUIRED_CONFIG_KEYS = Object.freeze(['user', 'pw', 'ICLOUDPD_COOKIE_DIR']);

export function buildRealIcloudpdReadinessChecks({ env = process.env, baseUrl = 'http://127.0.0.1:8787', recentCount = 10 } = {}) {
  const readiness = buildRealIcloudpdReadinessHints({ env, baseUrl, recentCount });
  const configuredKeys = new Set(readiness.required_env.filter((entry) => entry.configured === true).map((entry) => entry.key));
  const checks = [
    { name: 'real_icloudpd_opt_in_set', passed: isRealIcloudpdProofEnabled(env), detail: 'PF_PROOF_ENABLE_REAL_ICLOUDPD must equal true' },
    ...REQUIRED_CONFIG_KEYS.map((key) => ({ name: `${key}_configured`, passed: configuredKeys.has(key), detail: `required config key ${key}` })),
    { name: 'auth_checkpoint_required_state_documented', passed: readiness.auth_checkpoint_required_state === 'AUTH_SESSION_USABLE', detail: readiness.auth_checkpoint_required_state },
    { name: 'secret_boundary_documented', passed: /must not include/.test(readiness.secret_boundary), detail: readiness.secret_boundary },
  ];
  return { readiness, checks };
}

export function buildRealIcloudpdReadinessProof({ metadata, env = process.env, baseUrl = 'http://127.0.0.1:8787', recentCount = 10 } = {}) {
  const { readiness, checks } = buildRealIcloudpdReadinessChecks({ env, baseUrl, recentCount });
  const proofStatus = checks.every((check) => check.passed) ? 'PASSED' : 'BLOCKED';
  return createProofEnvelope({
    proofKind: 'real_icloudpd_readiness',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus,
    runtimeMode: 'real_icloudpd_auth_readiness_preflight',
    evidence: { environment: getProofEnvironment(), checks, readiness },
    knownLimitations: proofStatus === 'PASSED'
      ? ['This only proves local readiness inputs are present; it does not run iCloudPD or download media.']
      : ['Provide real iCloudPD config, an app-owned auth checkpoint, and explicit opt-in before running real iCloudPD proof.'],
  });
}
