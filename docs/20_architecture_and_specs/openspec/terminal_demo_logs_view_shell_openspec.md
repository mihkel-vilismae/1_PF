# Terminal Demo Logs View OpenSpec

Version: 2.0.22

## Purpose

View `L` is the terminal Demo Mode read-only log/status/truth inspection view. It gives the operator a bounded snapshot of the seven core demo runtime files without mutating runtime state.

## View contract

| View key | Name | Status |
|---|---|---|
| `L` | Logs view | Implemented as a read-only snapshot inspector. |

Required visible sections:

| Section | Purpose |
|---|---|
| `VIEW L — LOGS VIEW` | States the read-only snapshot and no-side-effect boundary. |
| `CORE LOG / STATUS SNAPSHOTS` | Renders all seven allowlisted files with status, type, size, line count, and path. |
| `SELECTED LOG DETAIL` | Renders bounded detail/tail/preview information for the selected file. |

## Canonical file registry

The only allowed file identities come from:

```text
terminal/demo/src/logs/TerminalLogsRegistry.ts
```

| # | Runtime file |
|---:|---|
| 1 | `runtime_data/logs/demo/terminal-button-actions.jsonl` |
| 2 | `runtime_data/v2_worker_truth/demo/regular-worker.truth.jsonl` |
| 3 | `runtime_data/v2_worker_truth/demo/playback-worker.truth.jsonl` |
| 4 | `runtime_data/v2_worker_truth/demo/screen-worker.truth.jsonl` |
| 5 | `runtime_data/scheduler/demo/regular-worker.status.json` |
| 6 | `runtime_data/scheduler/demo/playback-worker-status.json` |
| 7 | `runtime_data/scheduler/demo/screen-on-off-worker-status.json` |

## Snapshot reader contract

The reader lives at:

```text
terminal/demo/src/logs/TerminalLogsSnapshotReader.ts
```

It returns one snapshot per registry entry and supports:

| State | Meaning |
|---|---|
| `missing` | File does not exist. |
| `empty` | File exists with zero bytes. |
| `ready` | JSON or JSONL content parses. |
| `invalid_json` | JSON status file is malformed. |
| `invalid_jsonl` | JSONL log has a malformed line. |
| `too_large` | File exceeds the safe read limit. |

## Detail panel contract

The selected detail panel shows:

- path;
- role and file kind;
- status;
- byte size;
- line count;
- last modified time if available;
- registry purpose;
- reader message;
- bounded tail/preview lines.

## Runtime boundary

Allowed:

- read the seven allowlisted files when View `L` is active;
- render missing/empty/ready/invalid/too-large states;
- render bounded previews.

Forbidden:

- creating, modifying, appending, deleting, or watching files;
- writing DB data;
- starting workers;
- running auth/session behavior;
- launching playback;
- running cron;
- changing View `0` or View `6` behavior.

## Proofs

```bash
npm run proof:terminal-demo-logs-registry
npm run proof:terminal-demo-logs-snapshot-reader
npm run proof:terminal-demo-logs-view-overview
npm run proof:terminal-demo-logs-detail-panel
npm run proof:terminal-demo-logs-view-shell
```
