/** Raspberry reboot/restored-start recovery proof runner. */
import { readFile } from 'node:fs/promises';
import { runCommand, writeProofArtifact } from './proof-utils.mjs';
import { buildRaspberryRebootRecoveryProof } from './raspberry-reboot-recovery-proof-lib.mjs';
async function readProjectMetadata() { const version = (await readFile('VERSION', 'utf8')).trim(); const gitResult = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false }); return { version, gitCommit: gitResult.stdout.trim() || 'unknown' }; }
async function main() { const envelope = buildRaspberryRebootRecoveryProof({ metadata: await readProjectMetadata() }); const outputPath = await writeProofArtifact('raspberry_reboot_recovery', envelope); console.log(JSON.stringify({ status: envelope.proof_status, outputPath }, null, 2)); process.exit(['PASSED', 'BLOCKED'].includes(envelope.proof_status) ? 0 : 1); }
main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exit(1); });
