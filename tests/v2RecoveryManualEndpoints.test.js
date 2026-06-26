import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { createV2RecoveryStateService } from '../server/recovery/v2RecoveryStateService.ts';
import { createEmptyV2RecoveryStateSnapshot } from '../dashboard/services/v2RecoveryStateSchema.ts';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';
import { renderV2StartupOperatorMenuView } from '../dashboard/views/v2StartupOperatorMenuView.ts';

const serverSource = readFileSync('server/index.ts', 'utf8');
const appSource = readFileSync('dashboard/app.ts', 'utf8');
const clientSource = readFileSync('dashboard/services/v2RecoveryStateClient.ts', 'utf8');

test('B11.2 exposes manual recovery save/load routes and frontend client endpoints', () => {
  for (const route of [
    'GET /api/runtime/recovery/state',
    'POST /api/runtime/recovery/state/save',
    'POST /api/runtime/recovery/state/load',
  ]) {
    assert.match(serverSource, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(clientSource, /saveV2RecoveryStateSnapshot/);
  assert.match(clientSource, /loadV2RecoveryStateSnapshot/);
  assert.match(appSource, /data-action="v2-recovery-save-state"|v2-recovery-save-state/);
  assert.match(appSource, /data-action="v2-recovery-load-state"|v2-recovery-load-state/);
});

test('B11.2 save/load service persists a validated same-media snapshot without secrets', async () => {
  const repoRoot = mkdtempSync(path.join(tmpdir(), 'pf-v2-recovery-'));
  const service = createV2RecoveryStateService({ repoRoot });
  const snapshot = createEmptyV2RecoveryStateSnapshot('2026-06-26T15:06:00.000Z', 'manual-save');
  snapshot.playback.currentMediaId = 'media-1';
  snapshot.playback.currentFilename = 'photo.jpg';
  snapshot.playback.mediaKind = 'image';
  snapshot.playback.queueCursorIndex = 0;
  snapshot.playback.queueLength = 1;
  snapshot.queue.source = 'v2-browser-local-bridge';
  snapshot.queue.preparedMediaCount = 1;
  snapshot.notes = ['manual snapshot; no credentials, cookies, or session file contents'];

  const saved = await service.saveSnapshot(snapshot, 'manual-save', 'manual');
  assert.equal(saved.status, 'saved');
  assert.equal(saved.validation.ok, true);
  assert.equal(saved.snapshot?.playback.currentFilename, 'photo.jpg');

  const loaded = await service.loadSnapshot();
  assert.equal(loaded.status, 'loaded');
  assert.equal(loaded.snapshot?.playback.currentMediaId, 'media-1');
  assert.equal(loaded.snapshot?.playback.exactTimestampRequired, false);
  assert.equal(loaded.snapshot?.pipeline.corruptOrPartialDownloadsExcluded, true);
  assert.doesNotMatch(JSON.stringify(loaded), /password=|cookie=|secret=/i);
});

test('B11.2 Recovery page renders real manual action data-action values and result surface', () => {
  const state = createInitialState();
  const markup = renderV2StartupOperatorMenuView('recovery', state.history, 'copy all log', {
    runtimeState: state,
    dashboardVisualMode: 'v2',
    implementationStatusMode: true,
  });
  assert.match(markup, /Recovery manual state controls/);
  assert.match(markup, /data-action="v2-recovery-save-state"/);
  assert.match(markup, /data-action="v2-recovery-load-state"/);
  assert.match(markup, /data-action="v2-recovery-emulate-power-off"/);
  assert.match(markup, /Latest backend result/);
  assert.doesNotMatch(markup, /data-v2-alert-text="SAVE STATE"/);
});
