# V2_TARGET_LIVE_PROOF_READINESS_20260626

Checkpoint: `v0.10.67`.

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
