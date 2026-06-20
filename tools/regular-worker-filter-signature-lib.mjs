import { readJsonFile, requirement, statusFromRequirements, blockReasons } from './real-icloud-proof-evidence-utils.mjs';
import { evaluateRealIcloudFilterConfig } from './real-icloud-filter-config-lib.mjs';
export function evaluateRegularWorkerFilterSignature(env = process.env, opts = {}) {
  const filter = evaluateRealIcloudFilterConfig(env, opts);
  const manifest = readJsonFile(env.PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE, opts);
  const requirements = [...filter.requirements, requirement('worker_manifest_present', Boolean(manifest.value), manifest.reason)];
  if (filter.filter_signature && manifest.value) requirements.push(requirement('worker_filter_signature_matches_manifest', filter.filter_signature === manifest.value.filter_signature, 'Worker filter signature must match manifest filter_signature.'));
  return { proofStatus: statusFromRequirements(requirements), requirements, filter_signature: filter.filter_signature, block_reasons: blockReasons(requirements) };
}
