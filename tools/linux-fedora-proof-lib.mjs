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
