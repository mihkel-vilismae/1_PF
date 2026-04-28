# View B B4 Playback Selection

## Scope

- View: `B - Test`
- Section: `B4`
- Control: `Run`
- Action key: `data-action="run-b4"`

## Authoritative Spec Callout

Merged spec expects test playback flow to use test DB queue, display overlay/address data, and continue automatically to next media after display duration (`docs/VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md:580-641`).

## Final Classification

`⚠️ Partial`

Root cause: B4 real backend selection is implemented, but full playback progression semantics remain incomplete in this control path.

## Workflow Result

| Step | Result | Evidence | Notes |
| --- | --- | --- | --- |
| 1. UI Trigger | Pass | `dashboard/views/testView.js:100` renders B4 run button. | Control exists. |
| 2. Frontend Wiring | Pass | `runtimeTruthBehavior.js:124` maps `run-b4` to playback action. | Wiring is correct. |
| 3. Frontend -> Backend Call | Pass | `runtimeExecutionService.js:9,32-33` -> `POST /api/runtime/playback/select-current`. | Contract wired. |
| 4. Backend Endpoint Existence | Pass | `server/index.js:127,863` route + handler present. | Endpoint exists. |
| 5. Backend Logic Execution | Pass | Stage 6 behavior and DB pointer/history updates validated in `tests/waveA.step2.test.js:61-108` and `tests/waveD.e2e.test.js:217-257`. | Real endpoint behavior confirmed. |
| 6. Response Handling (Frontend) | Pass | `runtimeTruthDemoActions.js:358-391` updates current media/overlay/checkpoint from backend selection payload. | UI shows selected backend item. |
| 7. Mock / Reality Validation | Pass | `guideCopy.json:279-282` marks B4 real. | Correct for current implementation. |
| 8. Inspect System Alignment | Pass | Backend-status copy for B4 is aligned (`guideCopy.json:387-390`). | No metadata contradiction. |
| 9. Test Coverage | Pass | Backend stage tests (`waveA.step2`, `waveD.e2e`) and frontend action path test (`tests/viewB.buttonWorkflow.test.js`) pass. | Coverage is adequate. |

## Registry Update

- `RUN_LOG.md` appended: yes
- `INDEX.md` updated to latest status: yes
