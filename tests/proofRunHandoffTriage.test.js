import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProofRunHandoffChecklist, classifyProofRow, summarizeProofRows } from '../tools/proof-run-handoff-triage-lib.mjs';

test('proof run handoff triage separates shell exit from proof JSON status', () => {
  assert.equal(classifyProofRow({ exit_code: 1, proof_status: 'PASSED' }).class, 'HARD_FAIL');
  assert.equal(classifyProofRow({ exit_code: 0, proof_status: 'BLOCKED' }).class, 'HONEST_BLOCKED');
  assert.equal(classifyProofRow({ exit_code: 0, proof_status: 'FAILED' }).class, 'PROOF_FAILED');
});

test('proof run handoff checklist requires shell/json layers separately', () => {
  const checklist = buildProofRunHandoffChecklist();
  assert.ok(checklist.required_analysis_layers.includes('shell_exit'));
  assert.ok(checklist.required_analysis_layers.includes('proof_json_status'));
});

test('proof run handoff summary counts hard failures and blocked rows separately', () => {
  const summary = summarizeProofRows([{ exit_code: 0, proof_status: 'PASSED' }, { exit_code: 0, proof_status: 'BLOCKED' }, { exit_code: 2 }]);
  assert.equal(summary.counts.PASS, 1);
  assert.equal(summary.counts.HONEST_BLOCKED, 1);
  assert.equal(summary.counts.HARD_FAIL, 1);
});
