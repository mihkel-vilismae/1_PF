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

const full = buildProofRunnerQueuePlanForMode(pkg, { runMode: 'full', includeWindowsAliases: true });
const quick = buildProofRunnerQueuePlanForMode(pkg, { runMode: 'quick', includeWindowsAliases: true });
const changed = buildProofRunnerQueuePlanForMode(pkg, {
  runMode: 'changed',
  includeWindowsAliases: true,
  changedProofs: ['proof:regular-worker-product-contract'],
});
const blockers = buildProofRunnerQueuePlanForMode(pkg, { runMode: 'blockers', includeWindowsAliases: true });
const failedLast = buildProofRunnerQueuePlanForMode(pkg, {
  runMode: 'failed-last',
  includeWindowsAliases: true,
  lastFailedProofs: ['proof:regular-worker-product-contract', 'proof:proof-runner-final-summary'],
});
const platformWin = buildProofRunnerQueuePlanForMode(pkg, { runMode: 'platform', includeWindowsAliases: true });
const platformRaspberry = buildProofRunnerQueuePlanForMode(pkg, { runMode: 'platform', includeWindowsAliases: false });

const checks = [
  { name: 'full_mode_keeps_complete_queue', passed: full.run_mode === 'full' && full.ordered_count > 100, detail: { ordered_count: full.ordered_count } },
  { name: 'quick_mode_is_smaller_than_full', passed: quick.run_mode === 'quick' && quick.ordered_count < full.ordered_count, detail: { quick: quick.ordered_count, full: full.ordered_count, proofs: quick.ordered_proofs } },
  { name: 'changed_mode_includes_requested_and_quick_core', passed: changed.ordered_proofs.includes('proof:regular-worker-product-contract') && changed.ordered_proofs.includes('proof:docs-reconciliation-audit'), detail: { proofs: changed.ordered_proofs } },
  { name: 'blockers_mode_is_smaller_and_keeps_final_summary_last', passed: blockers.ordered_count < full.ordered_count && assertFinalSummaryProofsRunLast(blockers.ordered_proofs).passed, detail: { count: blockers.ordered_count, tail: blockers.ordered_proofs.slice(-5) } },
  { name: 'failed_last_mode_replays_failed_proof_and_summary_tail', passed: failedLast.ordered_proofs.includes('proof:regular-worker-product-contract') && failedLast.ordered_proofs.at(-1) === 'proof:proof-runner-final-summary', detail: { proofs: failedLast.ordered_proofs } },
  { name: 'platform_mode_respects_windows_alias_filter', passed: platformWin.ordered_proofs.some((name) => name.endsWith(':windows')) && !platformRaspberry.ordered_proofs.some((name) => name.endsWith(':windows')), detail: { windows_count: platformWin.ordered_count, raspberry_count: platformRaspberry.ordered_count } },
];
const proofStatus = checks.every((check) => check.passed) ? 'PASSED' : 'FAILED';
const meta = await metadata();
const envelope = createProofEnvelope({
  proofKind: 'proofrunner_tiered_queues',
  baselineVersion: meta.version,
  gitCommit: meta.gitCommit,
  proofStatus,
  runtimeMode: 'local_proofrunner_tiered_queue_contract',
  evidence: {
    checks,
    modes: {
      full: { count: full.ordered_count },
      quick: { count: quick.ordered_count, proofs: quick.ordered_proofs },
      changed: { count: changed.ordered_count, proofs: changed.ordered_proofs },
      blockers: { count: blockers.ordered_count, proofs: blockers.ordered_proofs },
      failed_last: { count: failedLast.ordered_count, proofs: failedLast.ordered_proofs },
      platform_windows: { count: platformWin.ordered_count },
      platform_raspberry: { count: platformRaspberry.ordered_count },
    },
  },
  knownLimitations: ['This validates tiered queue selection. It does not execute every selected mode end-to-end.'],
});
const outputPath = await writeProofArtifact('proofrunner_tiered_queues', envelope);
console.log(JSON.stringify({ status: envelope.proof_status, outputPath, checks: envelope.evidence.checks }, null, 2));
process.exit(envelope.proof_status === 'PASSED' ? 0 : 1);
