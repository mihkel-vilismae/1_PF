# PF_login / PhotoFrame

PF_login / PhotoFrame is a local dashboard-driven photo-frame system for staged media processing, operator inspection, and Raspberry/Windows playback workflows.

The project is intentionally proof-heavy. Source code, tests, OpenSpec documents, and generated proof artifacts are kept separate so the repo can distinguish implemented behavior, planned behavior, and target-machine evidence.

## Current baseline

| Field | Value |
|---|---|
| Version | `0.10.29` |
| Main dashboard | Vite frontend in `dashboard/` |
| Backend API | TypeScript server entrypoint at `server/index.ts` |
| Database schema source | `database/schema.sql` |
| Current startup choices | `Test Mode`, `Real Mode`, `V2` |
| V2 status | Startup option, six-item left sidebar, and original visual-only typed center-panel blocks implemented |
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
| `V2` | New operator-menu shell with six left-sidebar rows |

The V2 sidebar currently contains exactly these top-level rows:

| Order | Label | Route key |
|---:|---|---|
| `01` | `setup.sh` | `setup` |
| `02` | `authentication.sh` | `authentication` |
| `03` | `startup.sh` | `startup` |
| `04` | `workers` | `workers` |
| `05` | `troubleshooting` | `troubleshooting` |
| `06` | `recovery` | `recovery` |

The order number is display/order metadata and is not part of the label. The V2 center panel now renders the original sub-items as typed visual blocks; auth, worker, database, crontab, troubleshooting, and recovery actions are still not wired from V2.

## What is not claimed

This README is a project landing page, not proof evidence. Do not infer target-machine success from documentation alone.

Current non-claims include:

- no automatic proof that a fresh Raspberry target is fully ready unless current proof artifacts say so;
- no claim that V2 center-panel sub-items execute real backend actions; they are visual/read-only typed blocks in this baseline;
- no claim that V2 buttons trigger auth, crontab, DB, worker, troubleshooting, or recovery actions;
- no claim that real iCloud, GPS/geocode, playback, or recovery behavior is proven unless the relevant proof output exists;
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
