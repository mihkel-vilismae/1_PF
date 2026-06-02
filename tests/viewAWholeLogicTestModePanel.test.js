/*
 * Guards the View A Test Mode whole-logic control panel contract.
 * Group 1 is intentionally UI/contract-only so no scheduler, worker, or process
 * termination behavior can start from this slice.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';
import { renderInitView } from '../dashboard/views/initView.ts';

const WHOLE_LOGIC_BUTTON_LABEL = 'INSTALL CRONTAB/EMULATOR, CALLING REGULAR WORKER EVERY 1 MINUTES, PLAYBACK WORKER EVERY 30sec, screen on-off worker EVERY 2 MINUTES, ADD LIMIT OF 5 ITEMS TO EACH WORKER STAGE (INCLUDING THE MOCK DOWNLOAD)';

const EXPECTED_POWER_KEYS = Object.freeze([
  'PRESS [q] to shut down regular worker process.',
  'PRESS [w] to shut down playback worker process.',
  'PRESS [e] to shut down screen-on-off worker process.',
  'PRESS [r] to stop all cronjobs - so that the processes would not autorun',
  'PRESS [t] to stop all running processes related to the photoframe app (but not the photoframe dashboard itself!) - the database, playaback, everything. this also stops cronjobs. kill them using a signal that imitates a sudden power-outage. they can leave unfisinshed state etc, it must imitate sudden poweroff',
  'PRESS [t] again to imitate a power on and enable all the cronjobs',
]);

const EXPECTED_SAFETY_LIMITS = Object.freeze([
  'Only stop/terminate worker processes spawned and tracked by this TEST mode controller.',
  'Do not kill the dashboard process.',
  'Do not kill arbitrary Node/Python/SQLite/system processes.',
]);

test('View A renders the whole-logic no-login panel only in Test Mode', () => {
  const state = createInitialState();

  assert.doesNotMatch(renderInitView(state), /RUN whole logic without logging in/);
  assert.doesNotMatch(renderInitView(state, 'real'), /RUN whole logic without logging in/);
  assert.match(renderInitView(state, 'test'), /RUN whole logic without logging in/);
});

test('Group 3 panel exposes the exact requested operator text and controller actions', () => {
  const markup = renderInitView(createInitialState(), 'test');

  assert.match(markup, new RegExp(escapeRegExp(WHOLE_LOGIC_BUTTON_LABEL)));
  assert.match(markup, /data-action="run-whole-logic-test-mode"/);
  assert.doesNotMatch(markup, /data-action="run-whole-logic-test-mode" disabled/);
  assert.match(markup, /data-action="status-whole-logic-test-mode"/);
  for (const key of ['q', 'w', 'e', 'r', 't']) {
    assert.match(markup, new RegExp(`data-action="control-whole-logic-${key}"`));
  }
  for (const expectedText of EXPECTED_POWER_KEYS) {
    assert.match(markup, new RegExp(escapeRegExp(expectedText)));
  }
});

test('Group 3 panel documents safe process termination boundaries before process controls', () => {
  const markup = renderInitView(createInitialState(), 'test');

  for (const expectedText of EXPECTED_SAFETY_LIMITS) {
    assert.match(markup, new RegExp(escapeRegExp(expectedText)));
  }
  assert.match(markup, /Group 3 owns only tracked Test Mode controller records/);
  assert.match(markup, /Configured worker-stage item limit: <strong>5<\/strong>/);
});

/**
 * Escapes literal operator text for RegExp checks against rendered HTML.
 * The tests use exact copy because the wording is part of the behavior contract.
 */
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
