/** Proof report blocker summary proof runner. */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { runCommand, writeProofArtifact, createProofEnvelope, getProofEnvironment } from './proof-utils.mjs';
import { collectProofArtifactsFromDirectory } from './proof-runner-final-summary-lib.mjs';
import { summarizeProofReportBlockers, BLOCKER_CATEGORIES } from './proof-report-blocker-summary-lib.mjs';

async function readProjectMetadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const gitResult = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: gitResult.stdout.trim() || 'unknown' };
}

async function main() {
  const metadata = await readProjectMetadata();
  const proofsDir = join(process.cwd(), 'runtime_data', 'proofs');
  const artifacts = await collectProofArtifactsFromDirectory(proofsDir);
  const summary = summarizeProofReportBlockers({ artifacts });
  const envelope = createProofEnvelope({
    proofKind: 'proof_report_blocker_summary',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: summary.proof_status,
    runtimeMode: 'proof_report_blocker_summary',
    evidence: { environment: getProofEnvironment(), proofs_dir: proofsDir, category_legend: BLOCKER_CATEGORIES, ...summary },
    knownLimitations: ['This summarizes existing runtime_data/proofs artifacts; it does not execute provider, product, overlay, or hardware proofs.'],
  });
  const outputPath = await writeProofArtifact('proof_report_blocker_summary', envelope);
  console.log(JSON.stringify({ status: envelope.proof_status, outputPath, blockerCount: summary.blocker_count, categoryCounts: summary.category_counts, nextPriority: summary.next_priority }, null, 2));
  process.exit(['PASSED', 'BLOCKED'].includes(envelope.proof_status) ? 0 : 1);
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exit(1); });
