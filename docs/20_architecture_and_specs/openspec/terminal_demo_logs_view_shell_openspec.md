# Terminal Demo Logs View Shell OpenSpec

Version: 2.0.13

## Purpose

View `L` is the terminal Demo Mode Logs view shell. It gives the operator a visible place for the core demo action, truth, and status files before live tailing is implemented.

This slice is shell-only. It renders labels and placeholder panels, but it does not read, tail, watch, or write any runtime log/status/truth file.

## View contract

| View key | Name | Status |
|---|---|---|
| `L` | Logs view | Implemented as a shell placeholder page. |

Required visible sections:

| Section | Purpose |
|---|---|
| `VIEW L — LOGS VIEW` | States that this is a shell-only logs page. |
| `CORE LOG / STATUS SHELLS` | Lists the seven core runtime files. |
| `LOG PANEL PLACEHOLDERS` | Provides non-reading placeholders for future panels. |

## Core file labels

| # | Runtime file label |
|---:|---|
| 1 | `terminal-button-actions.jsonl` |
| 2 | `regular-worker.truth.jsonl` |
| 3 | `playback-worker.truth.jsonl` |
| 4 | `screen-worker.truth.jsonl` |
| 5 | `regular-worker.status.json` |
| 6 | `playback-worker-status.json` |
| 7 | `screen-on-off-worker-status.json` |

## Runtime paths

| Label | Planned runtime path |
|---|---|
| `terminal-button-actions.jsonl` | `runtime_data/logs/demo/terminal-button-actions.jsonl` |
| `regular-worker.truth.jsonl` | `runtime_data/v2_worker_truth/demo/regular-worker.truth.jsonl` |
| `playback-worker.truth.jsonl` | `runtime_data/v2_worker_truth/demo/playback-worker.truth.jsonl` |
| `screen-worker.truth.jsonl` | `runtime_data/v2_worker_truth/demo/screen-worker.truth.jsonl` |
| `regular-worker.status.json` | `runtime_data/scheduler/demo/regular-worker.status.json` |
| `playback-worker-status.json` | `runtime_data/scheduler/demo/playback-worker-status.json` |
| `screen-on-off-worker-status.json` | `runtime_data/scheduler/demo/screen-on-off-worker-status.json` |

## Non-goals

| Non-goal | Reason |
|---|---|
| Live tailing | Deferred until a later logs behavior slice. |
| File reading | This shell must not require runtime files to exist. |
| File writing | The view must not mutate logs/status/truth files. |
| Worker execution | Logs view shell is display-only. |
| DB/auth/playback/cron behavior | Outside this shell slice. |
| View `0` or View `6` logs behavior changes | Later view-specific contracts exist, but this logs shell slice must not add logs-side effects to them. |

## Acceptance criteria

- Pressing `L` opens the Logs view shell.
- The seven core labels and paths are visible.
- The page states it is `shell placeholders only`.
- The page states there is no file tailing or reading.
- View `0` and View `6` have later view-specific contracts that remain outside the logs shell.
