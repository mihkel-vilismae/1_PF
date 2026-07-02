# Terminal Demo Logs View Proof

Command:

```bash
npm run proof:terminal-demo-logs-view-shell
```

The proof renders View `L` and verifies:

- `VIEW L — LOGS VIEW` is visible.
- `CORE LOG / STATUS SNAPSHOTS` is visible.
- `SELECTED LOG DETAIL` is visible.
- The seven core log/status/truth labels are visible.
- The seven runtime paths are visible.
- The renderer does not import or call direct file APIs.
- View `0` and View `6` contracts are not regressed.

Scope: read-only snapshot inspection. File reads are isolated to `TerminalLogsSnapshotReader`; the renderer consumes state only. No file creation/mutation, auth, workers, DB writes, playback, file copy, or cron behavior is allowed.
