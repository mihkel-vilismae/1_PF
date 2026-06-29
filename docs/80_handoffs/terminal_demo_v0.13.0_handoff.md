# Terminal Demo v0.13.0 handoff

Current artifact goal: operator release-candidate rehearsal pack.

## Baseline

- Version: `0.13.0`
- Main command: `npm run proof:terminal-demo-operator-rehearsal`
- Windows one-command launcher: `VERIFY_TERMINAL_DEMO.CMD`

## What v0.13.0 adds

- Verifies extracted ZIP identity: folder name, `VERSION`, and `package.json` version.
- Runs the aggregate terminal Demo Mode final proof pack.
- Writes `terminal_demo_status.json` and `terminal_demo_status.md`.
- Creates a terminal-demo-only evidence ZIP under `terminal/demo/runtime_logs/operator_rehearsal/`.
- Keeps the evidence ZIP limited to logs/status/proof outputs; it must not include the source repository.

## Safety boundaries preserved

- No cron.
- No native/fullscreen playback enablement.
- No silent worker execution.
- Q/P worker execution remains guarded behind `PHOTOFRAME_TERMINAL_DEMO_EXECUTE=1` and `PHOTOFRAME_TERMINAL_DEMO_ACK_WORKER_DEMO_SCHEDULER_SAFE=1`.

## Next likely milestone

`v0.14.0` should consume operator Windows/Raspberry evidence from the v0.13.0 rehearsal and fix any real-run blockers before calling the terminal Demo Mode a v1.0 release candidate.
