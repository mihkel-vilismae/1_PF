# PhotoFrame Terminal Demo Mode

Version: `0.16.0`

This folder is the merged terminal/TUI mock plus real-demo runtime-boundary, media-discovery, truth/status-read, command-plan, guarded W/Q orchestration, queue-reader, and playback selected-item visibility scaffold for the PhotoFrame Demo Mode beeline.
## Merged into PhotoFrame

As of PhotoFrame `0.10.94`, this terminal demo lives inside the main PhotoFrame repo at `terminal/demo/`. The real-demo adapter now supports W batch-size toggling and Q selected-batch orchestration. Default worker execution remains guarded; use `PHOTOFRAME_TERMINAL_DEMO_EXECUTE=1` only when intentionally testing real worker calls against DEMO paths.

PhotoFrame root commands:

```bash
npm run demo:terminal:mock:smoke
npm run demo:terminal:real:smoke
npm run proof:terminal-demo-merge-smoke
npm run proof:terminal-demo-playback-status
```

The product-worker quick reference is kept in `terminal/demo/docs/photoframe-worker-product-pipeline-reference.md` so agents can avoid opening larger worker/evidence files unless needed.


It is intentionally small. The mock adapter still drives the visual rehearsal. The real-demo adapter resolves DEMO runtime boundaries, reads generated demo media/truth/status, supports Q/P operator paths, and now exposes `start_stage_modal` for manual stage starts against the DEMO DB while preserving no-cron safety.



## View 0 map/testing and View 6 fixture contract

Version `2.0.17` merges the View `0` map/testing branch and View `6` fixture-playback placeholder branch into current `master`.

- Press `0` to open `map and testing - view 0`.
- View `0` contains a `VIEW MAP` section listing `[D]`, `[L]`, `[I]`, and `[1]` through `[6]`.
- Pressing a listed key from View `0` routes to that page when no modal owns input.
- View `0` also contains a `TESTING` section with the default test route `0A`.
- Press `0 -> Enter -> Enter -> Enter` to reach `TEST PAGE 0A`.
- Press `0 -> Enter -> 7 -> Enter -> D -> Enter` to reach `TEST PAGE 7D`.
- View `6` renders a fixture-backed playback contract page.
- View `6` keeps queue-backed playback disabled and uses terminal-demo-owned fixture copies.
- Pressing a View `6` fixture button opens the exact placeholder modal `this will be done by Codex` and logs `CODEX_DEFERRED`.

Real browser playback, fullscreen playback, address-overlay playback, queue-backed playback execution, auth, DB writes, file copies, workers, and cron remain deferred.

Real-demo terminal shared logging contract: View `0` and View `6` use `runtime_data/logs/demo/terminal-button-actions.jsonl` through the branch-safe schema described in `terminal_demo_shared_logging_openspec.md`. Branch markers are `view0_map_testing` and `view6_fixture_playback`.

Proof:

```bash
npm run proof:terminal-demo-view0-map-view6-blank
npm run proof:terminal-demo-shared-logging-contract
npm run proof:terminal-demo-view0-default-test-route
npm run proof:terminal-demo-view0-custom-test-route
npm run proof:terminal-demo-view6-fixture-playback-contract
npm run proof:terminal-demo-view6-codex-placeholder
npm run proof:terminal-demo-view6-codex-placeholder-complete
npm run proof:terminal-demo-view6-codex-playback-handoff
```

## Remaining view shell beeline preflight

Version `2.0.11` adds an honest planning and proof guard for the next beeline after View `0` and View `6`.

Scope guard:

- View `0` is frozen for this chat: keep the current map page, map navigation, and empty `TESTING` section unless explicitly reopened.
- View `6` now owns the fixture-backed playback placeholder contract; queue-backed and real playback remain deferred unless explicitly reopened.
- Future work targets View `D`, `L`, `I`, and stage views `1` through `5` as shell contracts first.
- Planned buttons remain shell-only until explicitly implemented. Do not run auth, log tailing, file copy, workers, DB writes, playback, or cron from this preflight.

Planned shell targets:

| View | Planned shell contract |
|---|---|
| `D` | Add an `iCloudPD authorization` section with read-only status and a `Go to login view` navigation control. |
| `I` | Add only the newer NEW AUTH button set; older compatibility auth buttons are forbidden. |
| `L` | Implement log/status/truth file inspection panels as read-only snapshots. |
| `1` | Add Download stage shell with `Copy one file from generated test images` as a non-executing button shell. |
| `2` | Add Indexing stage shell. |
| `3` | Add GPS Parser stage shell. |
| `4` | Add Geocode stage shell. |
| `5` | Add Enqueue stage shell. |

Reusable UI rule: views should compose reusable components such as `SectionFrame`, `ViewMapSection`, planned `StatusRing`, planned `StatusRow`, planned `RpiStagesSection`, and planned `RpiWorkersSection` instead of duplicating rendering logic.

Proof:

```bash
npm run proof:terminal-demo-view-shell-beeline-preflight
```

## Default authorization and View I login shells

Version `2.0.12` implements the Batch B shell contract for iCloudPD authorization surfaces.

- View `D` now includes an `ICLOUDPD AUTHORIZATION` section.
- The section contains a read-only `Authorization status: planned shell only` row rendered with reusable status helpers.
- The section contains `[I] Go to login view`; pressing `I` opens View `I`.
- View `I` renders only the newer NEW AUTH button shells.
- Older compatibility auth buttons are forbidden in View `I`.
- View `0` and View `6` are unchanged.

NEW AUTH shell buttons:

| Button shell |
|---|
| `Verify iCloudPD install` |
| `Verify with iCloudPD` |
| `Login using .env values` |
| `Check login` |
| `Log out and remove existing session` |
| `Show auth/session paths and files` |
| `Generate auth evidence pack` |
| `List auth evidence packs` |

Scope: shell only. No iCloudPD process starts, no session files are read/written/deleted, no evidence pack is generated, no worker runs, no DB write happens, no playback/file-copy/cron behavior is added.

Proof:

```bash
npm run proof:terminal-demo-auth-view-shells
```


## View `L` logs read-only inspection view

Version `2.0.22` promotes View `L` from shell labels into a real read-only log/status/truth snapshot inspector.

Sections:

| Section | Purpose |
|---|---|
| `VIEW L — LOGS VIEW` | Identifies View `L` as a read-only snapshot inspector and states the no-effects boundary. |
| `CORE LOG / STATUS SNAPSHOTS` | Shows the seven allowlisted files with status, kind, size, line count, label, and path. |
| `SELECTED LOG DETAIL` | Shows a bounded selected-file detail panel with path, role, kind, size, line count, modified time, message, and tail/preview content. |

Core files:

| # | File |
|---:|---|
| 1 | `runtime_data/logs/demo/terminal-button-actions.jsonl` |
| 2 | `runtime_data/v2_worker_truth/demo/regular-worker.truth.jsonl` |
| 3 | `runtime_data/v2_worker_truth/demo/playback-worker.truth.jsonl` |
| 4 | `runtime_data/v2_worker_truth/demo/screen-worker.truth.jsonl` |
| 5 | `runtime_data/scheduler/demo/regular-worker.status.json` |
| 6 | `runtime_data/scheduler/demo/playback-worker-status.json` |
| 7 | `runtime_data/scheduler/demo/screen-on-off-worker-status.json` |

Snapshot states:

| State | Meaning |
|---|---|
| `missing` | The allowlisted file does not exist. |
| `empty` | The file exists but contains no content. |
| `ready` | JSON/JSONL content parses successfully. |
| `invalid_json` | A `.json` status file exists but cannot be parsed. |
| `invalid_jsonl` | A `.jsonl` file exists but at least one line cannot be parsed. |
| `too_large` | The file exceeds the safe snapshot byte limit and is not read. |

Scope: read-only snapshot inspection only. View `L` may read the seven allowlisted files while active. It must not create, modify, append, delete, tail/watch live, write DB, start workers, run auth, launch playback, copy files, or touch cron.

Proofs:

```bash
npm run proof:terminal-demo-logs-registry
npm run proof:terminal-demo-logs-snapshot-reader
npm run proof:terminal-demo-logs-view-overview
npm run proof:terminal-demo-logs-detail-panel
npm run proof:terminal-demo-logs-view-shell
```

## Section header ID overlay

Version `2.0.7` adds a display-only section header ID overlay for operator screenshots and implementation discussions. Press `H` to toggle `section_header_id_overlay` on/off. The default view stays unprefixed. When enabled, each `SectionHeader` receives a stable Pane/Section prefix such as:

| Section | Overlay header |
|---|---|
| Actions | `L-3 ACTIONS` |
| Playback | `C-2 PLAYBACK` |
| RPI stages | `R-1 RPI-STAGES — DEMO TRUTH` |
| iCloudPD authorization | `L-4 ICLOUDPD AUTHORIZATION` |
| `start_stage_modal` when open | `L-5 START STAGE MODAL` |

Vocabulary: a `Pane` is a large left/center/right terminal region; a `Section` is a bordered functional block inside a pane; a `SectionHeader` is the visible title; a `SectionBody` is the content below that title. The overlay only changes visible headers. It does not run workers, mutate the DEMO DB, or change cron behavior.

Proof:

```bash
npm run proof:terminal-demo-section-header-ids
```


## Real-demo Group 1 scaffold

Version `0.7.0` adds the first real-demo beeline boundary slice:

- explicit adapter modes: `mock-demo` and `real-demo`,
- central DEMO path resolver,
- DEMO path safety/readiness checks against configured REAL/TEST paths,
- visible runtime banner fields for adapter, repo root, demo DB, demo media, and demo truth,
- non-crashing `RealDemoRuntimeAdapter` scaffold,
- `Q`/`W`/`P` disabled in real-demo mode until later groups wire real media rows, existing workers/stages, truth readers, and queue readers.

Run the real-demo scaffold:

```bash
npm run build
npm run demo:terminal:real:smoke
# or interactive:
npm run demo:terminal:real
```

Useful environment variables for real-demo mode:

| Variable | Default | Purpose |
|---|---|---|
| `PHOTOFRAME_REPO_ROOT` | current working directory | Root of the real PhotoFrame/PF_login repo. |
| `DEMO_DB_PATH` | `runtime_data/demo/demo.sqlite` | Demo-owned SQLite DB path. |
| `DEMO_DOWNLOAD_DIR` | `generated_test_data` | Demo media source folder. Later slices will choose 3 valid and 3 invalid files from its subfolders. |
| `DEMO_V2_WORKER_TRUTH_DIR` | `runtime_data/v2_worker_truth/demo` | Demo-owned worker truth JSONL directory. |
| `DEMO_SCHEDULER_DIR` | `runtime_data/scheduler/demo` | Demo-owned scheduler/status/lock directory. |
| `DEMO_LOG_DIR` | `runtime_data/logs/demo` | Demo-owned log path. |
| `DEMO_RUNTIME_OUTPUT_DIR` | `runtime_data/demo/outputs` | Demo runtime output path. |
| `DEMO_QUEUE_OUTPUT_PATH` | `runtime_data/demo/outputs/display_queue.json` | Future demo queue output snapshot path. |

Groups 1/2/4/3A do **not** call real workers, mutate the demo DB, write truth JSONL, or populate real queue data. Group 2 reads generated demo media files; Group 4 reads DEMO truth/status files if present; Group 3A plans manual worker commands only.


## Real-demo Group 2 media discovery

Version `0.8.0` adds read-only real-demo media discovery:

- reads `generated_test_data` from the configured PhotoFrame/PF_login repo root,
- selects 6 deterministic fixture rows for the first real-demo table: 3 valid and 3 problem/invalid files,
- stores safe relative paths on each row instead of relying only on display filenames,
- keeps Q/W/P disabled because worker/stage orchestration, truth readers, and queue writes are later groups,
- preserves the mock adapter and mock storyboard unchanged.

Expected first fixture mix when the PhotoFrame baseline contains the standard generated fixtures:

| Kind | Example source folder | Intended row state before workers run |
|---|---|---|
| Valid | `generated_test_data/gps_valid` / `videos_with_gps` | GPS fixture is valid; geocode and queue are not run yet. |
| Problem | `generated_test_data/no_gps` | GPS fixture is missing; geocode and queue are not run yet. |
| Problem | `generated_test_data/invalid_gps` / `corrupted` | GPS/media fixture is invalid/problematic; geocode and queue are not run yet. |

Run against a PhotoFrame repo root:

```bash
PHOTOFRAME_REPO_ROOT=/path/to/PF_login_v0.10.93 npm run demo:terminal:real:smoke
```

Group 2 is still read-only: no workers, no DB writes, no truth JSONL writes, no queue writes, and no cron.


## Real-demo Group 4 truth/status readers

Version `0.9.0` adds read-only DEMO truth/status readers:

- reads `regular-worker.truth.jsonl`, `playback-worker.truth.jsonl`, and `screen-worker.truth.jsonl` from `DEMO_V2_WORKER_TRUTH_DIR`,
- maps recent regular-worker truth into the `RPI-STAGES — DEMO TRUTH` panel,
- maps recent worker truth/status into the `RPI-WORKERS — DEMO TRUTH` panel,
- safely handles missing truth/status files without crashing,
- keeps Q/W/P disabled because real worker/stage execution and queue writes are later groups.

Group 4 remains read-only: no worker calls, no DB writes, no truth JSONL writes, no queue writes, and no cron.



## Real-demo Group 3A command-plan scaffold

Version `0.10.0` adds the pre-merge command contract and dry-run planner:

- records the PhotoFrame scheduler worker commands used by the default Raspberry cron rows,
- plans manual/no-cron `regular-stage-worker` calls for future terminal `Q` execution,
- emits dry-run plans for `batch_size=1` and `batch_size=5`,
- plans temporary demo manifest paths under `DEMO_RUNTIME_OUTPUT_DIR`,
- marks all plans as `dry-run-only-no-file-written`,
- keeps real execution disabled until the terminal is merged into PhotoFrame for Group 3B.

Dry-run command-plan smoke:

```bash
PHOTOFRAME_REPO_ROOT=/path/to/PF_login_v0.10.93 npm run demo:terminal:real:command-plan-smoke
```

Group 3A remains read-only: no worker calls, no DB writes, no truth JSONL writes, no queue writes, no manifest writes, and no cron.


## Real-demo Group 3B guarded W/Q orchestration

Version `0.10.97` adds the first real-demo W/Q orchestration path inside PhotoFrame:

- `W` toggles selected `batch_size` between `1` and `5`,
- selected batch size is visible in the terminal banner and inspector,
- `Q` consumes the selected batch size,
- `Q` writes a demo-owned manifest under `DEMO_RUNTIME_OUTPUT_DIR` after a path-safety check,
- `Q` records a guarded manual/no-cron worker command result,
- LEFT/RIGHT replay captured Q snapshots after a real-demo run,
- default smoke behavior does not execute workers unless `PHOTOFRAME_TERMINAL_DEMO_EXECUTE=1` is explicitly set.

Group 5A implements the real-demo queue reader. Fullscreen playback, playback worker execution, and screen on/off behavior remain out of scope.


## Real-demo Group 5A queue reader

Version `0.10.99` adds the read-only real-demo queue reader:

- reads `DEMO_QUEUE_OUTPUT_PATH` / `runtime_data/demo/outputs/display_queue.json`,
- maps supported queue JSON shapes into the `PLAYBACK_QUEUE` table,
- enables `[P] Run Playback` only when real demo queue rows exist,
- safely handles missing, empty, or malformed queue files without crashing,
- keeps playback worker execution and fullscreen/native playback disabled for later groups.

Group 5A is read-only: no playback worker calls, no DB writes, no truth JSONL writes, no queue writes, and no cron.


## Real-demo Group 5B playback selected-item visibility

Version `0.11.0` adds the playback selected-item/status reader:

- reads the demo playback worker status file from `DEMO_SCHEDULER_DIR/playback-worker-status.json`,
- maps `selectedItemSummary`, `selection.playback.selected`, `currentItem`, and related selected/current item shapes into the playback panel,
- shows selected file/type/address/status/duration when a demo playback status exists,
- keeps missing, empty, or malformed playback status as a safe waiting state,
- adds a guarded `[P]` playback command plan for `npm run api -- --scheduler playback-worker`,
- keeps actual playback worker execution behind explicit safety flags,
- keeps native/fullscreen playback disabled.

Group 5B does not install/use cron, does not claim native playback, and does not bypass the existing execution acknowledgement gate.



## Real-demo Group 6B final proofs

Version `0.12.0` adds the final proof/de-mocking guard milestone for the terminal real-demo path:

- path isolation proof for DEMO runtime/manifest/output boundaries,
- no-cron proof for Q/P manual command planning,
- real media discovery and DEMO truth/status reader proofs,
- W/Q batch-size route proof,
- real Q route proof that does not import the mock storyboard or fake worker success,
- queue reader and playback selected-item/status proofs,
- mock-vs-real adapter separation proof,
- execution guard proof for explicit worker flags,
- largest-file proof for the terminal/proof slice.

Run the aggregate proof:

```bash
npm run proof:terminal-demo-final
```

Group 6B still keeps native/fullscreen playback disabled and does not bypass guarded worker execution flags.


## Real-demo v0.13.0 operator release-candidate rehearsal pack

Version `0.13.0` adds an operator-focused rehearsal pack. It does not add major new runtime behavior; it makes the current terminal Demo Mode easier to verify from an extracted ZIP.

One-command Windows verification from the repo root:

```cmd
VERIFY_TERMINAL_DEMO.CMD
```

Equivalent npm command:

```bash
npm run proof:terminal-demo-operator-rehearsal
```

The rehearsal proof verifies version/package/folder identity, runs the terminal final proof pack, writes `terminal_demo_status.json` and `terminal_demo_status.md`, and creates a terminal-demo-only evidence ZIP under:

```text
terminal/demo/runtime_logs/operator_rehearsal/
```

The evidence ZIP contains logs/status/proof outputs only. It must not include the extracted source repository.


## Current scope

The current mock terminal:

- uses exactly five hardcoded mock media rows,
- renders a terminal Demo Mode screen,
- uses a JSON layout/menu contract where practical,
- provides a reusable `DemoTerminalState`,
- renders RPI-STAGES and RPI-WORKERS panels from mock state,
- supports `Q` as an automatic scripted demonstration: rows #1-#5 flow through index/GPS/geocode/queue, with a one-second pause between storyboard frames,
- supports manual storyboard stepping with `Left Arrow` / `Right Arrow`, using the same states as the automatic Q path,
- updates rows #1-#5 through the mock index/GPS/geocode/queue flow,
- enqueues rows #1, #3, and #5 after address resolution, while rows #2 and #4 become not eligible,
- keeps fullscreen playback disabled,
- keeps screen on/off controls disabled,
- uses an ANSI color schema for readability while preserving the existing layout,
- renders all “Not yet implemented” text in dimmed pink,
- uses a responsive A/B/C dashboard layout on wide terminals so the main sections can be seen at once, with a stacked fallback for narrow terminals.

The mock terminal does **not**:

- call real workers,
- write a real database,
- read real source-of-truth JSONL,
- use cron/crontab,
- add/import files,
- allow manual file selection,
- claim mock state is runtime proof.

## Commands

Install dependencies:

```bash
npm install
```

Build TypeScript:

```bash
npm run build
```

Run the interactive mock terminal:

```bash
npm run demo:terminal:mock
```

Render a non-interactive initial-screen smoke output:

```bash
npm run demo:terminal:mock:smoke
```

Render the final Q storyboard state:

```bash
npm run demo:terminal:mock:q-smoke
```

Render every Q storyboard frame:

```bash
npm run demo:terminal:mock:q-storyboard-smoke
```

Render the manual left/right storyboard smoke path:

```bash
npm run demo:terminal:mock:manual-smoke
```

Run smoke verification:

```bash
npm run verify:smoke
```


## Windows runner

Run from the repository root on Windows:

```cmd
windows_runner.cmd
```

The Windows runner may be launched from `terminal/demo/windows_runner.cmd` or from the PhotoFrame root helper. After the terminal was merged into PhotoFrame, the PowerShell helper walks upward to find the PhotoFrame repository root containing `package.json` and `terminal/demo/src/main.ts`, then runs npm scripts from that root. It installs dependencies, builds TypeScript, runs terminal-demo smoke verification, and then launches the interactive mock terminal. It prints the project version from the PhotoFrame root `VERSION` / `package.json` at startup. During install/build/verify steps, press `L` to print the current Estonian timestamp, current step, current command, latest captured log row, full log path, and current verbose-display state. Press `V` to toggle live verbose log rows in the terminal. Full npm `--verbose` output is always written to `terminal/demo/runtime_logs/windows_runner/` regardless of the `V` display toggle.

If `npm ci` hits a network timeout such as `ETIMEDOUT`, the runner prints a timeout hint and retries the dependency install once using npm fetch retry settings.

## Terminal layout

When the terminal is wide enough, the mock renders as three side-by-side panels:

| Panel | Contents | Purpose |
|---|---|---|
| A | Header, mock media table, actions | Operator controls and inputs. |
| B | Current run, RPI-STAGES, RPI-WORKERS, playback, screen on/off | Runtime/status view. |
| C | Storyboard/log/inspector | Current step, latest event, manual/auto mode, and future log area. |

Narrow terminals keep the previous stacked layout so the app remains usable.

## Keyboard behavior

| Key | Behavior |
|---|---|
| `Q` | In mock mode: auto-runs rows #1-#5 through index/GPS/geocode/queue, one second per step. In real-demo Group 3A: real execution disabled; dry-run command plans are visible. |
| `Right Arrow` | Enters manual storyboard mode and advances one Q-path step. |
| `Left Arrow` | Enters manual storyboard mode and goes back one Q-path step. |
| `R` | Re-renders the current mock state, or refreshes the real-demo boundary scaffold. |
| `X` | Exits the interactive terminal. |
| `Ctrl+C` | Exits the interactive terminal. |

## Mock media rows

| # | File | Type | Indexed | GPS | Geocode | Queue |
|---:|---|---|---|---|---|---|
| 1 | `demo_sunset_tartu_001.jpg` | image | no | not parsed | not run | not queued |
| 2 | `demo_old_bridge_002.jpg` | image | no | missing | not run | not queued |
| 3 | `demo_family_clip_003.mp4` | video | no | not parsed | not run | not queued |
| 4 | `demo_invalid_gps_004.jpg` | image | no | invalid | not run | not queued |
| 5 | `demo_forest_walk_005.jpg` | image | no | not parsed | not run | not queued |

After `Q` completes in mock mode, rows #1, #3, and #5 are enqueued; rows #2 and #4 become not eligible. Playback becomes enabled because the mock playback queue has three eligible rows.

## Architecture boundary

The UI renders from `DemoTerminalState` and talks to `DemoRuntimeAdapter`.

Current adapter:

```text
MockDemoRuntimeAdapter
```

Future adapter:

```text
RealDemoRuntimeAdapter
```

The future real adapter must use the real Demo Mode runtime stack: demo DB, demo source-of-truth files, demo worker truth JSONL, and existing workers/stages called manually. It must not invent fake real-mode logic.


## Windows runner registry/logging note

The Windows runner forces dependency installation through `https://registry.npmjs.org/` and checks `package-lock.json` for leaked internal registry URLs before running `npm ci`. It also supports `[L]` for timestamp/current-command/latest-log-row peeks and `[V]` to toggle live verbose terminal output while full verbose logs continue to be written to `runtime_logs/windows_runner`.

### Wide dashboard panel placement

When the terminal is wide enough, the mock renders as a three-panel dashboard:

- **Panel A**: header, mock media table, and actions.
- **Panel B**: current run, playback controls, screen on/off placeholder, and the `PLAYBACK_QUEUE` table.
- **Panel C**: RPI-STAGES, RPI-WORKERS, and the storyboard/log inspector.

The layout keeps the current run/playback area visible while moving RPI panels and the inspector into the right-side runtime/detail column. If the terminal is too narrow, the app falls back to the stacked layout.


## Q batch queue path


In v0.6.1, negative pipeline outcomes such as `missing GPS`, `invalid GPS`, `skipped`, and `not eligible` use a reddish danger background instead of the green `[DONE]` success treatment. Eligible/enqueued outcomes remain green.

In v0.6.0, `Q` auto-runs the expanded mock path over rows #1-#5. Rows #1, #3, and #5 resolve addresses and become `enqueued`; row #2 is skipped because GPS is missing; row #4 is skipped because GPS is invalid. The `PLAYBACK_QUEUE` panel then shows the enqueued rows.


## Group 3B-FINISH hardening

`W` toggles selected `batch_size` between `1` and `5`. `Q` uses that value to choose the real-demo route: batch size `1` captures file-by-file chunks across the first five generated demo rows, while batch size `5` captures stage-by-stage batch snapshots across the first five rows. Q writes only a DEMO-owned manifest under `DEMO_RUNTIME_OUTPUT_DIR`; default worker execution remains planned/guarded, and explicit execution is blocked until demo scheduler/status isolation is proven.

## Real-demo v0.14.0 evidence diagnosis loop

Version `0.14.0` adds a diagnosis step after the operator rehearsal pack. It does not enable native playback or bypass guarded worker execution; it classifies evidence from the latest rehearsal folder or a supplied evidence ZIP.

From the extracted repo root on Windows:

```cmd
VERIFY_TERMINAL_DEMO.CMD
ANALYZE_TERMINAL_DEMO_EVIDENCE.CMD
```

For a specific evidence ZIP/folder:

```cmd
ANALYZE_TERMINAL_DEMO_EVIDENCE.CMD path\to\evidence.zip
```

Equivalent npm commands:

```bash
npm run proof:terminal-demo-operator-rehearsal
npm run terminal-demo:evidence-diagnosis -- path/to/evidence.zip
```

The diagnosis report is written under `terminal/demo/runtime_logs/evidence_diagnosis/` and classifies common blockers such as stale runner root detection, missing Node/npm, missing dependencies, folder/version mismatch, and expected guarded-execution messages.


## v0.15.0 v1.0 RC readiness audit

Version `0.15.0` adds a narrow RC-readiness audit without changing the real-demo runtime behavior. It proves the operator-facing chain is discoverable and still safe:

```bash
npm run proof:terminal-demo-rc-readiness
```

On Windows, use the root launcher:

```text
VERIFY_TERMINAL_DEMO_RC.CMD
```

The audit runs the final terminal-demo guard proof, the operator rehearsal proof, and evidence diagnosis against the rehearsal evidence. It also checks that the root launchers and npm scripts print clear `PASSED` / `BLOCKED` summaries. Evidence is written under `terminal/demo/runtime_logs/rc_readiness/` and contains logs/status only, not the source repository.


## v0.16.0 transferable RC package proof

Version `0.16.0` adds packaging/proof hygiene only. It does not add terminal-demo runtime behavior. The formerly untracked `TRANSFERABLE_REPO_PACKAGER.cmd` is now an intentional repo-root packaging helper and is verified as a tracked file.

Run the transferable package proof from the repo root:

```bash
npm run proof:terminal-demo-transferable-package
```

On Windows, use the root launcher:

```cmd
VERIFY_TERMINAL_DEMO_TRANSFERABLE_PACKAGE.CMD
```

The proof verifies `VERSION` / `package.json` / `package-lock.json` identity, Git HEAD readability, `git fsck --no-dangling`, clean worktree state after extraction, root launcher presence, tracked packager policy, and evidence-only output under `terminal/demo/runtime_logs/transferable_package/`. The v0.16.0 RC readiness audit also runs this proof before declaring `RC1_READY_FOR_OPERATOR_REHEARSAL`.

## v1.0.0 final release proof

Version `1.0.0` is release-only package finalization. It adds no new terminal-demo runtime behavior.

```bash
npm run proof:terminal-demo-v1-release
```

Windows launcher:

```cmd
VERIFY_TERMINAL_DEMO_V1_RELEASE.CMD
```

A passing result reports `TERMINAL_DEMO_MODE_V1_RELEASED` after the release-freeze evidence gate remains green.

## v0.18.0 v1.0 release-freeze proof

Version `0.18.0` adds a release-freeze and final evidence-pack proof only. It does not add new terminal-demo runtime behavior.

Run from a clean extracted package root:

```bash
npm run proof:terminal-demo-v1-release-freeze
```

On Windows, use the root launcher:

```cmd
VERIFY_TERMINAL_DEMO_V1_RELEASE_FREEZE.CMD
```

The proof collects build, typecheck, final terminal-demo proof, dashboard mode boundary proof, transferable package proof, and RC readiness evidence under `terminal/demo/runtime_logs/v1_release_freeze/`. A passing result reports `V1_READY_TO_RELEASE`; a blocked result reports `NOT_READY_FOR_V1`. The evidence folder contains command logs and status reports only, not source repository files.

## v1.2.0 real-demo entrypoint clarity

Use `RUN_TERMINAL_DEMO_REAL.CMD` from the repo root, or `terminal/demo/windows_runner_real.cmd`, when testing DB-backed playback. These launchers intentionally start `npm run demo:terminal:real` through the Windows runner helper.

The default `terminal/demo/windows_runner.cmd` remains mock-demo/storyboard-only. Mock-demo can still be useful for visual flow rehearsals, but it must not be mistaken for proof that DB playback is reading `DEMO_DB_PATH` or real playback tables.

Proof:

```bash
npm run proof:terminal-demo-real-entrypoint
```

Decision: `REAL_DEMO_ENTRYPOINT_READY`.


## v1.3.0 live DEMO DB image playback fixture

The real-demo Windows launcher prepares a live DEMO DB image playback fixture before launching. The setup copies one real image from `generated_test_data` into the DEMO-owned downloaded-files folder, creates the isolated DEMO SQLite database, applies the existing real schema, and seeds one READY `slideshow_queue` row.

The fixture proves the `P` button has a real DB-backed image to consume without using mock rows or the legacy JSON queue output. It remains a fixture and does not claim real worker or geocode provider completion.
## v1.4.0 real-demo log panel layout

- Area A renders `REAL-TIME LOG [-]` and receives truth-read, queue-read, DB table verification, playback-status, media-discovery, selected-row, and path-check diagnostics.
- Area B is reserved for current command/action plan lines; errors/warnings are highlighted red.
- Area A has terminal mouse hitboxes for focus, `[-]` collapse/expand, and wheel scrolling when the terminal supports SGR mouse events.
- Proof: `npm run proof:terminal-demo-log-panel-layout`.

## v1.4.1 Windows viewer launch repair

The real-demo DB image playback button still writes `runtime_data/demo/outputs/db-image-playback/windowed-playback.html`, but Windows opening now uses guarded `Start-Process -FilePath` plus a `cmd.exe start` fallback. This is a launch-only repair for the `P` button; it does not add geocode, workers, cron, schema changes, or v2 final behavior.

Run the contract proof with:

```cmd
npm run proof:terminal-demo-windows-viewer-launch
```


## Terminal Demo v1.5.0 - Q-created DEMO DB queue rows

Pressing `Q` in real-demo now creates DEMO-scoped READY rows in `slideshow_queue` through the real DEMO DB tables. The source label is `terminal-demo-q-created`. Batch size `1` creates one selected queue row; batch size `5` creates up to five selected queue rows. This does not add GPS/geocode provider execution, screen-worker behavior, cron, schema redesign, or v2 final claims.

Proof:

```bash
npm run proof:terminal-demo-q-db-queue-creation
```


## Terminal Demo v1.9.1 - v2.0 OpenSpec handoff

This docs-only slice updates the Terminal Demo Real Mode OpenSpec and adds the v2.0.0 operator RC handoff docs. It does not change runtime behavior and does not claim v2.0 final readiness.

Docs/proof command:

```bash
npm run proof:terminal-demo-v2-handoff-docs
```

Main handoff docs:

- `docs/20_architecture_and_specs/openspec/terminal_demo_v2_operator_rc_handoff_openspec.md`
- `docs/40_backlog_and_tasks/terminal_demo_v2_implementation_handoff.md`


## v2.0.0 Real Demo Mode operator RC

Decision: `REAL_DEMO_MODE_V2_RC_READY` when the v2 proof chain passes. The v2 operator RC consolidates the implemented v1.5-v1.9 slices: DEMO-owned DB/media/truth/status/queue/playback, Q-created DB rows, metadata/address stages, batch 1/5 parity, guarded screen-worker panel, Area A/B/C layout routing, operator rehearsal evidence, and RC readiness reporting.

Proof chain:

```bash
npm run proof:terminal-demo-v2-operator-rc
npm run proof:terminal-demo-final
npm run proof:terminal-demo-operator-rehearsal
npm run proof:terminal-demo-rc-readiness
```

Non-claims: no cron, no DB schema redesign, no unguarded real screen power command, no mock success claim, and no production Raspberry v2 claim without target evidence.


## v2.0.1 Windows P viewer launch hotfix

Pressing `P` still uses the DB-backed DEMO playback path, but Windows viewer launching now uses a safer chain: `Invoke-Item -LiteralPath`, then `rundll32.exe url.dll,FileProtocolHandler`, then `explorer.exe`. The old fragile `cmd.exe start` fallback is not part of the accepted launch path. If the viewer file is written but Windows refuses to open it, the terminal keeps showing the viewer path, selected image path, and address instead of erasing them. P button actions are persisted to `runtime_data/logs/demo/terminal-button-actions.jsonl`.

Proof:

```bash
npm run proof:terminal-demo-windows-viewer-launch
```


## v2.0.2 Q operator status/logging cleanup

The real-demo terminal now records manual `Q` runs as completed operator actions and writes persistent Q button evidence to `runtime_data/logs/demo/terminal-button-actions.jsonl`. The Q event includes batch size, route, selected row count, q-created queue counts, stage status summary, and `noCron=true`. Expected demo/offline GPS/geocode degradation is displayed as degraded/blocked with context rather than an unexplained hard Error, and stale `v0.12.0 Group 6B` copy has been removed from the real-demo operator UI.

Proof:

```bash
npm run proof:terminal-demo-q-operator-status
```

## v2.0.3-v2.0.6 start_stage_modal manual stage start

Press `S` in real-demo mode to open `start_stage_modal`. The modal shows one row per stage.

| The key pressed | Action it must take |
|---|---|
| `S` | Open/display `start_stage_modal`. |
| `1` | Show Download, but keep it disabled for now. |
| `2` | Run Index against the DEMO DB through the shared regular worker path contract. |
| `3` | Run GPS Parser against the DEMO DB through the shared regular worker path contract. |
| `4` | Run Geocode against the DEMO DB through the shared regular worker path contract. |
| `5` | Run Enqueue for Playback against the DEMO DB through the shared regular worker path contract. |

Each modal row has an independent manual `batch_size`. The default is `1`; allowed modal values are `1` and `3`. The modal keeps Q batch-size behavior separate.

The enabled rows retain the existing `regular-stage-worker` command contract: `npm run api -- --scheduler regular-stage-worker`. The real-demo terminal records `noCron=true`; it does not install or invoke cron. Manual evidence is written to `runtime_data/logs/demo/terminal-button-actions.jsonl`, with stage, batch size, route, DB effect, truth/status, and manifest details.

Proofs:

```bash
npm run proof:terminal-demo-start-stage-modal
npm run proof:terminal-demo-start-stage-modal-shared-path
npm run proof:terminal-demo-start-stage-modal-db-effects
npm run proof:terminal-demo-start-stage-modal-docs
```

Docs/OpenSpec:

- `docs/20_architecture_and_specs/openspec/terminal_demo_start_stage_modal_openspec.md`
- `docs/proofs/terminal_demo_start_stage_modal_docs_proof.md`

Non-claims: key `1` does not start Download; no cron/crontab is installed or invoked; no DB schema redesign; no production Raspberry claim without target evidence.


## Terminal empty view shells

Version `2.0.9` adds the first view-system foundation slice.

The active view registry is:

| View key | Empty view shell |
|---|---|
| `D` | Default operator view. |
| `L` | Logs view. |
| `I` | iCloudPD login view. |
| `1` | Download stage view. |
| `2` | Indexing stage view. |
| `3` | GPS Parser stage view. |
| `4` | Geocode stage view. |
| `5` | Enqueue view. |
| `6` | Playback view. |

Vocabulary: `View` contains `Pane`; `Pane` contains `Section`; `Section` may contain `Subsection`; `Modal` is a view-scoped overlay.

This slice is intentionally a shell only. The non-default views show empty placeholder screens and do not run buttons, workers, auth, playback, DB writes, file copies, or cron. When `start_stage_modal` is open, modal keys `1`-`5` keep their modal behavior instead of switching views.

## View 6 real fixture playback

View `6` fixture buttons generate browser-renderable HTML viewer artifacts for image, video, fullscreen-capable no-overlay, and fixture address-overlay modes. Queue-backed playback remains visible but disabled. Run `npm run proof:terminal-demo-view6-real-fixture-playback` to validate the artifact and shared JSONL evidence contract.
