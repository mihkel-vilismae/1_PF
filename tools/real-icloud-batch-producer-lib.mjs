import { validateDownloadManifestSafeSchema } from './download-manifest-safe-schema-lib.mjs';
import { blockReasons, hasSecretLikeText, readJsonFile, requirement, statusFromRequirements } from './real-icloud-proof-evidence-utils.mjs';
export function evaluateRealIcloudBatchProducer(env = process.env, { cwd = process.cwd(), manifestEnv, expectedIndex, label } = {}) {
  const artifact = readJsonFile(env[manifestEnv], { cwd });
  const requirements = [requirement(`${label}_manifest_configured`, Boolean(env[manifestEnv]), `Set ${manifestEnv}.`)];
  if (artifact.value) {
    const validation = validateDownloadManifestSafeSchema(artifact.value);
    requirements.push(requirement(`${label}_manifest_schema_valid`, validation.status === 'PASSED', validation.errors.join('; ') || 'Manifest schema validates.'));
    const batch = artifact.value.batches?.[expectedIndex];
    requirements.push(requirement(`${label}_batch_present`, Boolean(batch), `Manifest must include batch index ${expectedIndex}.`));
    if (batch) requirements.push(requirement(`${label}_batch_has_items`, Number(batch.downloaded_count) > 0 && Array.isArray(batch.items) && batch.items.length > 0, 'Batch must include at least one downloaded item.'));
    requirements.push(requirement(`${label}_manifest_secret_safe`, !hasSecretLikeText(artifact.value), 'Manifest must not include raw provider/account/session details.'));
  }
  return { proofStatus: statusFromRequirements(requirements), requirements, block_reasons: blockReasons(requirements) };
}
