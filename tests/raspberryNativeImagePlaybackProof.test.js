/**
 * Raspberry native image playback proof guard.
 * These tests do not require Raspberry hardware and do not start mpv.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import {
  buildRaspberryNativeImagePlaybackCommand,
  determineRaspberryNativeImagePlaybackStatus,
  detectRaspberryDisplaySession,
  inspectNativeImageFixture,
  RASPBERRY_NATIVE_IMAGE_FIXTURE,
  RASPBERRY_NATIVE_IMAGE_REQUIRED_TOOLS,
} from '../tools/raspberry-native-image-playback-proof-lib.mjs';

const openSpecPath = 'docs/20_architecture_and_specs/openspec/raspberry_native_image_playback_proof_openspec.md';
const proofDocPath = 'docs/proofs/raspberry_native_image_playback_proof.md';

function read(path) {
  return readFileSync(path, 'utf8');
}

function tools(available = true) {
  return RASPBERRY_NATIVE_IMAGE_REQUIRED_TOOLS.map((tool) => ({ name: tool.name, available }));
}

const target = { raspberry_like: true, explicit_override_used: false };
const display = { display_available: true, explicit_display_override_used: false };
const fixture = { exists: true, size_bytes: 10, relative_path: RASPBERRY_NATIVE_IMAGE_FIXTURE };
const launcherResult = { exitCode: 0, timedOut: false };
const playbackResult = { exitCode: 0, timedOut: false, signal: null };

test('Raspberry native image playback proof docs, package script, and runner are wired', () => {
  assert.equal(existsSync(openSpecPath), true);
  assert.equal(existsSync(proofDocPath), true);
  assert.equal(existsSync('tools/raspberry-native-image-playback-proof-lib.mjs'), true);
  assert.equal(existsSync('tools/run-raspberry-native-image-playback-proof.mjs'), true);
  const packageJson = JSON.parse(read('package.json'));
  assert.equal(packageJson.scripts['proof:raspberry-native-image-playback'], 'node tools/run-raspberry-native-image-playback-proof.mjs');
  assert.match(read('docs/proofs/README.md'), /npm run proof:raspberry-native-image-playback/);
});

test('proof selects a deterministic image fixture and builds a bounded mpv command', () => {
  const inspected = inspectNativeImageFixture();
  assert.equal(inspected.relative_path, RASPBERRY_NATIVE_IMAGE_FIXTURE);
  assert.equal(inspected.exists, true);
  assert.equal(inspected.media_type, 'image');
  assert.equal(inspected.deterministic_fixture, true);
  assert.ok(inspected.size_bytes > 0);

  const command = buildRaspberryNativeImagePlaybackCommand();
  assert.equal(command.command, 'mpv');
  assert.deepEqual(command.args.slice(-1), [RASPBERRY_NATIVE_IMAGE_FIXTURE]);
  assert.ok(command.args.includes('--fs'));
  assert.ok(command.args.includes('--image-display-duration=2'));
});

test('display detection uses normal display variables and records override separately', () => {
  assert.equal(detectRaspberryDisplaySession({ env: {} }).display_available, false);
  assert.equal(detectRaspberryDisplaySession({ env: { DISPLAY: ':0' } }).display_available, true);
  const overridden = detectRaspberryDisplaySession({ env: { PF_RASPBERRY_NATIVE_IMAGE_ASSUME_DISPLAY: 'true' } });
  assert.equal(overridden.display_available, true);
  assert.equal(overridden.explicit_display_override_used, true);
});

test('status contract blocks off-target, override, headless, missing tools, and missing fixture runs', () => {
  assert.equal(determineRaspberryNativeImagePlaybackStatus({
    target: { raspberry_like: false, explicit_override_used: false }, display, requiredTools: tools(true), fixture, launcherResult, playbackResult,
  }).proofStatus, 'BLOCKED');

  assert.equal(determineRaspberryNativeImagePlaybackStatus({
    target: { raspberry_like: true, explicit_override_used: true }, display, requiredTools: tools(true), fixture, launcherResult, playbackResult,
  }).proofStatus, 'BLOCKED');

  assert.equal(determineRaspberryNativeImagePlaybackStatus({
    target, display: { display_available: false, explicit_display_override_used: false }, requiredTools: tools(true), fixture, launcherResult, playbackResult,
  }).proofStatus, 'BLOCKED');

  assert.equal(determineRaspberryNativeImagePlaybackStatus({
    target, display: { display_available: true, explicit_display_override_used: true }, requiredTools: tools(true), fixture, launcherResult, playbackResult,
  }).proofStatus, 'BLOCKED');

  assert.equal(determineRaspberryNativeImagePlaybackStatus({
    target, display, requiredTools: tools(false), fixture, launcherResult, playbackResult,
  }).proofStatus, 'BLOCKED');

  assert.equal(determineRaspberryNativeImagePlaybackStatus({
    target, display, requiredTools: tools(true), fixture: { exists: false, size_bytes: 0, relative_path: RASPBERRY_NATIVE_IMAGE_FIXTURE }, launcherResult, playbackResult,
  }).proofStatus, 'BLOCKED');
});

test('status contract passes only after launcher boundary and native image process evidence succeed', () => {
  assert.equal(determineRaspberryNativeImagePlaybackStatus({
    target, display, requiredTools: tools(true), fixture, launcherResult, playbackResult,
  }).proofStatus, 'PASSED');

  assert.equal(determineRaspberryNativeImagePlaybackStatus({
    target, display, requiredTools: tools(true), fixture, launcherResult: { exitCode: 1, timedOut: false }, playbackResult,
  }).proofStatus, 'FAILED');

  assert.equal(determineRaspberryNativeImagePlaybackStatus({
    target, display, requiredTools: tools(true), fixture, launcherResult, playbackResult: { exitCode: 2, timedOut: false, signal: null },
  }).proofStatus, 'FAILED');
});

test('OpenSpec keeps proof narrow and non-claims explicit', () => {
  const spec = read(openSpecPath);
  assert.match(spec, /Raspberry native image playback/);
  assert.match(spec, /project-owned launcher/);
  assert.match(spec, /generated_test_data\/gps_valid\/gps_valid_01\.jpg/);
  assert.match(spec, /mpv/);
  assert.match(spec, /DISPLAY|WAYLAND_DISPLAY/);
  assert.match(spec, /does not prove:[\s\S]*Raspberry native video playback/i);
  assert.match(spec, /does not prove:[\s\S]*power-loss recovery/i);
  assert.match(spec, /does not configure systemd, cron, or boot autostart/i);
});
