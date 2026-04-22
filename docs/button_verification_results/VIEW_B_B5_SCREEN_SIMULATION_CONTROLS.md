# View B B5 Screen Simulation Controls

## Scope

- View: `B - Test`
- Section: `B5`
- Controls: `Enable PIR sensor`, `Enable mouse movement`, `Enable keyboard activity`, `Enable all`
- Control keys: input names `pirEnabled`, `mouseEnabled`, `keyboardEnabled`, `simulateAllEnabled`

## Final Classification

`🧪 Mock-only`

## Workflow Result

| Step | Result | Evidence | Notes |
| --- | --- | --- | --- |
| 1. UI Trigger | Pass | `dashboard/views/testView.js:112-116` renders four B5 simulation toggle controls. | Controls exist and are interactive. |
| 2. Frontend Wiring | Pass | `dashboard/app.js:331-341` binds change handlers for all four B5 toggles. | Event wiring is active. |
| 3. Frontend -> Backend Call | Mock-only | `dashboard/services/runtimeTruth.js:238-257` updates local simulation state and invokes local screen simulation logic. | No backend request is attempted. |
| 4. Backend Endpoint Existence | Mock-only | No B5 backend route in `server/index.js` for these controls. | Intentional simulation surface. |
| 5. Backend Logic Execution | Mock-only | N/A for this control group. | Frontend simulation only. |
| 6. Response Handling (Frontend) | Pass | `runtimeTruthDemoActions.js:54-96` applies screen/playback simulation updates and logs. | Operator-visible state updates work. |
| 7. Mock / Reality Validation | Pass | UI copy explicitly states frontend-only simulation (`dashboard/views/testView.js:110`). | Honest mock labeling. |
| 8. Inspect System Alignment | Pass | Inspect copy includes B5 simulation control descriptions (`dashboard/inspect/guideCopy.json:440-453`). | Metadata matches implementation intent. |
| 9. Test Coverage | Partial | Current automated suite has indirect coverage via runtime state helpers but no dedicated B5 toggle workflow test. | Acceptable for audit, but could be strengthened. |

## Registry Update

- `RUN_LOG.md` appended: yes
- `INDEX.md` updated to latest status: yes
