/**
 * Live Windows native playback proof runner for PF_login.
 * Refuses to launch a real OS player unless explicitly enabled.
 * Talks to the existing backend/native playback routes for item identity proof.
 * Writes sanitized JSON under runtime_data/proofs.
 * Returns success for PASSED and BLOCKED so unconfigured machines stay safe.
 */
import { readFile } from 'node:fs/promises';
import { runCommand, writeProofArtifact } from './proof-utils.mjs';
import { runLiveWindowsNativePlaybackProof } from './live-windows-native-playback-proof-lib.mjs';

/** Reads project version and short Git commit for the proof envelope. */
async function readProjectMetadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const gitResult = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000 });
  return { version, gitCommit: gitResult.stdout.trim() || 'unknown' };
}

/** Runs the live Windows proof or writes a BLOCKED artifact when not explicitly enabled. */
async function main() {
  const envelope = await runLiveWindowsNativePlaybackProof({ metadata: await readProjectMetadata() });
  const outputPath = await writeProofArtifact('live_windows_native_playback', envelope);
  console.log(JSON.stringify({ status: envelope.proof_status, outputPath }, null, 2));
  process.exit(envelope.proof_status === 'PASSED' || envelope.proof_status === 'BLOCKED' ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
