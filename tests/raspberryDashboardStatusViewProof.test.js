import assert from 'node:assert/strict';
import test from 'node:test';
import { buildRaspberryDashboardStatusViewProof } from '../tools/raspberry-dashboard-status-view-proof-lib.mjs';

test('raspberry dashboard status view proof passes only read-only projection checks', () => {
  const envelope = buildRaspberryDashboardStatusViewProof({ metadata: { version: 'test', gitCommit: 'test' } });
  assert.equal(envelope.proof_kind, 'raspberry_dashboard_status_view');
  assert.equal(envelope.proof_status, 'PASSED');
  assert.equal(envelope.evidence.passed, true);
  assert.equal(envelope.evidence.projection.readOnly, true);
  assert.equal(envelope.evidence.projection.mutationAllowed, false);
  assert.match(envelope.known_limitations.join('\n'), /does not prove real providers or hardware/);
});
