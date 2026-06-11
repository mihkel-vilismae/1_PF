/**
 * Raspberry local tool checker proof library.
 *
 * Checks target-machine readiness for Raspberry native playback/tooling without
 * installing packages, vendoring binaries, or claiming playback/recovery proof.
 * PASS is limited to Raspberry-like Linux targets with required tools available.
 */
import { existsSync, readFileSync } from 'node:fs';
import process from 'node:process';
import { createProofEnvelope, getProofEnvironment, runCommand, sanitizeEvidence } from './proof-utils.mjs';

export const REQUIRED_RASPBERRY_TOOLS = Object.freeze([
  { name: 'mpv', args: ['--version'], purpose: 'native fullscreen image/video playback candidate' },
  { name: 'ffmpeg', args: ['-version'], purpose: 'media metadata/toolchain compatibility' },
  { name: 'ffprobe', args: ['-version'], purpose: 'generated video fixture validation' },
]);

/** Detects whether the current machine looks like a Raspberry OS target. */
export function detectRaspberryTarget({ env = process.env, platform = process.platform, arch = process.arch } = {}) {
  const osRelease = readOptionalFile('/etc/os-release');
  const cpuInfo = readOptionalFile('/proc/cpuinfo');
  const model = readOptionalFile('/proc/device-tree/model').replace(/\0/g, '').trim();
  const explicitOverride = env.PF_RASPBERRY_TOOL_CHECK_ASSUME_TARGET === 'true';
  const raspberryHints = [osRelease, cpuInfo, model, env.PF_RASPBERRY_OS_SUMMARY ?? '', env.PF_RASPBERRY_HOSTNAME ?? ''].join('\n');
  const raspberryLike = /raspberry|raspbian|bcm27|bcm28|aarch64|armv7l/i.test(raspberryHints) || (platform === 'linux' && /^arm|aarch64/.test(arch));
  return {
    platform,
    arch,
    os_release_present: existsSync('/etc/os-release'),
    cpuinfo_present: existsSync('/proc/cpuinfo'),
    device_tree_model_present: existsSync('/proc/device-tree/model'),
    model: model || null,
    raspberry_like: Boolean(raspberryLike || explicitOverride),
    explicit_override_used: explicitOverride,
  };
}

/** Checks one command by running its version command with bounded output. */
export async function checkTool(tool, { timeoutMs = 5000 } = {}) {
  const result = await runCommand(tool.name, tool.args, { timeoutMs, detached: false });
  const available = result.exitCode === 0 && !result.timedOut;
  return {
    name: tool.name,
    purpose: tool.purpose,
    command: tool.name,
    args: tool.args,
    available,
    exit_code: result.exitCode,
    signal: result.signal,
    timed_out: result.timedOut,
    version_excerpt: firstNonEmptyLines(result.stdout || result.stderr, 3),
  };
}


/** Determines proof status from target detection and tool availability. */
export function determineRaspberryToolCheckerStatus({ target, tools }) {
  const missing = tools.filter((tool) => !tool.available).map((tool) => tool.name);
  const allToolsAvailable = missing.length === 0;
  const proofStatus = target.raspberry_like && allToolsAvailable ? 'PASSED' : 'BLOCKED';
  const blockReasons = [];
  if (!target.raspberry_like) blockReasons.push('current machine is not detected as Raspberry OS / Linux ARM target');
  if (!allToolsAvailable) blockReasons.push(`missing or unavailable tools: ${missing.join(', ')}`);
  return { proofStatus, missing, allToolsAvailable, blockReasons };
}

/** Runs the full Raspberry tool check and returns a proof envelope. */
export async function buildRaspberryToolCheckerProof({ metadata, env = process.env } = {}) {
  const target = detectRaspberryTarget({ env });
  const tools = [];
  for (const tool of REQUIRED_RASPBERRY_TOOLS) tools.push(await checkTool(tool));
  const { proofStatus, missing, allToolsAvailable, blockReasons } = determineRaspberryToolCheckerStatus({ target, tools });

  return createProofEnvelope({
    proofKind: 'raspberry_tool_checker',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus,
    runtimeMode: 'raspberry_tool_preflight',
    evidence: sanitizeEvidence({
      environment: getProofEnvironment(),
      target_detection: target,
      required_tools: REQUIRED_RASPBERRY_TOOLS.map(({ name, purpose }) => ({ name, purpose })),
      tool_results: tools,
      all_tools_available: allToolsAvailable,
      block_reasons: blockReasons,
      install_policy: {
        installs_packages: false,
        vendors_binaries: false,
        local_tools_directories_remain_ignored: ['tools/mpv/', 'tools/ffmpeg/'],
      },
      pass_criteria: 'PASSED only when the current target is Raspberry-like and mpv, ffmpeg, and ffprobe are available.',
    }),
    knownLimitations: proofStatus === 'PASSED'
      ? ['This is a readiness preflight only; it does not prove native playback, scheduler behavior, reboot recovery, or power-loss recovery.']
      : ['Run on the Raspberry target after installing mpv, ffmpeg, and ffprobe through the operating system package manager or another documented local operator path.'],
  });
}

function readOptionalFile(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return '';
  }
}

function firstNonEmptyLines(text, count) {
  return String(text ?? '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, count).join('\n');
}
