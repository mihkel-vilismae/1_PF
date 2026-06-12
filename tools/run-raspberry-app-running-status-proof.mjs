/** Raspberry app-running status proof runner. */
import { readFile } from 'node:fs/promises';
import { runCommand, writeProofArtifact } from './proof-utils.mjs';
import { buildRaspberryAppRunningStatusProof } from './raspberry-app-running-status-proof-lib.mjs';

async function readProjectMetadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const gitResult = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: gitResult.stdout.trim() || 'unknown' };
}

async function main() {
  const envelope = await buildRaspberryAppRunningStatusProof({ metadata: await readProjectMetadata() });
  const outputPath = await writeProofArtifact('raspberry_app_running_status', envelope);
  console.log(JSON.stringify({ status: envelope.proof_status, appRunning: envelope.evidence.app_running, outputPath }, null, 2));
  process.exit(['PASSED', 'BLOCKED'].includes(envelope.proof_status) ? 0 : 1);
}
main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exit(1); });
