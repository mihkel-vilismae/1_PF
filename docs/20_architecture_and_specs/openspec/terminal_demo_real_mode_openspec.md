# Terminal Demo Real Mode OpenSpec

Generated: 2026-06-29  
Status: v0.14.0 operator evidence diagnosis loop implemented; worker/native execution remains guarded pending later proof.

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
| Operator rehearsal pack | Implemented; root Windows launcher and npm proof create status JSON/MD plus terminal-demo-only evidence ZIP | 9/10 |
| Operator evidence diagnosis | Implemented; analyzes latest evidence folder or supplied ZIP and writes blocker/next-action report | 9/10 |

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


## v0.13.0 operator release-candidate rehearsal pack

Version `0.13.0` adds packaging/evidence workflow for the current terminal Demo Mode implementation:

- root `VERIFY_TERMINAL_DEMO.CMD` runs the operator rehearsal proof from an extracted ZIP,
- `terminal/demo/windows_verify_terminal_demo.cmd` forwards to the root verification launcher,
- `proof:terminal-demo-operator-rehearsal` verifies version/package/folder identity, runner presence, and final proof status,
- the rehearsal writes `terminal_demo_status.json` and `terminal_demo_status.md`,
- the rehearsal creates a terminal-demo-only evidence ZIP under `terminal/demo/runtime_logs/operator_rehearsal/`,
- the evidence ZIP contains logs/status/proof outputs only, not the source repository.

This milestone is a release-candidate rehearsal pack, not v1.0 final. It does not enable native/fullscreen playback or bypass guarded worker execution flags.

## v0.14.0 operator evidence diagnosis loop

Version `0.14.0` adds the evidence import/fix-loop layer after the v0.13 rehearsal pack:

- root `ANALYZE_TERMINAL_DEMO_EVIDENCE.CMD` analyzes the latest operator rehearsal evidence or an explicit evidence ZIP/folder,
- `terminal-demo:evidence-diagnosis` runs the same analyzer from npm,
- `proof:terminal-demo-evidence-diagnosis` self-tests known blocker classification,
- the analyzer writes `terminal_demo_evidence_diagnosis.json` and `.md` under `terminal/demo/runtime_logs/evidence_diagnosis/`,
- common classifications include stale Windows runner root detection, missing Node/npm, missing dependencies, folder/version mismatch, expected guarded-execution messages, and failed rehearsal checks.

This milestone is an evidence triage/fix-loop milestone. It does not enable native/fullscreen playback and does not bypass guarded worker execution flags.


## v0.15.0 v1.0 RC readiness gate

Terminal Demo Mode may be called RC1 only when the dedicated RC readiness proof passes from an extracted package root:

```bash
npm run proof:terminal-demo-rc-readiness
```

The gate is intentionally narrow. It must not introduce new runtime behavior, cron usage, real/test data access, or mock substitution. It verifies:

- `VERSION` and `package.json` identity agree.
- operator commands are discoverable from `package.json`;
- root launchers expose clear `PASSED` / `BLOCKED` outcomes;
- the final guard proof still passes;
- the operator rehearsal proof still produces terminal-demo-only evidence;
- evidence diagnosis can classify the rehearsal evidence and write reports;
- RC readiness logs do not package the source repository.

A passing result means `v0.15.0` is RC1-ready for operator rehearsal, not that production cron or real/test data may be used by Demo Mode.


## v0.16.0 transferable RC package proof

The transferable RC package proof is a packaging hygiene gate, not a terminal Demo Mode runtime feature. It must preserve the v1.0 RC safety boundaries: DEMO-owned paths only, no cron, no real/test data writes, no native/fullscreen playback enablement, and no mock substitution in the real-demo path.

The proof command is:

```bash
npm run proof:terminal-demo-transferable-package
```

Windows operators may run:

```cmd
VERIFY_TERMINAL_DEMO_TRANSFERABLE_PACKAGE.CMD
```

The gate requires:

- `VERSION`, `package.json`, and `package-lock.json` agree on the current milestone version.
- `TRANSFERABLE_REPO_PACKAGER.cmd` is tracked by Git and contains the readable self-contained packager payload.
- `.git` history is present, `git fsck --no-dangling` passes, and the extracted worktree is clean.
- root operator launchers remain present and discoverable.
- generated proof evidence stays under `terminal/demo/runtime_logs/transferable_package/` and does not include source repository files.

A passing result means the RC package is transferable and clean enough for operator rehearsal packaging. It does not itself approve production cron, live Raspberry execution, or real/test data use.


## v0.17.0 dashboard runtime mode type boundary

The v0.17.0 repair makes the runtime-mode boundary explicit rather than widening legacy services blindly. `DashboardRuntimeMode` may include `demo` for dashboard selection and terminal Demo Mode surfaces, but legacy database, playback contract, native playback, and orchestration surfaces remain real/test-only.

Required guardrails:

- `demo` must not be passed directly into database, playback, native playback, or orchestration service contexts.
- Real/test-only routes must call an explicit boundary helper before they reach those services.
- Test-only proof routes must keep a separate Test Mode guard.
- Terminal Demo Mode continues to use DEMO-owned media, truth, status, queue, and playback evidence surfaces.

Proof command:

```bash
npm run proof:dashboard-runtime-mode-boundary
```

The RC readiness audit also runs this proof so the transferable RC package cannot regress by silently allowing demo mode into real/test-only service boundaries.


## v0.18.0 v1.0 release-freeze evidence gate

The v0.18.0 milestone is a release-freeze and final evidence-pack gate. It does not add terminal Demo Mode runtime behavior. Its job is to prove the v0.17.0 green state is still intact and to produce an explicit v1.0 go/no-go report.

Proof command:

```bash
npm run proof:terminal-demo-v1-release-freeze
```

Windows launcher:

```cmd
VERIFY_TERMINAL_DEMO_V1_RELEASE_FREEZE.CMD
```

The release-freeze proof must keep these boundaries unchanged:

- Demo Mode continues to use DEMO-owned media, truth, status, queue, and playback evidence surfaces.
- Terminal Demo Mode does not use cron or crontab.
- Terminal Demo Mode does not touch real/test data paths.
- Real-demo behavior is not faked through the mock adapter/storyboard.
- Worker execution remains explicitly guarded.
- Native/fullscreen playback remains disabled for terminal Demo Mode.
- Dashboard `demo` mode remains blocked from legacy real/test-only services.
- Generated release-freeze evidence contains logs/status only and does not include source repository files.

A passing proof writes `terminal_demo_v1_release_freeze.json` and `.md` under `terminal/demo/runtime_logs/v1_release_freeze/` and reports:

```text
V1_READY_TO_RELEASE
```

A blocked proof reports:

```text
NOT_READY_FOR_V1
```

The supporting go/no-go checklist is `docs/20_architecture_and_specs/openspec/terminal_demo_v1_release_freeze_checklist.md`.
## v1.0.0 final release package

The v1.0.0 milestone is release-only. It promotes the passing v0.18.0 release-freeze state into the final Terminal Demo Mode v1 package. It must not add terminal Demo Mode runtime behavior.

Final proof command:

```bash
npm run proof:terminal-demo-v1-release
```

Windows launcher:

```cmd
VERIFY_TERMINAL_DEMO_V1_RELEASE.CMD
```

The final proof reuses the release-freeze evidence gate and adds version/docs/package checks for `1.0.0`. A passing proof reports:

```text
TERMINAL_DEMO_MODE_V1_RELEASED
```

The final package preserves these v1 boundaries: DEMO-owned paths only, no cron, no real/test data access, no mock substitution in real-demo flow, guarded worker execution, non-fullscreen terminal playback, explicit dashboard demo mode boundaries, and evidence folders that contain logs/status reports only.

