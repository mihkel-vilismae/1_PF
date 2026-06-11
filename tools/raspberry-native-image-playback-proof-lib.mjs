/**
 * Raspberry native image playback proof library.
 *
 * Proves the first Raspberry target playback step only when running on a
 * Raspberry-like target with a display session and mpv available. Off-target,
 * missing-tool, missing-display, or missing-fixture runs are BLOCKED. The proof
 * uses the project-owned Raspberry launcher dry-run boundary and then starts a
 * bounded mpv image process as proof-owned native playback evidence.
 */
import { existsSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import process from 'node:process';
import { createProofEnvelope, getProofEnvironment, runCommand, sanitizeEvidence } from './proof-utils.mjs';
import { checkTool, detectRaspberryTarget } from './raspberry-tool-checker-lib.mjs';

export const RASPBERRY_NATIVE_IMAGE_FIXTURE = 'generated_test_data/gps_valid/gps_valid_01.jpg';

export const RASPBERRY_NATIVE_IMAGE_REQUIRED_TOOLS = Object.freeze([
  { name: 'mpv', args: ['--version'], purpose: 'project-owned native fullscreen image playback on Raspberry display' },
]);

export const RASPBERRY_NATIVE_IMAGE_MPV_ARGS = Object.freeze([
  '--no-config',
  '--force-window=yes',
  '--fs',
  '--image-display-duration=2',
  '--really-quiet',
]);

export function detectRaspberryDisplaySession({ env = process.env } = {}) {
  const displayValues = {
    DISPLAY: env.DISPLAY ?? null,
    WAYLAND_DISPLAY: env.WAYLAND_DISPLAY ?? null,
    XDG_SESSION_TYPE: env.XDG_SESSION_TYPE ?? null,
  };
  const explicitDisplayOverride = env.PF_RASPBERRY_NATIVE_IMAGE_ASSUME_DISPLAY === 'true';
  const displayAvailable = Boolean(displayValues.DISPLAY || displayValues.WAYLAND_DISPLAY || explicitDisplayOverride);
  return {
    ...displayValues,
    display_available: displayAvailable,
    explicit_display_override_used: explicitDisplayOverride,
  };
}

export function inspectNativeImageFixture({ repoRoot = process.cwd(), fixturePath = RASPBERRY_NATIVE_IMAGE_FIXTURE } = {}) {
  const absolutePath = join(repoRoot, fixturePath);
  const exists = existsSync(absolutePath);
  let sizeBytes = 0;
  if (exists) sizeBytes = statSync(absolutePath).size;
  return {
    relative_path: fixturePath,
    exists,
    size_bytes: sizeBytes,
    media_type: 'image',
    deterministic_fixture: true,
  };
}

export function buildRaspberryNativeImagePlaybackCommand({ fixturePath = RASPBERRY_NATIVE_IMAGE_FIXTURE } = {}) {
  return {
    command: 'mpv',
    args: [...RASPBERRY_NATIVE_IMAGE_MPV_ARGS, fixturePath],
  };
}

export function determineRaspberryNativeImagePlaybackStatus({ target, display, requiredTools, fixture, launcherResult, playbackResult }) {
  const missingTools = requiredTools.filter((tool) => !tool.available).map((tool) => tool.name);
  const blockReasons = [];
  if (!target.raspberry_like) blockReasons.push('current machine is not detected as Raspberry OS / Linux ARM target');
  if (target.explicit_override_used) blockReasons.push('Raspberry target detection used explicit override; override runs cannot produce PASS');
  if (!display.display_available) blockReasons.push('no Raspberry display session detected through DISPLAY or WAYLAND_DISPLAY');
  if (display.explicit_display_override_used) blockReasons.push('display detection used explicit override; override runs cannot produce PASS');
  if (missingTools.length > 0) blockReasons.push(`missing or unavailable tools: ${missingTools.join(', ')}`);
  if (!fixture.exists || fixture.size_bytes <= 0) blockReasons.push(`deterministic image fixture unavailable: ${fixture.relative_path}`);

  if (blockReasons.length > 0) {
    return { proofStatus: 'BLOCKED', missingTools, blockReasons };
  }

  if (!launcherResult || launcherResult.exitCode !== 0 || launcherResult.timedOut) {
    return {
      proofStatus: 'FAILED',
      missingTools,
      blockReasons: ['project-owned Raspberry launcher dry-run boundary did not complete successfully'],
    };
  }

  if (!playbackResult) {
    return { proofStatus: 'FAILED', missingTools, blockReasons: ['native image playback command was not executed'] };
  }

  if ((playbackResult.exitCode === 0 || playbackResult.timedOut) && playbackResult.signal !== 'ERROR') {
    return { proofStatus: 'PASSED', missingTools, blockReasons };
  }

  return {
    proofStatus: 'FAILED',
    missingTools,
    blockReasons: playbackResult.timedOut
      ? ['native image playback command timed out before proof stop evidence could be collected']
      : ['native image playback command returned non-zero on Raspberry target'],
  };
}

export async function buildRaspberryNativeImagePlaybackProof({
  metadata,
  env = process.env,
  repoRoot = process.cwd(),
  runLauncher = runRaspberryLauncherDryRun,
  runPlayback = runNativeImagePlayback,
} = {}) {
  const target = detectRaspberryTarget({ env });
  const display = detectRaspberryDisplaySession({ env });
  const fixture = inspectNativeImageFixture({ repoRoot });
  const requiredTools = [];
  for (const tool of RASPBERRY_NATIVE_IMAGE_REQUIRED_TOOLS) requiredTools.push(await checkTool(tool));

  const gateReasons = [];
  if (!target.raspberry_like) gateReasons.push('current machine is not detected as Raspberry OS / Linux ARM target');
  if (target.explicit_override_used) gateReasons.push('Raspberry target detection used explicit override; override runs cannot produce PASS');
  if (!display.display_available) gateReasons.push('no Raspberry display session detected through DISPLAY or WAYLAND_DISPLAY');
  if (display.explicit_display_override_used) gateReasons.push('display detection used explicit override; override runs cannot produce PASS');
  const missingTools = requiredTools.filter((tool) => !tool.available).map((tool) => tool.name);
  if (missingTools.length > 0) gateReasons.push(`missing or unavailable tools: ${missingTools.join(', ')}`);
  if (!fixture.exists || fixture.size_bytes <= 0) gateReasons.push(`deterministic image fixture unavailable: ${fixture.relative_path}`);

  const canAttemptPlayback = gateReasons.length === 0;
  const launcherResult = canAttemptPlayback ? await runLauncher({ repoRoot }) : null;
  const playbackCommand = buildRaspberryNativeImagePlaybackCommand({ fixturePath: fixture.relative_path });
  const playbackResult = canAttemptPlayback && launcherResult?.exitCode === 0 && !launcherResult?.timedOut
    ? await runPlayback({ repoRoot, command: playbackCommand })
    : null;

  const { proofStatus, blockReasons } = determineRaspberryNativeImagePlaybackStatus({
    target,
    display,
    requiredTools,
    fixture,
    launcherResult,
    playbackResult,
  });

  const launcherEvidence = launcherResult ? await summarizeLauncherResult({ launcherResult, repoRoot }) : { executed: false, reason: 'target/display/tool/fixture prerequisites not satisfied' };

  return createProofEnvelope({
    proofKind: 'raspberry_native_image_playback',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus,
    runtimeMode: 'raspberry_native_image_playback_proof',
    evidence: sanitizeEvidence({
      environment: getProofEnvironment(),
      target_detection: target,
      display_detection: display,
      required_tools: RASPBERRY_NATIVE_IMAGE_REQUIRED_TOOLS.map(({ name, purpose }) => ({ name, purpose })),
      tool_results: requiredTools,
      selected_media: fixture,
      launcher_boundary: launcherEvidence,
      native_player_command: {
        command: playbackCommand.command,
        args: playbackCommand.args,
        policy: 'proof-owned bounded mpv process; no arbitrary process kill by name',
      },
      playback_result: playbackResult ? summarizePlaybackResult(playbackResult) : { executed: false, reason: canAttemptPlayback ? 'launcher boundary did not pass' : 'target/display/tool/fixture prerequisites not satisfied' },
      stop_boundary: playbackResult ? summarizeStopBoundary(playbackResult) : { executed: false },
      block_reasons: blockReasons,
      pass_criteria: 'PASSED only on a non-override Raspberry-like display target when mpv is available, the deterministic image fixture exists, the Raspberry launcher dry-run succeeds, and the bounded mpv playback command exits 0 or is stopped by the proof timeout.',
      non_claims: [
        'does not prove Raspberry native video playback',
        'does not prove scheduler behavior',
        'does not configure systemd, cron, or boot autostart',
        'does not prove reboot or power-loss recovery',
        'does not prove monitor-pixel/display-camera observation',
        'does not prove production iCloud continuation',
      ],
    }),
    knownLimitations: proofStatus === 'PASSED'
      ? ['This proves a bounded Raspberry native image playback command only; it does not prove video playback, scheduler behavior, reboot recovery, power-loss recovery, or monitor-pixel observation.']
      : ['Run on the Raspberry display target after installing mpv and ensuring a graphical display session is available.'],
  });
}

export async function runRaspberryLauncherDryRun({ repoRoot = process.cwd() } = {}) {
  return runCommand('./start_raspberry_full.sh', ['--dry-run'], { cwd: repoRoot, timeoutMs: 30000, detached: false });
}

export async function runNativeImagePlayback({ repoRoot = process.cwd(), command = buildRaspberryNativeImagePlaybackCommand() } = {}) {
  return runCommand(command.command, command.args, { cwd: repoRoot, timeoutMs: 12000, forceKillGraceMs: 2000, detached: false });
}

async function summarizeLauncherResult({ launcherResult, repoRoot }) {
  return {
    executed: true,
    command: launcherResult.command,
    args: launcherResult.args,
    exit_code: launcherResult.exitCode,
    signal: launcherResult.signal,
    timed_out: launcherResult.timedOut,
    duration_ms: launcherResult.durationMs,
    stdout_excerpt: lastNonEmptyLines(launcherResult.stdout, 12),
    stderr_excerpt: lastNonEmptyLines(launcherResult.stderr, 12),
    latest_launch_plan: await findLatestLaunchPlan({ repoRoot }),
  };
}

function summarizePlaybackResult(result) {
  return {
    executed: true,
    command: result.command,
    args: result.args,
    exit_code: result.exitCode,
    signal: result.signal,
    timed_out: result.timedOut,
    duration_ms: result.durationMs,
    stdout_excerpt: lastNonEmptyLines(result.stdout, 12),
    stderr_excerpt: lastNonEmptyLines(result.stderr, 12),
  };
}

function summarizeStopBoundary(result) {
  return {
    owned_process_policy: true,
    arbitrary_process_kill_by_name: false,
    command_exit_code: result.exitCode,
    command_signal: result.signal,
    stopped_by_proof_timeout: result.timedOut,
    natural_exit: result.exitCode === 0 && !result.timedOut,
  };
}

async function findLatestLaunchPlan({ repoRoot }) {
  const runtimeDir = join(repoRoot, 'runtime_data', 'raspberry_launcher');
  try {
    const { readdir, stat } = await import('node:fs/promises');
    const entries = [];
    for (const name of await readdir(runtimeDir)) {
      if (!/^launch_plan_.*\.json$/.test(name)) continue;
      const path = join(runtimeDir, name);
      const stats = await stat(path);
      entries.push({ path, mtimeMs: stats.mtimeMs });
    }
    entries.sort((a, b) => b.mtimeMs - a.mtimeMs);
    if (entries.length === 0) return null;
    const source = await readFile(entries[0].path, 'utf8');
    const parsed = JSON.parse(source);
    return {
      path: relative(repoRoot, entries[0].path),
      launcher_kind: parsed.launcher_kind,
      baseline_version: parsed.baseline_version,
      mode: parsed.mode,
      api_requested: parsed.api?.requested ?? null,
      non_claims: parsed.non_claims ?? [],
    };
  } catch {
    return null;
  }
}

function lastNonEmptyLines(text, count) {
  return String(text ?? '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(-count).join('\n');
}
