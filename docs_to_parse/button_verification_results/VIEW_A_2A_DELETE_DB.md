# View A 2A Delete DB

## Scope

- View: `A - Init`
- Section: `2A`
- Control: `Delete DB`
- Action key: `data-action="delete-db"`

## Final Classification

`✅ Works`

## Evidence Basis

This pass used static code tracing, live endpoint execution, and executable tests. No browser automation was used.

## Workflow Result

| Step | Result | Evidence | Notes |
| --- | --- | --- | --- |
| 1. UI Trigger | Pass | `dashboard/views/initView.js` renders `data-action="delete-db"`. | Destructive button is explicitly shown in `2A`. |
| 2. Frontend Wiring | Pass | `dashboard/app.js` gates `delete-db` behind `window.confirm()` and only calls `runAction` on confirmation. | Cancellation path writes a warning history entry; request is not sent. |
| 3. Frontend -> Backend Call | Pass | `runtimeTruthBehavior.js` maps `delete-db`; `initService.js` posts to `/api/init/database/delete` with `{confirm:true, action:'delete-db'}` and merged confirmation metadata. | Frontend payload enforces destructive confirmation contract. |
| 4. Backend Endpoint Existence | Pass | `server/index.js` registers `POST /api/init/database/delete`. | Route is present and reachable. |
| 5. Backend Logic Execution | Pass | Live call returned `200`, `confirmed: true`, and `removedPaths` including the DB path. | Handler removed the SQLite file and reported post-delete state. |
| 6. Response Handling (Frontend) | Pass | `runtimeTruthDatabaseActions.runInitAction()` writes success/error state and result payload into `initResults["2A"]`, plus logs/history entries. | Card receives backend confirmation and artifact details. |
| 7. Mock / Reality Validation | Pass | `dashboard/inspect/guideCopy.json` marks `delete-db` as `real`. | Action executes backend file operations; not frontend-only logic. |
| 8. Inspect System Alignment | Pass | Inspect metadata for this control lives in `dashboard/inspect/guideCopy.json` and is consistent with confirmation-gated destructive behavior. | No inline inspect copy drift found. |
| 9. Test Coverage | Pass | `tests/initApi.step1.test.js` verifies confirmation guards and delete success; `tests/viewA.2A.databaseButtons.buttonWorkflow.test.js` verifies frontend payload/dispatch; inspect metadata tests passed. | Coverage includes wrong-action rejection and happy path. |

## Live Result Summary

- Backend status: `200 OK`
- Key payload facts: returned `status: "ok"`, `confirmed: true`, and `removedPaths` with the target SQLite file; subsequent status call showed `database.exists=false`.
- Operator-visible outcome: confirmed delete removes DB artifacts and updates the `2A` result/log surfaces.

## Notes

- Without correct confirmation payload (`confirm:true` + `action:'delete-db'`), backend intentionally returns `400 missing_confirmation`; this guard is tested.

## Registry Update

- `RUN_LOG.md` appended: yes
- `INDEX.md` updated to latest status: yes
