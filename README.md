# PF_login / PhotoFrame

> Current checkpoint: `v0.10.64` after B11 manual/autosave recovery wiring and the B12 autonomous playback/recovery proof gate. Code, focused tests, generated proof artifacts, and runtime evidence remain stronger than prose when they conflict.

PF_login / PhotoFrame is a local dashboard-driven photo-frame system for staged media processing, operator inspection, and Raspberry/Windows playback workflows.

The project is intentionally proof-heavy. Source code, tests, OpenSpec documents, and generated proof artifacts are kept separate so the repo can distinguish implemented behavior, planned behavior, and target-machine evidence.

## Current baseline

| Field | Value |
|---|---|
| Version | `0.10.47` |
| Main dashboard | Vite frontend in `dashboard/` |
| Backend API | TypeScript server entrypoint at `server/index.ts` |
| Database schema source | `database/schema.sql` |
| Current startup choices | `Test Mode`, `Real Mode`, `V2` |
| V2 status | Nine-page V2 operator shell, shared Event history, implementation-status toolbar/overlay/help, Setup/Auth controls, Startup Raspberry scheduler controls, shared RPI-STAGES/RPI-WORKERS rows, and Workers B3.1-B3.5 cards are implemented; `07 PIR` and `08 PLAYBACK` remain shells for their later isolated controls, and `09 REAL PLAYBACK` remains explanation-only. |
| Changelog | Release history lives in [`CHANGELOG.md`](CHANGELOG.md), not in this README |

## What this repo does

The project coordinates a photo-frame pipeline with these broad responsibilities:

| Area | Purpose |
|---|---|
| Dashboard | Browser UI for mode selection, status, playback surfaces, and operator views |
| Backend API | Local runtime endpoints for pipeline, auth/session, status, playback, scheduler, and proof support |
| Media pipeline | Staged download, indexing, GPS parsing, geocoding, queue preparation, and playback selection |
| Workers | Regular-stage worker, playback worker, and screen on/off worker concepts for Raspberry operation |
| Proof system | Local and target-machine evidence generation for claims that source code alone cannot prove |
| Documentation | OpenSpec contracts, runbooks, status snapshots, audits, and proof notes under `docs/` |

## Current UI state

The startup gate has three choices:

| Mode | Current behavior |
|---|---|
| `Test Mode` | Existing test/simulation-oriented dashboard behavior |
| `Real Mode` | Existing real-mode dashboard behavior |
| `V2` | Operator-menu shell with nine left-sidebar rows plus V2 status/help overlay, shared Event history, Setup/Auth controls, Startup scheduler controls, and Workers stage cards |

The V2 sidebar currently contains exactly these top-level rows:

| Order | Label | Route key |
|---:|---|---|
| `01` | `setup.sh` | `setup` |
| `02` | `authentication.sh` | `authentication` |
| `03` | `startup.sh` | `startup` |
| `04` | `workers` | `workers` |
| `05` | `troubleshooting` | `troubleshooting` |
| `06` | `recovery` | `recovery` |
| `07` | `PIR` | `pir` |
| `08` | `PLAYBACK` | `playback` |
| `09` | `REAL PLAYBACK` | `real-playback` |

The order number is display/order metadata and is not part of the label. The V2 center panel renders typed visual blocks and shell/explanation pages. Current wired/placed V2 controls include Setup Verify `.env`, Setup Database controls, Authentication NEW AUTH, Startup Raspberry scheduler controls, Workers B3.1-B3.5 action cards, Troubleshooting pipeline maintenance, Recovery manual save/load plus autosave/restart-check flow, PIR emulator controls, Playback drag/drop/rendering/queue metadata bridge, and an integrated `09 REAL PLAYBACK` layout with a B12 proof gate.


### V2 real playback goal

The documented V2 end goal is `09 REAL PLAYBACK`: an integrated Raspberry-oriented operating page assembled from proven setup, authentication, scheduler, worker, troubleshooting, recovery, PIR, and playback pieces.

Victory has two primary conditions:

1. **Autonomous playback:** after login and scheduler/cron installation, media downloads according to configured rules, progresses through Download → Index → GPS parser → Geocode → Queue, reaches fullscreen image/video playback, and shows the resolved address overlay when available.
2. **Autonomous recovery:** after sudden power loss or rough shutdown, the system restarts, detects that recovery is needed, loads lightweight saved state, and resumes operation without manual repair. Exact video timestamp recovery is not required; restarting the same media file from the beginning is acceptable.

A second-tier goal is screen on/off behavior driven by mouse, keyboard, and PIR activity. Mouse/keyboard can be tested directly; PIR may require emulation until target hardware input is proven.

See [`docs/20_architecture_and_specs/v2_goals/goals.md`](docs/20_architecture_and_specs/v2_goals/goals.md) for the authoritative V2 goal contract.

Current V2 implementation decisions remain: reuse/extract shared components instead of copy-pasting HTML, keep the implementation-status overlay V2-only, store overlay status in structured JSON, and keep `09 REAL PLAYBACK` composed only from proven pieces and block customer-ready claims until B12 live evidence exists.


The current V2 documentation package also includes:

- [`docs/20_architecture_and_specs/openspec/v2_operator_pages_openspec.md`](docs/20_architecture_and_specs/openspec/v2_operator_pages_openspec.md) — page/component/reuse/proof contract for pages `01` through `09`;
- [`docs/20_architecture_and_specs/openspec/V2_ImplementationStatus.md`](docs/20_architecture_and_specs/openspec/V2_ImplementationStatus.md) — status tracker for V2 elements, proof expectations, and unresolved states;
- [`docs/20_architecture_and_specs/openspec/V2_GoalSummary.md`](docs/20_architecture_and_specs/openspec/V2_GoalSummary.md) — source-of-truth summary of the V2 planning intent;
- [`docs/20_architecture_and_specs/openspec/V2_IssueRegister.md`](docs/20_architecture_and_specs/openspec/V2_IssueRegister.md) — open design questions, likely problems, and verification gaps;
- [`docs/20_architecture_and_specs/openspec/V2_HRDecisionLog.md`](docs/20_architecture_and_specs/openspec/V2_HRDecisionLog.md) — operator answers to the V2 implementation-planning question set.
- [`docs/50_audits_and_migrations/V2_REAL_PLAYBACK_OPENSPEC_COVERAGE_3PLUS2ACR_20260626.md`](docs/50_audits_and_migrations/V2_REAL_PLAYBACK_OPENSPEC_COVERAGE_3PLUS2ACR_20260626.md) — 3+2 ACR audit that greatly expanded OpenSpec implementation coverage before code changes.

## What is not claimed

This README is a project landing page, not proof evidence. Do not infer target-machine success from documentation alone.

Current non-claims include:

- no automatic proof that a fresh Raspberry target is fully ready unless current proof artifacts say so;
- no claim that every V2 center-panel sub-item executes real backend actions; several later-page controls remain shell/planned only;
- no claim that V2 Setup/Auth/Startup/Workers placements prove successful live backend, Raspberry hardware, iCloud, or crontab execution without current proof output;
- no claim that troubleshooting, recovery, PIR, playback, or integrated `09 REAL PLAYBACK` are complete;
- no claim that archive or older status documents are current truth without code/test/evidence confirmation.

## Repository map

```text
dashboard/        frontend app, views, data, inspect UI, and dashboard services
database/         canonical SQLite schema source
server/           backend API, auth, database, runtime, scheduler, workers, and playback services
shared/           shared TypeScript contracts
docs/             numbered documentation tree, OpenSpec contracts, runbooks, audits, and snapshots
tests/            focused regression and proof-contract tests
tools/            proof runners, governance checks, unzipper tooling, and local utilities
scripts/          helper scripts and validation utilities
start_scripts/    Windows and Raspberry launchers
runtime_data/     generated local runtime/proof data; ignored by Git
VERSION           canonical repository version
CHANGELOG.md      forward-only release history
```

## Run locally

Install dependencies:

```bash
npm install
```

Start the backend API:

```bash
npm run api
```

Start the frontend dashboard:

```bash
npm run dev
```

Open the dashboard:

```text
http://localhost:5173/
```

Build the frontend:

```bash
npm run build
```

Run the full test entrypoint when dependencies are available:

```bash
npm test
```

Run TypeScript checking:

```bash
npm run typecheck
```

## Launchers

| Platform | Entrypoint | Notes |
|---|---|---|
| Windows quick launcher | `start_scripts/windows/start_win.cmd` | Starts the normal Windows workflow |
| Windows full launcher | `start_scripts/windows/start_win_full.cmd` | Full startup workflow with dependency/build/status handling |
| Windows runner/status UI | `full_windows_runner_status.cmd` | Root helper for start/status/stop workflow |
| Raspberry launcher | `start_scripts/raspberry/START_RASPBERRYOS.SH` | Raspberry-oriented startup path |

Use [`HOW_TO_RUN.md`](HOW_TO_RUN.md) for the short quickstart and [`docs/10_runbooks/how_to_run_full_reference.md`](docs/10_runbooks/how_to_run_full_reference.md) for the longer reference.

## Proof and validation commands

Common validation commands:

```bash
npm run check:large-file-containment
npm run proof:docs-reconciliation-audit
npm run check:repo-report-protocol
npm run check:ai-context-policy
```

Representative proof commands:

```bash
npm run proof:full-test
npm run proof:real-icloudpd
npm run proof:real-geocode-provider-chain
npm run proof:address-display-ui
npm run proof:raspberry-v1-readiness
```

Many real-provider and target-machine proofs are intentionally blocked unless explicit environment variables and target evidence are supplied. Proof artifacts are written under ignored runtime folders such as `runtime_data/proofs/`.

## Documentation entry points

| Document | Purpose |
|---|---|
| [`docs/table_of_contents.md`](docs/table_of_contents.md) | Short documentation map |
| [`docs/DOC_INDEX.md`](docs/DOC_INDEX.md) | Full documentation inventory |
| [`docs/DOC_FRESHNESS_MATRIX.md`](docs/DOC_FRESHNESS_MATRIX.md) | Current/recent/historical/risky document status |
| [`docs/00_current_truth/`](docs/00_current_truth/) | Current evidence-backed guides |
| [`docs/10_runbooks/`](docs/10_runbooks/) | Operator and developer runbooks |
| [`docs/20_architecture_and_specs/openspec/`](docs/20_architecture_and_specs/openspec/) | OpenSpec contracts and future-proof requirements |
| [`docs/20_architecture_and_specs/v2_goals/goals.md`](docs/20_architecture_and_specs/v2_goals/goals.md) | Authoritative V2 real playback goal contract |
| [`docs/20_architecture_and_specs/openspec/v2_operator_pages_openspec.md`](docs/20_architecture_and_specs/openspec/v2_operator_pages_openspec.md) | V2 page/component/reuse/proof OpenSpec for pages `01` through `09` |
| [`docs/20_architecture_and_specs/openspec/V2_ImplementationStatus.md`](docs/20_architecture_and_specs/openspec/V2_ImplementationStatus.md) | Element-by-element V2 implementation status tracker |
| [`docs/20_architecture_and_specs/openspec/V2_GoalSummary.md`](docs/20_architecture_and_specs/openspec/V2_GoalSummary.md) | Authoritative V2 planning and placement summary |
| [`docs/20_architecture_and_specs/openspec/V2_IssueRegister.md`](docs/20_architecture_and_specs/openspec/V2_IssueRegister.md) | Known issues, design questions, and verification gaps for V2 |
| [`docs/20_architecture_and_specs/openspec/V2_HRDecisionLog.md`](docs/20_architecture_and_specs/openspec/V2_HRDecisionLog.md) | Operator answers to the V2 implementation-planning question set |
| [`docs/40_backlog_and_tasks/V2_NEXT_IMPLEMENTATION_PLAN_20260626.md`](docs/40_backlog_and_tasks/V2_NEXT_IMPLEMENTATION_PLAN_20260626.md) | Current V2 slice ledger through B12 proof gate, with live target-machine proof still pending |
| [`docs/proofs/`](docs/proofs/) | Human-readable proof notes and proof contracts |
| [`CHANGELOG.md`](CHANGELOG.md) | Release history |

The V2 startup/sidebar work is documented in:

- [`docs/20_architecture_and_specs/openspec/dashboard_v2_mode_openspec.md`](docs/20_architecture_and_specs/openspec/dashboard_v2_mode_openspec.md)
- [`docs/20_architecture_and_specs/openspec/v2_operator_menu_left_sidebar_openspec.md`](docs/20_architecture_and_specs/openspec/v2_operator_menu_left_sidebar_openspec.md)
- [`docs/20_architecture_and_specs/openspec/v2_operator_menu_center_panel_original_openspec.md`](docs/20_architecture_and_specs/openspec/v2_operator_menu_center_panel_original_openspec.md)

## Development rules that matter here

- Preserve existing behavior unless the task explicitly approves a behavior change.
- Treat the latest accepted full Git ZIP as the immutable baseline for regression comparison.
- Keep new feature bodies out of already-large files; use `npm run check:large-file-containment` before handoff.
- Keep `HOW_TO_RUN.md` short; put long operational details in runbooks.
- Keep release history in `CHANGELOG.md`, not in `README.md`.
- Keep secrets out of logs, proof artifacts, screenshots, and documentation examples.
- Treat OpenSpec as a contract/planning layer until code, tests, and evidence prove implementation.

## Versioning

The repository version is stored in both [`VERSION`](VERSION) and `package.json`. Release notes belong in [`CHANGELOG.md`](CHANGELOG.md).

Use focused commits for focused changes. For implementation handoff ZIPs, preserve `.git` history and avoid squashing unrelated changes.
