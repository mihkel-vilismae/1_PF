/**
 * Opt-in real iCloudPD pipeline proof runner.
 * Calls the already-running PF_login backend through existing routes.
 * Refuses to run real provider work unless PF_PROOF_ENABLE_REAL_ICLOUDPD=true.
 * Writes sanitized JSON evidence under runtime_data/proofs.
 * Does not start iCloudPD, bypass auth, or use mock download routes.
 */
import { readFile } from 'node:fs/promises';
import { runCommand, writeProofArtifact } from './proof-utils.mjs';
import { runRealIcloudpdPipelineProof } from './real-icloudpd-pipeline-proof-lib.mjs';

/** Reads project metadata used in proof artifacts. */
async function readProjectMetadata() { const version = (await readFile('VERSION', 'utf8')).trim(); const gitResult = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000 }); return { version, gitCommit: gitResult.stdout.trim() || 'unknown' }; }

/** Runs or blocks the real proof based on explicit operator configuration. */
async function main() { const baseUrl = process.env.PF_API_BASE_URL ?? 'http://127.0.0.1:8787'; const recentCount = Number(process.env.PF_REAL_ICLOUDPD_PROOF_RECENT_COUNT ?? '10'); const envelope = await runRealIcloudpdPipelineProof({ baseUrl, recentCount, metadata: await readProjectMetadata() }); const outputPath = await writeProofArtifact('real_icloudpd_pipeline', envelope); console.log(JSON.stringify({ status: envelope.proof_status, outputPath }, null, 2)); process.exit(envelope.proof_status === 'PASSED' || envelope.proof_status === 'BLOCKED' ? 0 : 1); }
main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exit(1); });
