import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildSchedulerHostMockStatus } from '../dashboard/services/schedulerHostMock.ts';
import { buildScreenWorkerNonBlockingDesign, evaluateScreenWorkerNonBlockingDesign, SCREEN_WORKER_NONBLOCKING_CRITERIA } from '../tools/screen-worker-nonblocking-design-lib.mjs';

test('screen worker non-blocking design is satisfied by scheduler host mock lanes', () => {
  const design = buildScreenWorkerNonBlockingDesign({ schedulerHostStatus: buildSchedulerHostMockStatus() });
  const evaluation = evaluateScreenWorkerNonBlockingDesign(design);
  assert.deepEqual(SCREEN_WORKER_NONBLOCKING_CRITERIA, Object.keys(design.satisfied));
  assert.equal(evaluation.passed, true);
  assert.deepEqual(evaluation.missing, []);
  assert.match(design.nonClaim, /no real screen worker process/);
});

test('screen worker non-blocking OpenSpec records local pre-pass boundaries', () => {
  const doc = readFileSync('docs/20_architecture_and_specs/openspec/raspberry_screen_worker_non_blocking_openspec.md', 'utf8');
  assert.match(doc, /Design pre-pass — v0\.8\.164/);
  assert.match(doc, /not the target proof itself/);
  assert.match(doc, /regular and playback worker lanes remain available/);
});
