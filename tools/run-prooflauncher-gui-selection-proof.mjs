#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createProofEnvelope, runCommand, writeProofArtifact } from './proof-utils.mjs';
import { buildProofRunnerQueuePlanForMode, assertFinalSummaryProofsRunLast } from './proof-runner-queue-lib.mjs';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

async function metadata() {
  const version = (await readFile('VERSION', 'utf8')).trim();
  const git = await runCommand('git', ['rev-parse', '--short', 'HEAD'], { timeoutMs: 10000, detached: false });
  return { version, gitCommit: git.stdout.trim() || 'unknown' };
}

const allPlan = buildProofRunnerQueuePlanForMode(pkg, { runMode: 'all', includeWindowsAliases: true });
const minimumPlan = buildProofRunnerQueuePlanForMode(pkg, { runMode: 'minimum', includeWindowsAliases: true });
const checks = [
  { name: 'all_mode_has_full_queue', passed: allPlan.ordered_count > minimumPlan.ordered_count, detail: { all: allPlan.ordered_count, minimum: minimumPlan.ordered_count } },
  { name: 'minimum_mode_has_no_missing_required_proofs', passed: minimumPlan.missing_minimum_proofs.length === 0, detail: minimumPlan.missing_minimum_proofs },
  { name: 'all_mode_final_summary_last', passed: assertFinalSummaryProofsRunLast(allPlan.ordered_proofs).passed, detail: allPlan.final_summary_proofs },
  { name: 'minimum_mode_final_summary_last', passed: assertFinalSummaryProofsRunLast(minimumPlan.ordered_proofs).passed, detail: minimumPlan.final_summary_proofs },
];
const proofStatus = checks.every((check) => check.passed) ? 'PASSED' : 'FAILED';
const envelope = createProofEnvelope({
  proofKind: 'prooflauncher_gui_selection',
  baselineVersion: (await metadata()).version,
  gitCommit: (await metadata()).gitCommit,
  proofStatus,
  runtimeMode: 'local_launcher_gui_selection_contract',
  evidence: { checks, all_mode_count: allPlan.ordered_count, minimum_mode_count: minimumPlan.ordered_count, minimum_proofs: minimumPlan.ordered_proofs },
  knownLimitations: ['This proves queue-selection happy paths only; it does not execute the selected queues.'],
});
const outputPath = await writeProofArtifact('prooflauncher_gui_selection', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, checks: envelope.evidence.checks }, null, 2));
process.exit(envelope.proof_status === 'PASSED' ? 0 : 1);
