/*
 * Tests the guarded dirty-shutdown testing service.
 * The service must never rely on broad process-name matching.
 * It blocks destructive simulation unless Test Mode and an env flag are both active.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildDirtyShutdownTestingResult,
  classifyProcessRecords,
} from '../server/testing_dirtyShutdownTestingService.ts';

const ownedWorker = { pid: 1234, worker: 'download', processName: 'pf-download-worker', appOwned: true };

test('dirty-shutdown plan is non-destructive and accepts owned worker records', async () => {
  const result = await buildDirtyShutdownTestingResult({
    mode: 'plan',
    runtimeMode: 'test',
    records: [ownedWorker],
  });

  assert.equal(result.status, 'ok');
  assert.equal(result.destructiveActionAttempted, false);
  assert.equal(result.processNameMatchingUsed, false);
  assert.equal(result.targetedProcessRecords.length, 1);
});

test('dirty-shutdown simulation is blocked by default', async () => {
  const result = await buildDirtyShutdownTestingResult({
    mode: 'simulate',
    runtimeMode: 'test',
    records: [ownedWorker],
  });

  assert.equal(result.status, 'blocked');
  assert.equal(result.targetedProcessRecords.length, 0);
  assert.match(result.message, /PF_ENABLE_DIRTY_SHUTDOWN_TESTING=true/);
});

test('dirty-shutdown simulation also requires Test Mode when flag is enabled', async () => {
  const result = await buildDirtyShutdownTestingResult({
    mode: 'simulate',
    runtimeMode: 'real',
    envValues: { PF_ENABLE_DIRTY_SHUTDOWN_TESTING: 'true' },
    records: [ownedWorker],
  });

  assert.equal(result.status, 'blocked');
  assert.match(result.message, /blocked outside Test Mode/);
});

test('dirty-shutdown enabled simulation remains first-version non-destructive', async () => {
  const result = await buildDirtyShutdownTestingResult({
    mode: 'simulate',
    runtimeMode: 'test',
    envValues: { PF_ENABLE_DIRTY_SHUTDOWN_TESTING: 'true' },
    records: [ownedWorker],
  });

  assert.equal(result.status, 'ok');
  assert.equal(result.destructiveActionAttempted, false);
  assert.equal(result.backendSelfKillIncluded, false);
  assert.equal(result.targetedProcessRecords.length, 1);
  assert.match(result.actions[0].action, /no_kill/);
});

test('dirty-shutdown targeting rejects unowned and generic process records', () => {
  const classified = classifyProcessRecords([
    ownedWorker,
    { pid: 2222, worker: 'pipeline', processName: 'node.exe', appOwned: true },
    { pid: 3333, worker: 'download', processName: 'pf-download-worker', appOwned: false },
    { pid: 4444, worker: 'backend', processName: 'pf-backend', appOwned: true },
  ]);

  assert.equal(classified.targeted.length, 1);
  assert.deepEqual(classified.skipped.map((entry) => entry.skipReason).sort(), [
    'backend_self_kill_blocked',
    'generic_process_name_rejected',
    'not_app_owned',
  ]);
});
