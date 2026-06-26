/**
 * Validates regular_stage_worker runtime status as product-work authority.
 * Rejects manual confirmation and instrumentation-only worker evidence.
 * Returns sanitized, proof-friendly confirmation details for bridge producers.
 */
import { join } from 'node:path';
import process from 'node:process';
import { readJsonFile } from './real-icloud-proof-evidence-utils.mjs';

/** Resolves the configured or canonical regular worker runtime status path. */
export function resolveRegularWorkerRuntimeStatusPath(env = process.env, { cwd = process.cwd() } = {}) {
  return env.PF_REGULAR_WORKER_RUNTIME_STATUS_FILE
    ?? join(cwd, 'runtime_data', 'scheduler', 'regular-stage-worker-status.json');
}

/** Validates that runtime status proves product work from a product-capable worker run. */
export function evaluateRegularWorkerRuntimeProductEvidence(env = process.env, opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  const statusPath = resolveRegularWorkerRuntimeStatusPath(env, { cwd });
  const loaded = readJsonFile(statusPath, { cwd });
  const status = loaded.value;
  const reasons = [];
  if (!status) reasons.push(loaded.reason);
  if (status && status.worker !== 'regular_stage_worker') reasons.push('worker runtime status must belong to regular_stage_worker');
  if (status && status.status !== 'succeeded') reasons.push('regular_stage_worker runtime status must be succeeded');
  if (status && status.invocation_observed !== true) reasons.push('regular_stage_worker invocation_observed must be true');
  if (status?.implementationStatus === 'instrumentation_only') reasons.push('regular_stage_worker implementationStatus is instrumentation_only');
  else if (status && !status.implementationStatus) reasons.push('regular_stage_worker runtime must identify a product-capable implementationStatus');
  if (status && status.productWork?.claimed !== true) reasons.push('regular_stage_worker runtime productWork.claimed must be true');
  const confirmed = Boolean(status) && reasons.length === 0;
  return {
    confirmed,
    source: statusPath,
    load_error: status ? null : loaded.reason,
    manual_confirmation_ignored: Boolean(env.PF_REGULAR_WORKER_PRODUCT_WORK_CONFIRMED),
    implementation_status: status?.implementationStatus ?? null,
    worker_status: status?.status ?? null,
    invocation_observed: status?.invocation_observed ?? null,
    product_work_claimed: status?.productWork?.claimed ?? false,
    worker_run_id: status?.productWork?.runId ?? status?.runId ?? status?.workerRunId ?? null,
    observed_at: status?.finishedAt ?? status?.last_invocation_at ?? null,
    reasons: [...new Set(reasons.filter(Boolean))],
  };
}
