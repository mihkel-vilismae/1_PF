/**
 * Native/fullscreen playback proof library for PF_login.
 * Uses targeted repository tests to prove safe native-player boundaries.
 * Covers disabled defaults, mock player config, fullscreen browser overlay, and routes.
 * Writes sanitized proof envelopes through the shared proof artifact helpers.
 * Does not launch real fullscreen players unless a future opt-in proof is approved.
 */
import { access, readFile } from 'node:fs/promises';
import { createProofEnvelope, getProofEnvironment, runCommand } from './proof-utils.mjs';

const TARGETED_TESTS = Object.freeze([
  'tests/nativePlaybackController.test.js',
  'tests/osPlaybackRotationFullscreen.test.js',
  'tests/osPlaybackViews.test.js',
]);

const REQUIRED_DOCS = Object.freeze([
  'docs/20_architecture_and_specs/native_playback_runner_spec.md',
  'docs/OS_PLAYBACK_VIEWS_SLICE_3.md',
]);

/** Returns the targeted command that proves native/fullscreen playback boundaries. */
export function buildNativeFullscreenPlaybackProofCommand() {
  return { command: 'npx', args: ['tsx', '--test', ...TARGETED_TESTS] };
}

/** Inspects the native/fullscreen proof support docs without treating docs as runtime proof. */
export async function inspectNativeFullscreenDocs() {
  const entries = [];
  for (const path of REQUIRED_DOCS) {
    try {
      await access(path);
      const source = await readFile(path, 'utf8');
      entries.push({ path, exists: true, mentionsNativePlayback: /native playback|fullscreen|mpv|vlc/i.test(source) });
    } catch (error) {
      entries.push({ path, exists: false, error: error instanceof Error ? error.message : String(error) });
    }
  }
  return entries;
}

/** Runs the deterministic native/fullscreen boundary proof and returns a proof envelope. */
export async function runNativeFullscreenPlaybackProof({ metadata, cwd = process.cwd() }) {
  const command = buildNativeFullscreenPlaybackProofCommand();
  const docs = await inspectNativeFullscreenDocs();
  const testResult = await runCommand(command.command, command.args, {
    cwd,
    timeoutMs: 180000,
    forceKillGraceMs: 5000,
  });
  const docsPresent = docs.every((entry) => entry.exists && entry.mentionsNativePlayback);
  const proofPassed = testResult.exitCode === 0 && docsPresent;

  return createProofEnvelope({
    proofKind: 'native_fullscreen_playback',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: proofPassed ? 'PASSED' : (testResult.timedOut ? 'TIMED_OUT' : 'FAILED'),
    runtimeMode: 'deterministic_local',
    evidence: {
      environment: getProofEnvironment(),
      targeted_tests: TARGETED_TESTS,
      required_docs: docs,
      command_result: testResult,
      verified_contracts: [
        'Native playback remains disabled by default',
        'Mock native playback can be enabled for safe test proof without launching OS players',
        'Native playback routes stay separate from browser playback routes',
        'Native playback spec records process ownership and spawn-argument safety boundaries',
        'Browser fullscreen overlay uses backend-served playback media URLs and resolved address text',
        'Fullscreen/rotation UI does not add backend mutation shortcuts',
      ],
    },
    knownLimitations: proofPassed
      ? [
          'This proof is deterministic and local; it does not launch a real mpv/vlc process.',
          'This proof does not prove monitor focus, OS fullscreen stability, Raspberry HDMI output, or hardware display behavior.',
          'A future opt-in live native playback proof is still required for actual OS fullscreen behavior.',
        ]
      : ['The deterministic native/fullscreen playback boundary proof did not complete successfully.'],
  });
}
