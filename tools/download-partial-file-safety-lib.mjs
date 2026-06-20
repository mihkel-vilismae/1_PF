import { blockReasons, readJsonFile, requirement, statusFromRequirements } from './real-icloud-proof-evidence-utils.mjs';
const TEMP_FILE_RE = /(?:\.tmp|\.part|\.crdownload|\.download)$/i;
export function evaluateDownloadPartialFileSafety(env = process.env, { cwd = process.cwd() } = {}) {
  const manifest = readJsonFile(env.PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE || env.PF_REAL_ICLOUD_BATCH2_MANIFEST_FILE, { cwd });
  const requirements = [requirement('manifest_configured', Boolean(manifest.value), manifest.reason)];
  if (manifest.value) { const items = manifest.value.batches?.flatMap((b) => b.items ?? []) ?? []; requirements.push(requirement('manifest_has_items', items.length > 0, 'Manifest must contain downloaded items.')); for (const [index, item] of items.entries()) { requirements.push(requirement(`item_${index}_nonzero_size`, Number(item.size_bytes ?? 0) > 0, 'Downloaded item size must be > 0.')); requirements.push(requirement(`item_${index}_not_temp_name`, !TEMP_FILE_RE.test(String(item.safe_filename ?? '')), 'Downloaded item filename must not be temp/partial.')); if ('finalized' in item) requirements.push(requirement(`item_${index}_finalized`, item.finalized === true, 'Downloaded item must be finalized when finalized flag exists.')); } }
  return { proofStatus: statusFromRequirements(requirements), requirements, block_reasons: blockReasons(requirements) };
}
