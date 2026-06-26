# V2 Next Implementation Plan

Estonian timestamp: 2026-06-26 15:52 EEST

## Status

Planning document for the next implementation sequence after `v0.10.47`. It is not proof that the later slices are complete.

## Current completed baseline

| Slice | Delivered in | Current reality |
| --- | --- | --- |
| `B1` | `v0.10.35` | V2 has `01` through `09` route/page shells. |
| `B3.1-B3.4` | `v0.10.39` | V2 status toolbar, JSON-backed highlights, per-section `?` help popovers, and sync tests exist. |
| `B4.1-B4.3` | `v0.10.42` | V2 Setup/Auth controls are placed/wired to existing frontend action contracts and shared renderers. |
| `B5.1-B5.4` | `v0.10.46` | V2 Startup/Workers controls, RPI-STAGES, RPI-WORKERS, and Workers B3.1-B3.5 cards are placed. |
| Docs/launcher reconciliation | `v0.10.47` | README files, runner title version display, and next-plan documentation are refreshed. |

## Recommended next sequence

Run these one slice at a time, with one logical commit and one full Git ZIP per checkpoint.

| Order | Slice | Goal | Why next | Proof/test expectation |
| ---: | --- | --- | --- | --- |
| 1 | `B6.1` | `05 TROUBLESHOOTING` pipeline maintenance: Detect issues and Clear stale locks | **done in v0.10.48** | Placement test added; live stale-lock behavior proof remains later. |
| 2 | `B6.2` | `06 RECOVERY` placeholder buttons: `SAVE STATE`, `LOAD STATE`, `EMULATE POWER OFF` | **done in v0.10.49** | Exact alert/text tests; status stays placeholder/future for real recovery. |
| 3 | `B7.1` | `07 PIR` visible B5 subset and PIR emulator button | **done in v0.10.50** | Render test added; PIR hardware remains later. |
| 4 | `B8.1` | `08 PLAYBACK` rendering target/mode subsection | **done in v0.10.51** | Render test and status metadata added; Raspberry OS target disabled until proven. |
| 5 | `B8.2` | `08 PLAYBACK` drag/drop queue table | Creates safe local queue/classification path | File classification tests for image/video/other and graceful non-media handling. |
| 6 | `B9` | Proof/test expansion | Hardens frontend/backend and graceful-error coverage before composition claims | Endpoint tests, button tests, docs/status sync tests, and explicit not-run proof list. |
| 7 | `B10` | `09 REAL PLAYBACK` composition | Compose only from proven pieces | `09` must show only proven/disabled-test controls; no fake readiness. |
| 8 | `B11` | Real recovery implementation | Save/load/autosave/restart recovery | State-schema tests and rough-shutdown/restart proof. |
| 9 | `B12` | Victory proof | End-to-end autonomous playback and autonomous recovery proof | Target-machine proof artifacts required before readiness claims. |

## Rules for every next slice

- Preserve existing B1/B3/B4/B5 behavior unless a slice explicitly changes it.
- Reuse/extract shared components; do not paste old page HTML into V2.
- Update `dashboard/data/v2ImplementationStatus.json`, `V2_ImplementationStatus.md`, and relevant README/OpenSpec docs together.
- Include LOC-before diffstat, tests run, tests not run, inspected files, unresolved risks, and a full Git ZIP.
- Do not mark a control green/done unless current tests/proofs support the exact claim.

## Immediate recommendation

Start with `B6.1`, then `B6.2`. That completes the currently visible operator maintenance/recovery pages before PIR/playback work and reduces the risk that `09 REAL PLAYBACK` is composed from unverified pieces.
