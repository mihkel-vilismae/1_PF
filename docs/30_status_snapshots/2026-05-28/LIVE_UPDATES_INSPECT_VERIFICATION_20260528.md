# Live Updates Inspect Verification — 28.05.2026

## Targeted verification

Command:

```bash
npm test -- tests/liveUpdatesPause.test.js tests/inspectMetadataDriftGuard.test.js
```

Result:

```text
tests 4
pass 4
fail 0
```

Coverage:

- the dashboard shell renders `Pause live updates` / `Resume live updates`;
- transit-driven renders use the live-update render guard;
- scheduler and playback observability polling skip automatic work while live updates are paused;
- the new `toggle-live-updates` action has inspect, real/mock, and backend-status metadata and does not fall back to generic copy.

## Build verification

Command:

```bash
npm run build
```

Result: passed.

## Full-suite note

Command:

```bash
npm test
```

The full suite was attempted in the Linux tool environment but timed out before completion. No assertion failure was captured before timeout.

## Preserved behavior

This change does not change backend routes, runtime mode headers, authentication/session handling, database paths, scheduler endpoint contracts, playback contracts, media pipeline behavior, or scroll-preservation semantics.
