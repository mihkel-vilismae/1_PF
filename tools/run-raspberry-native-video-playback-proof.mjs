/**
 * Raspberry native video playback proof runner for PF_login.
 * Writes sanitized proof JSON under ignored runtime_data/proofs.
 */
import { readFile } from 'node:fs/promises';
import { runCommand, writeProofArtifact } from './proof-utils.mjs';
import { buildRaspberryNativeVideoPlaybackProof } from './raspberry-native-video-playback-proof-lib.mjs';

async function readProjectMetadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const gitResult = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000 });
  return { version, gitCommit: gitResult.stdout.trim() || 'unknown' };
}

async function main() {
  const envelope = await buildRaspberryNativeVideoPlaybackProof({ metadata: await readProjectMetadata() });
  const outputPath = await writeProofArtifact('raspberry_native_video_playback', envelope);
  console.log(JSON.stringify({ status: envelope.proof_status, outputPath }, null, 2));
  process.exit(envelope.proof_status === 'FAILED' || envelope.proof_status === 'TIMED_OUT' ? 1 : 0);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
