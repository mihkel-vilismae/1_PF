import { isTruthy, requirement, statusFromRequirements, blockReasons } from './real-icloud-proof-evidence-utils.mjs';
import { evaluateRealIcloudNoLoopProducer } from './real-icloud-no-loop-producer-lib.mjs';
export function evaluateRegularWorkerRealDownloadBridge(env = process.env, opts = {}) {
  const noLoop = evaluateRealIcloudNoLoopProducer(env, opts);
  const requirements = [...noLoop.requirements, requirement('worker_bridge_opt_in', isTruthy(env.PF_PROOF_ENABLE_REAL_WORKER_BRIDGE), 'Set PF_PROOF_ENABLE_REAL_WORKER_BRIDGE=true once real batch manifests exist.')];
  return { proofStatus: statusFromRequirements(requirements), upstream_no_loop_status: noLoop.proofStatus, requirements, block_reasons: blockReasons(requirements) };
}
