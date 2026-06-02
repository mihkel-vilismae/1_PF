/**
 * Deterministic address display UI proof runner for PF_login.
 * Renders dashboard/display-facing playback UI from local state only.
 * Writes sanitized semantic proof JSON under runtime_data/proofs.
 * Avoids full-page snapshots and raw filesystem path exposure.
 * Does not call or mutate production backend behavior.
 */
import { readFile } from 'node:fs/promises';
import { runCommand, writeProofArtifact } from './proof-utils.mjs';
import { runAddressDisplayUiProof } from './address-display-ui-proof-lib.mjs';

/** Reads project version and short Git commit for the proof envelope. */
async function readProjectMetadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const gitResult = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000 });
  return { version, gitCommit: gitResult.stdout.trim() || 'unknown' };
}

/** Runs the deterministic UI proof and writes the runtime proof artifact. */
async function main() {
  const envelope = await runAddressDisplayUiProof({ metadata: await readProjectMetadata() });
  const outputPath = await writeProofArtifact('address_display_ui', envelope);
  console.log(JSON.stringify({ status: envelope.proof_status, outputPath }, null, 2));
  process.exit(envelope.proof_status === 'PASSED' ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
