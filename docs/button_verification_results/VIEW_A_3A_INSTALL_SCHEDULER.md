# View A 3A Install Scheduler

## Scope

- View: `A - Init`
- Section: `3A`
- Control: `Install scheduler`
- Action key: `data-action="install-cron"`

## Authoritative Spec Callout

The merged authoritative spec defines scheduler install as Raspberry Pi OS cron destructive replace with explicit Cancel/OK confirmation (`docs/VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md:92-132`, `:870-890`). Current implementation targets Windows Task Scheduler bootstrap-host wiring (`server/index.js:1546-1577`, `shared/schedulerPlatformCapabilities.js:16-33`), so expected behavior and implemented behavior diverge.

## Final Classification

`⚠️ Partial`

Root cause: install semantics do not match the authoritative cron-based destructive-confirmation flow.

## Evidence Basis

This pass used static code tracing, executable tests, and related live scheduler status/print endpoint evidence. The install endpoint itself was not live-triggered in this run to avoid mutating host scheduler state during audit.

## Workflow Result

| Step | Result | Evidence | Notes |
| --- | --- | --- | --- |
| 1. UI Trigger | Pass | `dashboard/views/initView.js:51` renders `data-action="install-cron"` with label `Install scheduler`. | Control exists in `3A`. |
| 2. Frontend Wiring | Pass | `dashboard/app.js:260-308` dispatches all `data-action` clicks; `dashboard/services/runtimeTruth/runtimeTruthBehavior.js:108` maps `install-cron`. | Action is routed through shared runtime-truth behavior. |
| 3. Frontend -> Backend Call | Pass | `dashboard/services/initService.js:5` defines `POST /api/init/cron/install`; `installCron()` at `:53-55` calls it. | Method/path are explicit and stable. |
| 4. Backend Endpoint Existence | Pass | `server/index.js:113` registers `POST /api/init/cron/install`; handler at `:355-356`. | Route exists. |
| 5. Backend Logic Execution | Partial | Install route resolves scheduler operation through Windows Task Scheduler helper (`server/index.js:1599-1629`). | Implementation is real but conflicts with authoritative cron-target behavior and confirmation expectations. |
| 6. Response Handling (Frontend) | Pass | `runtimeTruthDatabaseActions.runInitAction()` (`dashboard/services/runtimeTruth/runtimeTruthDatabaseActions.js:31-133`) stores status/log/history and result payload for `3A`. | Operator-visible surfaces are updated. |
| 7. Mock / Reality Validation | Pass | `dashboard/inspect/guideCopy.json:215-218` marks `install-cron` as real backend call. | Not mock-only. |
| 8. Inspect System Alignment | Partial | Inspect text claims live scheduler-install endpoint (`dashboard/inspect/guideCopy.json:217`), which is true for current code. | Authoritative spec still expects cron destructive-replace semantics, so truth-vs-spec remains partial. |
| 9. Test Coverage | Pass | `tests/viewA.3A.schedulerButtons.buttonWorkflow.test.js` (new) verifies action mapping/state handling; `tests/initApi.step1.test.js` covers related scheduler capability endpoints. | Frontend mapping and backend route family are covered. |

## Live Result Summary

- Backend status: related live `status` and `print` calls on `2026-04-23` returned `200` with `operationSupportLevel: "supported"` and `taskInstalled: true` for `Windows 11`.
- Key payload facts: scheduler messages report Task Scheduler install state and host-heartbeat state, plus explicit note that business services remain future work.
- Operator-visible outcome: `3A` result/log surfaces receive scheduler payloads and display warning-state details.

## Notes

- This classification is partial due to authoritative-spec mismatch, not because action wiring is missing.

## Registry Update

- `RUN_LOG.md` appended: yes
- `INDEX.md` updated to latest status: yes
