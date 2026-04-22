# View B B3.1 Download Stage

## Scope

- View: `B - Test`
- Section: `B3.1`
- Control: `Run`
- Action key: `data-action="run-b3-1"`

## Final Classification

`⚠️ Partial`

Root cause: backend route is real and functional, but stage behavior uses `icloudpd` worker semantics instead of authoritative generated-test-data mock-download semantics for test flow.

## Workflow Result

| Step | Result | Evidence | Notes |
| --- | --- | --- | --- |
| 1. UI Trigger | Pass | `dashboard/views/testView.js:69,149` renders B3.1 stage card + run button. | Control exists. |
| 2. Frontend Wiring | Pass | `runtimeTruthBehavior.js:118` maps `run-b3-1` to backend stage call. | Correct action map. |
| 3. Frontend -> Backend Call | Pass | `runtimeExecutionService.js:4,12-13` -> `POST /api/runtime/download/run`. | Request contract is explicit. |
| 4. Backend Endpoint Existence | Pass | `server/index.js:122,635` route + handler present. | Route exists. |
| 5. Backend Logic Execution | Partial | Endpoint runs and passes tests (`waveB.step3`, `waveD.e2e`) but not with authoritative mock-download source model. | Spec mismatch remains. |
| 6. Response Handling (Frontend) | Pass | `runBackendPipelineStage()` and `runBackendAction()` update status/log/history (`runtimeTruthDemoActions.js:257-293`, `:158-231`). | Stage feedback is visible. |
| 7. Mock / Reality Validation | Pass | `guideCopy.json:255-258` marks B3.1 real. | Matches implementation. |
| 8. Inspect System Alignment | Pass | Inspect metadata is aligned for B3.1. | No metadata drift for this control. |
| 9. Test Coverage | Pass | Backend covered by `tests/waveB.step3.test.js`; frontend runner path covered by `tests/viewB.buttonWorkflow.test.js` (auto sequence includes B3.1). | Coverage present. |

## Registry Update

- `RUN_LOG.md` appended: yes
- `INDEX.md` updated to latest status: yes
