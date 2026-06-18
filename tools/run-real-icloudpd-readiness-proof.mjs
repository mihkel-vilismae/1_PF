/** Real iCloudPD/auth readiness preflight proof runner. */
import { readFile } from 'node:fs/promises';
import { runCommand, writeProofArtifact } from './proof-utils.mjs';
import { buildRealIcloudpdReadinessProof } from './real-icloudpd-readiness-proof-lib.mjs';

async function readProjectMetadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const gitResult = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: gitResult.stdout.trim() || 'unknown' };
}

async function main() {
  const baseUrl = process.env.PF_API_BASE_URL ?? 'http://127.0.0.1:8787';
  const recentCount = Number.parseInt(process.env.PF_REAL_ICLOUDPD_READINESS_RECENT_COUNT ?? '10', 10);
  const envelope = buildRealIcloudpdReadinessProof({ metadata: await readProjectMetadata(), baseUrl, recentCount: Number.isFinite(recentCount) ? recentCount : 10 });
  const outputPath = await writeProofArtifact('real_icloudpd_readiness', envelope);
  console.log(JSON.stringify({ status: envelope.proof_status, outputPath, checks: envelope.evidence.checks }, null, 2));
  process.exit(['PASSED', 'BLOCKED'].includes(envelope.proof_status) ? 0 : 1);
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exit(1); });
