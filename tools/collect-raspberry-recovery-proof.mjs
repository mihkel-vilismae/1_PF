/**
 * Raspberry power-loss recovery proof collector.
 * Converts explicit operator/device evidence into a sanitized proof artifact.
 * Refuses to pass unless PF_PROOF_ENABLE_RASPBERRY_RECOVERY=true and power loss was performed.
 * Does not treat Windows CronEmulator evidence as Raspberry hardware proof.
 * Writes runtime JSON under runtime_data/proofs.
 */
import { readFile } from 'node:fs/promises';
import { runCommand, writeProofArtifact } from './proof-utils.mjs';
import { buildRaspberryRecoveryProof } from './raspberry-recovery-proof-lib.mjs';

/** Reads project metadata used in proof artifacts. */
async function readProjectMetadata() { const version = (await readFile('VERSION', 'utf8')).trim(); const gitResult = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000 }); return { version, gitCommit: gitResult.stdout.trim() || 'unknown' }; }

/** Builds and writes the proof artifact from environment/operator evidence. */
async function main() { const envelope = buildRaspberryRecoveryProof({ metadata: await readProjectMetadata() }); const outputPath = await writeProofArtifact('raspberry_power_loss_recovery', envelope); console.log(JSON.stringify({ status: envelope.proof_status, outputPath }, null, 2)); process.exit(['PASSED', 'BLOCKED', 'PARTIAL'].includes(envelope.proof_status) ? 0 : 1); }
main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exit(1); });
