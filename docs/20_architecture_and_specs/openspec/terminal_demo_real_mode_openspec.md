# Terminal Demo Real Mode OpenSpec

Generated: 2026-06-29  
Status: v0.12.0 Group 6B final proofs/de-mocking guard pack implemented; worker/native execution remains guarded pending later proof.

## Goal

Turn the terminal mock-demo into a real terminal Demo Mode that uses PhotoFrame DEMO-owned paths, generated demo media, DEMO truth/status files, and existing worker/stage entrypoints without cron.

## Current implementation status

| Area | Status | Score |
|---|---|---:|
| Terminal merged into PhotoFrame | Implemented at `terminal/demo/` | 10/10 |
| Mock adapter preserved | Implemented | 10/10 |
| Real-demo path boundary | Implemented | 9/10 |
| Real-demo media discovery | Implemented | 9/10 |
| Real-demo truth readers | Implemented | 9/10 |
| Command planner | Implemented | 9/10 |
| W batch-size toggle | Implemented for `1 <-> 5` | 10/10 |
| Visible selected batch size | Implemented in header/actions/current run/inspector | 10/10 |
| Q consumes selected batch size | Implemented and snapshot-routed | 9/10 |
| Demo-safe manifest write | Implemented under `DEMO_RUNTIME_OUTPUT_DIR` with path guard and first-5 run manifest | 10/10 |
| Worker execution | Still guarded; scheduler/status/truth/log output isolation has static proof coverage, but live execution ack remains explicit | 7/10 |
| Real/demo runtime env mapping | Implemented for guarded terminal stage plans, DEMO truth, DEMO scheduler/status, DEMO log, and DEMO queue/output paths | 9/10 |
| Real demo queue reader | Implemented; reads DEMO_QUEUE_OUTPUT_PATH and drives PLAYBACK_QUEUE/P enabled state | 9/10 |
| Playback selected-item display | Implemented; reads DEMO scheduler playback-worker-status and renders selected file/type/address/status/duration | 8/10 |
| Playback worker execution | Guarded/manual command plan only; requires explicit execution and scheduler-safety flags | 6/10 |
| Proof/de-mocking guard suite | Group 6B final proof pack implemented; path isolation, no-cron, media/truth, batch-size, Q route, queue, playback, mock separation, execution guard, and largest-file checks are scripted | 9/10 |

## Group 3B behavior

- Default selected `batch_size` is `1`.
- Pressing `W` toggles `batch_size` between `1` and `5`.
- Pressing `W` does not call workers.
- Pressing `Q` uses the currently selected batch size.
- For `batch_size=1`, the terminal captures a file-by-file route across the first five demo rows.
- For `batch_size=5`, the terminal captures a stage-by-stage route across the first five demo rows.
- Q writes a demo-owned manifest only after verifying the manifest path is inside `DEMO_RUNTIME_OUTPUT_DIR`.
- Q does not use cron.
- Real worker command execution is guarded by `PHOTOFRAME_TERMINAL_DEMO_EXECUTE=1` and additionally blocked unless demo scheduler/status isolation is acknowledged/proven.

## Boundaries

The Group 3B default path must not:

```text
write real/test paths
install or use cron
fake worker success
implement fullscreen playback
implement screen on/off behavior
```

## Next group

Group 6B has added final path isolation, no-cron, batch-size, queue, playback, and de-mocking proofs. Remaining work is broader v1.0 release-candidate packaging and any optional live guarded worker execution proof.


## Group 3B-FINISH hardening

- Q writes a DEMO-owned manifest containing the first five selected demo rows, independent of selected batch chunk size.
- `batch_size=1` now means file-by-file chunks across the first five rows.
- `batch_size=5` now means one stage-by-stage batch across the first five rows.
- Each route frame re-reads media/truth/status sources for the terminal snapshot.
- The terminal does not fabricate worker success; final eligibility summaries are labelled as discovered-fixture expectations until DEMO truth/queue readers report actual output.
- Explicit worker execution is blocked until scheduler/status outputs are proven DEMO-isolated.

## Group 6A execution-safety gate

- `V2WorkerTruthMode` now supports `demo`; demo truth is no longer normalized into test truth.
- Demo truth defaults to `runtime_data/v2_worker_truth/demo` or `DEMO_V2_WORKER_TRUTH_DIR`.
- Regular, playback, and instrumented scheduler workers resolve status/lock/state output through `resolveSchedulerRuntimeDirectory()`.
- In Demo Mode, scheduler/status/lock output resolves to `DEMO_SCHEDULER_DIR` or `runtime_data/scheduler/demo`.
- The terminal execution adapter now passes `LOG_DIR`, `DEMO_LOG_DIR`, `DEMO_V2_WORKER_TRUTH_DIR`, `DEMO_SCHEDULER_DIR`, `DEMO_RUNTIME_OUTPUT_DIR`, and `DEMO_QUEUE_OUTPUT_PATH` to guarded worker processes.
- The terminal still refuses real worker execution unless `PHOTOFRAME_TERMINAL_DEMO_EXECUTE=1` and the explicit scheduler-safety acknowledgement are both present.
- `proof:terminal-demo-execution-safety` statically verifies the above no-cron and demo-isolation guards without running workers or writing runtime data.

## Group 5A real queue reader

- `DEMO_QUEUE_OUTPUT_PATH` is read as a real-demo queue source.
- Missing, empty, or malformed queue files are safe non-crashing states.
- Supported queue shapes include top-level arrays, `{ items }`, `{ queue: { items } }`, and `{ playback: { items } }`.
- `PLAYBACK_QUEUE` renders real demo queue records when available.
- `[P] Run Playback` is enabled only when at least one real demo queue item exists.
- Group 5A does not call the playback worker, does not write DB/truth/queue files, does not use cron, and does not implement fullscreen/native playback.


## Group 5B playback selected-item visibility

- The terminal reads `DEMO_SCHEDULER_DIR/playback-worker-status.json` as the demo playback selected-item/status source.
- Supported selected-item shapes include top-level `selectedItemSummary`, `selected`, `currentItem`, and nested `selection`/`playback` equivalents.
- The playback panel shows selected file, media type, overlay address, status, duration, and status source path when present.
- Missing, empty, or malformed playback status remains a non-crashing waiting state.
- Pressing `P` plans the manual/no-cron command `npm run api -- --scheduler playback-worker`.
- Actual playback-worker execution remains guarded by `PHOTOFRAME_TERMINAL_DEMO_EXECUTE=1` plus `PHOTOFRAME_TERMINAL_DEMO_ACK_WORKER_DEMO_SCHEDULER_SAFE=1`.
- Native/fullscreen playback remains disabled and out of this milestone scope.


## Group 6B final proofs and de-mocking guards

Version `0.12.0` adds the terminal real-demo proof-locking pack:

- `proof:terminal-demo-path-isolation` verifies DEMO path boundaries and manifest/output guards.
- `proof:terminal-demo-no-cron` verifies Q/P paths remain manual and do not spawn crontab.
- `proof:terminal-demo-media-discovery` verifies real-demo rows come from generated demo media discovery.
- `proof:terminal-demo-truth-reader` verifies RPI panels read DEMO truth/status or safe empty state.
- `proof:terminal-demo-batch-size` verifies W toggles `1 <-> 5` and Q consumes the selected size.
- `proof:terminal-demo-real-q-route` verifies real-demo Q does not import the mock storyboard and does not fake worker success.
- `proof:terminal-demo-queue-reader` verifies `PLAYBACK_QUEUE` is sourced from `DEMO_QUEUE_OUTPUT_PATH`.
- `proof:terminal-demo-playback-status` verifies selected/current playback item display is sourced from DEMO playback status.
- `proof:terminal-demo-mock-separation` verifies mock and real adapters remain separated.
- `proof:terminal-demo-largest-files` prints largest terminal/proof files and blocks new Group 6B proof source over 300 LOC.
- `proof:terminal-demo-final` aggregates the Group 6B proof pack.

Group 6B does not enable native/fullscreen playback and does not bypass the explicit worker execution acknowledgement gate.
