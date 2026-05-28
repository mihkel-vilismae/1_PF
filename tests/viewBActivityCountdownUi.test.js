/*
 * Verifies the View B/B5 activity test runner UI.
 * The test locks the Start Test/countdown affordance without touching playback.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { renderTestView } from '../dashboard/views/testView.ts';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';

test('View B renders B5 Start Test runner with countdown copy', () => {
  const markup = renderTestView(createInitialState(), 'test');

  assert.match(markup, /data-action="start-b5-activity-test"/);
  assert.match(markup, /Start Test/);
  assert.match(markup, /3 → 2 → 1 countdown/);
  assert.match(markup, /Ready to start/);
});
