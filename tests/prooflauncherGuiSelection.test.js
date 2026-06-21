import assert from 'node:assert/strict';
import test from 'node:test';
import pkg from '../package.json' with { type: 'json' };
import { buildProofRunnerQueuePlanForMode, assertFinalSummaryProofsRunLast, MINIMUM_PROOF_RUNNER_PROOFS, QUICK_PROOF_RUNNER_PROOFS } from '../tools/proof-runner-queue-lib.mjs';

test('all mode returns a larger full queue than minimum mode', () => {
  const all = buildProofRunnerQueuePlanForMode(pkg, { runMode: 'all', includeWindowsAliases: true });
  const minimum = buildProofRunnerQueuePlanForMode(pkg, { runMode: 'minimum', includeWindowsAliases: true });
  const quick = buildProofRunnerQueuePlanForMode(pkg, { runMode: 'quick', includeWindowsAliases: true });
  assert.equal(all.run_mode, 'full');
  assert.equal(minimum.run_mode, 'minimum');
  assert.ok(all.ordered_count > minimum.ordered_count);
  assert.deepEqual(quick.ordered_proofs, QUICK_PROOF_RUNNER_PROOFS);
});

test('minimum mode includes every required minimum proof and keeps final summary last', () => {
  const minimum = buildProofRunnerQueuePlanForMode(pkg, { runMode: 'minimum', includeWindowsAliases: false });
  assert.deepEqual(minimum.missing_minimum_proofs, []);
  assert.deepEqual(minimum.ordered_proofs, MINIMUM_PROOF_RUNNER_PROOFS);
  assert.equal(assertFinalSummaryProofsRunLast(minimum.ordered_proofs).passed, true);
});


test('tiered launcher mode selection exposes quick, blockers, failed-last, platform, and full', () => {
  const full = buildProofRunnerQueuePlanForMode(pkg, { runMode: 'full', includeWindowsAliases: true });
  const quick = buildProofRunnerQueuePlanForMode(pkg, { runMode: 'quick', includeWindowsAliases: true });
  const blockers = buildProofRunnerQueuePlanForMode(pkg, { runMode: 'blockers', includeWindowsAliases: true });
  const failed = buildProofRunnerQueuePlanForMode(pkg, { runMode: 'failed-last', includeWindowsAliases: true, lastFailedProofs: ['proof:regular-worker-product-contract'] });
  const platform = buildProofRunnerQueuePlanForMode(pkg, { runMode: 'platform', includeWindowsAliases: true });
  assert.equal(full.run_mode, 'full');
  assert.equal(quick.run_mode, 'quick');
  assert.equal(blockers.run_mode, 'blockers');
  assert.equal(failed.run_mode, 'failed-last');
  assert.equal(platform.run_mode, 'platform');
  assert.ok(quick.ordered_count < full.ordered_count);
  assert.ok(blockers.ordered_count < full.ordered_count);
  assert.ok(platform.ordered_count < full.ordered_count);
  assert.ok(failed.ordered_proofs.includes('proof:regular-worker-product-contract'));
});
