import { checkDownloadManifestOverlap } from './download-manifest-overlap-check-lib.mjs';
import { blockReasons, hasSecretLikeText, readJsonFile, requirement, statusFromRequirements } from './real-icloud-proof-evidence-utils.mjs';
export function evaluateRealIcloudNoLoopProducer(env = process.env, { cwd = process.cwd() } = {}) {
  const b1 = readJsonFile(env.PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE, { cwd });
  const b2 = readJsonFile(env.PF_REAL_ICLOUD_BATCH2_MANIFEST_FILE, { cwd });
  const requirements = [requirement('batch1_manifest_configured', Boolean(env.PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE), 'Set PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE.'), requirement('batch2_manifest_configured', Boolean(env.PF_REAL_ICLOUD_BATCH2_MANIFEST_FILE), 'Set PF_REAL_ICLOUD_BATCH2_MANIFEST_FILE.')];
  if (b1.value && b2.value) {
    const combined = { ...b1.value, batches: [b1.value.batches?.[0], b2.value.batches?.[1] ?? b2.value.batches?.[0]].filter(Boolean) };
    const overlap = checkDownloadManifestOverlap(combined);
    requirements.push(requirement('no_loop_overlap_check_passed', overlap.status === 'PASSED', overlap.errors.join('; ') || 'No overlap detected.'));
    requirements.push(requirement('same_filter_signature', b1.value.filter_signature === b2.value.filter_signature, 'Batch 1 and batch 2 must use the same filter_signature.'));
    requirements.push(requirement('manifests_secret_safe', !hasSecretLikeText(b1.value) && !hasSecretLikeText(b2.value), 'Manifests must be secret-safe.'));
    return { proofStatus: statusFromRequirements(requirements), requirements, overlap, block_reasons: blockReasons(requirements) };
  }
  return { proofStatus: 'BLOCKED', requirements, overlap: null, block_reasons: blockReasons(requirements) };
}
