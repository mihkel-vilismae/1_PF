/**
 * Raspberry native video playback proof guard.
 * These tests do not require Raspberry hardware and do not start mpv.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import {
  buildRaspberryNativeVideoPlaybackCommand,
  buildVideoMetadataCommand,
  determineRaspberryNativeVideoPlaybackStatus,
  detectRaspberryVideoDisplaySession,
  inspectNativeVideoFixture,
  summarizeVideoMetadataResult,
  RASPBERRY_NATIVE_VIDEO_FIXTURE,
  RASPBERRY_NATIVE_VIDEO_REQUIRED_TOOLS,
} from '../tools/raspberry-native-video-playback-proof-lib.mjs';

const openSpecPath = 'docs/20_architecture_and_specs/openspec/raspberry_native_video_playback_proof_openspec.md';
const proofDocPath = 'docs/proofs/raspberry_native_video_playback_proof.md';

function read(path) {
  return readFileSync(path, 'utf8');
}

function tools(available = true) {
  return RASPBERRY_NATIVE_VIDEO_REQUIRED_TOOLS.map((tool) => ({ name: tool.name, available }));
}

const target = { raspberry_like: true, explicit_override_used: false };
const display = { display_available: true, explicit_display_override_used: false };
const fixture = { exists: true, size_bytes: 10, relative_path: RASPBERRY_NATIVE_VIDEO_FIXTURE };
const launcherResult = { exitCode: 0, timedOut: false };
const metadataResult = { exitCode: 0, timedOut: false, signal: null };
const playbackResult = { exitCode: 0, timedOut: false, signal: null };

test('Raspberry native video playback proof docs, package script, and runner are wired', () => {
  assert.equal(existsSync(openSpecPath), true);
  assert.equal(existsSync(proofDocPath), true);
  assert.equal(existsSync('tools/raspberry-native-video-playback-proof-lib.mjs'), true);
  assert.equal(existsSync('tools/run-raspberry-native-video-playback-proof.mjs'), true);
  const packageJson = JSON.parse(read('package.json'));
  assert.equal(packageJson.scripts['proof:raspberry-native-video-playback'], 'node tools/run-raspberry-native-video-playback-proof.mjs');
  assert.match(read('docs/proofs/README.md'), /npm run proof:raspberry-native-video-playback/);
});

test('proof selects a deterministic video fixture and builds bounded mpv and ffprobe commands', () => {
  const inspected = inspectNativeVideoFixture();
  assert.equal(inspected.relative_path, RASPBERRY_NATIVE_VIDEO_FIXTURE);
  assert.equal(inspected.exists, true);
  assert.equal(inspected.media_type, 'video');
  assert.equal(inspected.deterministic_fixture, true);
  assert.ok(inspected.size_bytes > 0);

  const playbackCommand = buildRaspberryNativeVideoPlaybackCommand();
  assert.equal(playbackCommand.command, 'mpv');
  assert.deepEqual(playbackCommand.args.slice(-1), [RASPBERRY_NATIVE_VIDEO_FIXTURE]);
  assert.ok(playbackCommand.args.includes('--fs'));
  assert.ok(playbackCommand.args.includes('--keep-open=no'));

  const metadataCommand = buildVideoMetadataCommand();
  assert.equal(metadataCommand.command, 'ffprobe');
  assert.ok(metadataCommand.args.includes('format=duration:stream=index,codec_type,codec_name,width,height'));
  assert.deepEqual(metadataCommand.args.slice(-1), [RASPBERRY_NATIVE_VIDEO_FIXTURE]);
});

test('display detection uses normal display variables and records override separately', () => {
  assert.equal(detectRaspberryVideoDisplaySession({ env: {} }).display_available, false);
  assert.equal(detectRaspberryVideoDisplaySession({ env: { WAYLAND_DISPLAY: 'wayland-1' } }).display_available, true);
  const overridden = detectRaspberryVideoDisplaySession({ env: { PF_RASPBERRY_NATIVE_VIDEO_ASSUME_DISPLAY: 'true' } });
  assert.equal(overridden.display_available, true);
  assert.equal(overridden.explicit_display_override_used, true);
});

test('status contract blocks off-target, override, headless, missing tools, and missing fixture runs', () => {
  assert.equal(determineRaspberryNativeVideoPlaybackStatus({
    target: { raspberry_like: false, explicit_override_used: false }, display, requiredTools: tools(true), fixture, launcherResult, metadataResult, playbackResult,
  }).proofStatus, 'BLOCKED');

  assert.equal(determineRaspberryNativeVideoPlaybackStatus({
    target: { raspberry_like: true, explicit_override_used: true }, display, requiredTools: tools(true), fixture, launcherResult, metadataResult, playbackResult,
  }).proofStatus, 'BLOCKED');

  assert.equal(determineRaspberryNativeVideoPlaybackStatus({
    target, display: { display_available: false, explicit_display_override_used: false }, requiredTools: tools(true), fixture, launcherResult, metadataResult, playbackResult,
  }).proofStatus, 'BLOCKED');

  assert.equal(determineRaspberryNativeVideoPlaybackStatus({
    target, display: { display_available: true, explicit_display_override_used: true }, requiredTools: tools(true), fixture, launcherResult, metadataResult, playbackResult,
  }).proofStatus, 'BLOCKED');

  assert.equal(determineRaspberryNativeVideoPlaybackStatus({
    target, display, requiredTools: tools(false), fixture, launcherResult, metadataResult, playbackResult,
  }).proofStatus, 'BLOCKED');

  assert.equal(determineRaspberryNativeVideoPlaybackStatus({
    target, display, requiredTools: tools(true), fixture: { exists: false, size_bytes: 0, relative_path: RASPBERRY_NATIVE_VIDEO_FIXTURE }, launcherResult, metadataResult, playbackResult,
  }).proofStatus, 'BLOCKED');
});

test('status contract passes only after launcher, metadata, and native video process evidence succeed', () => {
  assert.equal(determineRaspberryNativeVideoPlaybackStatus({
    target, display, requiredTools: tools(true), fixture, launcherResult, metadataResult, playbackResult,
  }).proofStatus, 'PASSED');

  assert.equal(determineRaspberryNativeVideoPlaybackStatus({
    target, display, requiredTools: tools(true), fixture, launcherResult: { exitCode: 1, timedOut: false }, metadataResult, playbackResult,
  }).proofStatus, 'FAILED');

  assert.equal(determineRaspberryNativeVideoPlaybackStatus({
    target, display, requiredTools: tools(true), fixture, launcherResult, metadataResult: { exitCode: 1, timedOut: false }, playbackResult,
  }).proofStatus, 'FAILED');

  assert.equal(determineRaspberryNativeVideoPlaybackStatus({
    target, display, requiredTools: tools(true), fixture, launcherResult, metadataResult, playbackResult: { exitCode: 2, timedOut: false, signal: null },
  }).proofStatus, 'FAILED');
});

test('metadata summary parses ffprobe JSON without storing raw private paths', () => {
  const summary = summarizeVideoMetadataResult({
    command: 'ffprobe',
    args: ['-of', 'json', RASPBERRY_NATIVE_VIDEO_FIXTURE],
    exitCode: 0,
    signal: null,
    timedOut: false,
    durationMs: 12,
    stdout: JSON.stringify({
      streams: [{ index: 0, codec_type: 'video', codec_name: 'h264', width: 640, height: 360 }],
      format: { duration: '2.000000' },
    }),
    stderr: '',
  });
  assert.equal(summary.parsed.duration_seconds, '2.000000');
  assert.deepEqual(summary.parsed.streams[0], { index: 0, codec_type: 'video', codec_name: 'h264', width: 640, height: 360 });
  assert.equal(summary.parse_error, null);
});

test('OpenSpec keeps proof narrow and non-claims explicit', () => {
  const spec = read(openSpecPath);
  assert.match(spec, /Raspberry native video playback/);
  assert.match(spec, /project-owned launcher/);
  assert.match(spec, /apple_like_h264_mp4_gps_new_york\.mp4/);
  assert.match(spec, /mpv/);
  assert.match(spec, /ffprobe/);
  assert.match(spec, /duration\/media metadata|media metadata/i);
  assert.match(spec, /does not prove:[\s\S]*scheduler behavior/i);
  assert.match(spec, /does not prove:[\s\S]*power-loss recovery/i);
  assert.match(spec, /does not configure systemd, cron, or boot autostart/i);
});
