/**
 * Verifies the PF_login Windows scheduler scope documentation.
 * Windows Task Scheduler is intentionally not part of this project.
 * The supported Windows scheduler proof path remains the proof-owned scheduler loop.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

function read(path) {
  return readFileSync(path, 'utf8');
}

test('Windows Task Scheduler-only proof files are removed from active scope', () => {
  assert.equal(existsSync('tools/windows-task-scheduler-dry-run-proof-lib.mjs'), false);
  assert.equal(existsSync('tools/run-windows-task-scheduler-dry-run-proof.mjs'), false);
  assert.equal(existsSync('docs/proofs/windows_task_scheduler_dry_run_proof.md'), false);
  assert.equal(existsSync('tests/windowsTaskSchedulerDryRunProof.test.js'), false);
});

test('package scripts do not expose Windows Task Scheduler proof commands', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(Object.hasOwn(pkg.scripts, 'proof:windows-task-scheduler-dry-run'), false);
});

test('docs preserve proof-owned scheduler loop and mark Task Scheduler out of scope', () => {
  const readme = read('README.md');
  const howToRun = read('HOW_TO_RUN.md');
  const proofsReadme = read('docs/proofs/README.md');
  const milestone = read('docs/proofs/windows_native_proof_milestone_v0.8.26.md');
  for (const doc of [readme, howToRun, proofsReadme, milestone]) {
    assert.match(doc, /Windows Task Scheduler is (not part of PF_login project scope|out of scope)/);
  }
  assert.match(proofsReadme, /proof-owned scheduler loop/);
  assert.match(milestone, /proof-owned bounded scheduler loop/);
});
