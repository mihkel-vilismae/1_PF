# View B B1 Login Flow

## Scope

- View: `B - Test`
- Section: `B1`
- Control: `Run`
- Action key: `data-action="run-b1"`

## Authoritative Spec Callout

Merged spec states B1 auth belongs in View A as init/preflight and is not a View B stage action (`docs/VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md:168-185`, `:910-920`).

## Final Classification

`🧪 Mock-only`

## Workflow Result

| Step | Result | Evidence | Notes |
| --- | --- | --- | --- |
| 1. UI Trigger | Pass | `dashboard/views/testView.js:29` renders B1 run button. | Control exists. |
| 2. Frontend Wiring | Pass | `dashboard/app.js:260-308` shared dispatch; `dashboard/services/runtimeTruth/runtimeTruthBehavior.js:116` maps `run-b1` to `runLoginFlow()`. | Click path is wired. |
| 3. Frontend -> Backend Call | Mock-only | `dashboard/services/runtimeTruth/runtimeTruthDemoActions.js:120-156` uses local timers/state only. | No network request is made. |
| 4. Backend Endpoint Existence | Mock-only | No `run-b1` backend route exists in `server/index.js` route table. | By design in current code. |
| 5. Backend Logic Execution | Mock-only | N/A for this control. | Frontend simulation only. |
| 6. Response Handling (Frontend) | Pass | `runLoginFlow()` updates `loginSteps`, logs, history, and status (`runtimeTruthDemoActions.js:124-155`). | Visible UI updates work. |
| 7. Mock / Reality Validation | Pass | `dashboard/inspect/guideCopy.json:247-250` marks `run-b1` as mock. | Matches implementation truth. |
| 8. Inspect System Alignment | Pass | Inspect metadata matches current behavior. | Still conflicts with authoritative placement intent. |
| 9. Test Coverage | Pass | `tests/viewB.buttonWorkflow.test.js` verifies B1 completes without backend calls. | Added in this run. |

## Registry Update

- `RUN_LOG.md` appended: yes
- `INDEX.md` updated to latest status: yes
