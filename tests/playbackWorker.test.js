/*
 * Verifies the backend playback_worker boundary for B4 playback selection.
 * The tests keep worker behavior separate from rendering, B3 pipeline, and B5 screen control.
 */
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { selectCurrentPlayableItem } from '../server/playback/playbackSelectionService.ts';
import { runPlaybackWorker } from '../server/workers/playbackWorker.ts';

const fixedDates = [
  new Date('2026-05-10T13:00:00.000Z'),
  new Date('2026-05-10T13:00:01.000Z'),
  new Date('2026-05-10T13:00:02.000Z'),
];

test('playback selection service preserves selected route payload semantics', async () => {
  const result = await selectCurrentPlayableItem({
    context: { envValues: {} },
    databaseService: buildDatabaseService({
      playback: {
        outcome: 'selected',
        failedCandidateCount: 0,
        selected: { mediaAssetId: 42, canonicalPath: 'runtime/photo.jpg' },
      },
    }),
  });

  assert.equal(result.outcome, 'selected');
  assert.equal(result.status, 'ok');
  assert.equal(result.stage, 'stage6_run_playback');
  assert.deepEqual(result.messages, ['Selected media asset 42 as the current playback item.']);
  assert.deepEqual(result.selectedItemSummary, { mediaAssetId: 42, canonicalPath: 'runtime/photo.jpg' });
  assert.equal(result.skippedReason, null);
});

test('playback_worker selects current item without claiming rendering or B3/B5 work', async () => {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'playback-worker-selected-'));
  try {
    const result = await runPlaybackWorker({
      context: { envValues: {} },
      databaseService: buildDatabaseService({
        playback: {
          outcome: 'selected',
          failedCandidateCount: 1,
          selected: { mediaAssetId: 84, canonicalPath: 'runtime/video.mp4' },
        },
      }),
      repoRoot,
      now: buildClock(),
      workerId: 'test-worker-selected',
    });

    assert.equal(result.worker, 'playback_worker');
    assert.equal(result.status, 'succeeded');
    assert.equal(result.startedAt, '2026-05-10T13:00:00.000Z');
    assert.equal(result.finishedAt, '2026-05-10T13:00:01.000Z');
    assert.equal(result.lock.released, true);
    assert.equal(result.skippedReason, null);
    assert.equal(result.failureReason, null);
    assert.deepEqual(result.selectedItemSummary, { mediaAssetId: 84, canonicalPath: 'runtime/video.mp4' });
    assert.deepEqual(result.pipelineStagesRun, []);
    assert.equal(result.rendering.claimed, false);
    assert.match(result.rendering.note, /native fullscreen launch is disabled by config/);
    assert.equal(result.nativePlayback, null);

    const persisted = JSON.parse(await readFile(result.statusPath, 'utf8'));
    assert.equal(persisted.status, 'succeeded');
    assert.deepEqual(persisted.selectedItemSummary, { mediaAssetId: 84, canonicalPath: 'runtime/video.mp4' });
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test('playback_worker reports no READY row as an honest skipped state', async () => {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'playback-worker-skipped-'));
  try {
    const result = await runPlaybackWorker({
      context: { envValues: {} },
      databaseService: buildDatabaseService({
        playback: {
          outcome: 'no_ready_row',
          failedCandidateCount: 0,
          selected: null,
        },
      }),
      repoRoot,
      now: buildClock(),
      workerId: 'test-worker-skipped',
    });

    assert.equal(result.status, 'skipped');
    assert.equal(result.skippedReason, 'no_ready_row');
    assert.equal(result.failureReason, null);
    assert.deepEqual(result.messages, ['No READY slideshow rows exist for playback selection.']);
    assert.deepEqual(result.pipelineStagesRun, []);
    assert.equal(result.rendering.claimed, false);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test('playback_worker rejects concurrent lock holders before selecting playback', async () => {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'playback-worker-locked-'));
  try {
    const runtimeDirectory = path.join(repoRoot, 'runtime_data', 'scheduler');
    await import('node:fs/promises').then(({ mkdir }) => mkdir(runtimeDirectory, { recursive: true }));
    await writeFile(
      path.join(runtimeDirectory, 'playback-worker-lock.json'),
      `${JSON.stringify({ worker: 'playback_worker', acquiredAt: '2026-05-10T12:59:00.000Z', pid: 999999 })}\n`,
      'utf8',
    );

    await assert.rejects(
      () => runPlaybackWorker({
        context: { envValues: {} },
        databaseService: buildDatabaseService({
          playback: { outcome: 'selected', selected: { mediaAssetId: 1 }, failedCandidateCount: 0 },
        }),
        repoRoot,
        now: buildClock(),
        workerId: 'test-worker-locked',
      }),
      /playback_worker is already running/,
    );
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

function buildClock() {
  let index = 0;
  return () => fixedDates[Math.min(index++, fixedDates.length - 1)];
}

function buildDatabaseService({ playback }) {
  return {
    async buildDatabaseStatus() {
      return { kind: 'sqlite', absolutePath: '/tmp/photo-frame.sqlite', exists: true };
    },
    async runPythonJson() {
      return { currentMediaAssetId: null, currentItem: null, nextItem: null, items: [], queue: { totalCount: 0, readyCount: 0, failedCount: 0, returnedCount: 0, limit: 25 } };
    },
    async getRuntimeState() {
      return null;
    },
    async setRuntimeState() {
      return undefined;
    },
    async runStage6SelectCurrent() {
      return {
        database: { kind: 'sqlite', absolutePath: '/tmp/photo-frame.sqlite', exists: true },
        executedAt: '2026-05-10T13:00:00.500Z',
        playback,
      };
    },
  };
}
