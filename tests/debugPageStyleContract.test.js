import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
const repoRoot = path.resolve(import.meta.dirname, '..');

test('debug page style contract proof passes', () => {
  const result = spawnSync(process.execPath, ['tools/run-debug-page-style-contract-proof.mjs'], { cwd: repoRoot, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const proof = JSON.parse(result.stdout);
  assert.equal(proof.proof_status, 'PASSED');
});
