/** Final proof-runner readiness summary proof. */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { runCommand, writeProofArtifact, createProofEnvelope, getProofEnvironment } from './proof-utils.mjs';
import { collectProofArtifactsFromDirectory, buildFinalProofRunnerSummary, parseProofSummaryTable } from './proof-runner-final-summary-lib.mjs';


async function readShellSummaryRowsFromEnv() {
  const summaryPath = process.env.PF_PROOF_SUMMARY_PATH || process.env.PF_PROOF_SUMMARY_FILE || '';
  if (!summaryPath) return { source: null, rows: [], read_error: null };
  try {
    const text = await readFile(summaryPath, 'utf8');
    return { source: summaryPath, rows: parseProofSummaryTable(text), read_error: null };
  } catch (error) {
    return { source: summaryPath, rows: [], read_error: error instanceof Error ? error.message : String(error) };
  }
}

async function readProjectMetadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const gitResult = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: gitResult.stdout.trim() || 'unknown' };
}

async function main() {
  const metadata = await readProjectMetadata();
  const proofsDir = join(process.cwd(), 'runtime_data', 'proofs');
  const artifacts = await collectProofArtifactsFromDirectory(proofsDir);
  const shellSummary = await readShellSummaryRowsFromEnv();
  const summary = buildFinalProofRunnerSummary({ artifacts, shellSummaryRows: shellSummary.rows });
  const envelope = createProofEnvelope({
    proofKind: 'proof_runner_final_summary',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: summary.proof_status,
    runtimeMode: 'proof_runner_final_readiness_summary',
    evidence: { environment: getProofEnvironment(), proofs_dir: proofsDir, artifact_count: artifacts.length, shell_summary_source: shellSummary.source, shell_summary_read_error: shellSummary.read_error, ...summary },
    knownLimitations: ['This summarizes proof artifacts already present in runtime_data/proofs; it does not execute provider, product, or hardware proofs itself.'],
  });
  const outputPath = await writeProofArtifact('proof_runner_final_summary', envelope);
  console.log(JSON.stringify({ status: envelope.proof_status, outputPath, latestReadiness: summary.latest_readiness, missingInputKinds: summary.missing_input_kinds }, null, 2));
  process.exit(['PASSED', 'BLOCKED'].includes(envelope.proof_status) ? 0 : 1);
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exit(1); });
