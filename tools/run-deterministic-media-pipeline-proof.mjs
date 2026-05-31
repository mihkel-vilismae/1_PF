/**
 * Deterministic media pipeline proof runner for PF_login.
 * Runs local test-backed media pipeline contracts without external providers.
 * Writes sanitized JSON proof output under runtime_data/proofs.
 * Does not contact iCloud, network geocoders, or hardware.
 * Exits non-zero when deterministic local pipeline proof fails.
 */
import { readFile } from 'node:fs/promises';
import { runCommand, writeProofArtifact } from './proof-utils.mjs';
import { runDeterministicMediaPipelineProof } from './deterministic-media-pipeline-proof-lib.mjs';

/** Reads the project version and current short Git commit for the proof envelope. */
async function readProjectMetadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const gitResult = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000 });
  return { version, gitCommit: gitResult.stdout.trim() || 'unknown' };
}

/** Runs the deterministic media proof and writes the generated proof artifact. */
async function main() {
  const envelope = await runDeterministicMediaPipelineProof({ metadata: await readProjectMetadata() });
  const outputPath = await writeProofArtifact('deterministic_media_pipeline', envelope);
  console.log(JSON.stringify({ status: envelope.proof_status, outputPath }, null, 2));
  process.exit(envelope.proof_status === 'PASSED' ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
