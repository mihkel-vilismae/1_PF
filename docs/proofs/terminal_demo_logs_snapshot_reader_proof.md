# Terminal Demo Logs Snapshot Reader Proof

Command:

```bash
npm run proof:terminal-demo-logs-snapshot-reader
```

This proof creates isolated proof fixtures and verifies `TerminalLogsSnapshotReader` returns exactly seven allowlisted snapshots with `missing`, `empty`, `ready`, `invalid_json`, `invalid_jsonl`, and `too_large` states. It also verifies the reader does not create missing files or mutate existing fixture contents.
