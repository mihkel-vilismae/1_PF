# Terminal Demo Logs View Shell Proof

Command:

```bash
npm run proof:terminal-demo-logs-view-shell
```

The proof renders View `L` and verifies:

- `VIEW L — LOGS VIEW` is visible.
- `CORE LOG / STATUS SHELLS` is visible.
- `LOG PANEL PLACEHOLDERS` is visible.
- The seven core log/status/truth labels are visible.
- The seven planned runtime paths are visible.
- The renderer does not import file APIs or tail/watch files.
- View `0` and View `6` are unchanged.

Scope: shell placeholders only. No file tailing, no auth, no workers, no DB writes, no playback, no file copy, and no cron.
