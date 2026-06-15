/**
 * Raspberry app-running PASS chain proof library.
 * Runs worker evidence generation -> cron worker runtime -> app-running status.
 */
import { createProofEnvelope, getProofEnvironment, sanitizeEvidence } from './proof-utils.mjs';
import { buildRaspberryWorkerEvidenceGeneratorProof } from './raspberry-worker-evidence-generator-lib.mjs';
import { buildRaspberryCronWorkerRuntimeProof } from './raspberry-cron-worker-runtime-proof-lib.mjs';
import { buildRaspberryAppRunningStatusProof } from './raspberry-app-running-status-proof-lib.mjs';

export function determineAppRunningChainStatus({ generatorProof, cronProof, appStatusProof }) {
  const statuses = [generatorProof?.proof_status, cronProof?.proof_status, appStatusProof?.proof_status];
  if (statuses.every((status) => status === 'PASSED')) return 'PASSED';
  if (statuses.some((status) => status === 'FAILED')) return 'FAILED';
  return 'BLOCKED';
}

export async function buildRaspberryAppRunningChainProof({ metadata, env = process.env, runtimeDirectory, generatedEvidence = null, currentCrontab = null } = {}) {
  const generatorProof = await buildRaspberryWorkerEvidenceGeneratorProof({ metadata, env, runtimeDirectory, generatedEvidence, currentCrontab });
  const evidenceFile = generatorProof.evidence?.generated_evidence_file;
  const injectedOperatorEvidence = generatedEvidence ?? null;
  const chainEnv = { ...env, PF_RASPBERRY_CRON_WORKER_EVIDENCE_FILE: evidenceFile ?? env.PF_RASPBERRY_CRON_WORKER_EVIDENCE_FILE };
  const cronProof = await buildRaspberryCronWorkerRuntimeProof({ metadata, env: chainEnv, currentCrontab, operatorEvidence: injectedOperatorEvidence });
  const appStatusProof = await buildRaspberryAppRunningStatusProof({ metadata, env: chainEnv, currentCrontab, cronEnvelope: cronProof });
  const proofStatus = determineAppRunningChainStatus({ generatorProof, cronProof, appStatusProof });
  return createProofEnvelope({
    proofKind: 'raspberry_app_running_chain',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus,
    runtimeMode: 'raspberry_app_running_chain',
    evidence: sanitizeEvidence({
      environment: getProofEnvironment(),
      generated_evidence_file: evidenceFile,
      chain: [
        { step: 'worker_evidence_generator', status: generatorProof.proof_status, proof_kind: generatorProof.proof_kind },
        { step: 'cron_worker_runtime', status: cronProof.proof_status, proof_kind: cronProof.proof_kind },
        { step: 'app_running_status', status: appStatusProof.proof_status, proof_kind: appStatusProof.proof_kind, app_running: appStatusProof.evidence?.app_running },
      ],
      generator_summary: generatorProof.evidence?.status_reasons,
      cron_summary: cronProof.evidence?.status_reasons,
      app_running_summary: appStatusProof.evidence?.summary,
      pass_criteria: 'PASSED only when worker evidence generation, cron worker runtime proof, and app-running status proof all pass in the same chained run.',
      non_claims: ['does not install cron', 'does not reboot the Raspberry', 'does not perform physical power-loss recovery', 'does not prove monitor pixels', 'does not prove production iCloud continuation'],
    }),
    knownLimitations: proofStatus === 'PASSED'
      ? ['This chain pass applies only to the generated evidence file and crontab observed during this run.']
      : ['The app-running chain remains blocked until worker evidence generation, cron worker runtime proof, and app-running status proof all pass.'],
  });
}
