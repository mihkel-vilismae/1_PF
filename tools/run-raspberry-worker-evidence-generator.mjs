/** Raspberry worker evidence generator runner. */
import { readFile } from 'node:fs/promises';
import { runCommand, writeProofArtifact } from './proof-utils.mjs';
import { buildRaspberryWorkerEvidenceGeneratorProof } from './raspberry-worker-evidence-generator-lib.mjs';

async function readProjectMetadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const gitResult = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: gitResult.stdout.trim() || 'unknown' };
}

async function main() {
  const envelope = await buildRaspberryWorkerEvidenceGeneratorProof({ metadata: await readProjectMetadata() });
  const outputPath = await writeProofArtifact('raspberry_worker_evidence_generator', envelope);
  console.log(JSON.stringify({
    status: envelope.proof_status,
    evidenceFile: envelope.evidence.generated_evidence_file,
    latestManifest: envelope.evidence.latest_evidence_manifest,
    latestEnvFile: envelope.evidence.latest_evidence_env_file,
    env: envelope.evidence.generated_evidence_env,
    collectionMode: envelope.evidence.collection_mode,
    outputPath,
  }, null, 2));
  process.exit(['PASSED', 'BLOCKED'].includes(envelope.proof_status) ? 0 : 1);
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exit(1); });
