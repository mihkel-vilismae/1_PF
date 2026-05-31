/**
 * Deterministic address display proof runner for PF_login.
 * Runs local stage helpers from GPS sidecar through playback contract.
 * Proves resolved address text reaches current playback payloads.
 * Writes sanitized proof JSON under runtime_data/proofs.
 * Does not require iCloudPD, network geocoding, browser UI, or hardware.
 */
import { readFile } from 'node:fs/promises';
import { runCommand, writeProofArtifact } from './proof-utils.mjs';
import { runAddressDisplayProof } from './address-display-proof-lib.mjs';

/** Reads project version and short Git commit for the proof envelope. */
async function readProjectMetadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const gitResult = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000 });
  return { version, gitCommit: gitResult.stdout.trim() || 'unknown' };
}

/** Runs the deterministic address display proof and writes the runtime artifact. */
async function main() {
  const envelope = await runAddressDisplayProof({ metadata: await readProjectMetadata() });
  const outputPath = await writeProofArtifact('address_display', envelope);
  console.log(JSON.stringify({ status: envelope.proof_status, outputPath }, null, 2));
  process.exit(envelope.proof_status === 'PASSED' ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
