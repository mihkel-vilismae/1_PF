/**
 * End-to-end local photo frame proof runner for PF_login.
 * Runs deterministic local pipeline and display-contract proof tests.
 * Writes sanitized JSON proof output under runtime_data/proofs.
 * Does not contact iCloud, network geocoders, or Raspberry hardware.
 * Exits non-zero when the local product-story proof fails.
 */
import { readFile } from 'node:fs/promises';
import { runCommand, writeProofArtifact } from './proof-utils.mjs';
import { runE2eLocalPhotoFrameProof } from './e2e-local-photo-frame-proof-lib.mjs';

/** Reads project version and Git commit metadata for the proof envelope. */
async function readProjectMetadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const gitResult = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000 });
  return { version, gitCommit: gitResult.stdout.trim() || 'unknown' };
}

/** Runs the proof library, writes the artifact, and exits with proof status. */
async function main() {
  const envelope = await runE2eLocalPhotoFrameProof({ metadata: await readProjectMetadata() });
  const outputPath = await writeProofArtifact('e2e_local_photo_frame', envelope);
  console.log(JSON.stringify({ status: envelope.proof_status, outputPath }, null, 2));
  process.exit(envelope.proof_status === 'PASSED' ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
