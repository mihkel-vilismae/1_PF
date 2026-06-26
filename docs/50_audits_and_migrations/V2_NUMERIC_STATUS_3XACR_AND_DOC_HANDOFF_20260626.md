# V2 numeric status 3XACR and document handoff

Estonian timestamp: 2026-06-26 23:12 EEST

Baseline analyzed: `v0.10.67`, HEAD `1f0e71174537d350cd6fa0d7250fe6dee77f2e0f`. Docs reconciliation output checkpoint: `v0.10.68`.

## Scope

This is a 3XACR status analysis of the V2 OpenSpec, implementation reality, and path toward the final `09 REAL PLAYBACK` goal, followed by a 2XACR docs reconciliation pass.

This report is not based only on prose documents. It was cross-checked against the current repository code and targeted tests.

## Evidence inspected

| Evidence source | Result |
| --- | --- |
| `docs/20_architecture_and_specs/openspec/V2_GoalSummary.md` | Defines the intended V2 flow and final `09 REAL PLAYBACK` endpoint. |
| `docs/20_architecture_and_specs/openspec/V2_ImplementationStatus.md` | Main human-readable implementation-status authority. |
| `dashboard/data/v2ImplementationStatus.json` | Frontend-readable status overlay source. |
| `dashboard/services/v2VictoryProofGate.ts` | B12 proof gate blocks victory without live playback and recovery evidence. |
| `tools/run-v2-target-live-proof-readiness.mjs` | Generates target live readiness manifest while keeping `liveVictoryClaimAllowed: false`. |
| Targeted V2 tests | `38/38` passed after dependency installation with `npm ci --ignore-scripts`. |

## 3XACR pass notes

| Pass | Focus | Result |
| --- | --- | --- |
| 1 | Requirements/OpenSpec coverage | V2 requirements are mostly specified and current, but the final live target proof remains intentionally open. |
| 2 | Code/test reality | B10/B11/B12 code and targeted tests exist. The sandbox can prove composition, status projection, recovery contracts, and gate blocking, but not target hardware operation. |
| 3 | Risk and release path | The release path is no longer "add more optimistic UI". It is target-machine evidence collection, then docs/status reconciliation from that evidence. |

## OpenSpec table

| # | OpenSpec area | Current reality | Main remaining gap | Finished 1-10 |
| ---: | --- | --- | --- | ---: |
| 1 | V2 goal summary and operator intent | Goal path and nine-page structure are documented. | Needs live evidence to close the final goal, not more prose. | 9 |
| 2 | `01 SETUP` / `02 AUTHENTICATION` contracts | Setup/Auth controls are documented and wired to existing action families. | Live env/database/auth/session evidence remains required. | 7 |
| 3 | `03 STARTUP` scheduler contract | Raspberry scheduler/crontab direction is documented and represented in UI. | Target crontab install/status proof remains required. | 6 |
| 4 | `04 WORKERS` B3.1-B3.5 contract | Download, Index, GPS, Geocode, and Queue cards/endpoints are documented. | Live worker pipeline proof remains required. | 7 |
| 5 | `05 TROUBLESHOOTING` stale-lock contract | Detect/clear stale-lock actions and endpoints are documented. | Real stale-lock scenario proof remains required. | 6 |
| 6 | `06 RECOVERY` state contract | Recovery schema, manual save/load, autosave, and restart-check boundaries are documented. | Abrupt-stop/restart target proof remains required. | 8 |
| 7 | `07 PIR` activity/screen contract | PIR emulator and visible activity subset are documented. | Real PIR hardware and screen off/on proof remain required. | 5 |
| 8 | `08 PLAYBACK` queue/render/metadata contract | Rendering controls, queue bridge, media-only insertion, and honest metadata rules are documented. | Target fullscreen playback and visible address overlay proof remain required. | 7 |
| 9 | `09 REAL PLAYBACK` composition contract | Final page composition and read-only projection are documented. | Autonomous target run evidence remains required. | 8 |
| 10 | B12 live victory proof contract | Gate and readiness manifest are documented and conservative. | Live autonomous playback/recovery/PIR evidence is not attached yet. | 7 |

## Implementation status table

| # | Implementation area | Current state | Evidence | Finished 1-10 |
| ---: | --- | --- | --- | ---: |
| 1 | V2 page shell and sidebar | Implemented/tested across `01`-`09`. | V2 sidebar/status sync tests. | 9 |
| 2 | V2 status/help overlay | Implemented/tested with JSON-backed targets. | `tests/v2ImplementationStatusSync.test.js`. | 9 |
| 3 | Setup/Auth actions | Wired through existing frontend/backend action contracts. | Setup/Auth placement tests and status docs. | 7 |
| 4 | Startup scheduler and shared RPI rows | UI placement and target labels exist. | Startup/Workers placement tests; target proof pending. | 6 |
| 5 | Worker stage cards | B3.1-B3.5 controls are present and mapped to runtime endpoints. | V2 control matrix and worker-card tests. | 7 |
| 6 | Troubleshooting pipeline maintenance | Detect/clear actions are wired and result surfaces render. | `tests/v2PipelineMaintenanceProof.test.js`. | 6 |
| 7 | Recovery save/load/autosave/restart-check | Schema and backend/frontend recovery endpoints are implemented/tested. | Recovery state/manual/autosave tests. | 8 |
| 8 | PIR page | Activity subset and PIR emulator exist. | Placement/render tests; hardware proof pending. | 5 |
| 9 | Playback page | Rendering controls, drag/drop queue, metadata bridge, and queue bridge exist/test. | Playback metadata/bridge tests. | 7 |
| 10 | `09 REAL PLAYBACK` page | Integrated layout and status projection compose proven pieces only. | Real playback composition/projection tests. | 8 |
| 11 | B12 proof gate | Gate blocks customer-ready claims without live evidence and can pass only with explicit live evidence flags. | `tests/v2VictoryProofGate.test.js`. | 7 |
| 12 | Target live proof evidence | Proof scripts/readiness manifest exist; evidence is not attached. | `tests/v2TargetLiveProofReadiness.test.js`; manifest status remains `target_proof_pending`. | 3 |

## Path toward goal table

| Order | Next path item | Current readiness | Done when | Finished 1-10 |
| ---: | --- | --- | --- | ---: |
| 1 | Prepare target proof run package | Scripts and readiness manifest exist. | Target machine can run the listed proof commands and export evidence. | 7 |
| 2 | Run Raspberry scheduler/crontab proof | UI/contract exists; target proof pending. | Crontab is installed, active, and running the intended worker commands on Raspberry. | 5 |
| 3 | Run autonomous media pipeline proof | Worker cards/endpoints and product pipeline proof infrastructure exist. | Real media moves Download -> Index -> GPS parser -> Geocode -> Queue on target. | 6 |
| 4 | Run native image/video fullscreen proof | Target-gated native playback proof scripts exist. | Image/video playback is observed on target display with bounded proof output. | 5 |
| 5 | Run address overlay proof | Overlay contracts/proofs exist. | Address appears when metadata exists, and missing address is handled honestly. | 5 |
| 6 | Run abrupt-stop/restart recovery proof | Save/load/autosave/restart-check are implemented/tested. | Same media/queue context restores after restart or rough shutdown. | 6 |
| 7 | Run PIR hardware/screen proof | Emulator exists; hardware proof is pending. | PIR transition is observed and screen on/off behavior is proven or safely blocked with evidence. | 4 |
| 8 | Attach evidence to B12 gate | Gate exists and blocks without evidence. | Live autonomous playback and live autonomous recovery evidence flags/artifacts are present. | 3 |
| 9 | DOCS.3 reconciliation | Current docs are honest for pre-live state. | Docs/JSON/status UI are updated from actual live target proof results. | 4 |
| 10 | Release-readiness decision | Product shape is close; live proof is the blocker. | No required gate remains blocked; B12 is passed with target evidence. | 6 |

## Handoff for the next prompt

Use this handoff when updating docs after target proof evidence is produced or when another model continues the documentation slice.

```text
Baseline: PF_login / PhotoFrame v0.10.67, HEAD 1f0e71174537d350cd6fa0d7250fe6dee77f2e0f. Preserve all current B1-B12 behavior and do not mark target/live victory passed without real target evidence.

Task: update the related V2 documents from the 3XACR numeric status analysis. Keep every table item numeric 1-10. Reconcile these docs together: docs/20_architecture_and_specs/openspec/V2_ImplementationStatus.md, docs/40_backlog_and_tasks/V2_NEXT_IMPLEMENTATION_PLAN_20260626.md, docs/50_audits_and_migrations/V2_TARGET_LIVE_PROOF_READINESS_20260626.md, docs/20_architecture_and_specs/openspec/README.md, CHANGELOG.md, VERSION, package.json, and package-lock.json.

Rules:
- Keep B12 conservative: liveVictoryClaimAllowed stays false until target evidence exists.
- Treat 09 REAL PLAYBACK as composition/projection implemented, not target victory proven.
- Preserve the architecture: reuse existing V2 wrapper/status JSON/proof-gate contracts; no duplicated UI/docs truth sources.
- Update human docs and frontend-readable status truth together if any implementation status changes.
- Run targeted V2 tests after docs update: npm test -- --test-reporter=spec tests/v2ImplementationStatusSync.test.js tests/v2RealPlaybackComposition.test.js tests/v2RealPlaybackProjection.test.js tests/v2RecoveryStateSchema.test.js tests/v2RecoveryManualEndpoints.test.js tests/v2RecoveryAutosaveRestart.test.js tests/v2VictoryProofGate.test.js tests/v2TargetLiveProofReadiness.test.js tests/v2PlaybackMetadataBridge.test.js tests/v2PlaybackMediaMetadataProof.test.js tests/v2PipelineMaintenanceProof.test.js tests/v2ControlActionProofMatrix.test.js

Expected outcome: docs show numeric 1-10 finish values, path-to-goal prioritizes LIVE.1, LIVE.2, PIR.1, and DOCS.3, and no document claims live playback/recovery/PIR proof has passed unless real evidence is attached.
```

## 2XACR document update result

| Pass | Update made | Result |
| --- | --- | --- |
| 1 | Added this report as the durable 3XACR numeric status and handoff artifact. | The three requested numeric tables now exist in repo docs. |
| 2 | Updated related V2 status/plan/readiness docs to point at the numeric table and keep the target-live boundary explicit. | Documentation now directs next work toward target evidence rather than UI optimism. |

## Preserved behavior

- No runtime code was changed.
- No frontend status color changed to green/done for live target proof.
- The B12 proof gate remains blocked without explicit live playback and recovery evidence.
- `proof:v2-target-live-readiness` remains a readiness manifest generator, not a victory claim.

## Known risks

- The numeric scores are an engineering readiness estimate, not generated proof artifacts.
- Target hardware evidence is still external to this sandbox.
- PIR hardware proof remains lower-confidence than playback/recovery because current implementation only has an emulator path.
