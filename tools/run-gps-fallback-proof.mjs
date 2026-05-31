/**
 * Deterministic GPS fallback proof runner for PF_login.
 * Executes local-only GPS provider fallback cases through backend Python modules.
 * Writes sanitized proof JSON under runtime_data/proofs.
 * Does not require network access, accounts, iCloudPD, or hardware.
 * Exits non-zero only when the deterministic proof fails.
 */
import { readFile } from 'node:fs/promises';
import { runCommand, writeProofArtifact } from './proof-utils.mjs';
import { runGpsFallbackProof } from './gps-fallback-proof-lib.mjs';

/** Reads project version and short Git commit for the proof envelope. */
async function readProjectMetadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const gitResult = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000 });
  return { version, gitCommit: gitResult.stdout.trim() || 'unknown' };
}

/** Runs the deterministic proof and writes the sanitized runtime artifact. */
async function main() {
  const envelope = await runGpsFallbackProof({ metadata: await readProjectMetadata() });
  const outputPath = await writeProofArtifact('gps_fallback', envelope);
  console.log(JSON.stringify({ status: envelope.proof_status, outputPath }, null, 2));
  process.exit(envelope.proof_status === 'PASSED' ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
