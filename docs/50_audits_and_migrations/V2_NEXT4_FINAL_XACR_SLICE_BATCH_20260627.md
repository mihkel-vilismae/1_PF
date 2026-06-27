# V2 next four XACR slice batch — 2026-06-27

## Scope

This batch applies the saved workflow `4SLICSE-XACRSLICEPLAN-ZIP-OFFER` / `4S-ACRPL-Z-O` to the remaining slices 20–23 after v0.10.76.

## XACR result

The plan remained logical, but the safe implementation boundary was to add verifiable contracts for screen activity, PIR-source filtering, guarded recovery restart markers, and a static autonomous proof contract. This batch does not claim real Raspberry hardware display, real screen power control, real iCloud download, or final scheduled autonomous proof.

## Implemented

- Screen activity endpoint: `POST /api/runtime/screen-simulation/activity`.
- Screen-worker truth events for `screen_on`, `screen_off`, and ignored disabled source activity.
- Fake screen-off and guarded real screen-off state flags.
- PIR/mouse/keyboard source filtering in backend-owned simulation state.
- Recovery emulated power-off endpoint: `POST /api/runtime/recovery/emulate-power-off`.
- Recovery unclean-shutdown flag that is consumed by restart check.
- Static V2 autonomous proof contract script: `npm run proof:v2-autonomous-contract`.

## Preserved

- Existing playback worker truth events added in v0.10.76.
- Existing recovery save/load endpoints.
- Existing screen simulation GET/configure endpoints.
- Existing worker truth API.

## Still not complete

- Real Raspberry display hardware proof.
- Real screen power-off hardware proof.
- Real cron-scheduled end-to-end autonomous run.
- Real iCloud media acquisition proof under this exact build.
- Full dependency-installed build/test run.

## Validation

`node tools/run-v2-autonomous-proof-contract.mjs` passed 8/8 static contract checks.
