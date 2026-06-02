/*
 * Runs the deterministic Test Mode whole-logic emulator proof.
 * The CLI writes a sanitized JSON artifact under runtime_data/proofs and exits
 * non-zero only when the semantic proof assertions fail.
 */
import { readFile } from 'node:fs/promises';
import { runCommand, writeProofArtifact } from './proof-utils.mjs';
import { runWholeLogicTestModeProof } from './whole-logic-test-mode-proof-lib.mjs';

/** Reads project version and short Git commit for the proof envelope. */
async function readProjectMetadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const gitResult = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000 });
  return { version, gitCommit: gitResult.stdout.trim() || 'unknown' };
}

/** Runs the Test Mode whole-logic proof and writes the runtime artifact. */
async function main() {
  const envelope = await runWholeLogicTestModeProof({ metadata: await readProjectMetadata() });
  const outputPath = await writeProofArtifact('test_mode_whole_logic_emulator', envelope);
  console.log(JSON.stringify({ status: envelope.proof_status, outputPath }, null, 2));
  process.exit(envelope.proof_status === 'PASSED' ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
