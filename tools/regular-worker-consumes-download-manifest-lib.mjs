import { isTruthy, requirement, statusFromRequirements, blockReasons, readJsonFile } from './real-icloud-proof-evidence-utils.mjs';
import { evaluateRealIcloudBatchProducer } from './real-icloud-batch-producer-lib.mjs';
import { resolveWorkerInputFromDownloadManifest } from './regular-worker-product-evidence-lib.mjs';

export function evaluateRegularWorkerConsumesDownloadManifest(env = process.env, opts = {}) {
  const manifestEnv = opts.manifestEnv ?? 'PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE';
  const batch = evaluateRealIcloudBatchProducer(env, { ...opts, manifestEnv, expectedIndex: opts.expectedIndex ?? 0, label: 'worker_batch1' });
  const artifact = readJsonFile(env[manifestEnv], { cwd: opts.cwd ?? process.cwd() });
  const resolvedInput = artifact.value ? resolveWorkerInputFromDownloadManifest(artifact.value, { sourceKind: opts.sourceKind ?? env.PF_WORKER_INPUT_SOURCE_KIND ?? 'real_download_manifest' }) : null;
  const requirements = [
    ...batch.requirements,
    requirement('worker_consumes_manifest_opt_in', isTruthy(env.PF_PROOF_ENABLE_WORKER_MANIFEST_CONSUME), 'Set PF_PROOF_ENABLE_WORKER_MANIFEST_CONSUME=true when worker consumes the manifest.'),
  ];
  if (resolvedInput) {
    requirements.push(requirement('worker_manifest_input_resolved', resolvedInput.status === 'PASSED', resolvedInput.errors.join('; ') || 'Manifest resolves to display-eligible worker input.'));
    requirements.push(requirement('worker_manifest_selected_media_present', Boolean(resolvedInput.selected_media), 'Resolved manifest must select one worker media candidate.'));
  }
  return {
    proofStatus: statusFromRequirements(requirements),
    requirements,
    resolved_input: resolvedInput,
    block_reasons: blockReasons(requirements),
  };
}
