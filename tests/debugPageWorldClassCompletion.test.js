import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
const repoRoot = path.resolve(import.meta.dirname, '..');

test('debug page world-class completion proof passes and generates two next batches', () => {
  const result = spawnSync(process.execPath, ['tools/run-debug-page-world-class-completion-proof.mjs'], { cwd: repoRoot, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const proof = JSON.parse(result.stdout);
  assert.equal(proof.proof_status, 'PASSED');
  assert.ok(proof.openspec_score_estimate >= 85);
  assert.ok(proof.implementation_score_estimate >= 85);
  assert.equal(proof.next_batch_count, 2);
});
