import { mkdtemp, readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runRegularStageWorker, REGULAR_STAGE_WORKER_IMPLEMENTATION_STATUS } from '../server/workers/regularStageWorker.ts';

test('regular_stage_worker attaches B3 Run actions and records product cycle status', async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'pf-regular-stage-worker-'));
  const calls: string[] = [];
  const result = await runRegularStageWorker({
    repoRoot,
    runStage: async (stage) => {
      calls.push(stage.endpoint);
      return {
        statusCode: 200,
        payload: {
          status: 'ok',
          stage: stage.key,
          message: `${stage.bStage} completed`,
          inserted_count: stage.key === 'queue_prepare' ? 1 : undefined,
          indexing: stage.key === 'index' ? { scannedMediaCount: 1, insertedCanonicalCount: 1 } : undefined,
        },
      };
    },
  });

  assert.deepEqual(calls, [
    '/api/runtime/download/run',
    '/api/runtime/index/run',
    '/api/runtime/gps/run',
    '/api/runtime/geocode/run',
    '/api/runtime/queue/prepare',
  ]);
  assert.equal(result.status, 'succeeded');
  assert.equal(result.implementationStatus, REGULAR_STAGE_WORKER_IMPLEMENTATION_STATUS);
  assert.equal(result.productWork.claimed, true);
  assert.equal(result.stageState.lastCompletedStage, 'queue_prepare');
  assert.equal(result.stageState.nextStage, 'download');
  assert.equal(result.stageState.completedProductCycleObserved, true);

  const saved = JSON.parse(await readFile(path.join(repoRoot, 'runtime_data/scheduler/regular-stage-worker-status.json'), 'utf8'));
  assert.equal(saved.productWork.claimed, true);
  assert.equal(saved.implementationStatus, 'b3_stage_state_machine_v1');
});

test('regular_stage_worker resumes from durable last completed stage', async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'pf-regular-stage-worker-resume-'));
  const schedulerDir = path.join(repoRoot, 'runtime_data/scheduler');
  await mkdir(schedulerDir, { recursive: true });
  await writeFile(path.join(schedulerDir, 'regular-stage-worker-state.json'), JSON.stringify({
    schemaVersion: 1,
    worker: 'regular_stage_worker',
    implementationStatus: 'b3_stage_state_machine_v1',
    lastCompletedStage: 'gps',
    nextStage: 'geocode',
    completedProductCycleObserved: false,
    cycleCount: 0,
    updatedAt: '2026-06-22T00:00:00.000Z',
    lastRunId: 'prior',
    stageHistory: [],
  }), 'utf8');

  const calls: string[] = [];
  const result = await runRegularStageWorker({
    repoRoot,
    runStage: async (stage) => {
      calls.push(stage.key);
      return { statusCode: 200, payload: { status: 'ok', stage: stage.key } };
    },
  });

  assert.deepEqual(calls, ['geocode', 'queue_prepare']);
  assert.equal(result.stageState.lastCompletedStage, 'queue_prepare');
  assert.equal(result.productWork.claimed, true);
});
