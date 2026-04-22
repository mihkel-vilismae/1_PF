# View B B2 Download Test Action

## Scope

- View: `B - Test`
- Section: `B2`
- Control: `Run`
- Action key: `data-action="run-b2"`

## Authoritative Spec Callout

Merged spec requires B mock-download behavior to use generated test data as source and copy to test download paths (`docs/VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md:289-319`).

## Final Classification

`✅ Works`

Result: endpoint is real and now implements the authoritative generated-test-data mock-download copy model.

## Workflow Result

| Step | Result | Evidence | Notes |
| --- | --- | --- | --- |
| 1. UI Trigger | Pass | `dashboard/views/testView.js:40` renders B2 run button. | Control exists. |
| 2. Frontend Wiring | Pass | `dashboard/app.js:260-308`; `runtimeTruthBehavior.js:117` maps `run-b2` to backend action. | Wiring is correct. |
| 3. Frontend -> Backend Call | Pass | `dashboard/services/runtimeExecutionService.js:4,12-13` uses `POST /api/runtime/download/run`. | Method/path match implementation. |
| 4. Backend Endpoint Existence | Pass | `server/index.js:122,635` defines route + handler. | Route exists. |
| 5. Backend Logic Execution | Pass | Endpoint runs successfully with generated-test-data copy semantics in tests (`tests/waveB.step3.test.js`, `tests/waveD.e2e.test.js`). | Execution and source model now match authoritative intent. |
| 6. Response Handling (Frontend) | Pass | `runtimeTruthDemoActions.js:158-231` `runBackendAction()` updates status/log/history. | Operator gets backend result summary. |
| 7. Mock / Reality Validation | Pass | `guideCopy.json:251-254` marks `run-b2` real. | Matches current implementation. |
| 8. Inspect System Alignment | Pass | Metadata aligns with current endpoint wiring. | No inspect drift for this control. |
| 9. Test Coverage | Pass | Backend covered by `waveB.step3`, `waveD.e2e`; frontend action path covered by `tests/viewB.buttonWorkflow.test.js`. | Evidence is strong. |

## Registry Update

- `RUN_LOG.md` appended: yes
- `INDEX.md` updated to latest status: yes
