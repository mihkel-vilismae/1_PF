import assert from 'node:assert/strict';
import test from 'node:test';

import { evaluateV2VictoryProofGate } from '../dashboard/services/v2VictoryProofGate.ts';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';
import { renderV2StartupOperatorMenuView } from '../dashboard/views/v2StartupOperatorMenuView.ts';

test('B12 victory proof gate blocks customer-ready claims without live playback and recovery evidence', () => {
  const state = createInitialState();
  for (const key of ['3A', 'B3.1', 'B3.2', 'B3.3', 'B3.4', 'B3.5']) {
    state.statusByKey[key] = 'success';
  }
  state.v2Recovery = { latestAutosave: { snapshot: { playback: { currentFilename: 'photo.jpg' } } } };
  const gate = evaluateV2VictoryProofGate(state, [{ mediaKind: 'image', backendQueueStatus: 'requested', addressStatus: 'missing' }]);
  assert.equal(gate.status, 'ready-for-live-proof');
  assert.match(gate.summary, /live autonomous playback and recovery proof artifacts are still required/i);
  assert.equal(gate.requirements.find((item) => item.id === 'live-autonomous-playback-proof')?.passed, false);
  assert.equal(gate.requirements.find((item) => item.id === 'live-autonomous-recovery-proof')?.passed, false);
});

test('B12 victory proof gate passes only with explicit live playback and recovery evidence', () => {
  const state = createInitialState();
  for (const key of ['3A', 'B3.1', 'B3.2', 'B3.3', 'B3.4', 'B3.5']) {
    state.statusByKey[key] = 'success';
  }
  state.v2Recovery = { latestLoad: { snapshot: { playback: { currentFilename: 'clip.mp4' } } } };
  const gate = evaluateV2VictoryProofGate(
    state,
    [{ mediaKind: 'video', backendQueueStatus: 'prepared', addressStatus: 'present' }],
    { autonomousPlaybackLiveProofPassed: true, autonomousRecoveryLiveProofPassed: true, targetMachine: 'Raspberry Pi' },
  );
  assert.equal(gate.status, 'passed');
  assert.match(gate.summary, /Raspberry Pi/);
});

test('B12 victory proof gate is visible on 09 REAL PLAYBACK projection', () => {
  const state = createInitialState();
  const markup = renderV2StartupOperatorMenuView('real-playback', state.history, 'copy all log', {
    runtimeState: state,
    dashboardVisualMode: 'v2',
    implementationStatusMode: true,
    v2PlaybackQueueItems: [],
  });
  assert.match(markup, /7\. B12 victory proof gate/);
  assert.match(markup, /B12 victory proof is blocked/);
});
