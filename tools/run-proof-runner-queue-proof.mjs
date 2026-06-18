/** Proof-runner queue ordering proof. */
import { readFile } from 'node:fs/promises';
import { runCommand, writeProofArtifact, createProofEnvelope, getProofEnvironment } from './proof-utils.mjs';
import { buildProofRunnerQueuePlan, assertFinalSummaryProofsRunLast } from './proof-runner-queue-lib.mjs';

async function readProjectMetadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const gitResult = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: gitResult.stdout.trim() || 'unknown' };
}

async function main() {
  const metadata = await readProjectMetadata();
  const pkg = JSON.parse(await readFile('package.json', 'utf8'));
  const linuxPlan = buildProofRunnerQueuePlan(pkg, { includeWindowsAliases: false });
  const windowsPlan = buildProofRunnerQueuePlan(pkg, { includeWindowsAliases: true });
  const linuxOrder = assertFinalSummaryProofsRunLast(linuxPlan.ordered_proofs);
  const windowsOrder = assertFinalSummaryProofsRunLast(windowsPlan.ordered_proofs);
  const checks = [
    { name: 'linux_queue_has_final_readiness_last', passed: linuxOrder.passed, detail: linuxOrder },
    { name: 'windows_queue_has_final_readiness_last', passed: windowsOrder.passed, detail: windowsOrder },
    { name: 'linux_queue_skips_windows_aliases', passed: linuxPlan.skipped_windows_aliases.every((name) => name.endsWith(':windows')), detail: linuxPlan.skipped_windows_aliases },
    { name: 'queue_preserves_all_discovered_linux_proofs', passed: linuxPlan.discovered_count === linuxPlan.ordered_count, detail: { discovered: linuxPlan.discovered_count, ordered: linuxPlan.ordered_count } },
  ];
  const proofStatus = checks.every((check) => check.passed) ? 'PASSED' : 'FAILED';
  const envelope = createProofEnvelope({
    proofKind: 'proof_runner_queue_order',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus,
    runtimeMode: 'proof_runner_queue_contract',
    evidence: { environment: getProofEnvironment(), checks, linux_plan: linuxPlan, windows_plan: windowsPlan },
    knownLimitations: ['This proves the intended queue order contract; external launcher scripts must use this ordering to realize it.'],
  });
  const outputPath = await writeProofArtifact('proof_runner_queue_order', envelope);
  console.log(JSON.stringify({ status: envelope.proof_status, outputPath, linuxProofCount: linuxPlan.ordered_count, windowsProofCount: windowsPlan.ordered_count }, null, 2));
  process.exit(proofStatus === 'PASSED' ? 0 : 1);
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exit(1); });
