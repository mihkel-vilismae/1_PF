# View A 2A Check DB

## Scope

- View: `A - Init`
- Section: `2A`
- Control: `Check DB`
- Action key: `data-action="check-db"`

## Final Classification

`✅ Works`

## Evidence Basis

This pass used static code tracing, live endpoint execution, and executable tests. No browser automation was used.

## Workflow Result

| Step | Result | Evidence | Notes |
| --- | --- | --- | --- |
| 1. UI Trigger | Pass | `dashboard/views/initView.js` renders `data-action="check-db"`. | Control is visible in block `2A`. |
| 2. Frontend Wiring | Pass | `dashboard/app.js` shared `[data-action]` click binding calls `runAction(action)`. | No dead click path found. |
| 3. Frontend -> Backend Call | Pass | `dashboard/services/runtimeTruth/runtimeTruthBehavior.js` maps `check-db` to `checkDatabaseStatus`; `dashboard/services/initService.js` defines `GET /api/init/database/status`. | Method/path match contract docs. |
| 4. Backend Endpoint Existence | Pass | `server/index.js` route table registers `GET /api/init/database/status`. | Route exists and is reachable. |
| 5. Backend Logic Execution | Pass | Live call returned `200` with payload `status: "warning"` when DB was missing, and `status: "ok"` after recreate. | Handler behavior matched DB file state transitions. |
| 6. Response Handling (Frontend) | Pass | `dashboard/services/runtimeTruth/runtimeTruthDatabaseActions.js` writes status, logs, history, and `initResults["2A"]`; `dashboard/views/initView.js` renders result/log surfaces. | `warning` payload is mapped to UI `info` status as designed. |
| 7. Mock / Reality Validation | Pass | `dashboard/inspect/guideCopy.json` marks `check-db` as `real` with backend endpoint reason. | No frontend-only mock branch on this action path. |
| 8. Inspect System Alignment | Pass | Inspect copy and mappings are metadata-driven in `dashboard/inspect/guideCopy.json` and helper modules in `dashboard/inspect/*.js`. | No inline drift found for this control. |
| 9. Test Coverage | Pass | `tests/initApi.step1.test.js`, `tests/viewA.2A.databaseButtons.buttonWorkflow.test.js`, and `tests/inspectMetadata.test.js` passed. | Backend and frontend paths are both covered. |

## Live Result Summary

- Backend status: `200 OK`
- Key payload facts: before recreate, `database.exists=false` and `status="warning"`; after recreate, `database.exists=true` and `status="ok"`; after delete, `database.exists=false` again.
- Operator-visible outcome: the card can surface readiness changes without mutating DB state.

## Notes

- `Check DB` intentionally reports `warning` when the file is absent; this is expected behavior, not a wiring failure.

## Registry Update

- `RUN_LOG.md` appended: yes
- `INDEX.md` updated to latest status: yes
