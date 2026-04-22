# View A 3A Check Scheduler

## Scope

- View: `A - Init`
- Section: `3A`
- Control: `Check scheduler`
- Action key: `data-action="check-cron"`

## Authoritative Spec Callout

Merged spec requires check behavior to read cron jobs, print them, compare exact canonical three-job set, and fail when jobs are missing/extra (`docs/VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md:136-164`, `:897-904`). Current implementation reports platform capability plus Windows Task Scheduler bootstrap-host state instead (`server/index.js:1546-1577`, `:1713-1795`).

## Final Classification

`⚠️ Partial`

Root cause: check endpoint does not perform canonical cron-list verification required by authoritative spec.

## Evidence Basis

This pass used static code tracing, live endpoint execution in a temporary environment, and executable tests. Browser automation was not used.

## Workflow Result

| Step | Result | Evidence | Notes |
| --- | --- | --- | --- |
| 1. UI Trigger | Pass | `dashboard/views/initView.js:52` renders `data-action="check-cron"` with `Check scheduler`. | Control exists in `3A`. |
| 2. Frontend Wiring | Pass | `dashboard/app.js:260-308` dispatches click actions; `dashboard/services/runtimeTruth/runtimeTruthBehavior.js:109` maps `check-cron`. | Wiring is direct and shared. |
| 3. Frontend -> Backend Call | Pass | `dashboard/services/initService.js:6-7` defines `GET /api/init/cron/status`; `checkCronStatus()` at `:57-59` calls it. | Method/path match implementation contract. |
| 4. Backend Endpoint Existence | Pass | `server/index.js:114` registers `GET /api/init/cron/status`; handler at `:359-360`. | Route exists and is reachable. |
| 5. Backend Logic Execution | Partial | Live call returned `200`, `status: "warning"`, `operationSupportLevel: "supported"`, `taskInstalled: true`, `hostState: "not-observed"` with Task Scheduler-oriented messages. | Real execution path works, but logic does not validate cron canonical set as authoritative spec requires. |
| 6. Response Handling (Frontend) | Pass | `dashboard/services/runtimeTruth/runtimeTruthDatabaseActions.js:31-133` captures payload/log/history for `3A`; `dashboard/views/initView.js:73-74` renders result + logs. | Operator sees backend payload and status transitions. |
| 7. Mock / Reality Validation | Pass | `dashboard/inspect/guideCopy.json:219-222` classifies `check-cron` as real endpoint call. | Backend-backed path is real. |
| 8. Inspect System Alignment | Partial | Inspect metadata aligns with current endpoint behavior, but authoritative cron-verification semantics are still unmet. | Spec-vs-implementation drift remains explicit. |
| 9. Test Coverage | Pass | `tests/initApi.step1.test.js` now covers `GET /api/init/cron/status`; `tests/viewA.3A.schedulerButtons.buttonWorkflow.test.js` covers action mapping and state updates. | Backend and frontend paths are exercised. |

## Live Result Summary

- Backend status: `200 OK`, payload `status: "warning"`
- Key payload facts: messages included installed Windows Task Scheduler task, missing scheduler-host heartbeat, and future-work notice for business services.
- Operator-visible outcome: action returns deterministic scheduler state data and updates the `3A` card surfaces.

## Notes

- This is partially implemented relative to authoritative intent: endpoint is live and useful, but not performing cron canonical validation.

## Registry Update

- `RUN_LOG.md` appended: yes
- `INDEX.md` updated to latest status: yes
