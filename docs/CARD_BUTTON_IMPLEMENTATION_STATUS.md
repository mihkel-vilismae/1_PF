# Card/button implementation status audit

Created: 2026-05-26 14:09 EEST  
Updated: 2026-05-26 15:08 EEST

Baseline at creation: `PF_login--v0.5.36--13.33.54-260526.zip`  
Latest integrated baseline: `PF_login--v0.5.38--card-button-audit-regression-full_git.zip`

Scope:

- Included View A cards: `1A`, `1A-STASH-OFF`, `2A`, `3A`.
- Included View B cards: `B2`, `B2-REAL_DOWNLOAD`, `B3`, `B4`, `B5`.
- Included View D cards: `D1`, `D2`, `D3`, `D4`.
- Excluded: `1A-AUTH`, all View C cards, and all View E cards.

Method and authority:

- This audit primarily lists actual `<button>` elements rendered inside the included `.card` elements.
- Nested buttons are included only when they render inside the relevant `.card`.
- Non-button controls are normally excluded, but user-observed controls are noted when they directly affect the implementation assessment or follow-up list.
- The tests/code status is based on static source and test inspection unless explicitly marked as runtime-observed.
- The docs status is based on repository documentation and remains weaker than code, tests, generated evidence, and runtime artifacts when there is a conflict.
- The `Your subjective assessment` column is user-observed and intentionally less authoritative than code/tests/docs. It is useful for practical validation and follow-up planning, not proof of full production readiness.
  - This is documentation only; it does not change UI behavior, runtime behavior, routes, source code, or authentication/scheduler/pipeline logic.

> **Corrective verification note — 2026-05-31:** Control/button presence should not be read as proof of production runtime behavior. Use `docs/50_audits_and_migrations/MAIN_GOAL_IMPLEMENTATION_STATUS_VERIFICATION_20260531.md` for the current evidence-grade status of the main app goals.

**Evidence classification note**:  A Gate A documentation audit dated 2026‑05‑31 cross‑checks each implementation claim in this table against the codebase and tests.  The audit assigns an evidence grade (Verified, Inferred, Unknown, or Contradicted) to each claim and summarises the recommended actions.  See `docs/50_audits_and_migrations/GATE_A_DOCUMENTATION_AUDIT_20260531.md` for details.

## View A

### .card code and Heading: 1A-TEST-WHOLE-LOGIC — RUN whole logic without logging in

| View | .card code | Heading | Purpose | Priority | Button label | Button action / attribute | Implementation status according to tests/code | Implementation status according to docs | Your subjective assessment |
|---|---|---|---|---|---|---|---|---|---|
| A | 1A-TEST-WHOLE-LOGIC | RUN whole logic without logging in | Test Mode-only operator surface for the planned whole-logic scheduler/emulator flow without requiring login. | High | INSTALL TEST MODE EMULATOR, CALLING REGULAR WORKER EVERY 6sec, PLAYBACK WORKER EVERY 3sec, screen-on-off worker EVERY 12sec, ADD LIMIT OF 5 ITEMS TO EACH WORKER STAGE (INCLUDING THE MOCK DOWNLOAD) | `data-action="run-whole-logic-test-mode"` | Group 3 backend controller wired. Focused tests prove it renders only in Test Mode, start/status/control actions are exposed, and q/w/e/r/t controls map to the owned controller boundary. | Documented in `docs/20_architecture_and_specs/test_mode_whole_logic_emulator_contract.md`. | Correct for Group 3; controls only the owned Test Mode controller state and does not kill dashboard or arbitrary system processes. |

### .card code and Heading: 1A — Verify .env

| View | .card code | Heading | Purpose | Priority | Button label | Button action / attribute | Implementation status according to tests/code | Implementation status according to docs | Your subjective assessment |
|---|---|---|---|---|---|---|---|---|---|
| A | 1A | Verify .env | Validate required configuration keys and render backend response payload. | High | Run | `data-action="verify-env"` | Implemented / covered by static tests. UI maps to `POST /api/init/verify-env`; source/test inspection indicates backend result handling exists. | Implemented / partial. Docs describe real verify-env wiring, but readiness is action-triggered rather than fully automatic. | Works as expected. It may still have missing edge cases, but from the user's perspective it works. |

### .card code and Heading: 1A-STASH-OFF — NEW AUTH

| View | .card code | Heading | Purpose | Priority | Button label | Button action / attribute | Implementation status according to tests/code | Implementation status according to docs | Your subjective assessment |
|---|---|---|---|---|---|---|---|---|---|
| A | 1A-STASH-OFF | NEW AUTH | Main login/authentication area for the new iCloudPD auth flow. | Critical | Verify iCloudPD install | `data-action="new-auth-verify-icloudpd"` | Implemented. Backend/provider verification flow and secret-redaction tests exist by static inspection. | Implemented, provider-dependent. Docs say NEW AUTH is mostly closed, but real success depends on iCloudPD/provider state. | Implemented from the user's perspective. It works the way the user wanted, though edge cases may still exist. |
| A | 1A-STASH-OFF | NEW AUTH | Main login/authentication area for the new iCloudPD auth flow. | Critical | Verify with iCloudPD | `data-action="new-auth-verify-provider-session"` | Implemented / provider-dependent. Endpoint wiring exists; live success depends on provider proof and session state. | Implemented, provider-dependent. Docs separate local session files from provider-verified login. | Implemented from the user's perspective. |
| A | 1A-STASH-OFF | NEW AUTH | Main login/authentication area for the new iCloudPD auth flow. | Critical | Login using .env values | `data-action="new-auth-login-using-env"` | Implemented / provider-dependent. Login flow and 2FA handling exist, but provider success must be proven by live run evidence. | Implemented, provider-dependent. Docs describe login/2FA flow with sanitized provider output. | Implemented from the user's perspective. |
| A | 1A-STASH-OFF | NEW AUTH | Main login/authentication area for the new iCloudPD auth flow. | Critical | Check login | `data-action="new-auth-check-login"` | Implemented. Session/status check wiring exists; status is still dependent on provider proof. | Implemented. Docs describe status checking but warn not to confuse local files with verified login. | Implemented from the user's perspective. |
| A | 1A-STASH-OFF | NEW AUTH | Main login/authentication area for the new iCloudPD auth flow. | Critical | Log out and remove existing session | `data-action="new-auth-logout-session"` | Implemented. Logout/session removal route appears wired and tested by static inspection. | Implemented. Docs describe controlled session cleanup. | Implemented from the user's perspective. |
| A | 1A-STASH-OFF | NEW AUTH | Main login/authentication area for the new iCloudPD auth flow. | Critical | Show auth/session paths and files | `data-action="new-auth-session-files"` | Implemented. Session path/file inspection exists with secret-safe boundaries. | Implemented. Docs describe session file/path visibility without exposing file contents. | Implemented from the user's perspective. |
| A | 1A-STASH-OFF | NEW AUTH | Main login/authentication area for the new iCloudPD auth flow. | High | Generate auth evidence pack | `data-action="new-auth-generate-artifact-pack"` | Implemented. Backend artifact generation endpoint and dashboard service wrapper exist; this slice surfaces the action as a View A NEW AUTH control. | Implemented. Artifact docs describe sanitized evidence pack generation without raw provider output or session file contents. | New surfaced control; runtime result depends on local backend filesystem state. |
| A | 1A-STASH-OFF | NEW AUTH | Main login/authentication area for the new iCloudPD auth flow. | High | List auth evidence packs | `data-action="new-auth-list-artifact-packs"` | Implemented. Backend artifact list endpoint and dashboard service wrapper exist; this slice surfaces the action as a View A NEW AUTH control. | Implemented. Artifact docs describe listing generated sanitized evidence packs. | New surfaced control; runtime result depends on generated local artifacts. |

### .card code and Heading: 2A — Database controls

| View | .card code | Heading | Purpose | Priority | Button label | Button action / attribute | Implementation status according to tests/code | Implementation status according to docs | Your subjective assessment |
|---|---|---|---|---|---|---|---|---|---|
| A | 2A | Database controls | Verify and control local DB setup/status for runtime pipeline. | High | Check DB | `data-action="check-db"` | Implemented. UI/backend status endpoint wiring exists. | Implemented / partial. Docs describe DB status support, with remaining readiness/preload concerns. | Seems to work. |
| A | 2A | Database controls | Verify and control local DB setup/status for runtime pipeline. | High | Inspect DB | `data-action="inspect-db"` | Implemented. Inspect endpoint wiring exists. | Implemented. Docs describe DB inspection as available. | Seems to work. |
| A | 2A | Database controls | Verify and control local DB setup/status for runtime pipeline. | High | Delete DB | `data-action="delete-db"` | Implemented with risk guard expectation. Destructive control exists and should remain guarded. | Implemented / guarded. Docs mention destructive actions and safety concerns. | Seems to work. |
| A | 2A | Database controls | Verify and control local DB setup/status for runtime pipeline. | High | Recreate DB | `data-action="recreate-db"` | Implemented. Recreate-empty endpoint wiring exists. | Implemented / partial. Docs describe DB recreation, but runtime DB lifecycle remains an integration concern. | Seems to work. |

### .card code and Heading: 3A — Scheduler controls

| View | .card code | Heading | Purpose | Priority | Button label | Button action / attribute | Implementation status according to tests/code | Implementation status according to docs | Your subjective assessment |
|---|---|---|---|---|---|---|---|---|---|
| A | 3A | Scheduler controls | Control or inspect cron/scheduler automation behavior. | High | WINDOWS (crontab emulator) | `data-action="select-scheduler-target-windows"` | Implemented. Scheduler target selection exists. | Partial. Docs describe Windows emulator target as available. | Windows part seems to work and appears to call endpoints; deeper endpoint effects still need verification. |
| A | 3A | Scheduler controls | Control or inspect cron/scheduler automation behavior. | High | RASPBERRY (real crontab) | `data-action="select-scheduler-target-raspberry"` | Implemented / platform-dependent. UI target exists; real behavior depends on Raspberry environment. | Partial / target-state only. Docs describe Raspberry crontab target, but worker proof remains incomplete. | Raspberry part is likely not fully implemented / not yet proven. |
| A | 3A | Scheduler controls | Control or inspect cron/scheduler automation behavior. | High | copy all | `data-scheduler-endpoint-copy-all` | Implemented UI utility. Control exists for scheduler endpoint log. | Not central / utility control. Docs likely treat this as UI utility rather than core scheduler behavior. | Useful UI utility; not separately assessed. |
| A | 3A | Scheduler controls | Control or inspect cron/scheduler automation behavior. | High | clear | `data-scheduler-endpoint-clear-all` | Implemented UI utility. Control exists for clearing endpoint log. | Not central / utility control. Docs likely do not define this as main runtime functionality. | Useful UI utility; not separately assessed. |
| A | 3A | Scheduler controls | Control or inspect cron/scheduler automation behavior. | High | expand row | `data-scheduler-endpoint-row-expand="<rowId>"` | Implemented UI utility. Row expansion is present for log detail visibility. | Not central / utility control. Matches the terminal-like-div control direction. | Useful UI utility; not separately assessed. |
| A | 3A | Scheduler controls | Control or inspect cron/scheduler automation behavior. | High | Check emulator scheduler | `data-action="check-emulator-scheduler"` | Implemented. Emulator status/check wiring exists. | Partial. Docs describe CronEmulator support. | Windows part seems to work; deeper endpoint effects still need verification. |
| A | 3A | Scheduler controls | Control or inspect cron/scheduler automation behavior. | High | Run emulator | `data-action="run-emulator"` | Implemented. Emulator run control exists. | Partial. Docs describe Windows emulator, not full production scheduler. | Windows part seems to work; deeper endpoint effects still need verification. |
| A | 3A | Scheduler controls | Control or inspect cron/scheduler automation behavior. | High | Stop emulator | `data-action="stop-emulator"` | Implemented. Emulator stop control exists. | Partial. Docs describe emulator lifecycle controls. | Windows part seems to work; deeper endpoint effects still need verification. |
| A | 3A | Scheduler controls | Control or inspect cron/scheduler automation behavior. | High | Install crontab | `data-action="install-crontab"` | Implemented / platform-dependent. Crontab install action exists; real result depends on OS. | Partial / platform-dependent. Docs distinguish Windows emulator from Raspberry crontab. | Raspberry/real crontab side not yet proven. |
| A | 3A | Scheduler controls | Control or inspect cron/scheduler automation behavior. | High | Get active crontab | `data-action="get-active-crontab"` | Implemented / platform-dependent. Active crontab inspection exists. | Partial. Docs mention real crontab support but not full worker proof. | Raspberry/real crontab side not yet proven. |
| A | 3A | Scheduler controls | Control or inspect cron/scheduler automation behavior. | High | Install scheduler | `data-action="install-cron"` | Implemented / platform-dependent. Scheduler install route/action exists. | Partial. Docs describe scheduler install but runtime automation remains not fully proven. | Raspberry/real scheduler side not yet proven. |
| A | 3A | Scheduler controls | Control or inspect cron/scheduler automation behavior. | High | Check scheduler | `data-action="check-cron"` | Implemented / platform-dependent. Scheduler check action exists. | Partial. Docs describe scheduler checking but live worker proof remains incomplete. | Raspberry/real scheduler side not yet proven. |
| A | 3A | Scheduler controls | Control or inspect cron/scheduler automation behavior. | High | Print scheduler | `data-action="print-cron"` | Implemented / platform-dependent. Scheduler print action exists. | Partial. Docs describe scheduler visibility, not complete autonomous runtime proof. | Raspberry/real scheduler side not yet proven. |

## View B

### .card code and Heading: B2 — Download test action

| View | .card code | Heading | Purpose | Priority | Button label | Button action / attribute | Implementation status according to tests/code | Implementation status according to docs | Your subjective assessment |
|---|---|---|---|---|---|---|---|---|---|
| B | B2 | Download test action | Run safe/mock download action for pipeline testing. | Medium | Run | `data-action="run-b2"` | Implemented as mock/test download. UI calls the mock download backend route. | Mock/demo/test-only. Docs classify B2 as generated/test download, not production provider download. | Works as expected. It copied the pre-generated valid/invalid test images into the correct place. |

### .card code and Heading: B2-REAL_DOWNLOAD — Authenticated real download

| View | .card code | Heading | Purpose | Priority | Button label | Button action / attribute | Implementation status according to tests/code | Implementation status according to docs | Your subjective assessment |
|---|---|---|---|---|---|---|---|---|---|
| B | B2-REAL_DOWNLOAD | Authenticated real download | Run real download behavior gated by auth/session state. | Critical | Run real download | `data-action="run-b2-real-download"` | Partial / provider-dependent. Route wiring exists and is auth-gated, but full live provider success is not proven by static inspection. | Partial / decision-gated. Docs say route exists, but full provider-backed download worker/error handling remains incomplete. | Works after login, but repeated runs may re-download the same files instead of continuing to the next file batch. Needs investigation. |
| B | B2-REAL_DOWNLOAD | Authenticated real download | Run real download behavior gated by auth/session state. | Critical | Download count selector | Non-button select/input, values like `1 file`, `5 files` | Not included in original button-only audit. Needs separate controls audit. | Not fully represented in docs/button audit. | Important control. It may affect the repeated-download issue. |

### .card code and Heading: B3 — Pipeline stages

| View | .card code | Heading | Purpose | Priority | Button label | Button action / attribute | Implementation status according to tests/code | Implementation status according to docs | Your subjective assessment |
|---|---|---|---|---|---|---|---|---|---|
| B | B3 | Pipeline stages | Show and run staged media pipeline actions. | Critical | Run all stages | `data-action="run-b3-auto"` | Partial. Orchestration exists but depends on mixed mock/real stage readiness. | Partial. Docs describe hybrid pipeline state. | Ignored for now because exact behavior is unclear. |
| B | B3 | Pipeline stages | Show and run staged media pipeline actions. | Critical | Detect issues in pipeline | `data-action="detect-pipeline-issues"` | Implemented. Pipeline issue detection endpoint/action exists. | Implemented / diagnostic. Docs treat issue detection as support tooling. | Worked once when needed; current state uncertain. |
| B | B3 | Pipeline stages | Show and run staged media pipeline actions. | Critical | Clear stale locks | `data-action="clear-stale-pipeline-locks"` | Implemented. Stale lock clearing action exists. | Implemented / diagnostic. Docs describe stale-lock clearing as maintenance support. | Worked once when needed; current state uncertain. |
| B | B3 | Pipeline stages | Show and run staged media pipeline actions. | Critical | Run | `data-action="run-b3-1"` for B3.1 Download | Implemented as mock/test stage. Download stage exists but not full provider production path. | Mock/demo/partial. Docs classify generated/test download separately from real provider download. | After mock download flow, files copied as expected. |
| B | B3 | Pipeline stages | Show and run staged media pipeline actions. | Critical | Run | `data-action="run-b3-2"` for B3.2 Index | Implemented / partial. Index route/action exists; production completeness depends on media source state. | Partial. Docs describe index as one backend-wired pipeline piece. | Seemed to work. |
| B | B3 | Pipeline stages | Show and run staged media pipeline actions. | Critical | Run | `data-action="run-b3-3"` for B3.3 Parse GPS | Implemented / partial. GPS parse action exists; depends on available metadata/media fixtures. | Partial. Docs describe GPS parsing as pipeline stage, not full autonomous production proof. | Seemed to work, but provider/mock behavior is unclear. |
| B | B3 | Pipeline stages | Show and run staged media pipeline actions. | Critical | Run | `data-action="run-b3-4"` for B3.4 Geocode | Partial / placeholder-dependent. Geocode action exists, but production geocoding remains limited. | Partial. Docs mention geocoding as not fully production-complete. | Seemed to work, but provider/mock behavior is unclear. |
| B | B3 | Pipeline stages | Show and run staged media pipeline actions. | Critical | Run | `data-action="run-b3-5"` for B3.5 Enqueue playback | Implemented. Queue preparation/enqueue stage is implemented by source/test inspection. | Implemented / partial pipeline context. Docs say B3.5 queue preparation is implemented while broader pipeline remains partial. | Seemed to work. |

### .card code and Heading: B4 — Playback selection

| View | .card code | Heading | Purpose | Priority | Button label | Button action / attribute | Implementation status according to tests/code | Implementation status according to docs | Your subjective assessment |
|---|---|---|---|---|---|---|---|---|---|
| B | B4 | Playback selection | Select or verify current playable media item. | High | Windows | `data-playback-rendering-platform="windows"` | Implemented as option state. UI platform option exists. | Selection-only context. Docs do not claim real rendering is complete. | Windows preview worked after queue/enqueue. |
| B | B4 | Playback selection | Select or verify current playable media item. | High | Raspberry OS (disabled) | `data-playback-rendering-platform="raspberry-os"` | Present but disabled/not production-ready. UI option exists but is intentionally unavailable. | Planned / not complete. Docs preserve Raspberry/fullscreen target as goal, not current proof. | Likely not implemented. Skip for now. |
| B | B4 | Playback selection | Select or verify current playable media item. | High | Playback without rendering | `data-playback-rendering-mode="playback-without-rendering"` | Implemented. Non-rendering selection mode exists. | Implemented, selection only. Docs say playback selection does not render. | Not separately assessed. |
| B | B4 | Playback selection | Select or verify current playable media item. | High | Show real rendering in preview window | `data-playback-rendering-mode="show-real-rendering-in-preview-window"` | Partial / UI option. Option exists, but full rendering proof is not established here. | Partial / target behavior. Docs distinguish preview/rendering from selection. | Worked: real image appeared in preview. Issue: GPS coordinates showed instead of address string. |
| B | B4 | Playback selection | Select or verify current playable media item. | High | Switch to fullscreen | `data-playback-rendering-mode="switch-to-fullscreen"` | Partial / target option. Option exists, but real fullscreen playback/hardware output is not proven. | Planned / partial. Docs say fullscreen rendering is not complete production behavior. | Issue: briefly entered blank fullscreen, then immediately exited and preview playback continued. |
| B | B4 | Playback selection | Select or verify current playable media item. | High | Run | `data-action="run-b4"` | Implemented for selection. Backend selection service/tests exist; this does not equal real playback rendering. | Implemented, selection only. Docs explicitly frame B4 as selecting the current playable item. | Playback selection/preview appeared to work after enqueue. |

### .card code and Heading: B5 — Screen on-off simulation

| View | .card code | Heading | Purpose | Priority | Button label | Button action / attribute | Implementation status according to tests/code | Implementation status according to docs | Your subjective assessment |
|---|---|---|---|---|---|---|---|---|---|
| B | B5 | Screen on-off simulation | Simulate display/screen state changes for development/testing. | Medium | No buttons inside this .card | — | Implemented as backend simulation only, but no card-local button. Screen simulation exists elsewhere through configured UI/state controls. | Mock/demo/test-only. Docs say this is simulation, not real hardware telemetry/control. | Largely not implemented / not fully thought through. Needs attention. |
| B | B5 | Screen on-off simulation | Simulate display/screen state changes for development/testing. | Medium | Real sensor / keyboard movement / mouse movement trigger controls | Checkboxes/inputs, not in original button-only audit | Not fully audited. Some simulation/config controls may exist, but not real hardware control. | Mock/demo/test-only / not fully documented. | Likely not fully implemented. Logic still needs to be defined. |

## View D

### .card code and Heading: D1 — Pipeline worker

| View | .card code | Heading | Purpose | Priority | Button label | Button action / attribute | Implementation status according to tests/code | Implementation status according to docs | Your subjective assessment |
|---|---|---|---|---|---|---|---|---|---|
| D | D1 | Pipeline worker | Monitor/control background pipeline worker execution. | Critical | No buttons inside this .card | — | Partial / projection shell. Card exists, but worker health defaults to unknown or projection-derived status rather than authoritative heartbeat telemetry. | Planned / mock-only. Docs describe View D as future backend-owned live runtime monitor. | Needs to be looked into. Mechanism/meaning of the worker status should be clarified and verified. |

### .card code and Heading: D2 — Playback worker

| View | .card code | Heading | Purpose | Priority | Button label | Button action / attribute | Implementation status according to tests/code | Implementation status according to docs | Your subjective assessment |
|---|---|---|---|---|---|---|---|---|---|
| D | D2 | Playback worker | Monitor/control automatic playback selection/update behavior. | High | No buttons inside this .card | — | Partial. Playback worker implementation exists elsewhere, but D2 card telemetry is not authoritative live heartbeat proof. | Planned / partial boundary. Docs say D2 monitoring is not yet real worker telemetry. | Needs to be looked into. It is unclear whether the card reflects real playback-worker state. |

### .card code and Heading: D3 — Screen on-off worker

| View | .card code | Heading | Purpose | Priority | Button label | Button action / attribute | Implementation status according to tests/code | Implementation status according to docs | Your subjective assessment |
|---|---|---|---|---|---|---|---|---|---|
| D | D3 | Screen on-off worker | Monitor/control screen power/state worker behavior. | Medium | No buttons inside this .card | — | Partial / placeholder telemetry. Card/projection mapping exists, but real screen worker heartbeat/hardware state is not implemented. | Planned / mock-only. Docs say real runtime/screen hardware contracts are still future work. | Needs to be looked into. Real intended mechanism and implementation state are unclear. |

### .card code and Heading: D4 — Monitor log / Preview log

| View | .card code | Heading | Purpose | Priority | Button label | Button action / attribute | Implementation status according to tests/code | Implementation status according to docs | Your subjective assessment |
|---|---|---|---|---|---|---|---|---|---|
| D | D4 | Monitor log / Preview log | Show live monitoring/log output for worker/runtime activity. | High | No buttons inside this .card | — | Partial / simulated or generic log surface. UI renders monitor/preview log, but authoritative worker log-tail behavior is not proven. | Planned / simulated preview. Docs say D4 should eventually come from backend event/log projections. | Needs review together with D1-D3, especially whether logs are real runtime evidence or simulated/preview output. |

## User-observed follow-up list

| ID | View / Card | Area | Observation / issue | Suggested next action | Priority |
|---:|---|---|---|---|---|
| 1 | B2-REAL_DOWNLOAD | Real download batching | When selecting `1 file` or `5 files`, repeated runs may re-download the same files instead of continuing to the next file/batch. It may overwrite or repeat the same downloaded items. | Verify download cursor/progress logic. Check whether downloaded items are tracked, skipped, or reselected on the next run. | Critical |
| 2 | B2-REAL_DOWNLOAD | Download count selector | There is an input/select controlling how many files to download, but the earlier button audit did not include non-button controls. | Add input/select controls to the audit or create a separate card controls audit that includes buttons, selects, checkboxes, and inputs. | High |
| 3 | B3 | Run all stages | The user chose to ignore `Run all stages` for now because its exact behavior is unclear. | Inspect what it triggers and whether it runs B3.1-B3.5 sequentially with proper state handling. | Medium |
| 4 | B3 | Pipeline diagnostics | `Detect issues in pipeline` worked when needed previously, but current behavior is uncertain. | Re-test with a known broken pipeline state and record expected/actual output. | Medium |
| 5 | B3 | Stale lock cleanup | `Clear stale locks` worked when needed previously, but current behavior is uncertain. | Re-test with known stale-lock fixture/state and confirm it clears only safe stale locks. | Medium |
| 6 | B3.3 / B3.4 | GPS + geocode providers | GPS parse and geocode seemed to work, but it is unclear whether they use real providers, multiple providers, or mock/static data. | Inspect provider pipeline and document whether each stage is mock, local parsing, external provider, or fallback. | High |
| 7 | B4 | Address display | Preview showed GPS coordinates, but expected output should be a human-readable address string. | Verify geocode result mapping into playback/preview metadata and UI display field selection. | High |
| 8 | B4 | Fullscreen mode | `Switch to fullscreen` briefly entered fullscreen/blank screen, then immediately exited and preview playback continued. | Debug fullscreen lifecycle, browser permission/user gesture behavior, focus loss, and render target switching. | High |
| 9 | B4 | Raspberry playback | Raspberry option is likely not implemented / not ready. | Keep marked as planned/disabled until Raspberry runtime playback path is implemented and tested. | Medium |
| 10 | B5 | Screen simulation controls | Checkboxes/inputs for real sensor, keyboard movement, mouse movement, and similar triggers are likely not fully implemented. | Define intended logic first, then implement/test each trigger path separately. | High |
| 11 | D1 | Pipeline worker monitor | The intended working mechanism of the D1 card is unclear and likely not authoritative yet. | Define what real pipeline-worker heartbeat/status should be, then connect card to real backend projection. | High |
| 12 | D2 | Playback worker monitor | D2 may not reflect real playback-worker telemetry. | Verify whether playback worker emits real heartbeat/status and whether View D consumes it. | High |
| 13 | D3 | Screen worker monitor | D3 likely lacks real screen-worker/hardware state. | Define screen-worker contract and connect to real or explicitly simulated source. | Medium |
| 14 | D4 | Monitor/preview log | D4 may show simulated/generic logs rather than authoritative worker logs. | Decide whether D4 should tail real backend events, worker logs, or a structured runtime event stream. | High |
| 15 | A3 | Scheduler / Windows emulator | Windows emulator seems to work and calls endpoints, but deeper endpoint effects are not fully verified. | Trace endpoint calls through backend actions and confirm expected side effects. | Medium |
| 16 | A3 | Scheduler / Raspberry crontab | Raspberry scheduler/crontab is platform-dependent and likely not fully proven. | Test on Raspberry or mark clearly as unverified until hardware/OS-level run evidence exists. | Medium |

## Reconciliation notes

- View A cards are mostly implemented according to static tests/code and are mostly aligned with docs, but scheduler behavior remains platform-dependent.
- View B is mixed: mock/test download and playback selection have substantial implementation, while real provider download, geocoding, fullscreen rendering, Raspberry playback, and screen simulation remain partial or not fully proven.
- View D cards remain mostly monitoring/projection shells. They should not be treated as authoritative live worker telemetry until backend heartbeat/status contracts are verified.
- The user-observed assessment confirms several flows appear to work in practice, but it also identifies high-priority follow-ups: repeated real-download batches, address display, fullscreen lifecycle, screen simulation controls, and View D worker telemetry.
- Do not use this document alone to claim production readiness. Code, tests, generated evidence packs, and runtime artifacts override this audit when they conflict.

### Pending border markers added in visual slice

Beginning with PF_login v0.5.44 (Slice 3 of the Test/Real mode split), the dashboard
includes a visual pending‑marker border on cards whose functionality remains
unfinished, partially verified, or otherwise subject to further review.
These markers are purely visual cues; they do not change the underlying
implementation status listed above, nor do they disable interaction.

The following cards currently display the pending border:

| Card code | Reason for pending marker |
|---|---|
| **B3** | Pipeline stage card is hybrid: some stages are wired to backend endpoints while others use placeholder geocoder or are not production‑ready. |
| **B4** | Playback selection card still relies on placeholder rendering; fullscreen lifecycle and Raspberry rendering remain incomplete. |
| **B5** | Screen on‑off simulation card controls backend simulation state only; real sensor and hardware triggers are not implemented. |
| **D1** | Pipeline worker card monitors computed summaries rather than authoritative worker heartbeat telemetry. |
| **D2** | Playback worker card monitors computed statuses and summary; real playback worker heartbeat is not yet wired. |
| **D3** | Screen on‑off worker card monitors placeholder data; real screen worker contract is not implemented. |
| **D4** | Monitor/preview log card displays simulated log lines in preview mode; live log tailing remains a future enhancement. |

When a card’s underlying functionality is completed and reviewed, the pending
border can be removed by modifying the relevant `card--pending` class in
the dashboard views. Only remove a pending marker when there is clear code,
test, runtime, or documentation evidence that the feature is complete.
