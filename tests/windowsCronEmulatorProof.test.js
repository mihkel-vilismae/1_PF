/**
 * Tests Windows CronEmulator proof artifact behavior.
 * Verifies emulator evidence is separated from Raspberry hardware proof claims.
 * Checks source inspections, crontab entrypoints, and pytest result handling.
 * Does not install scheduler services or execute real provider downloads.
 * Runs through the standard Node test runner.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildWindowsCronEmulatorProof,
  inspectCronEmulatorCrontab,
  inspectCronExecutorBoundary,
  inspectSchedulerDuplicateProtection,
  verifyRequiredCronEmulatorFiles
} from '../tools/windows-cronemulator-proof-lib.mjs';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = dirname(dirname(__filename));

/** Verifies the proof can see the required CronEmulator files. */
test('windows CronEmulator proof finds required files', () => {
  const result = verifyRequiredCronEmulatorFiles(repoRoot);
  assert.deepEqual(result.missing, []);
  assert.equal(result.checks.length > 0, true);
});

/** Verifies the example crontab references all expected worker entrypoints. */
test('windows CronEmulator proof validates example crontab entrypoints', async () => {
  const result = await inspectCronEmulatorCrontab(repoRoot);
  assert.equal(result.allEntrypointsReferenced, true);
  assert.equal(result.entrypointChecks.length, 3);
});

/** Verifies duplicate-run protection remains visible in SchedulerLoop source. */
test('windows CronEmulator proof detects scheduler duplicate-run protection', async () => {
  const result = await inspectSchedulerDuplicateProtection(repoRoot);
  assert.equal(result.passed, true);
  assert.equal(result.checks.skips_duplicate_active_job, true);
  assert.equal(result.checks.skips_same_minute_duplicate, true);
});

/** Verifies command execution remains isolated behind the executor boundary. */
test('windows CronEmulator proof detects executor boundary', async () => {
  const result = await inspectCronExecutorBoundary(repoRoot);
  assert.equal(result.passed, true);
  assert.equal(result.checks.uses_single_execution_boundary, true);
  assert.equal(result.checks.has_timeout, true);
});

/** Verifies proof envelope is explicit about not proving Raspberry hardware recovery. */
test('windows CronEmulator proof envelope does not claim hardware proof', async () => {
  const envelope = await buildWindowsCronEmulatorProof({ repoRoot, metadata: { version: '0.7.34', gitCommit: 'test' }, runPytest: false });
  assert.equal(envelope.runtime_mode, 'windows_emulator');
  assert.equal(envelope.proof_status, 'FAILED');
  assert.equal(envelope.evidence.separation_from_hardware_proof.raspberry_power_loss_proven, false);
  assert.equal(envelope.evidence.separation_from_hardware_proof.windows_cronemulator_is_hardware_proof, false);
});
