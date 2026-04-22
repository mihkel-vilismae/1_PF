# View B B3 Auto Run All Stages

## Scope

- View: `B - Test`
- Section: `B3`
- Control: `Run all stages`
- Action key: `data-action="run-b3-auto"`

## Final Classification

`⚠️ Partial`

Root cause: runtime behavior now orchestrates real backend stage endpoints sequentially, but inspect metadata still labels this control as mock/frontend-missing (`dashboard/inspect/guideCopy.json:275-277`, `:363-365`).

## Workflow Result

| Step | Result | Evidence | Notes |
| --- | --- | --- | --- |
| 1. UI Trigger | Pass | `dashboard/views/testView.js:65` renders `Run all stages`. | Control exists. |
| 2. Frontend Wiring | Pass | `dashboard/app.js:260-308`; `runtimeTruthBehavior.js:123` maps `run-b3-auto`. | Wiring is active. |
| 3. Frontend -> Backend Call | Pass | `runtimeTruthDemoActions.js:305-356` chains B3.1->B3.5 backend stage actions. | Sequence is explicit. |
| 4. Backend Endpoint Existence | Pass | Routes for all chained stages exist in `server/index.js:122-127`. | All required stage routes are registered. |
| 5. Backend Logic Execution | Pass | Stage endpoints pass in `tests/waveB.step3.test.js`, `tests/waveC.step4.test.js`, `tests/waveA.step2.test.js`, `tests/waveD.e2e.test.js`. | Real execution confirmed. |
| 6. Response Handling (Frontend) | Pass | `runBackendPipelineStage()` and `runAutoPipeline()` maintain lock/status/history (`runtimeTruthDemoActions.js:257-356`). | Single-stage lock and sequential completion work. |
| 7. Mock / Reality Validation | Partial | Code is backend-backed, but inspect reality metadata says mock for this control. | Truth drift in metadata. |
| 8. Inspect System Alignment | Fail | `guideCopy.json` claims frontend-only mock auto pipeline, contradicting runtime behavior. | Metadata needs correction. |
| 9. Test Coverage | Pass | `tests/viewB.buttonWorkflow.test.js` validates request order and status completion; backend stage suites pass. | Coverage is adequate. |

## Registry Update

- `RUN_LOG.md` appended: yes
- `INDEX.md` updated to latest status: yes
