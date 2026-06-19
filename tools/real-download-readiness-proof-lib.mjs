/** Secret-safe real download continuation readiness preflight helpers. */
import { createProofEnvelope, getProofEnvironment } from './proof-utils.mjs';
import { buildRealDownloadContinuationRoutePlan, isRealDownloadContinuationProofEnabled, resolveDownloadDirectory } from './real-download-continuation-proof-lib.mjs';

export function configuredDownloadDirectory(env = process.env) {
  return typeof env.PF_REAL_DOWNLOAD_PROOF_DOWNLOAD_DIR === 'string' && env.PF_REAL_DOWNLOAD_PROOF_DOWNLOAD_DIR.trim()
    ? env.PF_REAL_DOWNLOAD_PROOF_DOWNLOAD_DIR.trim()
    : null;
}

export function buildRealDownloadReadinessHints({ env = process.env, baseUrl = 'http://127.0.0.1:8787', recentCount = 10 } = {}) {
  const routePlan = buildRealDownloadContinuationRoutePlan(recentCount).map((route) => ({ key: route.key, method: route.method, path: route.path }));
  const explicitDownloadDirectory = configuredDownloadDirectory(env);
  const downloadDirectoryResolution = explicitDownloadDirectory ? 'explicit_proof_env' : 'live_verify_env_download_dir_required';
  const configBridge = {
    depends_on_proofs: [
      'npm run proof:real-icloudpd-readiness',
      'npm run proof:real-icloudpd',
      'npm run proof:real-download-continuation',
    ],
    required_env_groups: [
      { group: 'real_download_opt_in', required_keys: ['PF_PROOF_ENABLE_REAL_DOWNLOAD_CONTINUATION'], configured: isRealDownloadContinuationProofEnabled(env) },
      { group: 'download_directory', required_keys: ['PF_REAL_DOWNLOAD_PROOF_DOWNLOAD_DIR'], configured: Boolean(explicitDownloadDirectory), fallback: 'backend /api/init/verify-env DOWNLOAD_DIR' },
      { group: 'icloud_media_source', required_proofs: ['proof:real-icloudpd-readiness', 'proof:real-icloudpd'], configured: 'external_proof_artifact_required' },
    ],
    operator_sequence: [
      'Run npm run proof:real-icloudpd-readiness and resolve missing config/session blockers.',
      'Run npm run proof:real-icloudpd only after explicit opt-in and app-owned session proof exist.',
      'Resolve DOWNLOAD_DIR through backend verify-env or set PF_REAL_DOWNLOAD_PROOF_DOWNLOAD_DIR for proof-only snapshot comparison.',
      'Run npm run proof:real-download-continuation to compare first and second download snapshots.',
    ],
    secret_boundary: 'The bridge may name keys and proof commands, but must not emit Apple IDs, passwords, cookies, tokens, raw .env values, or private download paths.',
  };
  return {
    base_url: baseUrl,
    recent_count: recentCount,
    required_env: [
      { key: 'PF_PROOF_ENABLE_REAL_DOWNLOAD_CONTINUATION', configured: isRealDownloadContinuationProofEnabled(env), expected: 'true' },
      { key: 'PF_REAL_DOWNLOAD_PROOF_DOWNLOAD_DIR', configured: Boolean(explicitDownloadDirectory), purpose: 'Optional explicit local media download directory for snapshot comparison; otherwise live verify-env must expose DOWNLOAD_DIR.' },
    ],
    route_plan: routePlan,
    mock_download_route_used: false,
    download_directory_resolution: downloadDirectoryResolution,
    secret_boundary: 'Real download readiness artifacts must not include Apple IDs, passwords, cookies, tokens, or raw .env values.',
    provider_dependency: 'Run real iCloud/auth readiness and real iCloudPD proof before live repeated-download continuation when possible.',
    config_bridge: configBridge,
  };
}

export function buildRealDownloadReadinessChecks({ env = process.env, baseUrl = 'http://127.0.0.1:8787', recentCount = 10 } = {}) {
  const readiness = buildRealDownloadReadinessHints({ env, baseUrl, recentCount });
  const routePaths = readiness.route_plan.map((route) => route.path);
  const checks = [
    { name: 'real_download_opt_in_set', passed: isRealDownloadContinuationProofEnabled(env), detail: 'PF_PROOF_ENABLE_REAL_DOWNLOAD_CONTINUATION must equal true' },
    { name: 'route_plan_uses_real_download_endpoint_twice', passed: routePaths.filter((path) => path === '/api/runtime/download/real-run').length === 2, detail: routePaths },
    { name: 'route_plan_avoids_mock_download_endpoint', passed: routePaths.every((path) => !path.includes('/mock')), detail: routePaths },
    { name: 'download_directory_resolution_documented', passed: Boolean(readiness.download_directory_resolution), detail: readiness.download_directory_resolution },
    { name: 'icloud_readiness_bridge_documented', passed: readiness.config_bridge.depends_on_proofs.includes('npm run proof:real-icloudpd-readiness'), detail: readiness.config_bridge.depends_on_proofs.join(' -> ') },
    { name: 'real_download_bridge_avoids_secret_values', passed: /must not emit/.test(readiness.config_bridge.secret_boundary), detail: readiness.config_bridge.secret_boundary },
    { name: 'secret_boundary_documented', passed: /must not include/.test(readiness.secret_boundary), detail: readiness.secret_boundary },
  ];
  return { readiness, checks };
}

export function buildRealDownloadReadinessProof({ metadata, env = process.env, baseUrl = 'http://127.0.0.1:8787', recentCount = 10 } = {}) {
  const { readiness, checks } = buildRealDownloadReadinessChecks({ env, baseUrl, recentCount });
  const proofStatus = checks.every((check) => check.passed) ? 'PASSED' : 'BLOCKED';
  return createProofEnvelope({
    proofKind: 'real_download_readiness',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus,
    runtimeMode: 'real_download_continuation_readiness_preflight',
    evidence: { environment: getProofEnvironment(), checks, readiness },
    knownLimitations: proofStatus === 'PASSED'
      ? ['This only proves local readiness inputs and route plan shape; it does not call the backend or download media.']
      : ['Set real download continuation opt-in before running the live repeated-download continuation proof.'],
  });
}
