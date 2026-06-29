# PhotoFrame Terminal Demo Mode

Version: `0.10.94`

This folder is the merged terminal/TUI mock plus Group 1/2/4/3A real-demo runtime-boundary, media-discovery, truth/status-read, and dry-run command-plan scaffold for the PhotoFrame Demo Mode beeline.
## Merged into PhotoFrame

As of PhotoFrame `0.10.94`, this terminal demo lives inside the main PhotoFrame repo at `terminal/demo/`. The real-demo adapter is still read-only and dry-run only; real worker execution begins in a later Group 3B slice.

PhotoFrame root commands:

```bash
npm run demo:terminal:mock:smoke
npm run demo:terminal:real:smoke
npm run proof:terminal-demo-merge-smoke
```

The product-worker quick reference is kept in `terminal/demo/docs/photoframe-worker-product-pipeline-reference.md` so agents can avoid opening larger worker/evidence files unless needed.


It is intentionally small. The mock adapter still drives the visual demo, and the real-demo adapter currently resolves/verifies DEMO runtime boundaries, reads generated demo media files, reads DEMO truth/status files, and plans future manual worker commands without executing workers or writing DB/truth data yet.


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

The Windows runner installs dependencies, builds TypeScript, runs smoke verification, and then launches the interactive mock terminal. It prints the project version from `VERSION` / `package.json` at startup. During install/build/verify steps, press `L` to print the current Estonian timestamp, current step, current command, latest captured log row, full log path, and current verbose-display state. Press `V` to toggle live verbose log rows in the terminal. Full npm `--verbose` output is always written to `runtime_logs/windows_runner/` regardless of the `V` display toggle.

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
