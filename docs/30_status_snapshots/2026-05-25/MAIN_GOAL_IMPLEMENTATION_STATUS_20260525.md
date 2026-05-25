# Main Goal Implementation Status — Autonomous Picture Frame

Estonian timestamp: 2026-05-25 20:55 EEST

## Purpose

This is a code-checked implementation status snapshot for the main product goal: an autonomous picture frame that first lets the user log in, then automatically downloads, parses, queues, and plays images/videos fullscreen on Raspberry Pi as the production target, with Windows as the development target.

This document separates target intent from implemented behavior. It does not change runtime behavior, endpoints, tests, UI, authentication, download, parsing, playback, scheduler, or Raspberry display behavior.

## Baseline checked

- Baseline/work source: `1234_PF--v0.5.26--new-auth-artifact-generator-full_git.zip`
- Package version observed: `0.5.26`
- Main evidence types checked: backend route map, runtime service code, dashboard endpoint wrappers, playback worker, playback renderer, status docs, and focused tests.

## Status vocabulary

| Status | Meaning |
| --- | --- |
| Implemented | Code exists, is wired, and has supporting tests or direct route/service evidence. |
| Partial | Code exists but is bounded, manual, placeholder, development-only, or missing required production behavior. |
| Mock/demo/test-only | Behavior is intentionally simulated or based on generated/local test data. |
| Planned | Target behavior is documented, but implementation was not found in this baseline. |
| Blocked/decision-gated | Implementation depends on an unresolved architecture, platform, safety, or operator decision. |

## Main-goal implementation status table

| Main goal area | Target behavior | Current status | Current implementation evidence | Gap to main goal | Safest next implementation direction |
| --- | --- | --- | --- | --- | --- |
| Product identity | Runtime behaves as a dashboard-observable autonomous photo frame. | Partial | Product/spec docs define the dashboard-observable staged media pipeline and Raspberry production target; backend has staged runtime endpoints and View B orchestration. | Full unattended Raspberry production runtime is not complete. | Keep the staged pipeline and backend-owned truth model; avoid making the dashboard the runtime source of truth. |
| First-run login entry | User can log in before real provider-backed download starts. | Partial | NEW AUTH routes exist for status, login, 2FA submit, logout, session files, test download, and artifact generation. | Login is provider-evidenced but not yet clearly integrated into a complete first-run wizard that gates the whole autonomous runtime. | Add a first-run readiness contract that blocks real runtime start until provider proof/auth state is explicitly good. |
| Login diagnostics/artifacts | Failed login can produce AI-readable evidence without leaking secrets. | Implemented for safe artifact generation | `POST /api/auth/new/artifacts/generate` writes sanitized evidence packs; raw iCloudPD stdio remains private metadata-only in generated packs. | Artifact generation is separate from the login button unless UI/operator flow explicitly calls it. | Add a visible operator action or guided failure flow to generate/download the pack after a failed login attempt. |
| Raw iCloudPD provider communication capture | Local raw provider stdout/stderr can be captured for private debugging. | Implemented but private/local-only | Raw stdio logger exists and v0.5.25 enabled `ICLOUDPD_RAW_STDIO_LOG=1` in launcher/template paths. | Raw log is intentionally not included in shareable artifacts. | Preserve private-only boundary; add only metadata pointers to shareable reports. |
| Real iCloudPD download | After login, app downloads images/videos from provider into the configured media directory. | Partial | `POST /api/runtime/download/real-run` verifies NEW AUTH session, calls iCloudPD test-download flow, and accepts a bounded recent-count. | Real download is manual/API-triggered and narrow; not yet a robust autonomous downloader with paging, history, retries, and full media pipeline scheduling. | Extend real downloader as a separate provider-backed stage with durable state and non-destructive history. |
| Mock/test download | Development pipeline can copy generated test media. | Implemented as mock/demo | `POST /api/runtime/download/run` copies generated test data into the test download directory. | This is not production provider download. | Keep mock path for development and tests; keep real/test data isolated. |
| Index/register downloaded media | Downloaded files are scanned and registered into SQLite canonical tables. | Implemented/partial | `POST /api/runtime/index/run` calls the Python SQLite bridge `stage2_index_register`; tests cover fresh DB bootstrapping and idempotent indexing. | Production robustness depends on real download coverage, schema stability, and runtime isolation. | Keep idempotent indexing; add real-download integration tests once real downloader is expanded. |
| Parse image/video metadata and GPS | Media metadata/GPS are parsed into queued DB state. | Partial | `POST /api/runtime/gps/run` processes queued GPS work and handles no-GPS rows; tests cover GPS and no-GPS cases. | Exact video metadata parsing breadth and production EXIF/video coverage are not proven by this snapshot. | Add media-type coverage matrix and fixture tests for the supported image/video formats. |
| Geocode GPS data | GPS data becomes human-readable address/location metadata. | Partial/placeholder | `POST /api/runtime/geocode/run` exists and is explicitly described in responses as a deterministic placeholder geocoder, not production. | Production geocoder/provider adapter is missing. | Implement a provider adapter behind the existing stage contract; keep deterministic placeholder for tests. |
| Queue slideshow/playback candidates | Parsed media becomes an idempotent slideshow queue. | Implemented/partial | `POST /api/runtime/queue/prepare` exists; tests cover insertion and idempotency for eligible assets. | Queue policy for long-running production playback, ordering, freshness, and recovery needs further specification. | Add explicit queue policy docs/tests before changing selection behavior. |
| Select current playable item | Runtime selects a current READY item for playback. | Implemented | `POST /api/runtime/playback/select-current` calls `selectCurrentPlayableItem`; tests verify pointer/history behavior and invalid READY candidate handling. | Selection alone does not render media or control the screen. | Preserve selection-only boundary and wire downstream renderers/workers through explicit contracts. |
| Playback worker | Autonomous worker selects current playback item on a schedule. | Partial | `playback_worker` CLI/scheduler entrypoint exists and writes lock/status artifacts; tests verify it does not render or run pipeline stages. | It only selects the current item; it does not download, parse, queue, render, enter fullscreen, or control hardware. | Keep playback worker narrow; add separate regular pipeline worker and screen worker rather than overloading playback worker. |
| Full automatic pipeline action | One backend action runs the staged pipeline in order. | Partial | `POST /api/runtime/orchestration/run` executes download, index, GPS, geocode, queue, and playback selection sequentially and persists current/last run state. | It uses the mock download route, is invoked manually, and is not yet a scheduled autonomous worker loop. | Convert orchestration into a scheduler-owned regular pipeline worker after runtime truth and isolation are settled. |
| Runtime current/last state | Dashboard can inspect current and latest run summaries. | Partial | `GET /api/runtime/orchestration/current` and `GET /api/runtime/orchestration/last` read persisted runtime state; View C refresh uses last-run endpoint. | Resume behavior and full recovery semantics remain incomplete. | Define resume/recovery semantics before wiring any destructive or replay action. |
| Live monitoring | Dashboard can see real worker/playback/screen health. | Partial | `GET /api/runtime/projection/live` returns run state from orchestration state, but worker/playback/screen fields default to unknown placeholders. | It does not yet read playback-worker status, screen-worker status, heartbeats, locks, or DB playback truth comprehensively. | Map projection fields to authoritative lock/status/DB artifacts without inventing values. |
| Windows preview rendering | Development UI can render selected media in the browser. | Implemented for browser-native development preview | `GET /api/runtime/playback/media` streams allowed media paths; View B renders selected image/video URLs and tests cover preview/fullscreen markup. | Browser preview is not Raspberry/native hardware display. | Keep Windows renderer as development target and avoid claiming Raspberry parity. |
| Windows fullscreen playback | Development UI can request browser fullscreen for selected media. | Implemented for browser-native development fullscreen | `requestPlaybackFullscreen()` calls browser `requestFullscreen()` on the Windows playback stage; CSS fullscreen rules exist; tests cover enabling and markup. | Browser may reject fullscreen; this is not OS/kiosk boot fullscreen and not Raspberry display control. | Add operator feedback and an end-to-end browser smoke checklist; keep OS-level kiosk work separate. |
| Raspberry Pi fullscreen production playback | Raspberry boots/launches and plays media fullscreen autonomously. | Planned | Product docs name Raspberry as final production target; code/status docs still separate Windows browser rendering from Raspberry/native rendering. | No real Raspberry display worker, kiosk launcher, screen control, or hardware playback service was found. | Create a Raspberry display contract and a separate screen/playback adapter after current playback state contract is stable. |
| Scheduler/platform automation | Windows development and Raspberry production can schedule runtime work. | Partial | Scheduler target selection exists for Windows CronEmulator and Raspberry real crontab; Windows CronEmulator routes exist; playback worker command route is tested. | Regular pipeline worker and screen worker are not fully implemented; Raspberry scheduler install/runtime proof is incomplete. | Finish worker split first, then wire scheduler targets to real worker commands. |
| Screen on/off / hardware control | Runtime controls the physical display state. | Mock/demo/test-only | Screen simulation API and tests exist; View B/B5 copy identifies simulation-only behavior. | No production screen hardware adapter was found. | Keep simulation separate and add a hardware adapter behind a screen-control port. |
| Autonomy after restart/power loss | Runtime resumes safely from durable state. | Partial/target only | Specs define locks, DB state, recovery, and stale-lock rules; playback worker lock/status file exists. | Full recovery across regular pipeline, playback, and screen workers is not implemented. | Implement recovery per worker using lock/status/DB evidence and stale-lock tests. |
| Real/test separation | Development mocks and production media state stay isolated. | Partial | Docs and route naming distinguish mock download and real download; tests use generated data and temporary DBs. | Destructive live/runtime isolation remains a known risk in older status docs. | Add a formal environment namespace/isolation proof before expanding autonomous real actions. |

## Condensed readiness view

| End-to-end phase | Windows development readiness | Raspberry production readiness | Notes |
| --- | --- | --- | --- |
| Login | Partial | Partial | Backend/provider flow exists; first-run product wizard/gating remains incomplete. |
| Download | Partial | Partial | Mock download works for dev; real iCloudPD route is gated and narrow. |
| Parse/index/geocode | Partial | Partial | Index/GPS/queue are real DB stages; geocode is placeholder. |
| Queue/select playback item | Mostly implemented | Mostly implemented | Backend selects current playable item; not a renderer. |
| Render/play fullscreen | Partial/implemented for browser preview | Planned | Windows browser preview/fullscreen exists; Raspberry native/kiosk display missing. |
| Autonomous scheduling | Partial | Planned/partial | Scheduler surfaces exist; only playback worker is implemented and narrow. |
| Recovery/monitoring | Partial | Partial | Current/last orchestration state exists; live projection still has unknown placeholders. |

## Current most important truth

The repo is a strong staged-dashboard prototype with several real backend pipeline pieces, a real NEW AUTH/provider boundary, a safe login evidence-pack generator, SQLite-backed indexing/queue/playback selection, and Windows browser-native preview/fullscreen support.

It is not yet a complete autonomous Raspberry picture-frame runtime. The largest missing production pieces are: first-run auth gating for the whole runtime, a robust provider-backed downloader, production geocoding, a scheduler-owned regular pipeline worker, a Raspberry/native fullscreen display worker, screen hardware control, and recovery/monitoring surfaces that read authoritative worker/lock/DB evidence.

## Recommended next implementation sequence

| Order | Slice | Reason |
| --- | --- | --- |
| 1 | First-run readiness contract and UI status gate | Prevents autonomous real download from starting without verified auth/session readiness. |
| 2 | Regular pipeline worker skeleton using existing orchestration stages | Moves the manual pipeline toward autonomy without changing stage semantics. |
| 3 | Runtime projection upgrade for worker/status artifacts | Makes View D honest before relying on autonomy. |
| 4 | Real-download expansion plan and provider-backed download adapter | Turns the narrow real-run path into durable production ingestion. |
| 5 | Raspberry display contract and no-op adapter | Establishes boundaries before hardware/kiosk work. |
| 6 | Raspberry/native fullscreen implementation slice | Adds production rendering only after playback state and display contract are clear. |
| 7 | Recovery/stale-lock hardening across regular, playback, and screen workers | Makes autonomous operation safe after reboot/failure. |

## Non-goals of this status slice

- No code or runtime behavior was changed.
- No endpoint was added, removed, or renamed.
- No UI behavior was changed.
- No claim is made that Raspberry fullscreen playback currently works.
- No claim is made that the app is already fully autonomous.
