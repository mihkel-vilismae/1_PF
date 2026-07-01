# Terminal Demo Shared Logging Contract Proof

## Command

```bash
npm run proof:terminal-demo-shared-logging-contract
```

## Proves

- `TerminalActionLogWriter` writes to `runtime_data/logs/demo/terminal-button-actions.jsonl`.
- The shared event schema contains `branchFeature`.
- View 0 uses `view0_map_testing`.
- View 6 uses `view6_fixture_playback`.
- Events preserve `noCron=true`.

## Non-Claims

Does not prove real playback, queue execution, worker execution, DB writes, auth, cron, or hardware behavior.
