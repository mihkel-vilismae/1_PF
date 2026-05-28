/*
 * Verifies the View B/B5 activity detection model defaults and guards.
 * These tests keep the model honest before UI and browser event wiring are added.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  B5_ACTIVITY_SOURCES,
  createDefaultB5ActivityDetectionState,
  getB5ActivitySourceLabel,
  isB5ActivitySource,
  normalizeB5ActivityDetectionState,
} from '../dashboard/services/viewBActivityDetection.ts';

test('B5 activity detection defaults select all sources without claiming PIR availability', () => {
  const state = createDefaultB5ActivityDetectionState();

  assert.deepEqual([...B5_ACTIVITY_SOURCES], ['pir', 'mouse', 'keyboard']);
  assert.equal(state.selectedSources.pir, true);
  assert.equal(state.selectedSources.mouse, true);
  assert.equal(state.selectedSources.keyboard, true);
  assert.equal(state.pirAvailability, 'backend_dependent');
  assert.equal(state.phase, 'idle');
  assert.equal(state.results.pir.status, 'pending');
});

test('B5 activity detection source guard accepts only supported sources', () => {
  assert.equal(isB5ActivitySource('pir'), true);
  assert.equal(isB5ActivitySource('mouse'), true);
  assert.equal(isB5ActivitySource('keyboard'), true);
  assert.equal(isB5ActivitySource('fullscreen'), false);
});

test('B5 activity detection normalization fills missing nested defaults', () => {
  const state = normalizeB5ActivityDetectionState({
    selectedSources: { mouse: false },
    results: { mouse: { status: 'skipped', message: 'Skipped.' } },
  });

  assert.equal(state.selectedSources.pir, true);
  assert.equal(state.selectedSources.mouse, false);
  assert.equal(state.results.pir.status, 'pending');
  assert.equal(state.results.mouse.status, 'skipped');
  assert.equal(getB5ActivitySourceLabel('keyboard'), 'Keyboard activity');
});
