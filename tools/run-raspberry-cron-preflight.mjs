/** Raspberry managed cron preflight/installer runner. */
import { readFile } from 'node:fs/promises';
import { runCommand, writeProofArtifact } from './proof-utils.mjs';
import { buildRaspberryCronPreflightProof } from './raspberry-cron-preflight-lib.mjs';
function parseInstall(argv) { return argv.includes('--install'); }
async function readProjectMetadata() { const version = (await readFile('VERSION', 'utf8')).trim(); const gitResult = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false }); return { version, gitCommit: gitResult.stdout.trim() || 'unknown' }; }
async function main() { const envelope = await buildRaspberryCronPreflightProof({ metadata: await readProjectMetadata(), install: parseInstall(process.argv.slice(2)) }); const outputPath = await writeProofArtifact('raspberry_cron_preflight', envelope); console.log(JSON.stringify({ status: envelope.proof_status, mode: envelope.runtime_mode, outputPath }, null, 2)); process.exit(['PASSED','BLOCKED'].includes(envelope.proof_status) ? 0 : 1); }
main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exit(1); });
