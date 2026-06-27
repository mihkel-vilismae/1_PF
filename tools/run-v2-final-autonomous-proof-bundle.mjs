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
];

for (const scriptName of requiredContractScripts) {
  check(checks, `script-${scriptName}`, `${scriptName} exists.`, Boolean(scripts[scriptName]));
}

if (args.evidence) {
  const latestProofs = findLatestProofs();
  const statuses = Object.fromEntries(latestProofs.map((proof) => [proof.proof, proof.status]));
  const requiredEvidenceProofs = [
    'v2_real_machine_readiness',
    'v2_install_real_crontab',
    'v2_real_cron_runtime',
    'v2_real_cron_worker_evidence',
    'v2_real_playback_display',
    'v2_autonomous_proof_contract',
  ];
  for (const proofName of requiredEvidenceProofs) {
    check(checks, `evidence-${proofName}`, `${proofName} latest proof passed.`, statuses[proofName] === 'PASSED', { status: statuses[proofName] ?? 'missing' });
  }

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
    ? 'Final bundle summary over latest local proof artifacts. Cron-runtime proof is accepted as stronger evidence than worker-once proofs when it passes on the target machine.'
    : 'Static contract proof that final autonomous bundle commands are registered.',
});

emitProof(result, { write: args.write });
