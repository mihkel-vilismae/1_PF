/** Raspberry v1.0 release-gate readiness proof runner. */
import { readFile } from 'node:fs/promises';
import { runCommand, writeProofArtifact } from './proof-utils.mjs';
import { buildRaspberryV1ReadinessProof } from './raspberry-v1-readiness-lib.mjs';

async function readProjectMetadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const gitResult = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: gitResult.stdout.trim() || 'unknown' };
}

async function main() {
  const envelope = await buildRaspberryV1ReadinessProof({ metadata: await readProjectMetadata() });
  const outputPath = await writeProofArtifact('raspberry_v1_readiness', envelope);
  console.log(JSON.stringify({
    status: envelope.proof_status,
    mode: envelope.runtime_mode,
    outputPath,
    summary: envelope.evidence.summary,
    blockingGateIds: envelope.evidence.blocking_gate_ids,
  }, null, 2));
  process.exit(['PASSED', 'BLOCKED'].includes(envelope.proof_status) ? 0 : 1);
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exit(1); });
