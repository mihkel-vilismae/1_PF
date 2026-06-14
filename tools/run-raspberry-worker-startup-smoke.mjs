/** Raspberry three-worker startup smoke proof runner. */
import { readFile } from 'node:fs/promises';
import { runCommand, writeProofArtifact } from './proof-utils.mjs';
import { buildRaspberryWorkerStartupSmokeProof } from './raspberry-worker-startup-smoke-lib.mjs';

function parsePrepare(argv) { return argv.includes('--prepare'); }
async function readProjectMetadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const gitResult = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: gitResult.stdout.trim() || 'unknown' };
}

async function main() {
  const prepare = parsePrepare(process.argv.slice(2));
  const envelope = await buildRaspberryWorkerStartupSmokeProof({ metadata: await readProjectMetadata(), prepare });
  const outputPath = await writeProofArtifact('raspberry_worker_startup_smoke', envelope);
  console.log(JSON.stringify({
    status: envelope.proof_status,
    mode: envelope.runtime_mode,
    outputPath,
    workerStatuses: envelope.evidence.workers.map((worker) => ({ lane: worker.lane.name, exitCode: worker.exit_code, timedOut: worker.timed_out })),
  }, null, 2));
  process.exit(['PASSED', 'BLOCKED'].includes(envelope.proof_status) ? 0 : 1);
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exit(1); });
