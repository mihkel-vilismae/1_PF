/**
 * Verifies the Windows Task Scheduler dry-run proof contract.
 * Keeps tests deterministic and never installs scheduled tasks.
 * Checks command shape, cleanup previews, non-claims, and local tool boundaries.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWindowsTaskSchedulerDryRunContract,
  runWindowsTaskSchedulerDryRunProof,
  validateWindowsTaskSchedulerDryRunContract,
} from '../tools/windows-task-scheduler-dry-run-proof-lib.mjs';

const repoRoot = process.cwd();
const metadata = { version: '0.8.28', gitCommit: 'test' };

test('dry-run contract defines three proof-owned worker tasks', () => {
  const contract = buildWindowsTaskSchedulerDryRunContract({ repoRoot });
  assert.equal(contract.schedulerMode, 'windows-task-scheduler-dry-run-inspection');
  assert.deepEqual(contract.workers.map((worker) => worker.worker), ['regular_worker', 'playback_worker', 'screen_on_off_worker']);
  assert.equal(contract.workers.every((worker) => worker.installed === false && worker.dryRunOnly === true), true);
});

test('dry-run task definitions use existing worker entrypoints and cleanup previews', () => {
  const contract = buildWindowsTaskSchedulerDryRunContract({ repoRoot });
  for (const worker of contract.workers) {
    assert.equal(worker.entrypointExists, true, worker.entrypointRelativePath);
    assert.equal(worker.action.executable, 'powershell.exe');
    assert.ok(worker.action.arguments.includes('-File'));
    assert.ok(worker.cleanupCommandPreview.includes('/Delete'));
    assert.equal(worker.environment.PF_BACKEND_URL, 'http://127.0.0.1:4301');
  }
});

test('dry-run contract keeps local media tool bundles out of scheduled task definitions', () => {
  const contract = buildWindowsTaskSchedulerDryRunContract({ repoRoot });
  const serializedTaskDefinitions = JSON.stringify(contract.workers);
  assert.doesNotMatch(serializedTaskDefinitions, /tools[\\/]mpv/i);
  assert.doesNotMatch(serializedTaskDefinitions, /tools[\\/]ffmpeg/i);
});

test('dry-run contract validates and records explicit non-claims', () => {
  const contract = buildWindowsTaskSchedulerDryRunContract({ repoRoot });
  const validation = validateWindowsTaskSchedulerDryRunContract(contract);
  assert.equal(validation.passed, true);
  assert.ok(contract.nonClaims.some((claim) => claim.includes('Does not install')));
  assert.ok(contract.nonClaims.some((claim) => claim.includes('Windows reboot')));
  assert.ok(contract.nonClaims.some((claim) => claim.includes('Raspberry')));
});

test('dry-run proof passes without installing Windows Task Scheduler tasks', () => {
  const envelope = runWindowsTaskSchedulerDryRunProof({ repoRoot, metadata });
  assert.equal(envelope.proof_status, 'PASSED');
  assert.equal(envelope.proof_kind, 'windows_task_scheduler_dry_run');
  assert.equal(envelope.evidence.contract.workers[0].installed, false);
  assert.ok(envelope.known_limitations.some((entry) => entry.includes('Dry-run inspection only')));
});
