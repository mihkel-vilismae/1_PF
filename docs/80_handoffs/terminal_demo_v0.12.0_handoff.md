# Terminal Real-Demo v0.12.0 Handoff

Generated: 2026-06-29
Baseline version: 0.12.0

## Goal

Turn the PhotoFrame terminal mock-demo into a real terminal Demo Mode that safely demonstrates the PhotoFrame pipeline using DEMO-owned media, truth/status, queue, and playback selected-item visibility without touching real/test data, without cron, and without pretending mock behavior is real.

## Current status

- Terminal Demo Mode is merged into PhotoFrame under `terminal/demo/`.
- Mock adapter remains visual-only and isolated.
- Real-demo adapter resolves DEMO runtime boundaries, discovers generated demo media, reads DEMO truth/status, reads DEMO queue output, reads DEMO playback selected-item status, and plans guarded Q/P manual worker commands.
- W toggles selected batch size `1 <-> 5`; Q consumes the selected size.
- P plans `npm run api -- --scheduler playback-worker` and refreshes selected-item display.
- Actual worker execution remains guarded by both `PHOTOFRAME_TERMINAL_DEMO_EXECUTE=1` and `PHOTOFRAME_TERMINAL_DEMO_ACK_WORKER_DEMO_SCHEDULER_SAFE=1`.
- Native/fullscreen playback and screen on/off behavior remain out of scope for this milestone.

## Proof commands

Run the aggregate proof:

```bash
npm run proof:terminal-demo-final
```

Important individual proofs:

```bash
npm run proof:terminal-demo-path-isolation
npm run proof:terminal-demo-no-cron
npm run proof:terminal-demo-media-discovery
npm run proof:terminal-demo-truth-reader
npm run proof:terminal-demo-batch-size
npm run proof:terminal-demo-real-q-route
npm run proof:terminal-demo-queue-reader
npm run proof:terminal-demo-playback-status
npm run proof:terminal-demo-mock-separation
npm run proof:terminal-demo-largest-files
```

## Validation observed in sandbox

- `npm run proof:terminal-demo-merge-smoke`: PASS
- `NO_COLOR=1 npm run proof:terminal-demo-merge-smoke`: PASS
- `npm run proof:terminal-demo-final`: PASS
- `npm run proof:terminal-demo-execution-safety`: PASS
- `git fsck --no-dangling`: PASS

Blocked by missing dependencies in sandbox:

- `npm run build`: `vite: not found`
- `npm run typecheck`: missing `@types/node`

## Next suggested milestone

Move to v0.13.0 only after deciding whether the next target is:

1. release-candidate packaging/status report for the terminal real-demo, or
2. optional guarded live worker execution proof under DEMO-only flags, or
3. defer worker execution and start broader v1.0 release-candidate hardening.
