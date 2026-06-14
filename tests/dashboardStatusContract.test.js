import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDashboardStatusContract, buildEmptyDashboardStatusSnapshot, DASHBOARD_STATUS_SECTIONS, evaluateDashboardStatusSnapshot } from '../tools/dashboard-status-contract-lib.mjs';

test('dashboard status contract is status-only and includes v1 proof sections', () => {
  const contract = buildDashboardStatusContract();
  assert.equal(contract.controlScope, 'status_only');
  assert.deepEqual(contract.sections.map((section) => section.name), DASHBOARD_STATUS_SECTIONS);
  assert.match(contract.source_of_truth, /proof artifacts/);
});

test('dashboard status snapshot evaluation requires all proof-backed sections', () => {
  const contract = buildDashboardStatusContract();
  const incomplete = evaluateDashboardStatusSnapshot({ worker_health: [] }, contract);
  assert.equal(incomplete.complete, false);
  assert.ok(incomplete.missingSections.includes('current_playback'));
  const complete = evaluateDashboardStatusSnapshot(buildEmptyDashboardStatusSnapshot(), contract);
  assert.equal(complete.complete, true);
});
