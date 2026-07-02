# Terminal Demo View 6 Real Fixture Playback Proof

Run:

```bash
npm run proof:terminal-demo-view6-real-fixture-playback
```

The proof renders View `6`, selects all six fixture buttons, verifies each generated HTML viewer artifact, and verifies shared JSONL action evidence.

It proves:

- fixture image viewer artifact generation;
- fixture video viewer artifact generation;
- fullscreen-capable fixture viewer artifact generation;
- fixture address-overlay viewer artifact generation;
- queue-backed playback remains disabled;
- no DB writes, cron, auth, worker execution, or queue execution occurs.

It does not prove browser visual rendering, real fullscreen display, queue-backed playback, Raspberry hardware behavior, or real address pipeline behavior.
