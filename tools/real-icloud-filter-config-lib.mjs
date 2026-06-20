import { createIcloudFilterSignature } from './icloud-filter-signature-lib.mjs';
import { blockReasons, hasSecretLikeText, readJsonFile, requirement, statusFromRequirements } from './real-icloud-proof-evidence-utils.mjs';
function parseJson(text) { try { return JSON.parse(text); } catch { return null; } }
export function evaluateRealIcloudFilterConfig(env = process.env, { cwd = process.cwd() } = {}) {
  const filter = env.PF_REAL_ICLOUD_FILTER_JSON ? parseJson(env.PF_REAL_ICLOUD_FILTER_JSON) : readJsonFile(env.PF_REAL_ICLOUD_FILTER_FILE, { cwd }).value;
  const requirements = [requirement('filter_configured', Boolean(filter), 'Set PF_REAL_ICLOUD_FILTER_JSON or PF_REAL_ICLOUD_FILTER_FILE.')];
  let signature = null;
  if (filter) {
    try { signature = createIcloudFilterSignature(filter); requirements.push(requirement('filter_signature_created', true, 'Filter signature created.')); }
    catch (error) { requirements.push(requirement('filter_signature_created', false, error instanceof Error ? error.message : String(error))); }
    requirements.push(requirement('filter_secret_safe', !hasSecretLikeText(filter), 'Filter config must not include credentials or account identifiers.'));
  }
  return { proofStatus: statusFromRequirements(requirements), requirements, filter_signature: signature?.filter_signature ?? null, normalized_filter: signature?.normalized ?? null, block_reasons: blockReasons(requirements) };
}
