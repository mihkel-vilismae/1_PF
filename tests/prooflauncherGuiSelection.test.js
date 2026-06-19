import assert from 'node:assert/strict';
import test from 'node:test';
import pkg from '../package.json' with { type: 'json' };
import { buildProofRunnerQueuePlanForMode, assertFinalSummaryProofsRunLast, MINIMUM_PROOF_RUNNER_PROOFS } from '../tools/proof-runner-queue-lib.mjs';

test('all mode returns a larger full queue than minimum mode', () => {
  const all = buildProofRunnerQueuePlanForMode(pkg, { runMode: 'all', includeWindowsAliases: true });
  const minimum = buildProofRunnerQueuePlanForMode(pkg, { runMode: 'minimum', includeWindowsAliases: true });
  assert.equal(all.run_mode, 'all');
  assert.equal(minimum.run_mode, 'minimum');
  assert.ok(all.ordered_count > minimum.ordered_count);
});

test('minimum mode includes every required minimum proof and keeps final summary last', () => {
  const minimum = buildProofRunnerQueuePlanForMode(pkg, { runMode: 'minimum', includeWindowsAliases: false });
  assert.deepEqual(minimum.missing_minimum_proofs, []);
  assert.deepEqual(minimum.ordered_proofs, MINIMUM_PROOF_RUNNER_PROOFS);
  assert.equal(assertFinalSummaryProofsRunLast(minimum.ordered_proofs).passed, true);
});
