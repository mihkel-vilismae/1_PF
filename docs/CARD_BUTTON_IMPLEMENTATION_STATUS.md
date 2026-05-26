# Card/button implementation status audit

Created: 2026-05-26 14:09 EEST

Baseline: `PF_login--v0.5.36--13.33.54-260526.zip`

Scope:

- Included View A cards: `1A`, `1A-STASH-OFF`, `2A`, `3A`.
- Included View B cards: `B2`, `B2-REAL_DOWNLOAD`, `B3`, `B4`, `B5`.
- Included View D cards: `D1`, `D2`, `D3`, `D4`.
- Excluded: `1A-AUTH`, all View C cards, and all View E cards.

Method:

- This audit lists actual `<button>` elements rendered inside the included `.card` elements.
- Nested buttons are included only when they render inside the relevant `.card`.
- Radio buttons, checkboxes, selects, text inputs, badges, and links are excluded.
- The tests/code status is based on static source and test inspection. Live test execution was not part of this slice.
- This is documentation only; it does not change UI behavior, runtime behavior, tests, routes, source code, version numbers, or changelog entries.

## View A

### .card code and Heading: 1A — Verify .env

| View | .card code | Heading | Purpose | Priority | Button label | Button action / attribute | Implementation status according to tests/code | Implementation status according to docs |
|---|---|---|---|---|---|---|---|---|
| A | 1A | Verify .env | Validate required configuration keys and render backend response payload. | High | Run | `data-action="verify-env"` | Implemented / covered by static tests. UI maps to `POST /api/init/verify-env`; source/test inspection indicates backend result handling exists. | Implemented / partial. Docs describe real verify-env wiring, but readiness is action-triggered rather than fully automatic. |

### .card code and Heading: 1A-STASH-OFF — NEW AUTH

| View | .card code | Heading | Purpose | Priority | Button label | Button action / attribute | Implementation status according to tests/code | Implementation status according to docs |
|---|---|---|---|---|---|---|---|---|
| A | 1A-STASH-OFF | NEW AUTH | Main login/authentication area for the new iCloudPD auth flow. | Critical | Verify iCloudPD install | `data-action="new-auth-verify-icloudpd"` | Implemented. Backend/provider verification flow and secret-redaction tests exist by static inspection. | Implemented, provider-dependent. Docs say NEW AUTH is mostly closed, but real success depends on iCloudPD/provider state. |
| A | 1A-STASH-OFF | NEW AUTH | Main login/authentication area for the new iCloudPD auth flow. | Critical | Verify with iCloudPD | `data-action="new-auth-verify-provider-session"` | Implemented / provider-dependent. Endpoint wiring exists; live success depends on provider proof and session state. | Implemented, provider-dependent. Docs separate local session files from provider-verified login. |
| A | 1A-STASH-OFF | NEW AUTH | Main login/authentication area for the new iCloudPD auth flow. | Critical | Login using .env values | `data-action="new-auth-login-using-env"` | Implemented / provider-dependent. Login flow and 2FA handling exist, but provider success must be proven by live run evidence. | Implemented, provider-dependent. Docs describe login/2FA flow with sanitized provider output. |
| A | 1A-STASH-OFF | NEW AUTH | Main login/authentication area for the new iCloudPD auth flow. | Critical | Check login | `data-action="new-auth-check-login"` | Implemented. Session/status check wiring exists; status is still dependent on provider proof. | Implemented. Docs describe status checking but warn not to confuse local files with verified login. |
| A | 1A-STASH-OFF | NEW AUTH | Main login/authentication area for the new iCloudPD auth flow. | Critical | Log out and remove existing session | `data-action="new-auth-logout-session"` | Implemented. Logout/session removal route appears wired and tested by static inspection. | Implemented. Docs describe controlled session cleanup. |
| A | 1A-STASH-OFF | NEW AUTH | Main login/authentication area for the new iCloudPD auth flow. | Critical | Show auth/session paths and files | `data-action="new-auth-session-files"` | Implemented. Session path/file inspection exists with secret-safe boundaries. | Implemented. Docs describe session file/path visibility without exposing file contents. |

### .card code and Heading: 2A — Database controls

| View | .card code | Heading | Purpose | Priority | Button label | Button action / attribute | Implementation status according to tests/code | Implementation status according to docs |
|---|---|---|---|---|---|---|---|---|
| A | 2A | Database controls | Verify and control local DB setup/status for runtime pipeline. | High | Check DB | `data-action="check-db"` | Implemented. UI/backend status endpoint wiring exists. | Implemented / partial. Docs describe DB status support, with remaining readiness/preload concerns. |
| A | 2A | Database controls | Verify and control local DB setup/status for runtime pipeline. | High | Inspect DB | `data-action="inspect-db"` | Implemented. Inspect endpoint wiring exists. | Implemented. Docs describe DB inspection as available. |
| A | 2A | Database controls | Verify and control local DB setup/status for runtime pipeline. | High | Delete DB | `data-action="delete-db"` | Implemented with risk guard expectation. Destructive control exists and should remain guarded. | Implemented / guarded. Docs mention destructive actions and safety concerns. |
| A | 2A | Database controls | Verify and control local DB setup/status for runtime pipeline. | High | Recreate DB | `data-action="recreate-db"` | Implemented. Recreate-empty endpoint wiring exists. | Implemented / partial. Docs describe DB recreation, but runtime DB lifecycle remains an integration concern. |

### .card code and Heading: 3A — Scheduler controls

| View | .card code | Heading | Purpose | Priority | Button label | Button action / attribute | Implementation status according to tests/code | Implementation status according to docs |
|---|---|---|---|---|---|---|---|---|
| A | 3A | Scheduler controls | Control or inspect cron/scheduler automation behavior. | High | WINDOWS (crontab emulator) | `data-action="select-scheduler-target-windows"` | Implemented. Scheduler target selection exists. | Partial. Docs describe Windows emulator target as available. |
| A | 3A | Scheduler controls | Control or inspect cron/scheduler automation behavior. | High | RASPBERRY (real crontab) | `data-action="select-scheduler-target-raspberry"` | Implemented / platform-dependent. UI target exists; real behavior depends on Raspberry environment. | Partial / target-state only. Docs describe Raspberry crontab target, but worker proof remains incomplete. |
| A | 3A | Scheduler controls | Control or inspect cron/scheduler automation behavior. | High | copy all | `data-scheduler-endpoint-copy-all` | Implemented UI utility. Control exists for scheduler endpoint log. | Not central / utility control. Docs likely treat this as UI utility rather than core scheduler behavior. |
| A | 3A | Scheduler controls | Control or inspect cron/scheduler automation behavior. | High | clear | `data-scheduler-endpoint-clear-all` | Implemented UI utility. Control exists for clearing endpoint log. | Not central / utility control. Docs likely do not define this as main runtime functionality. |
| A | 3A | Scheduler controls | Control or inspect cron/scheduler automation behavior. | High | expand row | `data-scheduler-endpoint-row-expand="<rowId>"` | Implemented UI utility. Row expansion is present for log detail visibility. | Not central / utility control. Matches the terminal-like-div control direction. |
| A | 3A | Scheduler controls | Control or inspect cron/scheduler automation behavior. | High | Check emulator scheduler | `data-action="check-emulator-scheduler"` | Implemented. Emulator status/check wiring exists. | Partial. Docs describe CronEmulator support. |
| A | 3A | Scheduler controls | Control or inspect cron/scheduler automation behavior. | High | Run emulator | `data-action="run-emulator"` | Implemented. Emulator run control exists. | Partial. Docs describe Windows emulator, not full production scheduler. |
| A | 3A | Scheduler controls | Control or inspect cron/scheduler automation behavior. | High | Stop emulator | `data-action="stop-emulator"` | Implemented. Emulator stop control exists. | Partial. Docs describe emulator lifecycle controls. |
| A | 3A | Scheduler controls | Control or inspect cron/scheduler automation behavior. | High | Install crontab | `data-action="install-crontab"` | Implemented / platform-dependent. Crontab install action exists; real result depends on OS. | Partial / platform-dependent. Docs distinguish Windows emulator from Raspberry crontab. |
| A | 3A | Scheduler controls | Control or inspect cron/scheduler automation behavior. | High | Get active crontab | `data-action="get-active-crontab"` | Implemented / platform-dependent. Active crontab inspection exists. | Partial. Docs mention real crontab support but not full worker proof. |
| A | 3A | Scheduler controls | Control or inspect cron/scheduler automation behavior. | High | Install scheduler | `data-action="install-cron"` | Implemented / platform-dependent. Scheduler install route/action exists. | Partial. Docs describe scheduler install but runtime automation remains not fully proven. |
| A | 3A | Scheduler controls | Control or inspect cron/scheduler automation behavior. | High | Check scheduler | `data-action="check-cron"` | Implemented / platform-dependent. Scheduler check action exists. | Partial. Docs describe scheduler checking but live worker proof remains incomplete. |
| A | 3A | Scheduler controls | Control or inspect cron/scheduler automation behavior. | High | Print scheduler | `data-action="print-cron"` | Implemented / platform-dependent. Scheduler print action exists. | Partial. Docs describe scheduler visibility, not complete autonomous runtime proof. |

## View B

### .card code and Heading: B2 — Download test action

| View | .card code | Heading | Purpose | Priority | Button label | Button action / attribute | Implementation status according to tests/code | Implementation status according to docs |
|---|---|---|---|---|---|---|---|---|
| B | B2 | Download test action | Run safe/mock download action for pipeline testing. | Medium | Run | `data-action="run-b2"` | Implemented as mock/test download. UI calls the mock download backend route. | Mock/demo/test-only. Docs classify B2 as generated/test download, not production provider download. |

### .card code and Heading: B2-REAL_DOWNLOAD — Authenticated real download

| View | .card code | Heading | Purpose | Priority | Button label | Button action / attribute | Implementation status according to tests/code | Implementation status according to docs |
|---|---|---|---|---|---|---|---|---|
| B | B2-REAL_DOWNLOAD | Authenticated real download | Run real download behavior gated by auth/session state. | Critical | Run real download | `data-action="run-b2-real-download"` | Partial / provider-dependent. Route wiring exists and is auth-gated, but full live provider success is not proven by static inspection. | Partial / decision-gated. Docs say route exists, but full provider-backed download worker/error handling remains incomplete. |

### .card code and Heading: B3 — Pipeline stages

| View | .card code | Heading | Purpose | Priority | Button label | Button action / attribute | Implementation status according to tests/code | Implementation status according to docs |
|---|---|---|---|---|---|---|---|---|
| B | B3 | Pipeline stages | Show and run staged media pipeline actions. | Critical | Run all stages | `data-action="run-b3-auto"` | Partial. Orchestration exists but depends on mixed mock/real stage readiness. | Partial. Docs describe hybrid pipeline state. |
| B | B3 | Pipeline stages | Show and run staged media pipeline actions. | Critical | Detect issues in pipeline | `data-action="detect-pipeline-issues"` | Implemented. Pipeline issue detection endpoint/action exists. | Implemented / diagnostic. Docs treat issue detection as support tooling. |
| B | B3 | Pipeline stages | Show and run staged media pipeline actions. | Critical | Clear stale locks | `data-action="clear-stale-pipeline-locks"` | Implemented. Stale lock clearing action exists. | Implemented / diagnostic. Docs describe stale-lock clearing as maintenance support. |
| B | B3 | Pipeline stages | Show and run staged media pipeline actions. | Critical | Run | `data-action="run-b3-1"` for B3.1 Download | Implemented as mock/test stage. Download stage exists but not full provider production path. | Mock/demo/partial. Docs classify generated/test download separately from real provider download. |
| B | B3 | Pipeline stages | Show and run staged media pipeline actions. | Critical | Run | `data-action="run-b3-2"` for B3.2 Index | Implemented / partial. Index route/action exists; production completeness depends on media source state. | Partial. Docs describe index as one backend-wired pipeline piece. |
| B | B3 | Pipeline stages | Show and run staged media pipeline actions. | Critical | Run | `data-action="run-b3-3"` for B3.3 Parse GPS | Implemented / partial. GPS parse action exists; depends on available metadata/media fixtures. | Partial. Docs describe GPS parsing as pipeline stage, not full autonomous production proof. |
| B | B3 | Pipeline stages | Show and run staged media pipeline actions. | Critical | Run | `data-action="run-b3-4"` for B3.4 Geocode | Partial / placeholder-dependent. Geocode action exists, but production geocoding remains limited. | Partial. Docs mention geocoding as not fully production-complete. |
| B | B3 | Pipeline stages | Show and run staged media pipeline actions. | Critical | Run | `data-action="run-b3-5"` for B3.5 Enqueue playback | Implemented. Queue preparation/enqueue stage is implemented by source/test inspection. | Implemented / partial pipeline context. Docs say B3.5 queue preparation is implemented while broader pipeline remains partial. |

### .card code and Heading: B4 — Playback selection

| View | .card code | Heading | Purpose | Priority | Button label | Button action / attribute | Implementation status according to tests/code | Implementation status according to docs |
|---|---|---|---|---|---|---|---|---|
| B | B4 | Playback selection | Select or verify current playable media item. | High | Windows | `data-playback-rendering-platform="windows"` | Implemented as option state. UI platform option exists. | Selection-only context. Docs do not claim real rendering is complete. |
| B | B4 | Playback selection | Select or verify current playable media item. | High | Raspberry OS (disabled) | `data-playback-rendering-platform="raspberryOs"` | Present but disabled/not production-ready. UI option exists but is intentionally unavailable. | Planned / not complete. Docs preserve Raspberry/fullscreen target as goal, not current proof. |
| B | B4 | Playback selection | Select or verify current playable media item. | High | Playback without rendering | `data-playback-rendering-mode="withoutRendering"` | Implemented. Non-rendering selection mode exists. | Implemented, selection only. Docs say playback selection does not render. |
| B | B4 | Playback selection | Select or verify current playable media item. | High | Preview window | `data-playback-rendering-mode="previewWindow"` | Partial / UI option. Option exists, but full rendering proof is not established here. | Partial / target behavior. Docs distinguish preview/rendering from selection. |
| B | B4 | Playback selection | Select or verify current playable media item. | High | Fullscreen | `data-playback-rendering-mode="fullscreen"` | Partial / target option. Option exists, but real fullscreen playback/hardware output is not proven. | Planned / partial. Docs say fullscreen rendering is not complete production behavior. |
| B | B4 | Playback selection | Select or verify current playable media item. | High | Run | `data-action="run-b4"` | Implemented for selection. Backend selection service/tests exist; this does not equal real playback rendering. | Implemented, selection only. Docs explicitly frame B4 as selecting the current playable item. |

### .card code and Heading: B5 — Screen on-off simulation

| View | .card code | Heading | Purpose | Priority | Button label | Button action / attribute | Implementation status according to tests/code | Implementation status according to docs |
|---|---|---|---|---|---|---|---|---|
| B | B5 | Screen on-off simulation | Simulate display/screen state changes for development/testing. | Medium | No buttons inside this .card | — | Implemented as backend simulation, but no card-local button. Screen simulation exists elsewhere through configured UI/state controls. | Mock/demo/test-only. Docs say this is simulation, not real hardware telemetry/control. |

## View D

### .card code and Heading: D1 — Pipeline worker

| View | .card code | Heading | Purpose | Priority | Button label | Button action / attribute | Implementation status according to tests/code | Implementation status according to docs |
|---|---|---|---|---|---|---|---|---|
| D | D1 | Pipeline worker | Monitor/control background pipeline worker execution. | Critical | No buttons inside this .card | — | Partial / projection shell. Card exists, but worker health defaults to unknown or projection-derived status rather than authoritative heartbeat telemetry. | Planned / mock-only. Docs describe View D as future backend-owned live runtime monitor. |

### .card code and Heading: D2 — Playback worker

| View | .card code | Heading | Purpose | Priority | Button label | Button action / attribute | Implementation status according to tests/code | Implementation status according to docs |
|---|---|---|---|---|---|---|---|---|
| D | D2 | Playback worker | Monitor/control automatic playback selection/update behavior. | High | No buttons inside this .card | — | Partial. Playback worker implementation exists elsewhere, but D2 card telemetry is not authoritative live heartbeat proof. | Planned / partial boundary. Docs say D2 monitoring is not yet real worker telemetry. |

### .card code and Heading: D3 — Screen on-off worker

| View | .card code | Heading | Purpose | Priority | Button label | Button action / attribute | Implementation status according to tests/code | Implementation status according to docs |
|---|---|---|---|---|---|---|---|---|
| D | D3 | Screen on-off worker | Monitor/control screen power/state worker behavior. | Medium | No buttons inside this .card | — | Partial / placeholder telemetry. Card/projection mapping exists, but real screen worker heartbeat/hardware state is not implemented. | Planned / mock-only. Docs say real runtime/screen hardware contracts are still future work. |

### .card code and Heading: D4 — Monitor log / Preview log

| View | .card code | Heading | Purpose | Priority | Button label | Button action / attribute | Implementation status according to tests/code | Implementation status according to docs |
|---|---|---|---|---|---|---|---|---|
| D | D4 | Monitor log / Preview log | Show live monitoring/log output for worker/runtime activity. | High | No buttons inside this .card | — | Partial / simulated or generic log surface. UI renders monitor/preview log, but authoritative worker log-tail behavior is not proven. | Planned / simulated preview. Docs say D4 should eventually come from backend event/log projections. |

## Reconciliation notes

### Docs and code/tests broadly agree

- `1A` has real verify-env UI and backend wiring, but readiness is action-triggered.
- `1A-STASH-OFF` has dedicated NEW AUTH controls and provider/session endpoints, but live success depends on iCloudPD/provider proof and 2FA state.
- `2A` has database status/inspect/delete/recreate controls, with destructive actions remaining a safety-sensitive area.
- `B2` is mock/test download behavior, not production provider download.
- `B4` is implemented for selecting the current playable item; it must not be described as real playback rendering or Raspberry fullscreen output.
- `B5` is simulation/demo behavior rather than real hardware screen control.

### Docs and code/tests need careful wording

- `3A` has UI and endpoint wiring for scheduler controls, but real scheduler behavior is platform-dependent. Windows CronEmulator and Raspberry crontab should not be treated as identical runtime proof.
- `B2-REAL_DOWNLOAD` has a real-download route and auth gate, but provider-backed success requires live provider evidence.
- `B3` has multiple backend-wired stages, but the overall pipeline remains hybrid because mock download, provider download, geocoding, and autonomous orchestration do not all have the same production-readiness level.
- `D1` through `D4` have UI/projection surfaces, but current wording should avoid claiming authoritative live worker telemetry where source inspection indicates projection/default/simulated behavior.

### UI-present but runtime/provider/platform-dependent

- `1A-STASH-OFF` NEW AUTH buttons depend on external iCloudPD/provider state.
- `3A` Raspberry scheduler buttons depend on the OS/crontab environment.
- `B2-REAL_DOWNLOAD` depends on authenticated provider access and provider-side behavior.
- `B4` Raspberry/fullscreen rendering options are present as target/option state but are not proof of completed hardware playback.

### Mock/demo/simulation only or partly simulated

- `B2` is mock/test download.
- `B5` is screen on/off simulation.
- `D1` through `D4` should be treated as planned/partial monitor surfaces unless real runtime projection/heartbeat/log-tail evidence is available.

### Overclaiming risks

- Do not claim that login works just because local session files exist; provider proof is separate.
- Do not claim that real downloads are complete just because the auth-gated endpoint exists.
- Do not claim that playback rendering is complete when `B4` only proves selection behavior.
- Do not claim that View D is a live worker monitor until authoritative backend heartbeat/projection/log-tail behavior is verified.
- Do not treat frontend buttons as equivalent to successful backend/runtime execution.
