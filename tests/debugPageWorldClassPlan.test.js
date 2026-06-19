import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = path.resolve(import.meta.dirname, '..');
const planPath = path.join(repoRoot, 'docs/40_backlog_and_tasks/debug_page_world_class_sliceplan.json');

test('debug page world-class plan uses max requested batches and chosen slice count', () => {
  const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  assert.equal(plan.batch_count, 4);
  assert.equal(plan.slice_count, 18);
  assert.equal(plan.batches.length, 4);
  assert.equal(plan.batches.flatMap((batch) => batch.slices).length, 18);
});

test('debug page world-class plan proof passes', () => {
  const result = spawnSync(process.execPath, ['tools/run-debug-page-world-class-plan-proof.mjs'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const proof = JSON.parse(result.stdout);
  assert.equal(proof.proof_status, 'PASSED');
  assert.equal(proof.batch_count, 4);
  assert.equal(proof.slice_count, 18);
});
