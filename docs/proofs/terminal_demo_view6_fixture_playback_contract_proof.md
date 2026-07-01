# Terminal Demo View 6 Fixture Playback Contract Proof

## Command

```bash
npm run proof:terminal-demo-view6-fixture-playback-contract
```

## Proves

- View 6 renders `QUEUE-BACKED PLAYBACK - FUTURE DISABLED`.
- View 6 renders `FIXTURE-BACKED PLAYBACK - CURRENT ENABLED`.
- Queue-backed buttons are disabled.
- Fixture-backed buttons are enabled.
- Fixture copies under `terminal/demo/test_data/playback_fixtures/` match their `generated_test_data/gps_valid/` sources.
- View 6 no longer renders the old blank shell.

## Non-Claims

No real playback, queue-backed playback, fullscreen playback, address-overlay playback, worker, auth, DB write, cron, or hardware behavior is proven.
