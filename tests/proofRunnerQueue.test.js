import test from 'node:test';
import assert from 'node:assert/strict';
import pkg from '../package.json' with { type: 'json' };
import { buildProofRunnerQueuePlan, buildMinimumProofRunnerQueuePlan, buildProofRunnerQueuePlanForMode, orderProofScriptsForEvidenceRun, assertFinalSummaryProofsRunLast, MINIMUM_PROOF_RUNNER_PROOFS } from '../tools/proof-runner-queue-lib.mjs';

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
  assert.equal(allPlan.run_mode, 'all');
  assert.equal(minimumPlan.run_mode, 'minimum');
  assert.ok(allPlan.ordered_count > minimumPlan.ordered_count);
  assert.equal(minimumPlan.missing_minimum_proofs.length, 0);
});
