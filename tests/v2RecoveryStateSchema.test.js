import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  V2_RECOVERY_STATE_SCHEMA_VERSION,
  createEmptyV2RecoveryStateSnapshot,
  validateV2RecoveryStateSnapshot,
} from '../dashboard/services/v2RecoveryStateSchema.ts';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';
import { renderV2StartupOperatorMenuView } from '../dashboard/views/v2StartupOperatorMenuView.ts';

test('B11.1 defines a lightweight recovery state snapshot with same-media context and no exact timestamp requirement', () => {
  const snapshot = createEmptyV2RecoveryStateSnapshot('2026-06-26T14:55:00.000Z', 'manual-save');
  assert.equal(snapshot.schemaVersion, V2_RECOVERY_STATE_SCHEMA_VERSION);
  assert.equal(snapshot.playback.exactTimestampRequired, false);
  assert.equal(snapshot.playback.currentMediaId, null);
  assert.equal(snapshot.queue.source, 'unknown');
  assert.equal(snapshot.pipeline.corruptOrPartialDownloadsExcluded, true);
  assert.deepEqual(validateV2RecoveryStateSnapshot(snapshot), { ok: true, errors: [] });
});

test('B11.1 validation rejects fake-compatible snapshots that require exact timestamp or allow corrupt downloads', () => {
  const snapshot = createEmptyV2RecoveryStateSnapshot('2026-06-26T14:55:00.000Z');
  const invalid = {
    ...snapshot,
    playback: { ...snapshot.playback, exactTimestampRequired: true },
    pipeline: { ...snapshot.pipeline, corruptOrPartialDownloadsExcluded: false },
  };
  const result = validateV2RecoveryStateSnapshot(invalid);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /exactTimestampRequired must be false/);
  assert.match(result.errors.join('\n'), /corruptOrPartialDownloadsExcluded must be true/);
});

test('B11.1 renders the recovery schema card without activating save/load endpoints', () => {
  const state = createInitialState();
  const markup = renderV2StartupOperatorMenuView('recovery', state.history, 'copy all log', {
    runtimeState: state,
    dashboardVisualMode: 'v2',
    implementationStatusMode: true,
  });

  assert.match(markup, /Lightweight recovery state schema/);
  assert.match(markup, /same media\/queue context/);
  assert.match(markup, /manual save\/load endpoints arrive in B11\.2/);
  assert.match(markup, /data-v2-status-id="v2.block.06.recovery-state-schema"/);
  assert.match(markup, /data-v2-alert-text="SAVE STATE"/);
  assert.doesNotMatch(markup, /data-action="v2-recovery-save-state"/);
  assert.doesNotMatch(markup, /data-action="v2-recovery-load-state"/);
});

test('B11.1 documents the recovery schema and future implementation gates', () => {
  const doc = readFileSync('docs/20_architecture_and_specs/openspec/V2_RecoveryStateSchema.md', 'utf8');
  for (const expected of [
    'schema-only',
    'same media/queue context',
    'Exact video timestamp resume is not required',
    'No real save endpoint',
    'No real load endpoint',
    'corrupt/incomplete downloads must not enter recovery or playback queue context',
  ]) {
    assert.match(doc, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
});
