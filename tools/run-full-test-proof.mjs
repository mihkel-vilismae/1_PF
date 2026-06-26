/**
 * Full test suite proof runner for PF_login.
 * Executes the project test command and writes a sanitized proof JSON artifact.
 * The wrapper does not change test semantics or hide failures.
 * Generated output lives under runtime_data/proofs and is ignored by Git.
 * Intended for local verification before claiming full-suite stability.
 */
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { FULL_TEST_PROOF_KIND, runFullTestProof } from './full-test-proof-lib.mjs';
import { writeProofArtifact } from './proof-utils.mjs';

/** Cleans up orphaned test children after a timeout in Unix-like environments. */
function cleanupLingeringTestProcesses(proofEnvelope) {
  if (!proofEnvelope.evidence?.timed_out || process.platform === 'win32') {
    return;
  }
  spawnSync('pkill', ['-f', `${process.cwd()}.*node_modules/.bin/tsx`], { stdio: 'ignore' });
  spawnSync('pkill', ['-f', `${process.cwd()}.*server/index.ts`], { stdio: 'ignore' });
}

/** Runs tests, writes proof JSON, and exits non-zero unless the full suite passed. */
async function main() {
  const timeoutMs = Number(process.env.PF_FULL_TEST_PROOF_TIMEOUT_MS ?? '600000');
  const envelope = await runFullTestProof({ timeoutMs });
  cleanupLingeringTestProcesses(envelope);
  const outputPath = await writeProofArtifact(FULL_TEST_PROOF_KIND, envelope);
  console.log(JSON.stringify({
    status: envelope.proof_status,
    outputPath,
    durationMs: envelope.evidence.duration_ms,
    testCounts: envelope.evidence.test_counts,
    regressionAssessment: envelope.evidence.regression_assessment,
  }, null, 2));
  process.exit(envelope.proof_status === 'PASSED' ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
