/**
 * Verifies the live Windows native video playback proof contract.
 * Keeps tests deterministic and avoids launching real OS media players.
 * Checks opt-in gates, current/next video requirements, and proof route shape.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
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
