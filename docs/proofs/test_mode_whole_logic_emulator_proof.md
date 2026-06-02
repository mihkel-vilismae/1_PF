# Test Mode whole-logic emulator proof

`npm run proof:test-mode-whole-logic-emulator` writes a sanitized JSON proof artifact under `runtime_data/proofs`.

## What it proves

The proof deterministically exercises the Test Mode whole-logic service boundary and verifies:

- the no-login Test Mode start path is allowed only in Test Mode;
- requested worker cadences are recorded: 6 seconds, 3 seconds, and 12 seconds;
- the worker-stage item limit is 5, including the mock-download stage;
- CronEmulator rows include the three worker entrypoints;
- `q`, `w`, and `e` terminate only the matching owned controller worker record;
- `r` stops cronjobs without powering off the app state;
- `t` simulates sudden power-off and `t` again simulates power-on with cronjobs re-enabled;
- the safety boundary preserves the dashboard and arbitrary Node/Python/SQLite/system processes.

## What it does not prove

This proof does not prove real Raspberry cron firing, real Windows Task Scheduler firing, real native fullscreen playback, or real OS process termination. Those remain separate runtime/hardware evidence types.


## v0.7.49 proof additions

`proof:test-mode-whole-logic-emulator` now also verifies:

- large TEST MODE FAST EMULATOR start state becomes disabled after start;
- duplicate starts are blocked while the owned controller run is active;
- status rows transition from blank to passed/pending semantic states;
- `logs/end2end_test.log` is written in the proof temp runtime area;
- the dedicated log contains relevant start/control entries and excludes obvious secret-bearing patterns.

The proof still does not claim real Raspberry cron firing, real Windows Task Scheduler firing, real native fullscreen playback, or real OS process termination.

