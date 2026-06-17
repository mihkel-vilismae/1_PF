/** Raspberry app-running status proof library. */
import { createProofEnvelope, sanitizeEvidence } from './proof-utils.mjs';
import { buildRaspberryCronWorkerRuntimeProof } from './raspberry-cron-worker-runtime-proof-lib.mjs';

export function summarizeAppRunningStatus(cronEnvelope) {
  const workerRows = cronEnvelope?.evidence?.worker_evidence ?? [];
  const cronRows = cronEnvelope?.evidence?.cron?.row_evidence ?? [];
  const workerSummary = workerRows.map((worker) => ({
    name: worker.name,
    invocation_observed: Boolean(worker.invocation_observed),
    same_worker_singleton: Boolean(worker.same_worker_singleton),
    duplicate_skip_observed: Boolean(worker.duplicate_skip_observed),
    cross_worker_independence_observed: Boolean(worker.cross_worker_independence_observed),
    stale_lock_reclaim_observed: Boolean(worker.stale_lock_reclaim_observed),
    status: worker.complete ? 'ok' : 'missing_evidence',
  }));
  const appRunning = cronEnvelope?.proof_status === 'PASSED' && workerSummary.every((worker) => worker.status === 'ok');
  return {
    app_running: appRunning,
    status: appRunning ? 'PASSED' : cronEnvelope?.proof_status === 'FAILED' ? 'FAILED' : 'BLOCKED',
    cron_worker_runtime_status: cronEnvelope?.proof_status ?? 'UNKNOWN',
    cron_rows_present: cronRows.every((row) => row.present),
    worker_summary: workerSummary,
    blocking_reasons: cronEnvelope?.evidence?.status_reasons?.blockReasons ?? [],
    failed_reasons: cronEnvelope?.evidence?.status_reasons?.failedReasons ?? [],
  };
}


export function buildAppRunningStatusNextSteps(summary) {
  if (summary.app_running) return ['Run npm run proof:raspberry-v1-readiness to update release-gate status.'];
  const missingWorkers = summary.worker_summary.filter((worker) => worker.status !== 'ok').map((worker) => worker.name);
  const steps = [];
  if (summary.cron_worker_runtime_status !== 'PASSED') steps.push('Make npm run proof:raspberry-cron-worker-runtime pass first; app-running status is downstream of cron worker runtime evidence.');
  if (missingWorkers.length) steps.push(`Complete app-running worker evidence for: ${missingWorkers.join(', ')}.`);
  if (summary.blocking_reasons.length) steps.push(`Blocked by: ${summary.blocking_reasons.join('; ')}`);
  if (summary.failed_reasons.length) steps.push(`Failed because: ${summary.failed_reasons.join('; ')}`);
  return steps.length ? steps : ['Provide complete cron worker runtime evidence for all three worker lanes.'];
}

export async function buildRaspberryAppRunningStatusProof({ metadata, env = process.env, currentCrontab = null, operatorEvidence = null, cronEnvelope = null } = {}) {
  const cronProof = cronEnvelope ?? await buildRaspberryCronWorkerRuntimeProof({ metadata, env, currentCrontab, operatorEvidence });
  const summary = summarizeAppRunningStatus(cronProof);
  return createProofEnvelope({
    proofKind: 'raspberry_app_running_status',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: summary.status,
    runtimeMode: 'raspberry_app_running_status',
    evidence: sanitizeEvidence({
      app_running: summary.app_running,
      summary,
      cron_worker_runtime: {
        proof_status: cronProof.proof_status,
        proof_kind: cronProof.proof_kind,
        runtime_mode: cronProof.runtime_mode,
        target_detection: cronProof.evidence?.target_detection,
        cron: cronProof.evidence?.cron,
        operator_evidence: cronProof.evidence?.operator_evidence,
        worker_evidence: cronProof.evidence?.worker_evidence,
        status_reasons: cronProof.evidence?.status_reasons,
      },
      next_steps: buildAppRunningStatusNextSteps(summary),
      pass_criteria: 'PASSED only when the Raspberry cron worker runtime proof passes and all three worker lanes report complete evidence.',
      non_claims: ['does not start the API by itself', 'does not install cron', 'does not reboot the Raspberry', 'does not prove physical power-loss recovery', 'does not prove production iCloud continuation'],
    }),
    knownLimitations: summary.app_running ? ['Status is limited to the supplied cron/worker evidence timestamp.'] : ['App-running status remains blocked until the Raspberry cron worker runtime proof passes.'],
  });
}
