# Real-demo Group 1 Boundary Scaffold

Version: 0.7.0

This document records the Group 1 implementation slice for the beeline goal:

```text
Turn the current terminal mock-demo into a real terminal Demo Mode.
```

## Implemented in Group 1

| Slice | Implemented | Notes |
|---:|---|---|
| 1.1 | Runtime/adapter type boundary | Added explicit `RuntimeMode`, `TerminalAdapterMode`, and `RuntimeBoundaryState` config contracts. |
| 1.2 | Central demo path resolver | Added DEMO DB/media/truth/scheduler/log/output/queue path resolver. |
| 1.3 | Demo path safety verifier | Detects demo overlap with configured REAL/TEST paths and missing required demo path locations. |
| 1.4 | Terminal adapter mode config | Supports `--adapter=real-demo`, `--real-demo`, `PHOTOFRAME_TERMINAL_ADAPTER=real-demo`. |
| 1.5 | Visible runtime banner fields | Header shows adapter, demo paths, readiness, no-cron boundary, and repo root. |
| 1.6 | Mock adapter preserved | Mock-demo remains default and existing Q/arrow smoke behavior remains valid. |

## Not implemented in Group 1

Group 1 intentionally does not:

```text
call real workers
mutate demo DB
read real demo truth JSONL
read generated demo media rows
read/write real demo queue
implement batch-size switching
implement real playback
create cron entries
```

## Real-demo default paths

| Field | Default |
|---|---|
| PhotoFrame repo root | `PHOTOFRAME_REPO_ROOT` or current working directory |
| Demo DB | `runtime_data/demo/demo.sqlite` |
| Demo media source | `generated_test_data` |
| Demo worker truth | `runtime_data/v2_worker_truth/demo` |
| Demo scheduler/status/locks | `runtime_data/scheduler/demo` |
| Demo logs | `runtime_data/logs/demo` |
| Demo runtime outputs | `runtime_data/demo/outputs` |
| Demo queue output snapshot | `runtime_data/demo/outputs/display_queue.json` |

## Future data-selection note

When the real media discovery slice is implemented, use the PhotoFrame baseline `generated_test_data` subfolders and choose:

```text
3 valid files
3 invalid/problem files
```

for the first real-demo sample set.
