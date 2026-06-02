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
