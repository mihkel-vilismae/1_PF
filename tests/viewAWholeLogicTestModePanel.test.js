/*
 * Guards the View A Test Mode whole-logic control panel contract.
 * Group A adds the fast-emulator status/log model while preserving the
 * existing owned-controller safety boundary from v0.7.48.
 */
import assert from "node:assert/strict";
import test from "node:test";

import { createInitialState } from "../dashboard/services/runtimeTruth/runtimeTruthState.ts";
import { renderInitView } from "../dashboard/views/initView.ts";
import { buildWholeLogicTestModeControllerState } from "../shared/testModeWholeLogicContract.ts";

const WHOLE_LOGIC_BUTTON_LABEL =
  "INSTALL TEST MODE EMULATOR, CALLING REGULAR WORKER EVERY 6sec, PLAYBACK WORKER EVERY 3sec, screen-on-off worker EVERY 12sec, ADD LIMIT OF 5 ITEMS TO EACH WORKER STAGE (INCLUDING THE MOCK DOWNLOAD)";

const EXPECTED_POWER_KEYS = Object.freeze([
  "PRESS [q] to shut down regular worker process.",
  "PRESS [w] to shut down playback worker process.",
  "PRESS [e] to shut down screen-on-off worker process.",
  "PRESS [r] to stop all cronjobs - so that the processes would not autorun",
  "PRESS [t] to stop all running processes related to the photoframe app (but not the photoframe dashboard itself!) - the database, playaback, everything. this also stops cronjobs. kill them using a signal that imitates a sudden power-outage. they can leave unfisinshed state etc, it must imitate sudden poweroff",
  "PRESS [t] again to imitate a power on and enable all the cronjobs",
]);

const EXPECTED_SAFETY_LIMITS = Object.freeze([
  "Only stop/terminate worker processes spawned and tracked by this TEST mode controller.",
  "Do not kill the dashboard process.",
  "Do not kill arbitrary Node/Python/SQLite/system processes.",
]);

test("View A renders the whole-logic no-login panel only in Test Mode", () => {
  const state = createInitialState();

  assert.doesNotMatch(
    renderInitView(state),
    /RUN whole logic without logging in/,
  );
  assert.doesNotMatch(
    renderInitView(state, "real"),
    /RUN whole logic without logging in/,
  );
  assert.match(
    renderInitView(state, "test"),
    /RUN whole logic without logging in/,
  );
});

test("Group A panel exposes the exact requested operator text and controller actions", () => {
  const markup = renderInitView(createInitialState(), "test");

  assert.match(markup, new RegExp(escapeRegExp(WHOLE_LOGIC_BUTTON_LABEL)));
  assert.match(markup, /data-action="run-whole-logic-test-mode"/);
  assert.doesNotMatch(
    markup,
    /data-action="run-whole-logic-test-mode" disabled/,
  );
  assert.match(markup, /data-action="status-whole-logic-test-mode"/);
  assert.match(markup, /aria-label="Manual cronjob call buttons"/);
  assert.match(
    markup,
    /data-whole-logic-manual-key="1"[^>]+data-whole-logic-manual-enabled="false"/,
  );
  assert.match(markup, /data-action="control-whole-logic-1"[^>]+disabled/);
  assert.match(markup, /Manually call the regular worker cronjob boundary/);
  assert.match(markup, /Button 1: call the regular worker cronjob manually/);
  for (const key of ["q", "w", "e", "r", "t"]) {
    assert.match(
      markup,
      new RegExp(`data-action="control-whole-logic-${key}"`),
    );
  }
  for (const expectedText of EXPECTED_POWER_KEYS) {
    assert.match(markup, new RegExp(escapeRegExp(expectedText)));
  }
});

test("Group A panel documents safe process termination boundaries before process controls", () => {
  const markup = renderInitView(createInitialState(), "test");

  for (const expectedText of EXPECTED_SAFETY_LIMITS) {
    assert.match(markup, new RegExp(escapeRegExp(expectedText)));
  }
  assert.match(
    markup,
    /TEST MODE FAST EMULATOR owns only tracked Test Mode controller records/,
  );
  assert.match(
    markup,
    /Configured worker-stage item limit: <strong>5<\/strong>/,
  );
});

test("Group B panel renders disabled large button and updated statuses after start", () => {
  const state = createInitialState();
  state.statusByKey["1A-TEST-WHOLE-LOGIC"] = "success";
  state.wholeLogicTestMode = buildWholeLogicTestModeControllerState(
    "2026-06-02T01:00:00.000Z",
  );

  const markup = renderInitView(state, "test");

  assert.match(markup, /data-whole-logic-start-button="true"/);
  assert.match(markup, /data-action="run-whole-logic-test-mode"[^>]+disabled/);
  assert.match(markup, /button--disabled/);
  assert.match(
    markup,
    /data-whole-logic-manual-key="1"[^>]+data-whole-logic-manual-enabled="true"/,
  );
  assert.doesNotMatch(
    markup,
    /data-action="control-whole-logic-1"[^>]+disabled/,
  );
  assert.match(
    markup,
    /data-whole-logic-status-id="crontab_working"[^>]+data-whole-logic-status-state="passed"/,
  );
  assert.match(
    markup,
    /data-whole-logic-status-id="native_playback_started"[^>]+data-whole-logic-status-state="pending"/,
  );
  assert.match(
    markup,
    /FIRST CALLED 0 seconds ago \/ LAST CALLED 0 seconds ago \/ CALLED 1 times/,
  );
  assert.match(markup, /Large TEST MODE FAST EMULATOR start button clicked/);
});

test("Group A panel renders blank status circles and focused fast-emulator log", () => {
  const markup = renderInitView(createInitialState(), "test");

  assert.match(markup, /TEST MODE FAST EMULATOR STATUS/);
  assert.match(markup, /data-whole-logic-status-id="crontab_working"/);
  assert.match(markup, /data-whole-logic-status-id="regular_worker_called"/);
  assert.match(markup, /data-whole-logic-status-id="playback_worker_called"/);
  assert.match(
    markup,
    /data-whole-logic-status-id="screen_on_off_worker_called"/,
  );
  assert.match(markup, /data-whole-logic-status-id="native_playback_started"/);
  assert.match(markup, /STAGE: MOCK DOWNLOAD/);
  assert.match(markup, /STAGE: PLAYBACK SELECT/);
  assert.match(markup, /data-whole-logic-status-state="blank"/);
  assert.match(
    markup,
    /FIRST CALLED not called yet \/ LAST CALLED not called yet \/ CALLED 0 times/,
  );
  assert.match(markup, /data-whole-logic-focused-log="true"/);
  assert.match(markup, /Awaiting TEST MODE FAST EMULATOR start/);
});

/**
 * Escapes literal operator text for RegExp checks against rendered HTML.
 * The tests use exact copy because the wording is part of the behavior contract.
 */
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
