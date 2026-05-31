/*
 * Guards the View C Test Mode-only TESTING panel.
 * The tests ensure destructive dirty-shutdown controls never render in Real Mode.
 * They also verify the intended Test Mode button labels stay stable.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { renderLastRunView } from '../dashboard/views/lastRunView.ts';
import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';

test('View C Test Mode renders the TESTING panel and dirty-shutdown controls', () => {
  const markup = renderLastRunView(createInitialState(), 'test');

  assert.match(markup, /<h3>TESTING<\/h3>/);
  assert.match(markup, /data-action="plan-dirty-shutdown-test"/);
  assert.match(markup, /data-action="simulate-dirty-shutdown"/);
  assert.match(markup, /Test Mode only/);
});

test('View C Real Mode hides the TESTING panel from the DOM', () => {
  const markup = renderLastRunView(createInitialState(), 'real');

  assert.doesNotMatch(markup, /<h3>TESTING<\/h3>/);
  assert.doesNotMatch(markup, /data-action="plan-dirty-shutdown-test"/);
  assert.doesNotMatch(markup, /data-action="simulate-dirty-shutdown"/);
});

test('View C unknown mode hides the TESTING panel from the DOM', () => {
  const markup = renderLastRunView(createInitialState(), null);

  assert.doesNotMatch(markup, /<h3>TESTING<\/h3>/);
  assert.doesNotMatch(markup, /data-action="simulate-dirty-shutdown"/);
});
