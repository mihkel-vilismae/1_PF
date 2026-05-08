/*
 * Verifies backend helpers for persisted runtime pipeline lock maintenance.
 * The tests stay below the HTTP layer to avoid mutating repo-local truth files.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  clearStalePipelineLocks,
  detectStalePipelineLockIssues,
  resolvePipelineLockStaleThresholdSeconds,
} from '../server/runtimePipelineLocks.ts';

test('detectStalePipelineLockIssues flags locks with missing acquisition timestamps', () => {
  const issues = detectStalePipelineLockIssues({
    pipelineActiveKey: 'B3.2',
    pipelineLockAcquiredAt: null,
    stageLock: 'Pipeline lock held by B3.2',
  });

  assert.equal(issues.length, 1);
  assert.equal(issues[0].kind, 'stale_pipeline_lock');
  assert.equal(issues[0].lockOwner, 'B3.2');
  assert.equal(issues[0].staleReason, 'missing_acquired_at');
});

test('detectStalePipelineLockIssues leaves fresh timestamped locks alone', () => {
  const issues = detectStalePipelineLockIssues(
    {
      pipelineActiveKey: 'B3.2',
      pipelineLockAcquiredAt: '2026-05-08T04:02:00.000Z',
      stageLock: 'Pipeline lock held by B3.2',
    },
    {
      now: new Date('2026-05-08T04:02:30.000Z'),
      staleThresholdSeconds: 60,
    },
  );

  assert.deepEqual(issues, []);
});

test('clearStalePipelineLocks clears only stale pipeline lock fields', () => {
  const result = clearStalePipelineLocks({
    queueLength: 3,
    pipelineActiveKey: 'B3.2',
    pipelineLockAcquiredAt: 'invalid timestamp',
    stageLock: 'Pipeline lock held by B3.2',
  });

  assert.equal(result.cleared, true);
  assert.equal(result.truth.queueLength, 3);
  assert.equal(result.truth.pipelineActiveKey, null);
  assert.equal(result.truth.pipelineLockAcquiredAt, null);
  assert.equal(result.truth.stageLock, 'Cleared stale pipeline lock held by B3.2');
});

test('clearStalePipelineLocks preserves active non-stale pipeline locks', () => {
  const truth = {
    pipelineActiveKey: 'B3.2',
    pipelineLockAcquiredAt: '2026-05-08T04:02:00.000Z',
    stageLock: 'Pipeline lock held by B3.2',
  };

  const result = clearStalePipelineLocks(truth, {
    now: new Date('2026-05-08T04:02:30.000Z'),
    staleThresholdSeconds: 60,
  });

  assert.equal(result.cleared, false);
  assert.equal(result.truth, truth);
});

test('resolvePipelineLockStaleThresholdSeconds reuses configured lock timeout when valid', () => {
  assert.equal(resolvePipelineLockStaleThresholdSeconds({ LOCK_TIMEOUT_SECONDS: '30' }), 30);
  assert.equal(resolvePipelineLockStaleThresholdSeconds({ LOCK_TIMEOUT_SECONDS: 'bad' }, 900), 900);
});
