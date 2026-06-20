import { isTruthy, requirement, statusFromRequirements, blockReasons } from './real-icloud-proof-evidence-utils.mjs';
import { evaluateRealIcloudBatchProducer } from './real-icloud-batch-producer-lib.mjs';
export function evaluateRegularWorkerConsumesDownloadManifest(env = process.env, opts = {}) {
  const batch = evaluateRealIcloudBatchProducer(env, { ...opts, manifestEnv: 'PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE', expectedIndex: 0, label: 'worker_batch1' });
  const requirements = [...batch.requirements, requirement('worker_consumes_manifest_opt_in', isTruthy(env.PF_PROOF_ENABLE_WORKER_MANIFEST_CONSUME), 'Set PF_PROOF_ENABLE_WORKER_MANIFEST_CONSUME=true when worker consumes the manifest.')];
  return { proofStatus: statusFromRequirements(requirements), requirements, block_reasons: blockReasons(requirements) };
}
