# View A 3A Print Scheduler

## Scope

- View: `A - Init`
- Section: `3A`
- Control: `Print scheduler`
- Action key: `data-action="print-cron"`

## Authoritative Spec Callout

The merged spec treats scheduler verification as cron-based behavior and requires visible cron job list evidence as part of exact canonical verification (`docs/VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md:136-164`, `:897-904`). Current print action returns Windows Task Scheduler-oriented payload and exported task XML on supported Windows profile (`server/index.js:1713-1795`).

## Final Classification

`⚠️ Partial`

Root cause: print output is platform-capability/Task Scheduler metadata rather than authoritative cron-list verification evidence.

## Evidence Basis

This pass used static code tracing, live endpoint execution in a temporary environment, and executable tests. Browser automation was not used.

## Workflow Result

| Step | Result | Evidence | Notes |
| --- | --- | --- | --- |
| 1. UI Trigger | Pass | `dashboard/views/initView.js:53` renders `data-action="print-cron"` with `Print scheduler`. | Control exists in `3A`. |
| 2. Frontend Wiring | Pass | `dashboard/app.js:260-308` dispatches click actions; `dashboard/services/runtimeTruth/runtimeTruthBehavior.js:110` maps `print-cron`. | Wiring path is complete. |
| 3. Frontend -> Backend Call | Pass | `dashboard/services/initService.js:7` defines `GET /api/init/cron/print`; `printCron()` at `:61-63` calls it. | Method/path mapping is correct. |
| 4. Backend Endpoint Existence | Pass | `server/index.js:115` registers `GET /api/init/cron/print`; handler at `:363-364`. | Route exists and responds. |
| 5. Backend Logic Execution | Partial | Live call returned `200`, `status: "warning"`, `operationSupportLevel: "supported"`, `taskInstalled: true`, and exported task XML present. | Real execution is present, but payload targets Windows scheduler metadata instead of cron-list verification expected by authoritative spec. |
| 6. Response Handling (Frontend) | Pass | `dashboard/services/runtimeTruth/runtimeTruthDatabaseActions.js:31-133` captures payload/log/history for `3A`; result/log rendering occurs via `dashboard/views/initView.js:73-74`. | Backend response is visible in UI surfaces. |
| 7. Mock / Reality Validation | Pass | `dashboard/inspect/guideCopy.json:223-226` marks `print-cron` as real endpoint call. | Not a frontend-only placeholder action. |
| 8. Inspect System Alignment | Partial | Inspect metadata is technically accurate for current route wiring, but does not satisfy authoritative cron semantics. | Spec drift remains unresolved. |
| 9. Test Coverage | Pass | `tests/initApi.step1.test.js` now covers `GET /api/init/cron/print`; `tests/viewA.3A.schedulerButtons.buttonWorkflow.test.js` verifies action mapping/state updates. | Core path is covered in automated tests. |

## Live Result Summary

- Backend status: `200 OK`, payload `status: "warning"`
- Key payload facts: response included Task Scheduler installation state, host heartbeat state, business-service-future-work message, and exported XML for print path.
- Operator-visible outcome: print action returns backend scheduler diagnostics and renders them in `3A`.

## Notes

- The implementation is live and traceable but only partially aligned to authoritative cron-driven scheduler intent.

## Registry Update

- `RUN_LOG.md` appended: yes
- `INDEX.md` updated to latest status: yes
