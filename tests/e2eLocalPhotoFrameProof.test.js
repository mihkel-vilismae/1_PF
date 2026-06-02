/**
 * Tests the local end-to-end photo-frame proof wrapper.
 * Verifies proof command construction and envelope status handling.
 * Keeps the expensive Wave D/Wave E execution in the proof command itself.
 * Protects the proof from shell-dependent npx lookup regressions.
 * Runs without real iCloud, geocode, or Raspberry dependencies.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import process from 'node:process';
import {
  E2E_LOCAL_PHOTO_FRAME_TARGETED_TESTS,
  buildE2eLocalPhotoFrameProofCommand,
  buildE2eLocalPhotoFrameProofEnvelope,
  inspectE2eLocalPhotoFrameFixtures,
} from '../tools/e2e-local-photo-frame-proof-lib.mjs';

/** Verifies the proof uses local tsx and the expected product-story tests. */
test('e2e local photo-frame proof command uses local tsx with targeted tests', () => {
  const command = buildE2eLocalPhotoFrameProofCommand();
  assert.equal(command.command, process.execPath);
  assert.match(command.args[0], /tsx[/\\]dist[/\\]cli\.mjs$/);
  assert.ok(command.args.includes('--test'));
  assert.ok(command.args.includes('--test-concurrency=1'));
  assert.ok(command.args.includes('--test-name-pattern=Wave E orchestrator success run|address display proof passes with deterministic local sidecar input'));
  for (const testPath of E2E_LOCAL_PHOTO_FRAME_TARGETED_TESTS) {
    assert.ok(command.args.includes(testPath), `${testPath} should be part of the proof command`);
  }
});

/** Verifies required deterministic fixtures are present for the local proof. */
test('e2e local photo-frame proof fixtures are discoverable', async () => {
  const readiness = await inspectE2eLocalPhotoFrameFixtures();
  assert.equal(readiness.ready, true, JSON.stringify(readiness, null, 2));
  assert.ok(readiness.fixtures.length >= 2);
  assert.ok(Array.isArray(readiness.manifest.groupNames));
});

/** Verifies command success and fixture readiness produce a PASSED proof envelope. */
test('e2e local photo-frame proof envelope passes only with fixtures and command success', () => {
  const command = buildE2eLocalPhotoFrameProofCommand();
  const metadata = { version: '0.7.42', gitCommit: 'abc123' };
  const fixtureReadiness = { ready: true, fixtures: [], manifest: { path: 'generated_test_data/manifest.json' } };
  const testResult = { command: command.command, args: command.args, exitCode: 0, signal: null, timedOut: false, durationMs: 1, stdout: '', stderr: '' };

  const envelope = buildE2eLocalPhotoFrameProofEnvelope({ metadata, fixtureReadiness, testCommand: command, testResult });

  assert.equal(envelope.proof_kind, 'e2e_local_photo_frame');
  assert.equal(envelope.proof_status, 'PASSED');
  assert.equal(envelope.runtime_mode, 'deterministic_local');
  assert.ok(envelope.evidence.verified_product_story.length >= 6);
});

/** Verifies command failure keeps the proof honestly failed. */
test('e2e local photo-frame proof envelope fails when targeted tests fail', () => {
  const command = buildE2eLocalPhotoFrameProofCommand();
  const metadata = { version: '0.7.42', gitCommit: 'abc123' };
  const fixtureReadiness = { ready: true, fixtures: [], manifest: { path: 'generated_test_data/manifest.json' } };
  const testResult = { command: command.command, args: command.args, exitCode: 1, signal: null, timedOut: false, durationMs: 1, stdout: '', stderr: 'failed' };

  const envelope = buildE2eLocalPhotoFrameProofEnvelope({ metadata, fixtureReadiness, testCommand: command, testResult });

  assert.equal(envelope.proof_status, 'FAILED');
  assert.match(envelope.known_limitations.join('\n'), /did not complete successfully/);
});
