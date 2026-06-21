import test from 'node:test';
import assert from 'node:assert/strict';
import pkg from '../package.json' with { type: 'json' };
import { buildProofRunnerQueuePlan, buildMinimumProofRunnerQueuePlan, buildProofRunnerQueuePlanForMode, orderProofScriptsForEvidenceRun, assertFinalSummaryProofsRunLast, MINIMUM_PROOF_RUNNER_PROOFS, QUICK_PROOF_RUNNER_PROOFS, BLOCKER_PROOF_RUNNER_PROOFS } from '../tools/proof-runner-queue-lib.mjs';

test('proof runner queue moves v1 readiness summary after real/provider proofs', () => {
  const ordered = orderProofScriptsForEvidenceRun([
    'proof:raspberry-v1-readiness',
    'proof:real-icloudpd',
    'proof:real-geocode-provider-chain',
    'proof:raspberry-dashboard-status-view',
  ]);
  assert.deepEqual(ordered.slice(0, 3), ['proof:raspberry-dashboard-status-view', 'proof:real-geocode-provider-chain', 'proof:real-icloudpd']);
  assert.equal(ordered.at(-1), 'proof:raspberry-v1-readiness');
  assert.equal(assertFinalSummaryProofsRunLast(ordered).passed, true);
});

test('Raspberry proof runner queue excludes Windows-only aliases but keeps final summary last', () => {
  const plan = buildProofRunnerQueuePlan(pkg, { includeWindowsAliases: false });
  assert.equal(plan.ordered_proofs.some((name) => name.endsWith(':windows')), false);
  assert.ok(plan.skipped_windows_aliases.length > 0);
  assert.equal(assertFinalSummaryProofsRunLast(plan.ordered_proofs).passed, true);
  assert.equal(plan.ordered_proofs.at(-3), 'proof:raspberry-v1-readiness');
  assert.equal(plan.ordered_proofs.at(-2), 'proof:proof-report-blocker-summary');
  assert.equal(plan.ordered_proofs.at(-1), 'proof:proof-runner-final-summary');
});


test('minimum proof runner queue keeps required smoke proofs and final summary last', () => {
  const plan = buildMinimumProofRunnerQueuePlan(pkg, { includeWindowsAliases: false });
  assert.equal(plan.run_mode, 'minimum');
  assert.equal(plan.missing_minimum_proofs.length, 0);
  assert.deepEqual(plan.ordered_proofs, MINIMUM_PROOF_RUNNER_PROOFS);
  assert.equal(assertFinalSummaryProofsRunLast(plan.ordered_proofs).passed, true);
  assert.equal(plan.ordered_proofs.at(-3), 'proof:raspberry-v1-readiness');
  assert.equal(plan.ordered_proofs.at(-2), 'proof:proof-report-blocker-summary');
  assert.equal(plan.ordered_proofs.at(-1), 'proof:proof-runner-final-summary');
});

test('proof launcher GUI mode selection exposes all and minimum happy paths', () => {
  const allPlan = buildProofRunnerQueuePlanForMode(pkg, { runMode: 'all', includeWindowsAliases: true });
  const minimumPlan = buildProofRunnerQueuePlanForMode(pkg, { runMode: 'minimum', includeWindowsAliases: true });
  assert.equal(allPlan.run_mode, 'full');
  assert.equal(minimumPlan.run_mode, 'minimum');
  assert.ok(allPlan.ordered_count > minimumPlan.ordered_count);
  assert.equal(minimumPlan.missing_minimum_proofs.length, 0);
});


test('tiered proof runner modes reduce normal proof workload while preserving explicit mode metadata', () => {
  const full = buildProofRunnerQueuePlanForMode(pkg, { runMode: 'full', includeWindowsAliases: true });
  const quick = buildProofRunnerQueuePlanForMode(pkg, { runMode: 'quick', includeWindowsAliases: true });
  const blockers = buildProofRunnerQueuePlanForMode(pkg, { runMode: 'blockers', includeWindowsAliases: true });
  const platform = buildProofRunnerQueuePlanForMode(pkg, { runMode: 'platform', includeWindowsAliases: true });
  assert.equal(full.run_mode, 'full');
  assert.equal(quick.run_mode, 'quick');
  assert.equal(blockers.run_mode, 'blockers');
  assert.equal(platform.run_mode, 'platform');
  assert.ok(quick.ordered_count < full.ordered_count);
  assert.ok(blockers.ordered_count < full.ordered_count);
  assert.ok(platform.ordered_count < full.ordered_count);
  assert.deepEqual(quick.missing_requested_proofs, []);
  assert.ok(QUICK_PROOF_RUNNER_PROOFS.every((name) => quick.ordered_proofs.includes(name)));
  assert.ok(BLOCKER_PROOF_RUNNER_PROOFS.some((name) => blockers.ordered_proofs.includes(name)));
  assert.equal(assertFinalSummaryProofsRunLast(blockers.ordered_proofs).passed, true);
});

test('changed and failed-last modes use supplied proof lists plus safe fallback behavior', () => {
  const changed = buildProofRunnerQueuePlanForMode(pkg, {
    runMode: 'changed',
    includeWindowsAliases: true,
    changedProofs: ['proof:regular-worker-product-contract'],
  });
  assert.equal(changed.run_mode, 'changed');
  assert.equal(changed.selection_kind, 'changed-plus-quick-core');
  assert.ok(changed.ordered_proofs.includes('proof:regular-worker-product-contract'));
  assert.ok(changed.ordered_proofs.includes('proof:docs-reconciliation-audit'));

  const failed = buildProofRunnerQueuePlanForMode(pkg, {
    runMode: 'failed-last',
    includeWindowsAliases: true,
    lastFailedProofs: ['proof:regular-worker-product-contract', 'proof:proof-runner-final-summary'],
  });
  assert.equal(failed.run_mode, 'failed-last');
  assert.ok(failed.ordered_proofs.includes('proof:regular-worker-product-contract'));
  assert.equal(failed.ordered_proofs.at(-1), 'proof:proof-runner-final-summary');
  assert.equal(assertFinalSummaryProofsRunLast(failed.ordered_proofs).passed, true);

  const fallback = buildProofRunnerQueuePlanForMode(pkg, { runMode: 'failed-last', includeWindowsAliases: true, lastFailedProofs: [] });
  assert.equal(fallback.selection_kind, 'failed-last-fallback-quick');
  assert.deepEqual(fallback.ordered_proofs, QUICK_PROOF_RUNNER_PROOFS);
});
