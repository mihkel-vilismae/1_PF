# Photo Frame Dashboard System

This repository contains a dashboard-driven photo-frame system for managing staged media processing, runtime monitoring, and playback surfaces.

The system documentation is organized in canonical numbered folders under `docs/`: `00_current_truth`, `10_runbooks`, `20_architecture_and_specs`, `30_status_snapshots`, `40_backlog_and_tasks`, `50_audits_and_migrations`, and `90_archive`. Implementation status in documentation is not current runtime truth unless the document cites current code, tests, generated evidence, or runtime output.

## Windows full launcher

Run `start_win_full.cmd` from the repository root for the full Windows startup workflow. It installs dependencies, runs tests, builds the frontend, opens API, frontend, and component-status monitor tabs/windows when available, and opens `http://localhost:5173` in the default browser.

Use `start_win.cmd` for the older lighter startup path.

## Documentation entry points


### Documentation navigation

Use the current documentation navigation files before treating older docs as truth:

- [`docs/table_of_contents.md`](docs/table_of_contents.md) is the short top-level documentation table of contents.
- [`docs/DOC_INDEX.md`](docs/DOC_INDEX.md) is the main map for docs by purpose, kind, authority, and topic.
- [`docs/DOC_FRESHNESS_MATRIX.md`](docs/DOC_FRESHNESS_MATRIX.md) shows which docs are current, recent-but-verify, historical, or risky.
- [`docs/DOC_REORGANIZATION_PLAN.md`](docs/DOC_REORGANIZATION_PLAN.md) must be checked before moving or renaming documentation files.
- [`docs/DOC_REFACTOR_CLOSURE_REPORT_20260525.md`](docs/DOC_REFACTOR_CLOSURE_REPORT_20260525.md) summarizes the canonical folder layout and compatibility-pointer policy.
- [`docs/00_current_truth/AUTH_EVIDENCE_PACK.md`](docs/00_current_truth/AUTH_EVIDENCE_PACK.md) is the canonical starting point for login/auth artifact debugging.

Old TODO files, `task_docs/`, backlog docs, old categorized indexes, and vision/spec docs are useful context, but they are not current implementation truth unless code, tests, or generated evidence confirm them.

Start here:

- [`docs/table_of_contents.md`](docs/table_of_contents.md) for the short documentation map.
- [`docs/DOC_INDEX.md`](docs/DOC_INDEX.md) for the full documentation inventory.
- [`docs/00_current_truth/`](docs/00_current_truth/) for current evidence-backed guides.
- [`docs/10_runbooks/operator_setup_and_auth_notes.md`](docs/10_runbooks/operator_setup_and_auth_notes.md) for operator setup and auth notes.
- [`docs/10_runbooks/windows_full_launcher.md`](docs/10_runbooks/windows_full_launcher.md) for the full Windows startup workflow.
- [`docs/20_architecture_and_specs/auth/NEW_AUTH_PROVIDER_VERIFICATION_FLOW.md`](docs/20_architecture_and_specs/auth/NEW_AUTH_PROVIDER_VERIFICATION_FLOW.md) for the NEW AUTH provider-verification reference.
- [`docs/30_status_snapshots/`](docs/30_status_snapshots/) for dated implementation snapshots that must be rechecked against current code before use.

Legacy `docs/main_readme.md`, `docs/categorized/*`, `task_docs/`, and `_TODO_13_05_26/` paths are compatibility navigation only unless a current code/test/evidence check proves otherwise.

## Current documented state

The consolidated status docs describe the system as partially implemented, with mixed real backend behavior and simulated or placeholder-backed dashboard behavior.

Code-checked entrypoint summary:

| Area | Documented state |
|---|---|
| Frontend | Vite app under `dashboard/`, served by `npm run dev` on `http://localhost:5173/`. |
| Backend API | TypeScript server entrypoint at `server/index.ts`, started by `npm run api`. |
| Version display | Frontend reads backend version from `GET /api/version`; repo version is stored in `VERSION` and `package.json`. |
| NEW AUTH | Backend routes are under `/api/auth/new/*`; authentication claims still require endpoint/evidence checks. |
| Runtime/playback | Backend routes exist for orchestration, runtime pipeline stages, playback contracts, resume checkpoints, and native playback status/actions. |

This README does not assert source-code truth. Check code/tests directly before making implementation claims.

## Screen summary

The dashboard is a Vite browser UI with Views A-E plus Windows and Raspberry playback surfaces. The display-facing playback UI shows the selected media preview, media type, queue summary, resolved address caption, fullscreen controls, activity status, worker status, and terminal-style runtime logs.

## v0.8.0 code summary

v0.8.0 is the corrected minor-version baseline for the TEST MODE FAST EMULATOR control surface. It preserves v0.7.49 behavior and adds manual cronjob call buttons `1`, `2`, and `3` under the large start button. The manual button panel is disabled by default, includes explanation text plus hover details, and becomes enabled only after the large TEST MODE FAST EMULATOR start button has created the owned Test Mode controller run. The buttons record manual regular, playback, and screen-on-off cronjob calls in controller state and `logs/end2end_test.log`; they still do not claim real Raspberry cron, real Windows Task Scheduler, or arbitrary OS process control.

## v0.7.49 code summary

v0.7.49 completes Group B of the TEST MODE FAST EMULATOR UI/controller proof work. The View A Test Mode panel keeps the 6s / 3s / 12s fast-emulator cadence, disables the large start button after the backend start boundary succeeds, blocks duplicate starts, renders backend-owned status rows, and writes dedicated runtime evidence to `logs/end2end_test.log`. The log is runtime-generated and ignored by Git. The proof remains deterministic: it does not claim real Raspberry cron, real Windows Task Scheduler, real native fullscreen playback, or arbitrary OS process killing.

## v0.7.48.a code summary

v0.7.48.a adds Group 3 of the Test Mode whole-logic emulator workflow. View A now exposes controller status plus q/w/e/r/t controls for an owned Test Mode controller state. The backend adds status/control endpoints, keeps all controls blocked outside Test Mode, and preserves the safety boundary: only tracked Test Mode controller records may be stopped; the dashboard and arbitrary Node/Python/SQLite/system processes must not be killed.

## Architecture overview

High-level documented components:

- `dashboard/` - frontend UI, views, and inspect surfaces.
- `server/` - backend API routes, runtime services, auth, database, playback, scheduler, and worker entrypoints.
- `shared/` - shared TypeScript contracts.
- `docs/` - canonical numbered documentation, compatibility pointers, snapshots, specs, runbooks, audits, and archive material.
- `scripts/` - local tooling and governance helpers.
- `tools/` - tool-local utilities such as CronEmulator.
- staged pipeline model - download, index, GPS parsing, geocode, B3.5 queue preparation/building, and B4/current-item playback selection concepts as documented.

## How to run

Install dependencies:

```bash
npm install
```

Build the dashboard and start the frontend during manual development:

```bash
npm run build
npm run dev
```

On Windows, `start_win.cmd` checks dependencies, runs `npm run build`, then starts `npm run api`, `npm run dev`, and a component-status monitor in separate terminals. `start_win_full.cmd` delegates to `start_scripts/start_win_full.ps1`, which installs dependencies, runs tests, builds, starts API/frontend/status tabs or windows, and opens the browser.

Open the local app:

```text
http://localhost:5173/
```

Expected behavior depends on the current implementation state. The docs intentionally distinguish documented status from verified runtime behavior.


## Proof artifact workflows

Proof workflows document and collect sanitized evidence for behavior that cannot be proven by source code alone. Human docs live under [`docs/proofs/`](docs/proofs/), while generated runtime JSON is written under ignored `runtime_data/proofs/`.

| Script | Purpose | Default behavior |
|---|---|---|
| `npm run proof:full-test` | Runs the full test suite and writes structured local pass/fail/timeout evidence with parsed test counts when available. | Executes tests locally with serial Node/tsx test execution. |
| `npm run proof:real-icloudpd` | Proves the real iCloudPD pipeline through existing backend routes. | Writes `BLOCKED` unless explicitly enabled. |
| `npm run proof:geocode-provider` | Proves a real geocode provider and rejects placeholder-only proof. | Writes `BLOCKED` unless explicitly enabled. |
| `npm run proof:real-geocode-provider-chain` | Proves a configured real geocode provider, cache-first behavior, fallback from cache miss, human-readable address plausibility, and placeholder rejection. | Writes `BLOCKED` unless `PF_PROOF_ENABLE_REAL_GEOCODE_CHAIN=true` and provider config are supplied. |
| `npm run proof:address-display-ui` | Proves selected playback address evidence renders into the dashboard/display-facing playback UI. | Deterministic local UI render; writes sanitized JSON under `runtime_data/proofs/`. |
| `npm run proof:raspberry-recovery` | Collects Raspberry power-loss recovery proof from explicit hardware evidence. | Writes `BLOCKED` unless explicitly enabled. |

Generated proof artifacts must not include Apple IDs, passwords, 2FA codes, cookies, API keys, provider tokens, raw provider output, or private filesystem paths.

## Versioning and changelog workflow

The documentation set preserves the existing forward-only SemVer governance model.

Supported commit prefixes:

```text
feat:
fix:
docs:
refactor:
test:
chore:
```

Breaking-change markers:

```text
feat!:
fix!:
BREAKING CHANGE:
```

Local validation is documented in `docs/10_runbooks/operator_setup_and_auth_notes.md` and the versioning/changelog governance notes.

## Repository structure

```text
dashboard/        frontend views and inspect system
docs/             consolidated documentation
scripts/          helper scripts and repo tooling
.githooks/        repo-local Git hooks
tests/            test suite
VERSION           canonical repo version
CHANGELOG.md      forward-only changelog
```

## Notes for future work

- Do not treat archive/reference docs as active authority.
- Do not turn current-status docs into product requirements.
- Do not preserve task docs as actionable when they conflict with active vision/spec docs.
- Verify code paths directly before claiming implementation behavior.
