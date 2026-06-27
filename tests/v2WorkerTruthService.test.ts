import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createV2WorkerTruthService } from '../server/v2WorkerTruthService.ts';

test('v2 worker truth service separates test and real files and sorts events', async () => {
  const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'v2-worker-truth-'));
  const service = createV2WorkerTruthService({ repoRoot });

  await service.appendEvent('test', {
    worker: 'regular-worker',
    stage: 'index',
    status: 'finished',
    timestamp: '2026-06-27T01:00:02.000Z',
    counts: { processed: 2 },
  });
  await service.appendEvent('test', {
    worker: 'regular-worker',
    stage: 'download',
    status: 'started',
    timestamp: '2026-06-27T01:00:01.000Z',
  });
  await service.appendEvent('real', {
    worker: 'playback-worker',
    stage: 'display',
    status: 'started',
    timestamp: '2026-06-27T01:00:03.000Z',
  });

  const testTruth = await service.readCombined('test');
  const realTruth = await service.readCombined('real');

  assert.equal(testTruth.mode, 'test');
  assert.equal(realTruth.mode, 'real');
  assert.equal(testTruth.events.length, 2);
  assert.equal(realTruth.events.length, 1);
  assert.deepEqual(testTruth.events.map((event) => event.stage), ['download', 'index']);
});

test('v2 worker truth service reports malformed JSONL without crashing', async () => {
  const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'v2-worker-truth-bad-'));
  const service = createV2WorkerTruthService({ repoRoot });
  const filePath = service.resolveWorkerFilePath('test', 'regular-worker');
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, '{"stage":"download","status":"started"}\nnot-json\n', 'utf8');

  const truth = await service.readCombined('test');

  assert.equal(truth.status, 'warning');
  assert.equal(truth.events.length, 1);
  assert.equal(truth.malformed.length, 1);
  assert.equal(truth.malformed[0].line, 2);
});
