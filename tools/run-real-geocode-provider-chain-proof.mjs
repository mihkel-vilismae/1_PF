/**
 * Runs the opt-in real geocode provider-chain proof.
 * Writes sanitized JSON evidence under runtime_data/proofs.
 * Refuses to pass on deterministic placeholder-only geocode output.
 * Uses existing backend Python provider interfaces through a subprocess.
 * Leaves production runtime behavior and environment files unchanged.
 */
import { readFile } from 'node:fs/promises';
import { runCommand, writeProofArtifact } from './proof-utils.mjs';
import { runRealGeocodeProviderChainProof } from './real-geocode-provider-chain-proof-lib.mjs';

/** Reads current repo version and git commit for proof metadata. */
async function readProjectMetadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const gitResult = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000 });
  return { version, gitCommit: gitResult.stdout.trim() || 'unknown' };
}

/** Runs the proof and exits non-zero only for failed/timed-out evidence. */
async function main() {
  const envelope = await runRealGeocodeProviderChainProof({ metadata: await readProjectMetadata() });
  const outputPath = await writeProofArtifact('real_geocode_provider_chain', envelope);
  console.log(JSON.stringify({ status: envelope.proof_status, outputPath }, null, 2));
  process.exit(['PASSED', 'BLOCKED', 'PARTIAL'].includes(envelope.proof_status) ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
