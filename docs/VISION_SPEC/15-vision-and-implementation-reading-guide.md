# Vision and Implementation Documentation

Status: Slice 3 completed vision/specification set.
Created: 2026-04-26 19:47 EEST.
Updated: 2026-04-26 20:08 EEST.
Scope: up-to-date documentation authority folder for the photo-frame dashboard/runtime system.

## Purpose

This folder is the current reconciled documentation entrypoint for the project vision, current implementation reality, target architecture, pipeline/workers, authentication, scheduler/recovery, documentation authority, and unresolved decisions.

Use this folder before relying on older planning docs. Older docs may still contain useful historical detail, but claims from old docs should be treated as historical until reconciled here or verified against the repository.

## Reading order

1. `15-vision-and-implementation-reading-guide.md`
2. `05-project-vision.md`
3. `07-current-implementation-spec.md`
4. `11-dashboard-views-spec.md`
5. `06-target-architecture-spec.md`
6. `08-pipeline-and-workers-spec.md`
7. `10-auth-and-2fa-spec.md`
8. `09-scheduler-and-runtime-recovery-spec.md`
9. `12-documentation-authority-map.md`
10. `17-deprecated-superseded-docs-log.md`
11. `16-unresolved-questions.md`
12. `reconciliation/13-final-vision-spec-reconciliation-report.md`

## Authority rule

The current authority order is:

1. Current source code and tests for implementation reality.
2. This `docs/vision_and_implementation/` documentation set for reconciled vision/specification claims.
3. Root project files such as `15-vision-and-implementation-reading-guide.md`, `HOW_TO_RUN.md`, `VERSION`, `CHANGELOG.md`, and `package.json` for project metadata and run information.
4. Active workflow docs under `docs/active_workflow_docs/` for recent workflow evidence.
5. Older docs under `docs/OLD_DOCS/` and historical task docs only after their content is harvested or verified.

## Current status summary

| Area | Status after Slice 3 |
|---|---|
| Product vision | Documented in `05-project-vision.md`. |
| Current implementation reality | Documented in `07-current-implementation-spec.md`. |
| Dashboard view roles | Documented in `11-dashboard-views-spec.md`. |
| Target architecture | Documented in `06-target-architecture-spec.md`. |
| Pipeline and workers | Documented in `08-pipeline-and-workers-spec.md`. |
| Auth and 2FA | Documented in `10-auth-and-2fa-spec.md`. |
| Scheduler and recovery | Documented in `09-scheduler-and-runtime-recovery-spec.md`. |
| Deprecated/superseded docs | Logged in `17-deprecated-superseded-docs-log.md`; no files moved or deleted in this workflow. |
| Remaining ambiguity | Tracked in `16-unresolved-questions.md`. |

## Important current decisions

- Lock files are the intended active-instance truth for workers.
- Logs are evidence, history, and debugging trail.
- The database should hold durable media pipeline and recovery state.
- `conf/runtime-truth.json` is currently a runtime/dashboard bridge, not yet the final worker truth model.
- The dashboard should display backend/runtime truth and avoid inventing local truth.
- Auth must be backend-owned and provider-evidenced; no fake authenticated status.
- Mock/test behavior must remain visibly separated from real runtime behavior.

## Important remaining decisions

The highest-impact remaining decisions are listed in `16-unresolved-questions.md` and summarized in the final reconciliation report. They should be answered before implementation slices that change worker behavior, scheduler installation, auth/2FA provider behavior, or documentation relocation.
