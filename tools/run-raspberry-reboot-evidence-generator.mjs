/** Raspberry reboot evidence generator runner. */
import { readFile } from 'node:fs/promises';
import { runCommand, writeProofArtifact } from './proof-utils.mjs';
import { buildRaspberryRebootEvidenceGeneratorProof } from './raspberry-reboot-evidence-generator-lib.mjs';
function parseMode(argv) { return argv.includes('--prepare') ? 'prepare' : 'collect'; }
async function readProjectMetadata() { const version = (await readFile('VERSION', 'utf8')).trim(); const gitResult = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false }); return { version, gitCommit: gitResult.stdout.trim() || 'unknown' }; }
async function main() { const envelope = await buildRaspberryRebootEvidenceGeneratorProof({ metadata: await readProjectMetadata(), mode: parseMode(process.argv.slice(2)) }); const outputPath = await writeProofArtifact('raspberry_reboot_evidence_generator', envelope); console.log(JSON.stringify({ status: envelope.proof_status, mode: envelope.runtime_mode, outputPath, evidenceFile: envelope.evidence.evidence_file, markerPath: envelope.evidence.marker_path, env: envelope.evidence.reboot_recovery_env }, null, 2)); process.exit(['PASSED','BLOCKED'].includes(envelope.proof_status) ? 0 : 1); }
main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exit(1); });
