/** Raspberry three-worker startup smoke proof. */
import process from 'node:process';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createProofEnvelope, getProofEnvironment, runCommand, sanitizeEvidence } from './proof-utils.mjs';
import { detectRaspberryTarget } from './raspberry-tool-checker-lib.mjs';
import { parseEnvText } from './raspberry-env-preflight-lib.mjs';

export const RASPBERRY_WORKER_STARTUP_LANES = Object.freeze([
  { name: 'regular_stage_worker', schedulerArg: 'regular-stage-worker', requiredForV1: true },
  { name: 'playback_worker', schedulerArg: 'playback-worker', requiredForV1: true },
  { name: 'screen_on_off_worker', schedulerArg: 'screen-on-off-worker', requiredForV1: true, productWorkRequiredForV1: false },
]);

function lastNonEmptyLines(text, count = 16) {
  return String(text ?? '').split(/\r?\n/u).map((line) => line.trim()).filter(Boolean).slice(-count).join('\n');
}

function parseRunnerStatus(stdout) {
  try {
    const parsed = JSON.parse(String(stdout ?? '').match(/\{[\s\S]*\}\s*$/u)?.[0] ?? '{}');
    return parsed.status ?? parsed.proof_status ?? null;
  } catch {
    return null;
  }
}

export function summarizeCommandResult(result) {
  return {
    command: result.command,
    args: result.args,
    exit_code: result.exitCode,
    signal: result.signal,
    timed_out: result.timedOut,
    duration_ms: result.durationMs,
    reported_status: parseRunnerStatus(result.stdout),
    stdout_excerpt: lastNonEmptyLines(result.stdout),
    stderr_excerpt: lastNonEmptyLines(result.stderr),
  };
}


async function resolveDatabasePathFromEnv({ repoRoot }) {
  try {
    const parsed = parseEnvText(await readFile(join(repoRoot, '.env'), 'utf8'));
    const configured = parsed.values.DB_PATH || 'runtime_data/photo_frame.sqlite';
    return configured.startsWith('/') ? configured : join(repoRoot, configured);
  } catch {
    return join(repoRoot, 'runtime_data', 'photo_frame.sqlite');
  }
}

async function runDatabasePreflight({ repoRoot, prepare, commandRunner }) {
  const dbPath = await resolveDatabasePathFromEnv({ repoRoot });
  await mkdir(dirname(dbPath), { recursive: true });
  const args = prepare
    ? ['server/scripts/sqlite_admin.py', 'recreate', dbPath, 'schema.sql']
    : ['server/scripts/sqlite_admin.py', 'inspect', dbPath];
  const result = await commandRunner('python3', args, { cwd: repoRoot, timeoutMs: 30000, detached: false });
  return { id: 'database_preflight', db_path: dbPath, ...summarizeCommandResult(result) };
}

export async function runWorkerStartupSmokeCommands({ repoRoot = process.cwd(), prepare = false, commandRunner = runCommand } = {}) {
  const preflightCommands = [
    {
      id: 'executable_permissions',
      command: 'npm',
      args: ['run', 'proof:raspberry-executable-permissions', ...(prepare ? ['--', '--repair'] : [])],
    },
    {
      id: 'env_preflight',
      command: 'npm',
      args: ['run', 'proof:raspberry-env-preflight', ...(prepare ? ['--', '--create'] : [])],
    },
  ];

  const preflights = [];
  for (const step of preflightCommands) {
    const result = await commandRunner(step.command, step.args, { cwd: repoRoot, timeoutMs: 30000, detached: false });
    preflights.push({ id: step.id, ...summarizeCommandResult(result) });
  }
  preflights.push(await runDatabasePreflight({ repoRoot, prepare, commandRunner }));

  const workers = [];
  for (const lane of RASPBERRY_WORKER_STARTUP_LANES) {
    const result = await commandRunner('npm', ['run', 'api', '--', '--scheduler', lane.schedulerArg], {
      cwd: repoRoot,
      timeoutMs: lane.schedulerArg === 'playback-worker' ? 45000 : 30000,
      detached: false,
    });
    workers.push({ lane, ...summarizeCommandResult(result) });
  }

  return { preflights, workers };
}

export function evaluateWorkerStartupSmoke({ target, preflights, workers }) {
  const blockReasons = [];
  const failureReasons = [];

  if (!target.raspberry_like) blockReasons.push('current machine is not detected as Raspberry OS / Linux ARM target');
  if (target.explicit_override_used) blockReasons.push('Raspberry target detection used explicit override; override runs cannot produce PASS');

  for (const step of preflights) {
    const statusOk = step.id === 'database_preflight' ? step.exit_code === 0 && !step.timed_out : step.reported_status === 'PASSED';
    if (step.exit_code !== 0 || step.timed_out || !statusOk) {
      blockReasons.push(`preflight did not pass: ${step.id}`);
    }
  }

  for (const worker of workers) {
    if (worker.exit_code !== 0 || worker.timed_out) {
      failureReasons.push(`worker did not start cleanly: ${worker.lane.name}`);
    }
  }

  if (target.raspberry_like && !target.explicit_override_used && blockReasons.length === 0 && failureReasons.length > 0) {
    return { proofStatus: 'FAILED', blockReasons, failureReasons };
  }
  if (blockReasons.length || failureReasons.length) {
    return { proofStatus: 'BLOCKED', blockReasons, failureReasons };
  }
  return { proofStatus: 'PASSED', blockReasons, failureReasons };
}

export async function buildRaspberryWorkerStartupSmokeProof({ metadata, repoRoot = process.cwd(), env = process.env, prepare = false, commandRunner = runCommand } = {}) {
  const target = detectRaspberryTarget({ env });
  const { preflights, workers } = await runWorkerStartupSmokeCommands({ repoRoot, prepare, commandRunner });
  const evaluation = evaluateWorkerStartupSmoke({ target, preflights, workers });

  return createProofEnvelope({
    proofKind: 'raspberry_worker_startup_smoke',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: evaluation.proofStatus,
    runtimeMode: prepare ? 'raspberry_worker_startup_smoke_prepare' : 'raspberry_worker_startup_smoke_check',
    evidence: sanitizeEvidence({
      environment: getProofEnvironment(),
      target_detection: target,
      repo_root: repoRoot,
      prepare_requested: prepare,
      expected_worker_lanes: RASPBERRY_WORKER_STARTUP_LANES,
      preflights,
      workers,
      evaluation,
      pass_criteria: 'PASSED only on a non-override Raspberry-like target when executable/env/database preflights pass and all three scheduler worker commands exit cleanly.',
      next_steps: evaluation.proofStatus === 'PASSED'
        ? ['Run cron/app-running proof and native playback proof.']
        : ['Fix blocked executable/env/database preflights or worker startup errors, then rerun this proof on Raspberry with --prepare if setup is fresh.'],
      non_claims: [
        'does not prove cron timing or crontab installation',
        'does not prove regular_stage_worker real product pipeline work',
        'does not prove native display playback',
        'does not prove dashboard status view',
        'does not prove reboot or physical power-loss recovery',
      ],
    }),
    knownLimitations: evaluation.proofStatus === 'PASSED'
      ? ['This proves startup of all three scheduler worker commands only; it does not prove full cron workflow product behavior.']
      : ['Run on the Raspberry target after install/runtime preflight repair.'],
  });
}
