/** Raspberry app-running target proof pack. */
import process from 'node:process';
import { createProofEnvelope, getProofEnvironment, runCommand, sanitizeEvidence } from './proof-utils.mjs';
import { detectRaspberryTarget } from './raspberry-tool-checker-lib.mjs';
import { parseRunnerStatus } from './raspberry-worker-startup-smoke-lib.mjs';

export const APP_RUNNING_TARGET_PACK_STEPS = Object.freeze([
  { id: 'executable_permissions_repair', command: 'npm', args: ['run', 'proof:raspberry-executable-permissions', '--', '--repair'], requiredStatus: 'PASSED' },
  { id: 'env_preflight_create', command: 'npm', args: ['run', 'proof:raspberry-env-preflight', '--', '--create'], requiredStatus: 'PASSED' },
  { id: 'worker_startup_smoke_prepare', command: 'npm', args: ['run', 'proof:raspberry-worker-startup-smoke', '--', '--prepare'], requiredStatus: 'PASSED' },
  { id: 'cron_preflight_install', command: 'npm', args: ['run', 'proof:raspberry-cron-preflight', '--', '--install'], requiredStatus: 'PASSED' },
  { id: 'app_running_pass', command: 'npm', args: ['run', 'proof:raspberry-app-running-pass'], requiredStatus: 'PASSED' },
  { id: 'v1_readiness', command: 'npm', args: ['run', 'proof:raspberry-v1-readiness'], requiredStatus: null },
]);

function tail(text, max = 1600) {
  return String(text ?? '').slice(-max);
}

export function summarizeTargetPackResult(step, result) {
  const reportedStatus = parseRunnerStatus(result.stdout);
  return {
    id: step.id,
    command: result.command,
    args: result.args,
    exit_code: result.exitCode,
    timed_out: result.timedOut,
    reported_status: reportedStatus,
    required_status: step.requiredStatus,
    passed_required_status: step.requiredStatus ? reportedStatus === step.requiredStatus && result.exitCode === 0 && !result.timedOut : result.exitCode === 0 && !result.timedOut,
    stdout_tail: tail(result.stdout),
    stderr_tail: tail(result.stderr),
  };
}

export async function runAppRunningTargetPackSteps({ repoRoot = process.cwd(), commandRunner = runCommand } = {}) {
  const results = [];
  for (const step of APP_RUNNING_TARGET_PACK_STEPS) {
    const result = await commandRunner(step.command, step.args, { cwd: repoRoot, timeoutMs: step.id === 'app_running_pass' ? 180000 : 120000, detached: false });
    results.push(summarizeTargetPackResult(step, result));
  }
  return results;
}

export function evaluateAppRunningTargetPack({ target, stepResults }) {
  const blockReasons = [];
  const failedReasons = [];
  if (!target.raspberry_like) blockReasons.push('current machine is not detected as Raspberry OS / Linux ARM target');
  if (target.explicit_override_used) blockReasons.push('Raspberry target detection used explicit override; override runs cannot produce PASS');
  const missingRequired = stepResults.filter((step) => step.required_status && !step.passed_required_status).map((step) => `${step.id}:${step.reported_status ?? 'NO_STATUS'}`);
  if (missingRequired.length) blockReasons.push(`required app-running target pack steps did not pass: ${missingRequired.join(', ')}`);
  const commandFailures = stepResults.filter((step) => step.exit_code !== 0 || step.timed_out).map((step) => step.id);
  if (commandFailures.length) failedReasons.push(`commands failed or timed out: ${commandFailures.join(', ')}`);
  if (blockReasons.length) return { proofStatus: 'BLOCKED', blockReasons, failedReasons, missingRequired, commandFailures };
  if (failedReasons.length) return { proofStatus: 'FAILED', blockReasons, failedReasons, missingRequired, commandFailures };
  return { proofStatus: 'PASSED', blockReasons, failedReasons, missingRequired: [], commandFailures: [] };
}

export async function buildRaspberryAppRunningTargetPackProof({ metadata, env = process.env, repoRoot = process.cwd(), commandRunner = runCommand } = {}) {
  const target = detectRaspberryTarget({ env });
  const stepResults = await runAppRunningTargetPackSteps({ repoRoot, commandRunner });
  const evaluation = evaluateAppRunningTargetPack({ target, stepResults });
  return createProofEnvelope({
    proofKind: 'raspberry_app_running_target_pack',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: evaluation.proofStatus,
    runtimeMode: 'raspberry_app_running_target_pack',
    evidence: sanitizeEvidence({
      environment: getProofEnvironment(),
      target_detection: target,
      step_results: stepResults,
      evaluation,
      pass_criteria: 'PASSED only on a non-override Raspberry target when executable/env repair, worker startup smoke, cron install, and app-running pass all report PASSED.',
      non_claims: ['does not prove real iCloud/GPS/geocode', 'does not prove address overlay', 'does not prove regular_stage_worker real product work', 'does not reboot or power-cycle the Raspberry'],
    }),
    knownLimitations: evaluation.proofStatus === 'PASSED' ? ['This pack proves the current app-running target chain only.'] : ['Inspect step_results for the first required step that did not report PASSED.'],
  });
}
