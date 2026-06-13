import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { SCHEDULER_WORKER_NAMES } from '../shared/schedulerWorkerCommands.ts';
import { runInstrumentedSchedulerWorker } from '../server/workers/instrumentedSchedulerWorker.ts';

const fixedDates = [
  new Date('2026-06-13T00:00:00.000Z'),
  new Date('2026-06-13T00:00:01.000Z'),
  new Date('2026-06-13T00:00:02.000Z'),
];

function buildClock() {
  let index = 0;
  return () => fixedDates[Math.min(index++, fixedDates.length - 1)];
}

test('regular_stage_worker writes instrumentation-only status and lock evidence', async () => {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'regular-worker-instrumentation-'));
  try {
    const result = await runInstrumentedSchedulerWorker({ workerName: SCHEDULER_WORKER_NAMES.regularStage, repoRoot, now: buildClock(), workerId: 'regular-test' });
    assert.equal(result.worker, 'regular_stage_worker');
    assert.equal(result.status, 'succeeded');
    assert.equal(result.implementationStatus, 'instrumentation_only');
    assert.equal(result.productWork.claimed, false);
    assert.equal(result.invocation_observed, true);
    assert.equal(result.same_worker_singleton.first_acquired, true);
    assert.equal(result.cross_worker_independence, true);
    const saved = JSON.parse(await readFile(path.join(repoRoot, 'runtime_data/scheduler/regular-stage-worker-status.json'), 'utf8'));
    assert.equal(saved.worker, 'regular_stage_worker');
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test('screen_on_off_worker safely skips duplicate same-worker lock', async () => {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'screen-worker-duplicate-'));
  try {
    const runtimeDirectory = path.join(repoRoot, 'runtime_data/scheduler');
    await mkdir(runtimeDirectory, { recursive: true });
    await writeFile(path.join(runtimeDirectory, 'screen-on-off-worker-lock.json'), JSON.stringify({ worker: 'screen_on_off_worker', acquiredAt: '2026-06-13T00:00:00.000Z', pid: 123, workerId: 'existing' }), 'utf8');
    const result = await runInstrumentedSchedulerWorker({ workerName: SCHEDULER_WORKER_NAMES.screenOnOff, repoRoot, now: buildClock(), workerId: 'screen-test', staleLockSeconds: 900 });
    assert.equal(result.status, 'skipped');
    assert.equal(result.same_worker_singleton.duplicate_skipped, true);
    assert.equal(result.skippedReason, 'same_worker_instance_already_running');
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test('instrumented worker can reclaim stale same-worker lock', async () => {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'regular-worker-stale-'));
  try {
    const runtimeDirectory = path.join(repoRoot, 'runtime_data/scheduler');
    await mkdir(runtimeDirectory, { recursive: true });
    await writeFile(path.join(runtimeDirectory, 'regular-stage-worker-lock.json'), JSON.stringify({ worker: 'regular_stage_worker', acquiredAt: '2026-06-12T23:00:00.000Z', pid: 456, workerId: 'stale' }), 'utf8');
    const result = await runInstrumentedSchedulerWorker({ workerName: SCHEDULER_WORKER_NAMES.regularStage, repoRoot, now: () => new Date('2026-06-13T00:00:00.000Z'), workerId: 'regular-stale-test', staleLockSeconds: 60 });
    assert.equal(result.status, 'succeeded');
    assert.equal(result.stale_lock.reclaimed, true);
    assert.equal(result.lock.released, true);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});
