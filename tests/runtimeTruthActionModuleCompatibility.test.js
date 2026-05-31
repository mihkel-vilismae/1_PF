import assert from 'node:assert/strict';
import test from 'node:test';

import { createRuntimeTruthDemoActions } from '../dashboard/services/runtimeTruth/runtimeTruthDemoActions.ts';
import { createRuntimeTruthNewAuthActions } from '../dashboard/services/runtimeTruth/runtimeTruthNewAuthActions.ts';
import { NEW_AUTH_BUTTON_DEFAULTS } from '../dashboard/services/runtimeTruth/newAuthActions/runtimeTruthNewAuthConstants.ts';
import {
  extractFileName,
  inferMediaTypeFromPath,
  mapOrchestrationToLastRunData,
} from '../dashboard/services/runtimeTruth/demoActions/runtimeTruthDemoMedia.ts';

// Verifies the compatibility aggregators still expose the existing runtime-truth factories.
test('runtime truth action factory exports remain compatible', () => {
  assert.equal(typeof createRuntimeTruthDemoActions, 'function');
  assert.equal(typeof createRuntimeTruthNewAuthActions, 'function');
});

// Verifies the NEW AUTH button keys survived the module split unchanged.
test('new auth action button keys remain unchanged after split', () => {
  assert.deepEqual(Object.keys(NEW_AUTH_BUTTON_DEFAULTS), [
    'new-auth-verify-icloudpd',
    'new-auth-verify-provider-session',
    'new-auth-login-using-env',
    'new-auth-check-login',
    'new-auth-logout-session',
    'new-auth-session-files',
    'new-auth-generate-artifact-pack',
    'new-auth-list-artifact-packs',
  ]);
});

// Verifies demo media projection helpers preserve existing filename and media behavior.
test('runtime demo media projection helpers preserve output shape', () => {
  assert.equal(extractFileName('C:\\frame\\media\\clip.mp4'), 'clip.mp4');
  assert.equal(inferMediaTypeFromPath('/frame/media/clip.mp4'), 'Video');
  assert.equal(inferMediaTypeFromPath('/frame/media/photo.jpg'), 'Image');
  assert.deepEqual(mapOrchestrationToLastRunData({
    status: 'SUCCEEDED',
    finished_at: '2026-05-10T15:00:00Z',
    selected_asset_summary: {
      canonical_path: '/frame/media/photo.jpg',
      address_text: 'Tallinn',
    },
    current_stage: 'playback_select_current',
    last_successful_stage: 'playback_select_current',
    stage_order_executed: ['download', 'index', 'playback_select_current'],
  }), {
    media: {
      file: 'photo.jpg',
      type: 'Image',
      queuePosition: 'Backend orchestration summary',
      checkpoint: '2026-05-10T15:00:00Z',
    },
    playback: {
      status: 'SUCCEEDED',
      lastCheckpoint: '2026-05-10T15:00:00Z',
      resumeMarker: '/frame/media/photo.jpg',
      crashState: 'No failure recorded',
    },
    stage: {
      active: 'playback_select_current',
      lastCompleted: 'playback_select_current',
      previousStage: 'download -> index -> playback_select_current',
      stageError: 'None',
    },
    screen: {
      state: 'Unknown',
      lastActivitySource: 'Not included in orchestration last-run payload',
      timeout: 'Not included',
      transition: 'Tallinn',
    },
  });
});
