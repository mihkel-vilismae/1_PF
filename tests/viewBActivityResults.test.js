/*
 * Verifies View B/B5 activity result states and honest PIR availability handling.
 * The test keeps PIR unavailable unless a verified backend source is added later.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { renderTestView } from '../dashboard/views/testView.ts';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';
import {
  completeB5ActivityResults,
  normalizeB5ActivityDetectionState,
  prepareB5ActivityResults,
} from '../dashboard/services/viewBActivityDetection.ts';

test('B5 activity results render per source in View B', () => {
  const state = createInitialState();
  state.simulation.b5ActivityDetection.results.mouse = {
    status: 'detected',
    message: 'Activity detected during the test window.',
  };

  const markup = renderTestView(state, 'test');

  assert.match(markup, /Activity detection results/);
  assert.match(markup, /data-b5-activity-result="pir"/);
  assert.match(markup, /data-b5-activity-result="mouse"/);
  assert.match(markup, /detected/);
});

test('B5 activity completion keeps PIR unavailable when no verified source exists', () => {
  const state = normalizeB5ActivityDetectionState({});
  const prepared = prepareB5ActivityResults(state);
  const completed = completeB5ActivityResults({ ...state, results: prepared }, {
    detectedSources: { mouse: true, keyboard: false },
    pirAvailable: false,
  });

  assert.equal(completed.pir.status, 'unavailable');
  assert.equal(completed.mouse.status, 'detected');
  assert.equal(completed.keyboard.status, 'not_detected');
});
