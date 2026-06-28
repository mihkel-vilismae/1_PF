#!/usr/bin/env node
import { check, emitProof, findLatestProofs, packageScripts, parseArgs, proofResult } from './v2-final-proof-utils.mjs';

const args = parseArgs();
const checks = [];
const scripts = packageScripts();
const requiredContractScripts = [
  'proof:v2-real-machine-readiness-contract',
  'proof:v2-real-cron-evidence-contract',
  'proof:v2-real-playback-display-contract',
  'proof:v2-autonomous-contract',
  'proof:v2-run-regular-worker-once',
  'proof:v2-run-playback-worker-once',
  'proof:v2-run-screen-worker-once',
  'proof:v2-install-real-crontab',
  'proof:v2-real-cron-runtime',
  'proof:v2-real-cron-cleanup',
  'proof:v2-visual-physical-evidence',
  'proof:v2-install-production-crontab',
  'proof:v2-install-production-crontab-contract',
  'proof:v2-production-cron-runtime',
  'proof:v2-production-cron-runtime-contract',
  'proof:v2-production-cron-cleanup',
  'proof:prooflauncher-logs-zip-hygiene-contract',
  'proof:prooflauncher-logs-zip-hygiene',
];

for (const scriptName of requiredContractScripts) {
  check(checks, `script-${scriptName}`, `${scriptName} exists.`, Boolean(scripts[scriptName]));
}

if (args.evidence) {
  const latestProofs = findLatestProofs();
  const statuses = Object.fromEntries(latestProofs.map((proof) => [proof.proof, proof.status]));
  const backendEvidenceProofs = [
    'v2_real_machine_readiness',
    'v2_install_real_crontab',
    'v2_real_cron_runtime',
    'v2_real_cron_worker_evidence',
    'v2_real_playback_display',
    'v2_autonomous_proof_contract',
  ];
  for (const proofName of backendEvidenceProofs) {
    check(checks, `evidence-${proofName}`, `${proofName} latest proof passed.`, statuses[proofName] === 'PASSED', { status: statuses[proofName] ?? 'missing' });
  }

  const productionEvidenceProofs = [
    'v2_install_production_crontab',
    'v2_production_cron_runtime',
  ];
  for (const proofName of productionEvidenceProofs) {
    check(checks, `production-evidence-${proofName}`, `${proofName} latest proof passed.`, statuses[proofName] === 'PASSED', { status: statuses[proofName] ?? 'missing' });
  }

  check(
    checks,
    'proof-cron-runtime-status',
    'Proof cron runtime is reported separately and passed.',
    statuses.v2_real_cron_runtime === 'PASSED',
    { proofCronRuntimeStatus: statuses.v2_real_cron_runtime ?? 'missing' },
  );
  check(
    checks,
    'production-cron-runtime-status',
    'Production cron runtime is reported separately and passed.',
    statuses.v2_production_cron_runtime === 'PASSED',
    { productionCronRuntimeStatus: statuses.v2_production_cron_runtime ?? 'missing' },
  );

  check(
    checks,
    'visual-physical-proof-status',
    'Visual physical proof is captured separately and passed when operator photo/video plus confirmation evidence exists.',
    statuses.v2_visual_physical_evidence === 'PASSED',
    { visualPhysicalStatus: statuses.v2_visual_physical_evidence ?? 'missing' },
  );

  const workerOnceProofs = [
    'v2_run_regular_worker_once',
    'v2_run_playback_worker_once',
    'v2_run_screen_worker_once',
  ];
  const passedWorkerOnceProofs = workerOnceProofs.filter((proofName) => statuses[proofName] === 'PASSED');
  check(
    checks,
    'cron-runtime-replaces-worker-once',
    'Cron-runtime proof is accepted as the stronger evidence source; worker-once proofs are optional fallback evidence.',
    statuses.v2_real_cron_runtime === 'PASSED' || passedWorkerOnceProofs.length === workerOnceProofs.length,
    { cronRuntimeStatus: statuses.v2_real_cron_runtime ?? 'missing', passedWorkerOnceProofs },
  );
  check(checks, 'proof-artifact-count', 'Proof artifacts are present.', latestProofs.length > 0, { count: latestProofs.length });
}

const result = proofResult({
  proof: 'v2_final_autonomous_bundle',
  checks,
  evidenceMode: args.evidence,
  note: args.evidence
    ? 'Final bundle summary over latest local proof artifacts. Proof cron and production cron are reported separately; production cron runtime is required for the production autonomous path. Visual physical proof remains a separate required layer for physical display completion.'
    : 'Static contract proof that final autonomous bundle commands are registered, including separate proof-cron and production-cron runtime proofs.',
});

emitProof(result, { write: args.write });
