# OpenSpec — Raspberry v1.0 release-gate matrix

Version: v0.8.56

## Purpose

This OpenSpec converts the answered v1.0 question matrix into release gates. It prevents the project from calling itself v1.0 merely because code exists. v1.0 is Raspberry-focused and must be proven by target evidence for the core cron workflow.

## Answered matrix decisions

| ID | Decision |
|---:|---|
| 1 | v1.0 is a Raspberry-focused production/runtime milestone. |
| 2 | Real iCloud/iCloudPD media source is required. |
| 3 | Real GPS/geocode evidence is required. |
| 4 | Physical power-loss recovery is not a v1.0 blocker; queue later. |
| 5 | Manual reboot recovery is not a v1.0 blocker; queue around v1.2. |
| 6 | The cron workflow must include all three worker lanes as non-blocking operational lanes. |
| 7 | Cron setup may be operator/manual; fully automatic install is useful but not required. |
| 8 | `.env` may be bootstrapped from `example.env` when missing. |
| 9 | Native Raspberry image and video playback are required. |
| 10 | Address overlay on the Raspberry/device display is required. |
| 11 | Physical screen on/off control is not required for v1.0 beyond not blocking the system. |
| 12 | `regular_stage_worker` must do real download/index/GPS/geocode/queue work. |
| 13 | iCloudPD is the first real production media source target. |
| 14 | Dashboard runtime/status view is required. |
| 15 | Single proof ZIP is useful but not a hard v1.0 requirement. |
| 16 | Automated JSON proof and operator observation may both count where appropriate. |
| 17 | Core target proofs should pass for v1.0; non-v1.0 gaps must be explicit. |
| 18 | Windows proof is preserved where possible, but Raspberry is the primary v1.0 target. |
| 19 | Documentation must be reconciled before v1.0. |
| 20 | Highest priority is proving the full Raspberry cron workflow end-to-end. |

## Required v1.0 gates

| Gate | Required proof status |
|---|---|
| Raspberry target tooling and generated fixtures | Latest relevant proof artifacts must be `PASSED`. |
| Install/runtime preflight | Executable-bit and `.env` preflight must be `PASSED`. |
| Real iCloud media source | Real iCloudPD pipeline and continuation evidence must be `PASSED`. |
| Real GPS/geocode | Real geocode provider-chain evidence must be `PASSED`. |
| Regular worker product pipeline | `regular_stage_worker` must prove real download/index/GPS/geocode/queue work. |
| Playback/native display | Native image and video playback must be `PASSED` on the Raspberry display target. |
| Address overlay device display | Address overlay must be observed/proven on the Raspberry/device display. |
| Cron app-running workflow | Worker startup smoke, cron preflight, worker evidence, cron runtime, app-running status, and app-running chain must be `PASSED`. |
| Dashboard status view | Dashboard must show proof-backed runtime/status truth for the Raspberry workflow. |
| Screen worker non-blocking behavior | `screen_on_off_worker` must not block the v1.0 cron workflow. |
| Docs/OpenSpec reconciliation | Current docs must match implementation and proof state. |

## Explicit non-v1.0 blockers

Manual reboot recovery, physical power-loss recovery, and Windows release proof are not v1.0 blockers under the answered matrix. They must remain documented as later or preserved proof areas and must not be falsely claimed by v1.0 evidence.

## Proof runner

`npm run proof:raspberry-v1-readiness` scans latest local proof artifacts under `runtime_data/proofs/` and evaluates them against this matrix. It returns `PASSED` only when all required v1.0 gates have latest `PASSED` evidence.
