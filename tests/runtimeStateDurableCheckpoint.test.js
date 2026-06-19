import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRuntimeStateCheckpoint, buildCheckpointSchemaSummary, validateRuntimeStateCheckpoint } from '../tools/runtime-state-durable-checkpoint-lib.mjs';

test('runtime state checkpoint validates durable continuation metadata with recovery disabled', () => {
  const checkpoint = buildRuntimeStateCheckpoint({ stage: 'queue', cursor: 'cursor-1', lastSuccessfulStage: 'geocode', queuePosition: 2 });
  const result = validateRuntimeStateCheckpoint(checkpoint);
  assert.equal(result.status, 'PASSED');
  assert.equal(checkpoint.continuation.recovery_enabled, false);
  assert.ok(checkpoint.continuation.disabled_recovery_claims.includes('power_loss_recovery'));
});

test('runtime state checkpoint schema rejects invalid stage', () => {
  assert.throws(() => buildRuntimeStateCheckpoint({ stage: 'magic' }), /Invalid checkpoint stage/);
  assert.ok(buildCheckpointSchemaSummary().supported_stages.includes('download'));
});
