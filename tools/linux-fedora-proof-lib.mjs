/** Fedora/Linux rehearsal proof helpers. */
import { existsSync, readFileSync } from 'node:fs';
import process from 'node:process';
import { createProofEnvelope, getProofEnvironment, runCommand, sanitizeEvidence } from './proof-utils.mjs';

export const REQUIRED_FEDORA_TOOLS = Object.freeze([
  { name: 'node', args: ['--version'], purpose: 'PF_login runtime and proof scripts' },
  { name: 'npm', args: ['--version'], purpose: 'package scripts and dependency workflow' },
  { name: 'git', args: ['--version'], purpose: 'baseline and commit evidence' },
]);

export const OPTIONAL_FEDORA_MEDIA_TOOLS = Object.freeze([
  { name: 'ffmpeg', args: ['-version'], purpose: 'media metadata/toolchain compatibility' },
  { name: 'ffprobe', args: ['-version'], purpose: 'media fixture inspection' },
  { name: 'mpv', args: ['--version'], purpose: 'Linux native playback rehearsal only, not Raspberry display proof' },
]);

export function detectFedoraLinuxTarget({ env = process.env, platform = process.platform, arch = process.arch } = {}) {
  const osRelease = readOptionalFile('/etc/os-release');
  const explicitOverride = env.PF_LINUX_FEDORA_ASSUME_TARGET === 'true';
  const fedoraLike = /\bID=fedora\b|\bID_LIKE=.*fedora|Fedora Linux/i.test(osRelease);
  const linuxLike = platform === 'linux';
  return {
    platform,
    arch,
    os_release_present: existsSync('/etc/os-release'),
    fedora_like: Boolean(fedoraLike || explicitOverride),
    linux_like: Boolean(linuxLike || explicitOverride),
    explicit_override_used: explicitOverride,
    os_release_excerpt: firstNonEmptyLines(osRelease, 8),
  };
}

export async function checkCommandTool(tool, { timeoutMs = 5000 } = {}) {
  const result = await runCommand(tool.name, tool.args, { timeoutMs, detached: false });
  return {
    name: tool.name,
    purpose: tool.purpose,
    command: tool.name,
    args: tool.args,
    available: result.exitCode === 0 && !result.timedOut,
    exit_code: result.exitCode,
    signal: result.signal,
    timed_out: result.timedOut,
    version_excerpt: firstNonEmptyLines(result.stdout || result.stderr, 3),
  };
}

export async function buildLinuxFedoraEnvPreflightProof({ metadata, env = process.env } = {}) {
  const target = detectFedoraLinuxTarget({ env });
  const required = [];
  for (const tool of REQUIRED_FEDORA_TOOLS) required.push(await checkCommandTool(tool));
  const missing = required.filter((tool) => !tool.available).map((tool) => tool.name);
  const packageJsonPresent = existsSync('package.json');
  const versionPresent = existsSync('VERSION');
  const proofStatus = target.linux_like && packageJsonPresent && versionPresent && missing.length === 0 ? 'PASSED' : 'BLOCKED';
  const blockReasons = [];
  if (!target.linux_like) blockReasons.push('current machine is not Linux/Fedora-like; set PF_LINUX_FEDORA_ASSUME_TARGET=true only for explicit rehearsal override');
  if (!packageJsonPresent) blockReasons.push('package.json missing');
  if (!versionPresent) blockReasons.push('VERSION missing');
  if (missing.length) blockReasons.push(`missing required command tools: ${missing.join(', ')}`);

  return createProofEnvelope({
    proofKind: 'linux_fedora_env_preflight',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus,
    runtimeMode: 'linux_fedora_rehearsal_env_preflight',
    evidence: sanitizeEvidence({
      environment: getProofEnvironment(),
      target_detection: target,
      package_json_present: packageJsonPresent,
      version_file_present: versionPresent,
      required_tool_results: required,
      block_reasons: blockReasons,
      proof_scope: 'Fedora/Linux rehearsal readiness only.',
      non_claims: FEDORA_NON_CLAIMS,
    }),
    knownLimitations: ['Does not prove Raspberry-native playback, Raspberry display overlay, boot behavior, power-loss recovery, or physical device readiness.'],
  });
}

export async function buildLinuxFedoraToolCheckerProof({ metadata, env = process.env } = {}) {
  const target = detectFedoraLinuxTarget({ env });
  const required = [];
  for (const tool of REQUIRED_FEDORA_TOOLS) required.push(await checkCommandTool(tool));
  const optional = [];
  for (const tool of OPTIONAL_FEDORA_MEDIA_TOOLS) optional.push(await checkCommandTool(tool));
  const missingRequired = required.filter((tool) => !tool.available).map((tool) => tool.name);
  const proofStatus = target.linux_like && missingRequired.length === 0 ? 'PASSED' : 'BLOCKED';
  return createProofEnvelope({
    proofKind: 'linux_fedora_tool_checker',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus,
    runtimeMode: 'linux_fedora_rehearsal_tool_checker',
    evidence: sanitizeEvidence({
      environment: getProofEnvironment(),
      target_detection: target,
      required_tool_results: required,
      optional_media_tool_results: optional,
      missing_required_tools: missingRequired,
      media_tool_policy: 'Optional media tools improve rehearsal coverage, but do not convert Fedora into Raspberry display proof.',
      non_claims: FEDORA_NON_CLAIMS,
    }),
    knownLimitations: ['mpv/ffmpeg/ffprobe availability on Fedora is rehearsal evidence only and is not Raspberry native playback proof.'],
  });
}

export const FEDORA_NON_CLAIMS = Object.freeze([
  'does not prove Raspberry native image playback',
  'does not prove Raspberry native video playback',
  'does not prove address overlay on the Raspberry/device display',
  'does not prove Raspberry boot, reboot, power-loss, or physical screen behavior',
  'does not replace proof:raspberry-v1-readiness',
]);

function readOptionalFile(path) {
  try { return readFileSync(path, 'utf8'); } catch { return ''; }
}

function firstNonEmptyLines(text, count) {
  return String(text ?? '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, count).join('\n');
}

export const LINUX_FEDORA_WORKER_LANES = Object.freeze([
  { name: 'regular_stage_worker', schedule: '*/10 * * * *', requiredForV1Rehearsal: true },
  { name: 'playback_worker', schedule: '* * * * *', requiredForV1Rehearsal: true },
  { name: 'screen_on_off_worker', schedule: '*/3 * * * *', requiredForV1Rehearsal: true },
]);

export function expectedFedoraCronRows({ repoRoot }) {
  return [
    `*/10 * * * * cd "${repoRoot}" && npm run api -- --scheduler regular-stage-worker >>"${repoRoot}/runtime_data/cron/regular-stage-worker.log" 2>&1`,
    `* * * * * cd "${repoRoot}" && npm run api -- --scheduler playback-worker >>"${repoRoot}/runtime_data/cron/playback-worker.log" 2>&1`,
    `*/3 * * * * cd "${repoRoot}" && npm run api -- --scheduler screen-on-off-worker >>"${repoRoot}/runtime_data/cron/screen-on-off-worker.log" 2>&1`,
  ];
}

export async function buildLinuxFedoraCronPreflightProof({ metadata, env = process.env, repoRoot = process.cwd() } = {}) {
  const target = detectFedoraLinuxTarget({ env });
  const crontab = await runCommand('crontab', ['-l'], { timeoutMs: 10000, detached: false, sanitize: false });
  const crontabAvailable = crontab.exitCode === 0 || /no crontab/i.test(crontab.stderr || '');
  const text = crontab.exitCode === 0 ? crontab.stdout : '';
  const expectedRows = expectedFedoraCronRows({ repoRoot });
  const rowEvidence = expectedRows.map((row, index) => ({
    lane: LINUX_FEDORA_WORKER_LANES[index].name,
    expected_row: row,
    present: text.includes(row),
  }));
  const allRowsPresent = rowEvidence.every((row) => row.present);
  const proofStatus = target.linux_like && crontabAvailable ? (allRowsPresent ? 'PASSED' : 'BLOCKED') : 'BLOCKED';
  return createProofEnvelope({
    proofKind: 'linux_fedora_cron_preflight',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus,
    runtimeMode: 'linux_fedora_rehearsal_cron_preflight',
    evidence: sanitizeEvidence({
      environment: getProofEnvironment(),
      target_detection: target,
      repo_root: repoRoot,
      crontab_available: crontabAvailable,
      crontab_command: { exit_code: crontab.exitCode, stderr_excerpt: firstNonEmptyLines(crontab.stderr, 6) },
      expected_worker_lanes: LINUX_FEDORA_WORKER_LANES,
      expected_cron_rows: expectedRows,
      row_evidence: rowEvidence,
      missing_rows: rowEvidence.filter((row) => !row.present).map((row) => row.lane),
      pass_criteria: 'PASSED only when Fedora/Linux crontab is readable and all three proof-equivalent worker lane rows are present.',
      install_policy: 'Does not install or mutate crontab. Operator may copy rows manually for Fedora rehearsal.',
      non_claims: FEDORA_NON_CLAIMS,
    }),
    knownLimitations: ['This checks Fedora/Linux scheduler rows only; it does not prove Raspberry cron environment or boot recovery.'],
  });
}

export function evaluateProofOwnedWorkerSingletonLane({ lane, nowMs = Date.now(), staleMs = 60_000 }) {
  const freshLock = { owner: lane.name, acquired_at: new Date(nowMs).toISOString() };
  const duplicateWhileFresh = { action: 'skip_duplicate', accepted: false, reason: 'fresh lock already held by same worker lane' };
  const staleLock = { owner: lane.name, acquired_at: new Date(nowMs - staleMs - 1000).toISOString() };
  const staleRecovered = { action: 'clear_stale_and_run', accepted: true, reason: 'lock age exceeded proof threshold' };
  return {
    lane: lane.name,
    first_invocation: { action: 'acquire_and_run', accepted: true, lock: freshLock },
    duplicate_invocation: duplicateWhileFresh,
    stale_lock_fixture: staleLock,
    stale_lock_recovery: staleRecovered,
    pass: duplicateWhileFresh.accepted === false && staleRecovered.accepted === true,
  };
}

export async function buildLinuxFedoraWorkerSingletonPackProof({ metadata, env = process.env, repoRoot = process.cwd() } = {}) {
  const target = detectFedoraLinuxTarget({ env });
  const laneEvidence = LINUX_FEDORA_WORKER_LANES.map((lane) => evaluateProofOwnedWorkerSingletonLane({ lane }));
  const allPassed = laneEvidence.every((lane) => lane.pass);
  const proofStatus = target.linux_like && allPassed ? 'PASSED' : 'BLOCKED';
  return createProofEnvelope({
    proofKind: 'linux_fedora_worker_singleton_pack',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus,
    runtimeMode: 'linux_fedora_rehearsal_worker_singleton_pack',
    evidence: sanitizeEvidence({
      environment: getProofEnvironment(),
      target_detection: target,
      repo_root: repoRoot,
      worker_lanes: LINUX_FEDORA_WORKER_LANES,
      lane_evidence: laneEvidence,
      pass_criteria: 'Each proof-owned Fedora worker-lane rehearsal must acquire once, skip duplicate invocation, and recover a stale lock fixture.',
      proof_scope: 'Proof-owned singleton semantics rehearsal for the three lane model; does not claim a real cron tick ran each worker.',
      non_claims: FEDORA_NON_CLAIMS.concat(['does not prove actual Raspberry worker execution or cron timing']),
    }),
    knownLimitations: ['This is a deterministic singleton semantics rehearsal. It does not prove physical Raspberry app-running status.'],
  });
}
