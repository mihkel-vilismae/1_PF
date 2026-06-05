/**
 * Verifies the live Windows native video proof keeps seeding in Test Mode.
 * The seed route is intentionally guarded, so the launcher must not use Real Mode.
 * These tests are static and never launch mpv or a Windows process.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const VIDEO_PS1 = 'start_scripts/run_live_windows_native_video_playback_proof.ps1';
const VIDEO_LIB = 'tools/live-windows-native-video-playback-proof-lib.mjs';

/** Reads a repo source file as UTF-8 text for source-contract assertions. */
function readSource(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('live Windows native video launcher sends Test Mode to the guarded seed route', () => {
  const source = readSource(VIDEO_PS1);
  assert.match(source, /PF_LIVE_WINDOWS_NATIVE_PLAYBACK_RUNTIME_MODE\s*=\s*"test"/);
  assert.doesNotMatch(source, /PF_LIVE_WINDOWS_NATIVE_PLAYBACK_RUNTIME_MODE\s*=\s*"real"/);
});

test('live Windows native video proof still uses canonical runtime-mode request helper', () => {
  const source = readSource(VIDEO_LIB);
  assert.match(source, /proof_video_seed/);
  assert.match(source, /requestJson\(baseUrl, \{ key: 'proof_video_seed'/);
});
