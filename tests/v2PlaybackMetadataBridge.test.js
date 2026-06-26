import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { buildV2PlaybackDropQueueBridgeRequest } from '../dashboard/services/v2PlaybackDropQueueBridge.ts';
import { buildBrowserLocalV2PlaybackMetadata, buildV2PlaybackMetadataBridge } from '../dashboard/services/v2PlaybackMetadataBridge.ts';
import { renderV2StartupOperatorMenuView } from '../dashboard/views/v2StartupOperatorMenuView.ts';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';

test('B8.4 marks browser-local dropped rows as missing GPS/address without fake address text', () => {
  const metadata = buildBrowserLocalV2PlaybackMetadata();
  assert.equal(metadata.gpsStatus, 'missing');
  assert.equal(metadata.addressStatus, 'missing');
  assert.equal(metadata.metadataSource, 'browser-local-file');
  assert.match(metadata.gpsCoordinates, /GPS missing/);
  assert.match(metadata.address, /Address missing/);
  assert.match(metadata.address, /no fake address/i);
  assert.match(metadata.metadataMessage, /No missing address is fabricated/);
});

test('B8.4 allows explicit pipeline metadata to mark GPS/address present', () => {
  const metadata = buildV2PlaybackMetadataBridge({
    source: 'pipeline-metadata',
    gpsCoordinates: '59.4370, 24.7536',
    address: 'Tallinn, Estonia',
  });
  assert.equal(metadata.gpsStatus, 'present');
  assert.equal(metadata.addressStatus, 'present');
  assert.equal(metadata.gpsCoordinates, '59.4370, 24.7536');
  assert.equal(metadata.address, 'Tallinn, Estonia');
  assert.match(metadata.metadataMessage, /GPS present; address present/);
});

test('B8.4 V2 playback queue renders metadata presence columns and missing labels', () => {
  const state = createInitialState();
  const markup = renderV2StartupOperatorMenuView('playback', state.history, 'copy all log', {
    runtimeState: state,
    dashboardVisualMode: 'v2',
    implementationStatusMode: true,
    v2PlaybackQueueItems: [
      {
        id: 'photo-1',
        filename: 'photo.jpg',
        mediaKind: 'image',
        durationLabel: 'not applicable for image',
        gpsCoordinates: 'GPS missing — no browser EXIF extraction',
        gpsStatus: 'missing',
        address: 'Address missing — no fake address',
        addressStatus: 'missing',
        metadataSource: 'browser-local-file',
        metadataMessage: 'GPS missing; address missing; source: browser-local drop queue. No missing address is fabricated.',
      },
    ],
  });

  assert.match(markup, />GPS status</);
  assert.match(markup, />address status</);
  assert.match(markup, />metadata source</);
  assert.match(markup, /data-v2-playback-gps-status="missing"/);
  assert.match(markup, /data-v2-playback-address-status="missing"/);
  assert.match(markup, /Address missing — no fake address/);
});

test('B8.4 backend queue bridge payload carries metadata states without fabricating address', () => {
  const request = buildV2PlaybackDropQueueBridgeRequest({
    id: 'photo-1',
    filename: 'photo.jpg',
    mediaKind: 'image',
    durationLabel: 'not applicable for image',
    gpsCoordinates: 'GPS missing — no browser EXIF extraction',
    gpsStatus: 'missing',
    address: 'Address missing — no fake address',
    addressStatus: 'missing',
    metadataSource: 'browser-local-file',
    metadataMessage: 'GPS missing; address missing; source: browser-local drop queue. No missing address is fabricated.',
  });

  assert.equal(request.ok, true);
  assert.equal(request.body.selected.gpsStatus, 'missing');
  assert.equal(request.body.selected.addressStatus, 'missing');
  assert.equal(request.body.selected.metadataSource, 'browser-local-file');
  assert.equal(request.body.selected.address, 'Address missing — no fake address');
});

test('B8.4 contract document records no fake address and metadata presence rules', () => {
  const doc = readFileSync('docs/20_architecture_and_specs/openspec/V2_PlaybackDropQueueBridgeContract.md', 'utf8');
  for (const expected of [
    'Metadata presence flags',
    'GPS missing — no browser EXIF extraction',
    'Address missing — no fake address',
    'must never reverse-geocode or invent address text',
  ]) {
    assert.match(doc, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
});
