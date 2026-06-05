/**
 * Verifies the live Windows native video playback proof contract.
 * Keeps tests deterministic and avoids launching real OS media players.
 * Checks opt-in gates, current/next video requirements, and proof route shape.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildLiveWindowsNativeVideoPlaybackRoutePlan,
  canStartCurrentOrNextVideoItem,
  isLiveWindowsNativeVideoPlaybackProofEnabled,
  runLiveWindowsNativeVideoPlaybackProof,
} from '../tools/live-windows-native-video-playback-proof-lib.mjs';

const metadata = { version: '0.8.10', gitCommit: 'test' };

test('live Windows native video proof is opt-in only', async () => {
  assert.equal(isLiveWindowsNativeVideoPlaybackProofEnabled({}), false);
  assert.equal(isLiveWindowsNativeVideoPlaybackProofEnabled({ PF_LIVE_WINDOWS_NATIVE_VIDEO_PLAYBACK_PROOF: '1' }), true);
  const envelope = await runLiveWindowsNativeVideoPlaybackProof({ metadata, env: {} });
  assert.equal(envelope.proof_status, 'BLOCKED');
  assert.equal(envelope.proof_kind, 'live_windows_native_video_playback');
});

test('live Windows native video route plan uses native start and owned stop boundaries', () => {
  assert.deepEqual(buildLiveWindowsNativeVideoPlaybackRoutePlan(), [
    'POST /api/testing/live-windows-native-video/seed',
    'GET /api/runtime/playback/current?limit=50',
    'POST /api/native-playback/detect',
    'POST /api/native-playback/start-current',
    'GET /api/native-playback/status',
    'POST /api/native-playback/stop',
  ]);
});

test('video proof only allows start-current when current or next item is video', () => {
  assert.equal(canStartCurrentOrNextVideoItem({ playback: { currentItem: { mediaAssetId: 1, mediaType: 'image' }, nextItem: { mediaAssetId: 2, mediaType: 'video' } } }), false);
  assert.equal(canStartCurrentOrNextVideoItem({ playback: { currentItem: null, nextItem: { mediaAssetId: 2, mediaType: 'video' } } }), true);
  assert.equal(canStartCurrentOrNextVideoItem({ playback: { currentItem: { mediaAssetId: 3, mediaType: 'video' }, nextItem: null } }), true);
});


test('video proof seed route is test-mode only and proof scoped in server source', () => {
  const source = fs.readFileSync(new URL('../server/index.ts', import.meta.url), 'utf8');
  assert.match(source, /POST \/api\/testing\/live-windows-native-video\/seed/);
  assert.match(source, /proof_video_seed_requires_test_mode/);
  assert.match(source, /seed_live_windows_native_video_fixture/);
  assert.doesNotMatch(source, /'POST \/api\/runtime\/playback\/seed-video'/);
});

test('blocked video proof can carry seed route evidence for diagnosis', () => {
  const source = fs.readFileSync(new URL('../tools/live-windows-native-video-playback-proof-lib.mjs', import.meta.url), 'utf8');
  assert.match(source, /stage_results: stageResults/);
  assert.match(source, /stageResults: \[seedResult, currentResult\]/);
});
