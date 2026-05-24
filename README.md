# Photo Frame Dashboard System

This repository contains a dashboard-driven system for managing a staged photo-processing pipeline and playback simulation.

The system documentation has been consolidated into categorized canonical docs under `docs/categorized/`. Implementation status in those docs is documentation-derived only unless a document explicitly states that a code path was verified.

## Documentation entry points


### Documentation navigation (current grouping)

Use the current documentation navigation files before treating older docs as truth:

- [`docs/DOC_INDEX.md`](docs/DOC_INDEX.md) is the main map for docs by purpose, kind, authority, and topic.
- [`docs/DOC_FRESHNESS_MATRIX.md`](docs/DOC_FRESHNESS_MATRIX.md) shows which docs are current, recent-but-verify, historical, or risky.
- [`docs/DOC_REORGANIZATION_PLAN.md`](docs/DOC_REORGANIZATION_PLAN.md) must be checked before moving or renaming documentation files.
- [`docs/AUTH_EVIDENCE_PACK.md`](docs/AUTH_EVIDENCE_PACK.md) is the starting point for login/auth artifact debugging.

Old TODO files, `task_docs/`, backlog docs, and vision/spec docs are useful context, but they are not current implementation truth unless code, tests, or generated evidence confirm them.

Start here:

- `docs/main_readme.md` - global documentation index, authority rules, conflict summary, and full old-to-new migration map.
- `docs/categorized/vision_spec_docs/main_readme.md` - product vision, architecture intent, runtime recovery, dashboard, auth, and pipeline specs.
- `docs/categorized/current_implementation_status_docs/main_readme.md` - documented current system status, button/view verification evidence, and known gaps.
- `docs/categorized/task_documentation_still_to_implement/main_readme.md` - still-actionable implementation, verification, and reconciliation tasks.
- `docs/categorized/other_documentation/main_readme.md` - operator notes, setup/auth notes, documentation workflow, default project checklist, and archive/reference orientation.
- `docs/NEW_AUTH_PROVIDER_VERIFICATION_FLOW.md` - current NEW AUTH passive-status and active provider-verification operator flow.
- `docs/IMPLEMENTATION_STATUS_UPDATE_20260512_NEW_AUTH_PROVIDER_VERIFICATION.md` - latest implementation-status update for the NEW AUTH provider-verification UX slices.

## 2026-05-12 status update

NEW AUTH Slices 1–10 plus the 2026-05-12 provider-verification UX reconciliation are documented as closed. The dashboard uses `/api/auth/new/*` for the new auth flow. Local session files alone are not authenticated; provider proof or stronger test-download proof is required. Passive status remains read-only; `Verify with iCloudPD` runs active provider proof through `GET /api/auth/new/status`, while `Verify iCloudPD install` remains an executable/config readiness check only.

View B has backend-wired pipeline maintenance controls for stale persisted pipeline lock detection and stale-lock clearing. The detector currently classifies stale pipeline locks only.

B3.5 owns playback queue preparation/building. B4 and `playback_worker` select the current playable item from already prepared queue/state as the final worker-stage action before the loop can begin again. Preview/fullscreen rendering are still not real media display, Raspberry OS rendering remains disabled/planned, and screen hardware control remains outside B4.

Windows CronEmulator playback-worker command wiring is partial: it reaches `npm run api -- --scheduler playback-worker` from the expected `tools/CronEmulator` launch context, but live local scheduler/emulator operation still depends on that context being installed/launched correctly.

View C now reads the last orchestration run from the backend using the `GET /api/runtime/orchestration/last` endpoint and renders a read‑only summary derived from SQLite.  The dashboard explicitly labels this snapshot as read‑only and does not attempt any restore; the “Resume” button remains a disabled placeholder until a deliberate restore contract exists.  View D continues to be a runtime‑monitoring gap in terms of backend support, but the UI now clarifies the origin of each field (database, lock, heartbeat, log tail or computed) in the simulated runtime preview.

## Current documented state

The consolidated status docs describe the system as partially implemented, with mixed real backend behavior and simulated or placeholder-backed dashboard behavior.

Documentation-derived summary:

| Area | Documented state |
|---|---|
| View A - Init | Backend-backed initialization surfaces with documented scheduler/platform limitations. |
| View B - Test | Hybrid area with a mix of real endpoints and simulated or placeholder-backed stages. |
| View C - Last Run Info | Demo/status-oriented surface unless otherwise verified separately. |
| View D - Running Process | Runtime preview/simulation unless otherwise verified separately. |
| Inspect/metadata | Important for explaining UI state, backend status, and provenance. |

This README does not assert source-code truth. Check code/tests directly before making implementation claims.

## Architecture overview

High-level documented components:

- `dashboard/` - frontend UI, views, and inspect surfaces.
- `docs/` - consolidated documentation entrypoints and categorized docs.
- `scripts/` - local tooling and governance helpers.
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

On Windows, `start_win.cmd` checks dependencies, runs `npm run build`, then starts `npm run api` and `npm run dev` in separate terminals.

Open the local app:

```text
http://localhost:5173/
```

Expected behavior depends on the current implementation state. The docs intentionally distinguish documented status from verified runtime behavior.

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

Local validation is documented in `docs/categorized/other_documentation/operator_setup_and_auth_notes.md` and the versioning/changelog governance notes.

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
