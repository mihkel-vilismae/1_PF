# View A 2A Recreate DB

## Scope

- View: `A - Init`
- Section: `2A`
- Control: `Recreate DB`
- Action key: `data-action="recreate-db"`

## Final Classification

`✅ Works`

## Evidence Basis

This pass used static code tracing, live endpoint execution, and executable tests. No browser automation was used.

## Workflow Result

| Step | Result | Evidence | Notes |
| --- | --- | --- | --- |
| 1. UI Trigger | Pass | `dashboard/views/initView.js` renders `data-action="recreate-db"`. | Button exists in `2A` controls row. |
| 2. Frontend Wiring | Pass | `dashboard/app.js` confirms via `window.confirm()` before calling `runAction('recreate-db', { confirmationSource: 'window.confirm' })`. | Cancel path blocks request and records warning history. |
| 3. Frontend -> Backend Call | Pass | `runtimeTruthBehavior.js` maps `recreate-db`; `initService.js` posts to `/api/init/database/recreate-empty` with `{confirm:true, action:'recreate-db'}`. | Request contract matches docs and backend expectations. |
| 4. Backend Endpoint Existence | Pass | `server/index.js` registers `POST /api/init/database/recreate-empty`. | Route exists and responds. |
| 5. Backend Logic Execution | Pass | Live call returned `200` with `status: "ok"`, `confirmed: true`, and `database.existsAfter=true`. | Handler recreated an empty SQLite file as designed. |
| 6. Response Handling (Frontend) | Pass | `runtimeTruthDatabaseActions.runInitAction()` stores operation result in `initResults["2A"]` and updates status/log/history. | UI receives and renders recreated DB summary details. |
| 7. Mock / Reality Validation | Pass | `dashboard/inspect/guideCopy.json` marks `recreate-db` as `real`. | This path performs backend file operations, not placeholders. |
| 8. Inspect System Alignment | Pass | Inspect metadata description for `recreate-db` matches destructive-recreate behavior and confirmation requirement. | Metadata remains centralized and current. |
| 9. Test Coverage | Pass | `tests/initApi.step1.test.js` validates confirmation guards and recreate success; `tests/viewA.2A.databaseButtons.buttonWorkflow.test.js` validates frontend dispatch/payload; inspect metadata tests passed. | Both backend contract and frontend runner behavior are covered. |

## Live Result Summary

- Backend status: `200 OK`
- Key payload facts: response contained `confirmed: true`, `database.existsAfter=true`, `database.sizeBytesAfter=4096`, `schemaVersion=1`.
- Operator-visible outcome: recreate action reliably provisions a clean SQLite file and makes follow-up inspect/status calls succeed.

## Notes

- Backend intentionally rejects malformed destructive payloads with `400 missing_confirmation`; the valid UI path satisfies this contract.

## Registry Update

- `RUN_LOG.md` appended: yes
- `INDEX.md` updated to latest status: yes
