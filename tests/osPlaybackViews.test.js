/*
 * Guards the additive Windows/Raspberry playback view shell slice.
 * The tests verify the new views render required playback sections without
 * modifying existing A-E navigation or backend runtime action behavior.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

import { VIEW_ORDER } from '../dashboard/shared/constants.ts';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';
import { OS_PLAYBACK_PLATFORMS } from '../dashboard/services/osPlaybackViewModel.ts';
import { renderOsPlaybackView } from '../dashboard/views/osPlaybackView.ts';

const appSource = readFileSync('dashboard/app.ts', 'utf8');
const docsSource = readFileSync('docs/OS_PLAYBACK_VIEWS_SLICE_1.md', 'utf8');

test('navigation adds Windows and Raspberry playback after existing A-E views', () => {
  const ids = VIEW_ORDER.map((view) => view.id);

  assert.deepEqual(ids.slice(0, 5), ['A', 'B', 'C', 'D', 'E']);
  assert.deepEqual(ids.slice(5), ['WIN', 'RPI']);
});

test('Windows playback view renders required playback shell sections', () => {
  const markup = renderOsPlaybackView(createInitialState(), OS_PLAYBACK_PLATFORMS.windows);

  assert.match(markup, /Windows Playback View/);
  assert.match(markup, /data-os-playback-stage="windows"/);
  assert.match(markup, /Switch to Full Screen/);
  assert.match(markup, /Download/);
  assert.match(markup, /Index/);
  assert.match(markup, /GPS parser/);
  assert.match(markup, /Geocode/);
  assert.match(markup, /Queue/);
  assert.match(markup, /Regular state worker/);
  assert.match(markup, /Playback worker/);
  assert.match(markup, /On-off worker/);
  assert.match(markup, /Windows CronEmulator activity/);
  assert.match(markup, /Error-only log/);
  assert.match(markup, /Main runtime log/);
  assert.match(markup, /Native fullscreen playback/);
  assert.match(markup, /Start native fullscreen/);
  assert.match(markup, /Stop native playback/);
  assert.match(markup, /Native playback log/);
});

test('Raspberry playback view renders required deployment shell sections', () => {
  const markup = renderOsPlaybackView(createInitialState(), OS_PLAYBACK_PLATFORMS.raspberry);

  assert.match(markup, /Raspberry OS Playback View/);
  assert.match(markup, /data-os-playback-stage="raspberry"/);
  assert.match(markup, /Raspberry OS crontab activity/);
  assert.match(markup, /Resolved address/);
  assert.match(markup, /copy all/);
  assert.match(markup, /clear/);
  assert.match(markup, /expand row/);
});

test('playback view renders backend contract media without local filesystem paths', () => {
  const state = createInitialState();
  state.osPlayback = {
    windows: {
      status: 'ready',
      contract: {
        messages: ['Current playback item is contract-image.jpg.'],
        playback: {
          currentItem: {
            mediaAssetId: 7,
            displayName: 'contract-image.jpg',
            mediaType: 'image',
            queueStatus: 'READY',
            resolvedAddress: 'Contract Address 7, Tallinn, Estonia',
            displayUrl: '/api/runtime/playback/media?assetId=7',
          },
          queue: { totalCount: 2, readyCount: 1, failedCount: 1, returnedCount: 2 },
        },
      },
    },
  };

  const markup = renderOsPlaybackView(state, OS_PLAYBACK_PLATFORMS.windows);

  assert.match(markup, /contract-image\.jpg/);
  assert.match(markup, /Contract Address 7, Tallinn, Estonia/);
  assert.match(markup, /Queue rows: 2 total • 1 READY • 1 FAILED/);
  assert.match(markup, /src="\/api\/runtime\/playback\/media\?assetId=7"/);
  assert.doesNotMatch(markup, /runtime_data\/downloads|test_runtime_data\/downloads|canonicalPath/);
});

test('app shell wires new playback views without removing existing render calls', () => {
  assert.match(appSource, /WIN: renderOsPlaybackView\(state, OS_PLAYBACK_PLATFORMS\.windows\)/);
  assert.match(appSource, /RPI: renderOsPlaybackView\(state, OS_PLAYBACK_PLATFORMS\.raspberry\)/);
  assert.match(appSource, /api\/runtime\/playback\/current\?limit=25/);
  assert.match(appSource, /data-os-playback-refresh-platform/);
  assert.match(appSource, /api\/native-playback\/status/);
  assert.match(appSource, /api\/native-playback\/start-current/);
  assert.match(appSource, /data-native-playback-start-platform/);
  assert.match(appSource, /renderInitView\(state\)/);
  assert.match(appSource, /renderTestView\(state, dashboardVisualMode\)/);
  assert.match(appSource, /renderLastRunView\(state\)/);
  assert.match(appSource, /renderRunningProcessView\(state\)/);
  assert.match(appSource, /renderDatabaseViewerView\(state\)/);
});

test('slice documentation records preserved behavior and limitations', () => {
  assert.match(docsSource, /Existing Views A, B, C, D, and E remain present/);
  assert.match(docsSource, /Playback rotation is not implemented in this slice/);
  assert.match(docsSource, /Real queue media serving is not implemented in this slice/);
  assert.match(docsSource, /Log terminals expose required controls visually/);
});
