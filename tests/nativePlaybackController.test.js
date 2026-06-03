/*
 * Verifies the native playback runner boundary without launching OS players.
 * The tests protect disabled-by-default behavior and route availability.
 * Mock-player configuration lets future backend tests avoid real fullscreen processes.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { buildNativePlaybackConfig, shouldAutoStartNativePlaybackFromWorker } from '../server/nativePlayback/nativePlaybackController.ts';

const serverSource = readFileSync('server/index.ts', 'utf8');
const specSource = readFileSync('docs/20_architecture_and_specs/native_playback_runner_spec.md', 'utf8');

test('native playback config is disabled by default and uses mpv safely', () => {
  const config = buildNativePlaybackConfig({ envValues: {}, platform: 'linux' });

  assert.equal(config.enabled, false);
  assert.equal(config.autoStartOnWorker, false);
  assert.equal(config.player, 'mpv');
  assert.equal(config.playerPath, 'mpv');
  assert.equal(config.fullscreen, true);
  assert.equal(config.replaceExisting, true);
  assert.equal(config.platform, 'raspberry');
});

// Verifies Windows can use the repo-local portable mpv install without env overrides.
test('native playback config auto-detects repo-local Windows mpv', async () => {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'native-playback-local-mpv-'));
  try {
    const mpvPath = path.join(repoRoot, 'tools', 'mpv', 'windows', 'mpv.exe');
    await mkdir(path.dirname(mpvPath), { recursive: true });
    await writeFile(mpvPath, '', 'utf8');

    const config = buildNativePlaybackConfig({ envValues: {}, platform: 'win32', repoRoot });

    assert.equal(config.player, 'mpv');
    assert.equal(config.playerPath, mpvPath);
    assert.equal(config.platform, 'windows');
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test('native playback mock config can be explicitly enabled for tests', () => {
  const context = {
    envValues: {
      NATIVE_PLAYBACK_ENABLED: 'true',
      NATIVE_PLAYBACK_AUTO_START_ON_WORKER: 'true',
      NATIVE_PLAYBACK_PLAYER: 'mock',
      NATIVE_PLAYBACK_PLATFORM: 'windows',
      NATIVE_PLAYBACK_IMAGE_DURATION_SECONDS: '20',
    },
    platform: 'linux',
  };

  const config = buildNativePlaybackConfig(context);

  assert.equal(config.enabled, true);
  assert.equal(config.autoStartOnWorker, true);
  assert.equal(config.player, 'mock');
  assert.equal(config.platform, 'windows');
  assert.equal(config.imageDurationSeconds, 20);
  assert.equal(shouldAutoStartNativePlaybackFromWorker(context), true);
});

test('server exposes native playback routes separately from browser playback routes', () => {
  assert.match(serverSource, /GET \/api\/native-playback\/status/);
  assert.match(serverSource, /POST \/api\/native-playback\/detect/);
  assert.match(serverSource, /POST \/api\/native-playback\/start-current/);
  assert.match(serverSource, /POST \/api\/native-playback\/stop/);
  assert.match(serverSource, /POST \/api\/runtime\/playback\/select-current/);
  assert.match(serverSource, /GET \/api\/runtime\/playback\/current/);
});



test('native playback launches OS player detached so worker CLI does not wait on player lifetime', () => {
  const source = readFileSync('server/nativePlayback/nativePlaybackController.ts', 'utf8');
  assert.match(source, /stdio:\s*'ignore'/);
  assert.match(source, /detached:\s*true/);
  assert.match(source, /activeProcess\.unref\(\)/);
});

test('native playback stop can target persisted owned pid without killing by process name', () => {
  const source = readFileSync('server/nativePlayback/nativePlaybackController.ts', 'utf8');
  assert.match(source, /process\.kill\(saved\.pid\)/);
  assert.doesNotMatch(source, /taskkill.*mpv|pkill.*mpv|killall.*mpv/i);
  assert.match(source, /persisted owned pid/);
});

test('native playback spec records disabled default and process ownership rules', () => {
  assert.match(specSource, /NATIVE_PLAYBACK_ENABLED=false/);
  assert.match(specSource, /Track only the process started by this backend instance/);
  assert.match(specSource, /Do not kill arbitrary `mpv` or `vlc` processes by name/);
  assert.match(specSource, /spawn argument arrays/);
  assert.match(specSource, /tools\/install-mpv-windows\.ps1/);
});
