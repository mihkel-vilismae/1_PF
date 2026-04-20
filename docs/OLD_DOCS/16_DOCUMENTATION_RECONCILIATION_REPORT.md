# Documentation Reconciliation Report

## Purpose

This report explains how the documentation set was reconciled against the actual uploaded repository contents.

## Why reconciliation was needed

The repository contains two different things at once:

1. an actually implemented frontend prototype, and
2. a large forward-looking backend architecture documentation set.

Without an explicit split, a future reader could misread target-state documents as statements about already-implemented behavior.

## Repository findings

### Code and asset findings

Found in the repo:

- Vite frontend project metadata
- dashboard UI implementation under `dashboard/`
- a minimal backend source tree under `server/` for A init endpoints
- built frontend output in `dist/`
- generated test-data assets under `generated_test_data/`
- no DB migrations/schema implementation files
- no worker runtime code beyond a small 3A scheduler bootstrap host

### Documentation findings

Found in `docs/`:

- view-level docs describing the frontend UI
- system docs `01` through `14` describing a future backend architecture
- canonical target-state contract docs `18` through `22` that are more implementation-ready than the broader summaries when topics overlap
- issue registry documenting already-fixed frontend runtime-truth problems

## Main risk found

The largest documentation risk was not that the docs were entirely wrong.
It was that the docs did not cleanly declare which documents describe:

- current implementation truth, versus
- future implementation contract.

That ambiguity is risky in a regression-intolerant workflow because it can cause:

- overclaiming implemented behavior,
- wiring decisions based on nonexistent backend code,
- false assumptions during testing, and
- documentation drift hidden behind plausible architecture language.

## Documentation updates applied

This reconciliation now also keeps the authority hierarchy, dashboard current-truth docs, and supporting contract notes aligned with the repo.

Updated files:

- `README.md`
- `docs/00_TABLE_OF_CONTENTS.md`
- `docs/09_CRON_AND_WATCHDOG.md`
- `docs/12_STATE_AND_RECOVERY.md`
- `docs/13_FRONTEND_BACKEND_CONTRACT.md`
- `docs/15_CURRENT_IMPLEMENTATION_STATUS.md`
- `docs/16_DOCUMENTATION_RECONCILIATION_REPORT.md`
- `docs/DASHBOARD_OVERVIEW.md`
- `docs/VIEW_A_INIT.md`
- `docs/VIEW_B_TEST.md`
- `docs/VIEW_C_LAST_RUN_INFO.md`
- `docs/VIEW_D_RUNNING_PROCESS.md`
- `placeholder_implementations.md`

## Current high-value conflicts

The most important conflicts now resolved or explicitly documented are:

- inspected code now outranks stale current-truth summaries when answering “what is implemented now?”
- `docs/19` through `docs/22` now outrank broader target-state summaries when target docs overlap
- View B no longer claims nonexistent B5 apply/simulate buttons in current-truth docs
- View D now documents the current shared D4 log layout and the preview-only start control honestly
- supporting contract docs now label scheduler/recovery/runtime behavior as target-state where the repo does not yet implement it

## What changed conceptually

### Preserved

Preserved:

- the existing frontend implementation
- the target architecture document family
- the view-specific docs
- the issue registry
- the existing architecture direction

### Changed

Changed:

- added a formal “current implementation vs target architecture” split
- made the implementation-status document authoritative for repo reality
- clarified that target backend docs define future constraints, not current execution truth
- updated the reading order so implementation questions are answered from implementation docs first
- tightened authority order so inspected code outranks stale summary docs for “implemented now”
- elevated the canonical target-state contract set in `docs/18` through `docs/22` above broader target summaries when topics overlap
- corrected current-truth view docs where the live UI had drifted from earlier descriptions

### Risks reduced

Reduced risks:

- treating planned APIs as already implemented
- treating mock runtime truth as durable runtime truth
- confusing simulated worker behavior with live worker processes
- using target docs alone to claim current repo capability

## Recommended reading behavior

Use:

- inspected code and repo contents first when the question is “what is implemented now?”
- `15_CURRENT_IMPLEMENTATION_STATUS.md` for the consolidated current-truth summary
- `16_DOCUMENTATION_RECONCILIATION_REPORT.md` for the authority split, conflict notes, and reconciliation rationale
- `DASHBOARD_OVERVIEW.md` + `VIEW_A_INIT.md` through `VIEW_D_RUNNING_PROCESS.md` for current UI behavior
- `19` through `22` first when planning backend implementation, then `18`, then the supporting target docs in `01` through `14`

## Residual limitations

This reconciliation updates documentation clarity, but it still does not create the full planned backend/runtime system. The repo now includes a minimal A backend slice, but it does not create:

- persistence
- workers
- fully resolved scheduler-driven runtime integration
- real runtime telemetry

Those remain future implementation work.

## Evidence Basis

Derived from direct inspection of the uploaded repository contents, especially:

- `package.json`
- `vite.config.js`
- `dashboard/`
- `dist/`
- `generated_test_data/`
- `docs/`
