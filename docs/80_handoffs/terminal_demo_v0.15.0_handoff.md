# PhotoFrame Terminal Demo Mode handoff — v0.15.0

Baseline after this milestone:

- Version: `0.15.0`
- Scope: v1.0 RC readiness audit for terminal real Demo Mode.
- New proof: `npm run proof:terminal-demo-rc-readiness`
- New Windows launcher: `VERIFY_TERMINAL_DEMO_RC.CMD`

## Preserved behavior

- Mock-demo remains separate from real-demo.
- Real-demo reads DEMO media/truth/status/queue/playback visibility only.
- `W` still toggles selected batch size `1 <-> 5`.
- `Q` remains guarded and no-cron.
- Playback selected-item/status visibility remains DEMO-sourced.
- Existing final guard, operator rehearsal, and evidence diagnosis commands remain in place.

## What changed

The milestone adds a narrow RC-readiness audit that runs the existing final guard, operator rehearsal, and evidence diagnosis chain. It verifies command discoverability, clear `PASSED` / `BLOCKED` launcher wording, terminal-demo-only evidence hygiene, and RC decision output.

## RC decision rule

If `npm run proof:terminal-demo-rc-readiness` passes from a freshly extracted generated ZIP, `v0.15.0` can be treated as Terminal Demo Mode RC1 for operator rehearsal. If it blocks, classify the evidence with `ANALYZE_TERMINAL_DEMO_EVIDENCE.CMD` and use the report as the next fix-loop input.
