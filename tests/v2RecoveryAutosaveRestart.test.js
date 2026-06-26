import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { createV2RecoveryStateService } from '../server/recovery/v2RecoveryStateService.ts';
import { createEmptyV2RecoveryStateSnapshot } from '../dashboard/services/v2RecoveryStateSchema.ts';
import { buildV2RealPlaybackProjection } from '../dashboard/services/v2RealPlaybackProjection.ts';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';

const serverSource = readFileSync('server/index.ts', 'utf8');
const appSource = readFileSync('dashboard/app.ts', 'utf8');
const clientSource = readFileSync('dashboard/services/v2RecoveryStateClient.ts', 'utf8');

test('B11.3 exposes autosave and restart-check endpoints and V2 wiring', () => {
  assert.match(serverSource, /POST \/api\/runtime\/recovery\/autosave/);
  assert.match(serverSource, /POST \/api\/runtime\/recovery\/restart-check/);
  assert.match(clientSource, /autosaveV2RecoveryStateSnapshot/);
  assert.match(clientSource, /checkV2RecoveryRestartState/);
  assert.match(appSource, /queueV2RecoveryAutosave\('autosave-stage-change'\)/);
  assert.match(appSource, /queueV2RecoveryAutosave\('pre-shutdown'\)/);
  assert.match(appSource, /queueV2RecoveryRestartCheck/);
});

test('B11.3 service detects a restart when a previous boot and snapshot exist', async () => {
  const repoRoot = mkdtempSync(path.join(tmpdir(), 'pf-v2-restart-'));
  const bootA = createV2RecoveryStateService({
    repoRoot,
    bootId: 'boot-a',
    bootStartedAtIso: '2026-06-26T16:00:00.000Z',
  });
  const snapshot = createEmptyV2RecoveryStateSnapshot('2026-06-26T16:01:00.000Z', 'autosave-stage-change');
  snapshot.playback.currentMediaId = 'media-2';
  snapshot.playback.currentFilename = 'clip.mp4';
  snapshot.playback.mediaKind = 'video';
  snapshot.queue.source = 'v2-browser-local-bridge';
  snapshot.queue.preparedMediaCount = 1;
  await bootA.saveSnapshot(snapshot, 'autosave-stage-change', 'autosave');
  const firstCheck = await bootA.checkRestart();
  assert.equal(firstCheck.possibleRestartDetected, false);

  const bootB = createV2RecoveryStateService({
    repoRoot,
    bootId: 'boot-b',
    bootStartedAtIso: '2026-06-26T16:05:00.000Z',
  });
  const secondCheck = await bootB.checkRestart();
  assert.equal(secondCheck.possibleRestartDetected, true);
  assert.equal(secondCheck.recoveryInProcess, true);
  assert.equal(secondCheck.snapshot?.playback.currentFilename, 'clip.mp4');
  assert.equal(secondCheck.validation.ok, true);
});

test('B11.3 real playback projection recognizes autosave/restart state without claiming victory proof', () => {
  const state = createInitialState();
  state.v2Recovery = { latestAutosave: { status: 'autosaved' }, restartCheck: { possibleRestartDetected: false } };
  const projection = buildV2RealPlaybackProjection(state, []);
  const recovery = projection.rows.find((row) => row.id === 'recovery');
  assert.equal(recovery?.status, 'autosave/restart watch active');
  assert.match(recovery?.message ?? '', /live power-loss proof remains B12/i);
});
