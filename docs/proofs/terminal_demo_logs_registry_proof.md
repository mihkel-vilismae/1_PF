# Terminal Demo Logs Registry Proof

Command:

```bash
npm run proof:terminal-demo-logs-registry
```

This proof verifies the View `L` canonical logs registry introduced for the read-only logs inspection path.

It checks that:

- `terminal/demo/src/logs/TerminalLogsRegistry.ts` exports `terminalLogsRegistry`.
- The registry contains exactly seven allowed log/status/truth entries.
- Entry order, ids, labels, runtime-relative paths, file kinds, and roles match the View `L` contract.
- Registry ids, labels, and paths are unique.
- Registry entries have descriptive purposes.
- The canonical registry source does not import or call runtime file APIs.
- `terminal/demo/src/views/TerminalLogsViewRegistry.ts` derives from the canonical registry instead of duplicating runtime paths.

Scope: registry/proof only. This proof does not create runtime files, read runtime logs, tail files, write logs, start workers, touch DB/auth/playback/cron behavior, or change View `0`/View `6` behavior.
