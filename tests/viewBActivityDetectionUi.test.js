/*
 * Verifies the View B/B5 activity detection source-selection UI.
 * The test keeps the new controls separate from legacy screen simulation toggles.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { renderTestView } from '../dashboard/views/testView.ts';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';

test('View B renders separate B5 activity detection source checkboxes', () => {
  const markup = renderTestView(createInitialState(), 'test');

  assert.match(markup, /B5 activity detection test sources/);
  assert.match(markup, /name="b5ActivitySource" value="pir" checked/);
  assert.match(markup, /name="b5ActivitySource" value="mouse" checked/);
  assert.match(markup, /name="b5ActivitySource" value="keyboard" checked/);
  assert.match(markup, /do not claim real PIR hardware support/);
});
