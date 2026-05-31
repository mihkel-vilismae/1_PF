/**
 * Opt-in real geocode provider proof runner.
 * Calls the existing PF_login geocode runtime route on a running backend.
 * Refuses to pass if only deterministic placeholder output is observed.
 * Writes sanitized JSON evidence under runtime_data/proofs.
 * Does not enable providers or modify .env automatically.
 */
import { readFile } from 'node:fs/promises';
import { runCommand, writeProofArtifact } from './proof-utils.mjs';
import { runRealGeocodeProviderProof } from './geocode-provider-proof-lib.mjs';

/** Reads project metadata used in proof artifacts. */
async function readProjectMetadata() { const version = (await readFile('VERSION', 'utf8')).trim(); const gitResult = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000 }); return { version, gitCommit: gitResult.stdout.trim() || 'unknown' }; }

/** Runs or blocks the provider proof based on explicit operator configuration. */
async function main() { const baseUrl = process.env.PF_API_BASE_URL ?? 'http://127.0.0.1:8787'; const expectedProvider = process.env.PF_GEOCODE_PROOF_PROVIDER; const envelope = await runRealGeocodeProviderProof({ baseUrl, expectedProvider, metadata: await readProjectMetadata() }); const outputPath = await writeProofArtifact('geocode_provider', envelope); console.log(JSON.stringify({ status: envelope.proof_status, outputPath }, null, 2)); process.exit(['PASSED', 'BLOCKED', 'PARTIAL'].includes(envelope.proof_status) ? 0 : 1); }
main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exit(1); });
