/** Raspberry app-running target proof pack. */
import process from 'node:process';
import { cp, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';
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


function safeTimestamp(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-');
}

async function copyDirectoryIfPresent({ repoRoot, relativePath, bundleRuntimeDir, included }) {
  const source = join(repoRoot, relativePath);
  if (!existsSync(source)) return;
  const target = join(bundleRuntimeDir, relativePath.replace(/^runtime_data\//u, ''));
  await mkdir(join(target, '..'), { recursive: true });
  await cp(source, target, { recursive: true, force: true });
  included.push(relativePath);
}

async function createZipFromDirectory({ bundleDir, zipPath, commandRunner }) {
  const script = `
from pathlib import Path
import sys
import zipfile
source = Path(sys.argv[1])
zip_path = Path(sys.argv[2])
if zip_path.exists():
    zip_path.unlink()
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
    for p in source.rglob('*'):
        if p.is_file():
            z.write(p, p.relative_to(source.parent))
print(zip_path)
`;
  return commandRunner('python3', ['-c', script, bundleDir, zipPath], { cwd: bundleDir, timeoutMs: 120000, detached: false });
}

export async function buildAppRunningTargetPackEvidenceBundle({ repoRoot = process.cwd(), envelope, proofPath, commandRunner = runCommand, now = new Date() } = {}) {
  const stamp = safeTimestamp(now);
  const bundleDir = join(repoRoot, 'runtime_data', `raspberry_app_running_target_pack_${stamp}`);
  const bundleRuntimeDir = join(bundleDir, 'runtime_data');
  const zipPath = join(repoRoot, 'runtime_data', `raspberry_app_running_target_pack_${stamp}.zip`);
  await mkdir(bundleRuntimeDir, { recursive: true });
  const included = [];

  for (const relativePath of [
    'runtime_data/proofs',
    'runtime_data/raspberry_worker_evidence',
    'runtime_data/scheduler',
    'runtime_data/cron',
    'runtime_data/operator_evidence',
    'runtime_data/raspberry_reboot_recovery',
  ]) {
    await copyDirectoryIfPresent({ repoRoot, relativePath, bundleRuntimeDir, included });
  }

  const manifest = sanitizeEvidence({
    generated_at: now.toISOString(),
    repo_root: repoRoot,
    target_pack_proof_path: proofPath,
    proof_status: envelope?.proof_status ?? null,
    proof_kind: envelope?.proof_kind ?? 'raspberry_app_running_target_pack',
    included_runtime_paths: included,
    step_summary: envelope?.evidence?.step_results?.map((step) => ({ id: step.id, reported_status: step.reported_status, exit_code: step.exit_code, timed_out: step.timed_out })) ?? [],
    non_claims: ['bundle creation does not add proof claims', 'bundle contents remain governed by individual proof statuses'],
  });
  await writeFile(join(bundleDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  await writeFile(join(bundleDir, 'README.txt'), [
    'PF_login Raspberry app-running target-pack evidence bundle',
    '',
    'Upload this ZIP for analysis. The bundle does not create extra proof claims; it packages logs/artifacts from the target-pack run.',
    `Target pack proof status: ${envelope?.proof_status ?? 'unknown'}`,
    `Target pack proof path: ${proofPath ?? 'unknown'}`,
    '',
  ].join('\n'), 'utf8');

  const zipResult = await createZipFromDirectory({ bundleDir, zipPath, commandRunner });
  return { bundleDir, zipPath, includedRuntimePaths: included, manifestPath: join(bundleDir, 'manifest.json'), zipResult: summarizeTargetPackResult({ id: 'bundle_zip', requiredStatus: null }, zipResult) };
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
