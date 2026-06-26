# V2 Next Implementation Plan

Estonian timestamp: 2026-06-26 18:53 EEST

## Status

Planning/status document for the implementation sequence through `v0.10.66`. It is not proof that live target-machine playback or recovery has passed.

## Current completed baseline

| Slice | Delivered in | Current reality |
| --- | --- | --- |
| `B1` | `v0.10.35` | V2 has `01` through `09` route/page shells. |
| `B3.1-B3.4` | `v0.10.39` | V2 status toolbar, JSON-backed highlights, per-section `?` help popovers, and sync tests exist. |
| `B4.1-B4.3` | `v0.10.42` | V2 Setup/Auth controls are placed/wired to existing frontend action contracts and shared renderers. |
| `B5.1-B5.4` | `v0.10.46` | V2 Startup/Workers controls, RPI-STAGES, RPI-WORKERS, and Workers B3.1-B3.5 cards are placed. |
| Docs/launcher reconciliation | `v0.10.47` | README files, runner title version display, and next-plan documentation are refreshed. |

## Recommended next sequence

The previous B6-B12 implementation sequence is complete as code/tests/docs slices. The next work should be live-proof and hardening, not more optimistic UI composition.

| Order | Slice | Goal | Why next | Proof/test expectation |
| ---: | --- | --- | --- | --- |
| 1 | `LIVE.1` | Target-machine autonomous playback proof | Prove login/scheduler/pipeline/queue/rendering on the real environment | Generated evidence pack showing media reaches playback and address overlay appears when address exists. |
| 2 | `LIVE.2` | Abrupt-stop/restart recovery proof | Prove B11 save/load/autosave/restart-check under rough shutdown | Evidence that same media/queue context restores; exact timestamp not required. |
| 3 | `PIR.1` | PIR hardware readiness/proof | Move beyond emulator-only status when hardware is available | Hardware input diagnostic/proof artifact or explicit blocker. |
| 4 | `SEC.1` | Audit dependency vulnerabilities | Existing npm audit warnings remain | Low-regression fix or documented deferral with exact dependency/risk. |
| 5 | `DOCS.3` | Post-live-proof docs reconciliation | Needed only after live proofs change truth | Update B12 gate status and current-truth docs from actual evidence. |

## Completed sequence through v0.10.66

| Slice | Delivered in | Current reality |
| --- | --- | --- |
| `B1` | `v0.10.35` | V2 has `01` through `09` route/page shells. |
| `B3.1-B3.4` | `v0.10.39` | V2 status toolbar, JSON-backed highlights, per-section `?` help popovers, and sync tests exist. |
| `B4.1-B4.3` | `v0.10.42` | V2 Setup/Auth controls are placed/wired to existing frontend action contracts and shared renderers. |
| `B5.1-B5.4` | `v0.10.46` | V2 Startup/Workers controls, RPI-STAGES, RPI-WORKERS, and Workers B3.1-B3.5 cards are placed. |
| `DOCS.1` | `v0.10.47` | README files, runner title version display, and next-plan documentation were refreshed. |
| `B6.1-B8.2` | `v0.10.52` | Troubleshooting maintenance, recovery placeholders, PIR emulator subset, playback rendering, and browser-local drag/drop queue were added. |
| `B9.1-B8.4-B9.4` | `v0.10.58` | Control proof matrix, playback bridge contract, media-only queue bridge, metadata bridge, and playback metadata proof tests were added. |
| `B10.1-B11.1` | `v0.10.61` | `09 REAL PLAYBACK` integrated layout/projection and recovery state schema were added. |
| `B11.2-B12` | `v0.10.64` | Manual recovery endpoints, autosave/restart-check, and B12 proof gate were added. |
| `DOCS.2` | `v0.10.65` | OpenSpec/status JSON/root docs were reconciled to current implementation reality. |

## Rules for every next slice

- Preserve existing B1-B12 behavior unless a slice explicitly changes it.
- Reuse/extract shared components; do not paste old page HTML into V2.
- Update `dashboard/data/v2ImplementationStatus.json`, `V2_ImplementationStatus.md`, and relevant README/OpenSpec docs together.
- Include LOC-before diffstat, tests run, tests not run, inspected files, unresolved risks, and a full Git ZIP.
- Do not mark B12 live-passed unless target-machine evidence exists.

## Immediate recommendation

Run `LIVE.1` and `LIVE.2` on the target machine before changing the B12 gate status. If target hardware is not available, run `SEC.1` or a docs-only proof-runbook cleanup slice instead.
