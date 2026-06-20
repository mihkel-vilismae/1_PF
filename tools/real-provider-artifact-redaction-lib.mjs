import { blockReasons, hasSecretLikeText, readJsonFile, requirement, statusFromRequirements } from './real-icloud-proof-evidence-utils.mjs';
export function evaluateRealProviderArtifactRedaction(env = process.env, { cwd = process.cwd() } = {}) {
  const paths = [env.PF_AUTH_SESSION_USABLE_EVIDENCE_FILE, env.PF_REAL_ICLOUD_FILTER_FILE, env.PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE, env.PF_REAL_ICLOUD_BATCH2_MANIFEST_FILE].filter(Boolean);
  const requirements = [requirement('artifact_paths_configured', paths.length > 0, 'Configure at least one artifact path to audit.')];
  for (const path of paths) { const artifact = readJsonFile(path, { cwd }); requirements.push(requirement(`artifact_parsed:${path}`, Boolean(artifact.value), artifact.reason)); if (artifact.value) requirements.push(requirement(`artifact_secret_safe:${path}`, !hasSecretLikeText(artifact.value), `${path} must not contain secret-like values.`)); }
  return { proofStatus: statusFromRequirements(requirements), requirements, audited_count: paths.length, block_reasons: blockReasons(requirements) };
}
