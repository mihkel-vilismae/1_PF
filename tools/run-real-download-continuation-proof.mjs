/**
 * Opt-in real download continuation proof runner for PF_login.
 * Calls the live real iCloudPD download route twice only when explicitly enabled.
 * Compares local sanitized media fingerprints before and after each run.
 * Writes runtime proof JSON under ignored runtime_data/proofs.
 * Never invokes the mock download endpoint.
 */
import { readFile } from 'node:fs/promises';
import { runCommand, writeProofArtifact } from './proof-utils.mjs';
import { runRealDownloadContinuationProof } from './real-download-continuation-proof-lib.mjs';

/** Reads project version and short git commit for the proof envelope. */
async function readProjectMetadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const gitResult = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000 });
  return { version, gitCommit: gitResult.stdout.trim() || 'unknown' };
}

/** Runs or blocks the proof based on explicit operator configuration. */
async function main() {
  const baseUrl = process.env.PF_API_BASE_URL ?? 'http://127.0.0.1:8787';
  const recentCount = Number.parseInt(process.env.PF_REAL_DOWNLOAD_PROOF_RECENT_COUNT ?? '10', 10);
  const envelope = await runRealDownloadContinuationProof({
    baseUrl,
    recentCount: Number.isFinite(recentCount) ? recentCount : 10,
    metadata: await readProjectMetadata(),
  });
  const outputPath = await writeProofArtifact('real_download_continuation', envelope);
  console.log(JSON.stringify({ status: envelope.proof_status, outputPath }, null, 2));
  process.exit(['PASSED', 'BLOCKED'].includes(envelope.proof_status) ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
