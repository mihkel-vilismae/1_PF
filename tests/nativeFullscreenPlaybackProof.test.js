/*
 * Tests the deterministic native/fullscreen playback proof runner.
 * The proof uses targeted tests and does not launch native OS players.
 * It verifies local boundary evidence separately from live fullscreen proof.
 * These assertions keep the proof runner portable across Windows and POSIX shells.
 */
import assert from 'node:assert/strict';
import process from 'node:process';
import test from 'node:test';
import {
  buildNativeFullscreenPlaybackProofCommand,
  inspectNativeFullscreenDocs,
  runNativeFullscreenPlaybackProof,
} from '../tools/native-fullscreen-playback-proof-lib.mjs';

test('native/fullscreen proof command covers native controller and fullscreen UI tests', () => {
  const command = buildNativeFullscreenPlaybackProofCommand();
  assert.equal(command.command, process.execPath);
  assert.match(command.args[0], /tsx[/\\]dist[/\\]cli\.mjs$/);
  assert.deepEqual(command.args.slice(1, 2), ['--test']);
  assert.ok(command.args.includes('tests/nativePlaybackController.test.js'));
  assert.ok(command.args.includes('tests/osPlaybackRotationFullscreen.test.js'));
  assert.ok(command.args.includes('tests/osPlaybackViews.test.js'));
});

test('native/fullscreen proof docs are present and recognizable', async () => {
  const docs = await inspectNativeFullscreenDocs();
  assert.equal(docs.every((entry) => entry.exists), true, JSON.stringify(docs, null, 2));
  assert.equal(docs.every((entry) => entry.mentionsNativePlayback), true, JSON.stringify(docs, null, 2));
});

test('native/fullscreen proof passes deterministic boundary tests', async () => {
  const envelope = await runNativeFullscreenPlaybackProof({
    metadata: { version: '0.7.34', gitCommit: 'test' },
  });
  assert.equal(envelope.proof_status, 'PASSED', JSON.stringify(envelope.evidence.command_result, null, 2));
  assert.ok(envelope.evidence.verified_contracts.includes('Native playback remains disabled by default'));
  assert.match(envelope.known_limitations.join('\n'), /does not launch a real mpv\/vlc process/);
});
