# V2 Real Playback Goals

Estonian timestamp: 2026-06-26 09:26 EEST

## Authority

This document is the current V2 goal authority for the planned `09 REAL PLAYBACK` page and the work leading to it. It captures the operator-defined victory conditions for the PF_login / PhotoFrame V2 path.

Implementation, tests, proofs, and OpenSpec documents must not claim V2 success unless they satisfy these goals or explicitly document the remaining gap.

## Main goal 1: autonomous playback

The first primary objective is a complete autonomous playback path after operator login.

A V2 real playback flow is successful when:

1. The user can authenticate/login successfully.
2. The Raspberry-oriented scheduler/cron jobs are installed and active.
3. The system starts downloading media according to configured runtime rules such as batch size and provider limits.
4. Downloaded media moves through the pipeline stages:
   - Download,
   - Index,
   - GPS parser,
   - Geocode,
   - Queue.
5. GPS coordinates are found from media metadata or supported sidecar/fallback sources when present.
6. GPS coordinates are resolved into an address string through the approved geocode path.
7. Media reaches the playback queue.
8. Fullscreen playback displays queued images and videos.
9. The fullscreen playback surface displays the address overlay string for media that has a resolved address.
10. The operator can observe enough dashboard/runtime evidence to know the pipeline is actually working, not merely visually present.

## Main goal 2: autonomous recovery after power loss

The second primary objective is power-loss recovery that can resume operation without manual repair.

A V2 real playback recovery flow is successful when:

1. The system is running normally and periodically saves lightweight runtime state.
2. Power is lost suddenly, or the process/terminals are stopped roughly in a way that approximates power loss.
3. Power returns and the app/runtime starts again.
4. A Raspberry-oriented cron/worker path detects that restart recovery may be required.
5. The system marks recovery as in progress.
6. Recovery loads the previous saved state.
7. The system resumes the real playback pipeline and playback operation independently.
8. Playback recovery restores the current media item well enough to continue the frame experience; exact timestamp resume is not required. Starting the same video from the beginning is acceptable.
9. Corrupt, partial, invalid, or non-media files caused by interruption are rejected before they can advance far through the media pipeline.

## Tier-2 goal: screen on/off activity behavior

The screen on/off behavior is an important second-tier goal, below autonomous playback and autonomous recovery.

The desired behavior is:

1. Mouse activity, keyboard activity, and PIR activity are considered activity sources.
2. If no accepted activity source is observed for the configured inactivity timeout, the display/screen should turn off or enter the planned inactive state.
3. If activity is observed again, the display/screen should wake or return to the active state.
4. Mouse and keyboard activity can be tested directly during development.
5. PIR activity may require emulation/simulation until real sensor input is proven on the target runtime.
6. This behavior must eventually integrate with real playback, not remain only an isolated `07 PIR` test surface.

## Real playback page role

`09 REAL PLAYBACK` is the final integrated endpoint page. Pages `01` through `08` are proving and staging pages used to isolate setup, authentication, scheduler, worker, troubleshooting, recovery, PIR, and playback behavior.

The real playback page should eventually compose only proven or honestly marked parts from:

| Source page | Contribution to `09 REAL PLAYBACK` |
| --- | --- |
| `01 - SETUP` | Environment and database readiness needed before the real path can run. |
| `02 - AUTHENTICATION` | iCloudPD/browser auth path, with command-line fallback documented if browser auth fails. |
| `03 - STARTUP` | Raspberry scheduler/cron installation and runtime startup state. |
| `04 - WORKERS` | Download, Index, GPS parser, Geocode, Queue, playback worker, and on/off worker status. |
| `05 - TROUBLESHOOTING` | Stale-lock and pipeline repair tools after they are documented and proven. |
| `06 - RECOVERY` | Lightweight save/load state and later automated power-loss recovery. |
| `07 - PIR` | Activity detection and screen on/off behavior after direct/emulated testing is proven. |
| `08 - PLAYBACK` | Queue, rendering mode, fullscreen playback, and address overlay behavior. |

## Scheduler direction

The real path should not depend on the Windows custom cron emulator. Raspberry/Raspberry-related runtime is preferred. WSL or a similar Linux-like development path may be considered for development/testing, but the customer-facing target remains Raspberry-oriented unless a later decision changes that.

## Goal status vocabulary

| Status | Meaning |
| --- | --- |
| `planned` | Goal is defined but not implemented. |
| `visual` | UI exists, but real behavior is not wired/proven. |
| `wired` | Code calls a real handler/endpoint, but proof may still be missing. |
| `needs verification` | Behavior may work but lacks current evidence in the relevant placement. |
| `needs solution` | Known or suspected gap must be solved before claiming readiness. |
| `proven` | Code, tests, and generated/target evidence support the claim. |

## Non-claims

This document is a goal contract, not proof that the goals are already satisfied.

Do not infer that `09 REAL PLAYBACK` is complete until implementation status, tests, and proof artifacts demonstrate the autonomous playback and autonomous recovery objectives above.
