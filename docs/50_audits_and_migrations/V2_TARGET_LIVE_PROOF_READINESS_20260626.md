# V2_TARGET_LIVE_PROOF_READINESS_20260626

Introduced checkpoint: `v0.10.67`. Current docs reconciliation checkpoint: `v0.10.68`.

## ACR remaining-risk finding

After the dependency audit cleanup, the remaining unresolved risks are target-environment proof gaps. They cannot be honestly closed inside the sandbox because they require Raspberry hardware, live media playback, abrupt stop/restart observation, and PIR hardware evidence.

## Implementation added

`npm run proof:v2-target-live-readiness` now generates a conservative JSON readiness manifest. It lists the proof scripts and evidence categories required to clear the B12 gate:

- autonomous playback on target Raspberry hardware;
- abrupt stop/restart recovery on target Raspberry hardware;
- PIR hardware activity/screen proof.

The manifest keeps `liveVictoryClaimAllowed` set to `false` and marks every live proof group as `target_run_required` until external target evidence is attached.

## Boundary

This does not run live hardware proof and does not claim victory. It makes the remaining proof work executable and auditable.

## v0.10.68 numeric readiness clarification

The 3XACR numeric reconciliation keeps this document conservative:

| Live proof group | Required before victory claim | Finished 1-10 | Current status |
| --- | --- | ---: | --- |
| Autonomous playback | Scheduler, real media pipeline, fullscreen image/video playback, address overlay evidence. | 5 | Proof scripts and UI path exist; target evidence remains. |
| Autonomous recovery | Pre-shutdown snapshot, restart detection, same-media/queue restore, corrupt partial exclusion. | 6 | Recovery schema/endpoints/autosave/restart-check are implemented; rough target restart proof remains. |
| PIR hardware | Sensor transition, fallback input sources, inactivity off/on behavior. | 4 | Emulator path exists; hardware evidence remains. |
| B12 evidence attachment | Explicit live playback and live recovery evidence flags/artifacts. | 3 | Gate exists and intentionally blocks customer-ready claims. |

The full 3XACR table and handoff are in [`V2_NUMERIC_STATUS_3XACR_AND_DOC_HANDOFF_20260626.md`](V2_NUMERIC_STATUS_3XACR_AND_DOC_HANDOFF_20260626.md).

