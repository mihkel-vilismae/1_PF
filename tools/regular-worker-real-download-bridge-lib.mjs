import { isTruthy, requirement, statusFromRequirements, blockReasons, readJsonFile } from './real-icloud-proof-evidence-utils.mjs';
import { evaluateRealIcloudNoLoopProducer } from './real-icloud-no-loop-producer-lib.mjs';
import { resolveWorkerInputFromDownloadManifest } from './regular-worker-product-evidence-lib.mjs';

export function evaluateRegularWorkerRealDownloadBridge(env = process.env, opts = {}) {
  const noLoop = evaluateRealIcloudNoLoopProducer(env, opts);
  const manifestPath = env.PF_WORKER_REAL_DOWNLOAD_BRIDGE_MANIFEST_FILE ?? env.PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE;
  const artifact = readJsonFile(manifestPath, { cwd: opts.cwd ?? process.cwd() });
  const resolvedInput = artifact.value ? resolveWorkerInputFromDownloadManifest(artifact.value, { sourceKind: opts.sourceKind ?? 'real_download_manifest' }) : null;
  const requirements = [
    ...noLoop.requirements,
    requirement('worker_bridge_opt_in', isTruthy(env.PF_PROOF_ENABLE_REAL_WORKER_BRIDGE), 'Set PF_PROOF_ENABLE_REAL_WORKER_BRIDGE=true once real batch manifests exist.'),
    requirement('worker_bridge_manifest_configured', Boolean(manifestPath), 'Set PF_WORKER_REAL_DOWNLOAD_BRIDGE_MANIFEST_FILE or PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE.'),
  ];
  if (resolvedInput) {
    requirements.push(requirement('worker_bridge_input_resolved', resolvedInput.status === 'PASSED', resolvedInput.errors.join('; ') || 'Real download manifest resolves to worker input.'));
    requirements.push(requirement('worker_bridge_selected_media_present', Boolean(resolvedInput.selected_media), 'Bridge must select one worker media candidate.'));
  }
  return {
    proofStatus: statusFromRequirements(requirements),
    upstream_no_loop_status: noLoop.proofStatus,
    requirements,
    resolved_input: resolvedInput,
    block_reasons: blockReasons(requirements),
  };
}
