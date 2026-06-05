/*
 * Tests the opt-in live Windows native playback proof helpers.
 * The tests do not launch mpv/vlc or require a Windows display.
 * They verify gating, route planning, media parity checks, and BLOCKED evidence.
 * Live OS playback remains an explicit operator-run proof outside normal tests.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  buildBlockedLiveWindowsNativePlaybackProof,
  buildLiveWindowsNativePlaybackRoutePlan,
  buildLiveWindowsWorkerAutostartRoutePlan,
  compareNativeAndBrowserItems,
  extractWorkerSelectedItem,
  isLiveWindowsNativePlaybackProofEnabled,
  parseExpectedMediaTypes,
  parseWorkerStdoutJson,
  selectBrowserPlaybackItem,
  selectWorkerAutostartComparisonItem,
  shouldRunPlaybackWorkerAutoStart,
  summarizeMediaTypeCoverage,
} from '../tools/live-windows-native-playback-proof-lib.mjs';

test('live Windows native playback proof is opt-in only', () => {
  assert.equal(isLiveWindowsNativePlaybackProofEnabled({}), false);
  assert.equal(isLiveWindowsNativePlaybackProofEnabled({ PF_LIVE_WINDOWS_NATIVE_PLAYBACK_PROOF: 'true' }), true);
  assert.equal(isLiveWindowsNativePlaybackProofEnabled({ PF_LIVE_WINDOWS_NATIVE_PLAYBACK_PROOF: '1' }), true);
  assert.equal(shouldRunPlaybackWorkerAutoStart({}), false);
  assert.equal(shouldRunPlaybackWorkerAutoStart({ PF_LIVE_WINDOWS_NATIVE_PLAYBACK_WORKER_AUTOSTART: '1' }), true);
});

test('live Windows native playback route plan checks browser/native parity and owned stop', () => {
  const routes = buildLiveWindowsNativePlaybackRoutePlan();
  assert.deepEqual(routes.map((route) => route.key), [
    'browser_playback_contract',
    'native_status_before',
    'native_detect',
    'native_start_current',
    'native_status_after_start',
    'native_stop_owned',
  ]);
  assert.ok(routes.some((route) => route.path === '/api/runtime/playback/current?limit=50'));
  assert.ok(routes.some((route) => route.path === '/api/native-playback/start-current'));
  assert.ok(routes.some((route) => route.path === '/api/native-playback/stop'));
});

test('live proof extracts selected browser playback item and media type coverage', () => {
  const payload = {
    playback: {
      currentItem: {
        mediaAssetId: 7,
        displayName: 'image.jpg',
        mediaType: 'image',
        displayUrl: '/api/runtime/playback/media/7',
        resolvedAddress: 'Tallinn',
        isCurrent: true,
      },
      nextItem: null,
      items: [
        { mediaAssetId: 7, mediaType: 'image' },
        { mediaAssetId: 8, mediaType: 'video' },
      ],
    },
  };

  assert.deepEqual(selectBrowserPlaybackItem(payload), {
    mediaAssetId: '7',
    displayName: 'image.jpg',
    mediaType: 'image',
    displayUrl: '/api/runtime/playback/media/7',
    resolvedAddress: 'Tallinn',
    isCurrent: true,
  });
  assert.deepEqual(summarizeMediaTypeCoverage(payload), {
    expected: ['image', 'video'],
    present: ['image', 'video'],
    missing: [],
    hasAllExpected: true,
  });
});

test('live proof compares native running status to the browser-selected item', () => {
  const comparison = compareNativeAndBrowserItems(
    { mediaAssetId: '7' },
    { nativePlayback: { status: 'running', currentMediaAssetId: '7', currentMediaType: 'image', pid: 1234, lastCommandSummary: 'mpv --fs image.jpg' } },
  );

  assert.equal(comparison.sameMediaAsset, true);
  assert.equal(comparison.nativeStatus, 'running');
  assert.equal(comparison.nativePidPresent, true);
  assert.equal(comparison.commandSummaryPresent, true);
});


test('worker-autostart route plan does not call direct start-current after playback_worker', () => {
  const routes = buildLiveWindowsWorkerAutostartRoutePlan();
  assert.deepEqual(routes.map((route) => route.key), [
    'browser_playback_contract',
    'native_status_before',
    'native_detect',
    'native_status_after_worker_autostart',
    'native_stop_owned',
  ]);
  assert.ok(routes.some((route) => route.path === '/api/native-playback/status'));
  assert.ok(routes.some((route) => route.path === '/api/native-playback/stop'));
  assert.ok(!routes.some((route) => route.path === '/api/native-playback/start-current'));
});

test('worker-autostart proof extracts worker-selected item and uses it for comparison', () => {
  const workerResult = {
    stdout: JSON.stringify({
      selectedItemSummary: {
        mediaAssetId: 124,
        addressText: 'Lat: 59.43700, Lon: 24.75360',
        selectedAt: '2026-06-02T20:59:00.000Z',
      },
    }),
  };
  const workerItem = extractWorkerSelectedItem(workerResult);
  assert.deepEqual(workerItem, {
    mediaAssetId: '124',
    displayName: null,
    mediaType: null,
    addressText: 'Lat: 59.43700, Lon: 24.75360',
    selectedAt: '2026-06-02T20:59:00.000Z',
  });

  const comparisonTarget = selectWorkerAutostartComparisonItem({ mediaAssetId: '123' }, workerItem);
  const comparison = compareNativeAndBrowserItems(
    comparisonTarget,
    { nativePlayback: { status: 'running', currentMediaAssetId: '124', currentMediaType: 'image', pid: 4321, lastCommandSummary: 'mpv --fs same_gps_01.jpg' } },
  );
  assert.equal(comparison.sameMediaAsset, true);
  assert.equal(comparison.browserMediaAssetId, '124');
  assert.equal(comparison.nativeMediaAssetId, '124');
});



test('worker stdout parser extracts JSON surrounded by launcher noise', () => {
  const parsed = parseWorkerStdoutJson('log before\n{"selectedItemSummary":{"mediaAssetId":127,"displayName":"same_gps_04.jpg"}}\nlog after');
  assert.equal(parsed.selectedItemSummary.mediaAssetId, 127);
  assert.equal(parsed.selectedItemSummary.displayName, 'same_gps_04.jpg');

  const workerItem = extractWorkerSelectedItem({ stdout: 'prefix\n{"selectedItemSummary":{"mediaAssetId":127,"displayName":"same_gps_04.jpg"}}\nsuffix' });
  assert.deepEqual(workerItem, {
    mediaAssetId: '127',
    displayName: 'same_gps_04.jpg',
    mediaType: null,
    addressText: null,
    selectedAt: null,
  });
});



test('worker stdout parser tolerates unquoted sanitizer placeholders in worker JSON', () => {
  const stdout = `prefix log
{
  "worker": "playback_worker",
  "selectedItemSummary": {
    "mediaAssetId": 128,
    "displayName": "gps_valid_01.jpg",
    "addressText": "Lat: 58.37760, Lon: 26.72900",
    "selectedAt": "2026-06-03T11:26:04.000Z"
  },
  "database": {
    "sizeBytes": [REDACTED]
  }
}
suffix log`;
  const parsed = parseWorkerStdoutJson(stdout);
  assert.equal(parsed.selectedItemSummary.mediaAssetId, 128);
  assert.equal(parsed.database.sizeBytes, '[REDACTED]');

  const workerItem = extractWorkerSelectedItem({ stdout });
  assert.deepEqual(workerItem, {
    mediaAssetId: '128',
    displayName: 'gps_valid_01.jpg',
    mediaType: null,
    addressText: 'Lat: 58.37760, Lon: 26.72900',
    selectedAt: '2026-06-03T11:26:04.000Z',
  });
});

test('blocked live proof records operator instructions without launching OS player', () => {
  const envelope = buildBlockedLiveWindowsNativePlaybackProof({
    metadata: { version: '0.8.1', gitCommit: 'test' },
    baseUrl: 'http://127.0.0.1:8787',
    reason: 'test block',
    expectedMediaTypes: parseExpectedMediaTypes('image,video'),
  });

  assert.equal(envelope.proof_status, 'BLOCKED');
  assert.equal(envelope.evidence.enable_flag, 'PF_LIVE_WINDOWS_NATIVE_PLAYBACK_PROOF');
  assert.match(envelope.evidence.planned_routes.join('\n'), /native-playback\/start-current/);
  assert.match(envelope.known_limitations.join('\n'), /No real native player was launched/);
});


test('live proof request helper sends the dashboard runtime mode header', () => {
  const source = readFileSync('tools/live-windows-native-playback-proof-lib.mjs', 'utf8');
  assert.match(source, /x-dashboard-runtime-mode/);
  assert.match(source, /x-pf-runtime-mode/);
});
