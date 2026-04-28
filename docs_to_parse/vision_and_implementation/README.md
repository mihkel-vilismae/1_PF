# Vision and Implementation Documentation

Status: Slice 3 completed vision/specification set.
Created: 2026-04-26 19:47 EEST.
Updated: 2026-04-26 20:08 EEST.
Scope: up-to-date documentation authority folder for the photo-frame dashboard/runtime system.

## Purpose

This folder is the current reconciled documentation entrypoint for the project vision, current implementation reality, target architecture, pipeline/workers, authentication, scheduler/recovery, documentation authority, and unresolved decisions.

Use this folder before relying on older planning docs. Older docs may still contain useful historical detail, but claims from old docs should be treated as historical until reconciled here or verified against the repository.

## Reading order

1. `README.md`
2. `PROJECT_VISION.md`
3. `CURRENT_IMPLEMENTATION_SPEC.md`
4. `DASHBOARD_VIEWS_SPEC.md`
5. `TARGET_ARCHITECTURE_SPEC.md`
6. `PIPELINE_AND_WORKERS_SPEC.md`
7. `AUTH_AND_2FA_SPEC.md`
8. `VIEW_A_AUTH_PREFLIGHT_BUTTONS.md`
9. `SCHEDULER_AND_RUNTIME_RECOVERY_SPEC.md`
9. `DOCUMENTATION_AUTHORITY_MAP.md`
10. `DEPRECATED_SUPERSEDED_DOCS_LOG.md`
11. `UNRESOLVED_QUESTIONS.md`
12. `reconciliation/FINAL_VISION_SPEC_RECONCILIATION_REPORT.md`

## Authority rule

The current authority order is:

1. Current source code and tests for implementation reality.
2. This `docs/vision_and_implementation/` documentation set for reconciled vision/specification claims.
3. Root project files such as `README.md`, `HOW_TO_RUN.md`, `VERSION`, `CHANGELOG.md`, and `package.json` for project metadata and run information.
4. Active workflow docs under `docs/active_workflow_docs/` for recent workflow evidence.
5. Older docs under `docs/OLD_DOCS/` and historical task docs only after their content is harvested or verified.

## Current status summary

| Area | Status after Slice 3 |
|---|---|
| Product vision | Documented in `PROJECT_VISION.md`. |
| Current implementation reality | Documented in `CURRENT_IMPLEMENTATION_SPEC.md`. |
| Dashboard view roles | Documented in `DASHBOARD_VIEWS_SPEC.md`. |
| Target architecture | Documented in `TARGET_ARCHITECTURE_SPEC.md`. |
| Pipeline and workers | Documented in `PIPELINE_AND_WORKERS_SPEC.md`. |
| Auth and 2FA | Documented in `AUTH_AND_2FA_SPEC.md`. |
| View A auth buttons | Documented in `VIEW_A_AUTH_PREFLIGHT_BUTTONS.md`; Slice 3 adds per-button truth rules, status circles, and compatibility naming notes. |
| Scheduler and recovery | Documented in `SCHEDULER_AND_RUNTIME_RECOVERY_SPEC.md`. |
| Deprecated/superseded docs | Logged in `DEPRECATED_SUPERSEDED_DOCS_LOG.md`; no files moved or deleted in this workflow. |
| Remaining ambiguity | Tracked in `UNRESOLVED_QUESTIONS.md`. |

## Important current decisions

- Lock files are the intended active-instance truth for workers.
- Logs are evidence, history, and debugging trail.
- The database should hold durable media pipeline and recovery state.
- `conf/runtime-truth.json` is currently a runtime/dashboard bridge, not yet the final worker truth model.
- The dashboard should display backend/runtime truth and avoid inventing local truth.
- Auth must be backend-owned and provider-evidenced; no fake authenticated status.
- View A `1A-AUTH` owns the auth UI; old B1 action/status keys are compatibility adapters only.
- Mock/test behavior must remain visibly separated from real runtime behavior.

## Important remaining decisions

The highest-impact remaining decisions are listed in `UNRESOLVED_QUESTIONS.md` and summarized in the final reconciliation report. They should be answered before implementation slices that change worker behavior, scheduler installation, auth/2FA provider behavior, or documentation relocation.
