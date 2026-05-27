/*
 * Guards View B Test Mode / Real Mode card separation.
 * The tests ensure mock B2 and real B2 download controls do not appear together
 * once the operator has selected a dashboard mode.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { renderTestView } from '../dashboard/views/testView.ts';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';

test('View B Test Mode renders mock B2 and hides real B2 download controls', () => {
  const markup = renderTestView(createInitialState(), 'test');

  assert.match(markup, /B2<\/p><h3>Download test action/);
  assert.match(markup, /data-action="run-b2"/);
  assert.doesNotMatch(markup, /B2-REAL_DOWNLOAD/);
  assert.doesNotMatch(markup, /data-action="run-b2-real-download"/);
});

test('View B Real Mode renders real B2 download controls and hides mock B2', () => {
  const markup = renderTestView(createInitialState(), 'real');

  assert.match(markup, /B2-REAL_DOWNLOAD/);
  assert.match(markup, /data-action="run-b2-real-download"/);
  assert.doesNotMatch(markup, /B2<\/p><h3>Download test action/);
  assert.doesNotMatch(markup, /data-action="run-b2"/);
});
