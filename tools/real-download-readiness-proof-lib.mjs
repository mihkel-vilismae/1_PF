/** Secret-safe real download continuation readiness preflight helpers. */
import { createProofEnvelope, getProofEnvironment } from './proof-utils.mjs';
import { buildRealDownloadContinuationRoutePlan, isRealDownloadContinuationProofEnabled, resolveDownloadDirectory } from './real-download-continuation-proof-lib.mjs';

function configuredDownloadDirectory(env = process.env) {
  return typeof env.PF_REAL_DOWNLOAD_PROOF_DOWNLOAD_DIR === 'string' && env.PF_REAL_DOWNLOAD_PROOF_DOWNLOAD_DIR.trim()
    ? env.PF_REAL_DOWNLOAD_PROOF_DOWNLOAD_DIR.trim()
    : null;
}

export function buildRealDownloadReadinessHints({ env = process.env, baseUrl = 'http://127.0.0.1:8787', recentCount = 10 } = {}) {
  const routePlan = buildRealDownloadContinuationRoutePlan(recentCount).map((route) => ({ key: route.key, method: route.method, path: route.path }));
  const explicitDownloadDirectory = configuredDownloadDirectory(env);
  return {
    base_url: baseUrl,
    recent_count: recentCount,
    required_env: [
      { key: 'PF_PROOF_ENABLE_REAL_DOWNLOAD_CONTINUATION', configured: isRealDownloadContinuationProofEnabled(env), expected: 'true' },
      { key: 'PF_REAL_DOWNLOAD_PROOF_DOWNLOAD_DIR', configured: Boolean(explicitDownloadDirectory), purpose: 'Optional explicit local media download directory for snapshot comparison; otherwise live verify-env must expose DOWNLOAD_DIR.' },
    ],
    route_plan: routePlan,
    mock_download_route_used: false,
    download_directory_resolution: explicitDownloadDirectory ? 'explicit_proof_env' : 'live_verify_env_download_dir_required',
    secret_boundary: 'Real download readiness artifacts must not include Apple IDs, passwords, cookies, tokens, or raw .env values.',
    provider_dependency: 'Run real iCloud/auth readiness and real iCloudPD proof before live repeated-download continuation when possible.',
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
