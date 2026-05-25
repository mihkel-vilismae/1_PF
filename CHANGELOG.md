# CHANGELOG

## 0.5.28 - 2026-05-26 01:49 EEST

- Added the terminal-style cron endpoint live log below the scheduler target cards and above `Latest backend result`, matching the requested placement for the Windows CronEmulator controls area.
- Recorded frontend-triggered scheduler endpoint request, response, and error events for the CronEmulator controls without changing `/api/init/cron/*` backend route compatibility or scheduler semantics.
- Preserved existing scheduler buttons, target selection behavior, crontab textareas, and `Latest backend result` rendering while adding the new diagnostic log panel.
- Bumped version metadata from v0.5.27 to v0.5.28 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.27 - 2026-05-25 21:03 EEST

- Added `docs/30_status_snapshots/2026-05-25/MAIN_GOAL_IMPLEMENTATION_STATUS_20260525.md`, a code-checked main-goal implementation status table for the autonomous picture-frame goal across login, download, parsing, queueing, playback, Windows fullscreen development rendering, Raspberry production rendering, scheduler automation, monitoring, and recovery.
- Updated the status snapshot README and documentation freshness matrix so the new snapshot is discoverable as the latest v0.5.26-based implementation-status reference.
- Preserved runtime behavior, backend routes, frontend UI behavior, authentication, download, parsing, playback, scheduler behavior, and Raspberry display behavior unchanged.
- Bumped version metadata from v0.5.26 to v0.5.27 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.26 - 2026-05-25 20:39 EEST

- Added safe NEW AUTH login artifact pack generation through `POST /api/auth/new/artifacts/generate`, writing sanitized evidence under `debug_artifacts/auth/auth_attempt_<estonian_timestamp>/`.
- Added `GET /api/auth/new/artifacts` plus frontend endpoint wrappers for listing generated NEW AUTH evidence packs.
- Captured passive status, session/path metadata, raw iCloudPD stdio private-log metadata, timeline, status matrix, evidence summary, hypotheses, and redaction checks without copying raw provider output or session contents.
- Updated the canonical NEW AUTH Evidence Pack guide to describe the implemented generator endpoints and safety boundaries.
- Bumped version metadata from v0.5.25 to v0.5.26 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.25 - 2026-05-25 18:17 EEST

- Enabled local-only raw iCloudPD stdout/stderr capture for Windows `start_win.cmd` launches by default while preserving existing environment overrides.
- Updated `example.env` so new copied repo env files opt into `ICLOUDPD_RAW_STDIO_LOG=1` with the existing private `runtime_data/private_logs/icloudpd_raw_stdio.log` path.
- Preserved sanitized API/UI/Event history behavior; raw provider output remains local private runtime evidence and is not exposed through normal auth routes.
- Bumped version metadata from v0.5.24 to v0.5.25 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.24 - 2026-05-25 17:56 EEST

- Added project-local skills `.codex/skills/icloudpd-login` and `.codex/skills/new-auth-login-monitor` for iCloudPD authentication guidance and NEW AUTH login monitoring workflows.
- Reviewed both added skill folders for GitHub safety and confirmed no hardcoded passwords, tokens, cookie values, API keys, or other credential material are present.
- Bumped version metadata from v0.5.23 to v0.5.24 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.23 - 2026-05-25 02:36 EEST

- Added an AI-first documentation navigation rule to `AGENTS.md` so agents read the closure report, documentation index, freshness matrix, reorganization plan, and link audit before trusting or changing docs.
- Documented the canonical numbered documentation folders and the rule that old categorized docs, compatibility pointers, TODOs, specs, backlog, and archive material are not current implementation truth without code/test/evidence verification.
- Bumped version metadata from v0.5.22 to v0.5.23 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.22 - 2026-05-14 04:10 Tallinn

- Added an opt-in raw-sensitive iCloudPD stdout/stderr capture sink gated by `ICLOUDPD_RAW_STDIO_LOG=1`.
- Isolated raw iCloudPD output under `runtime_data/private_logs/icloudpd_raw_stdio.log` by default and rejected configured raw log paths outside `runtime_data`.
- Preserved sanitized dashboard/API/Event history behavior; raw provider output is never returned through normal UI or API paths by default.
- Added focused regression coverage for disabled-by-default behavior, runtime_data path isolation, and opt-in raw capture from both provider and NEW AUTH interactive flows.
- Bumped version metadata from v0.5.21 to v0.5.22 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.21 - 2026-05-13 17:57 Tallinn

- Added dashboard request/response correlation ids to the shared frontend API client, HTTP request headers, echoed backend response headers, transit terminal lines, captured metadata, and Event history request/response detail rows.
- Added a dedicated sanitized `logindebug.log` sink for `/api/auth/*` traffic, including `1A-STASH-OFF NEW AUTH` request, response, and failure diagnostics without raw cookies, passwords, tokens, sessions, or submitted 2FA values.
- Stopped tracking generated `conf/runtime-truth.json` runtime state while preserving the local ignored file.
- Added focused regression coverage for request id propagation, Event history id display, backend header echoing, project logger file creation, and sanitized NEW AUTH login debug mirroring.
- Bumped version metadata from v0.5.20 to v0.5.21 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.20 - 2026-05-12 20:55 Tallinn

- Implemented Windows B4 browser-native playback rendering for the selected backend media item.
- Added the read-only `GET /api/runtime/playback/media` media stream endpoint with extension and path allow-list checks.
- Wired selected playback items to a safe media URL so the preview panel can render images/videos after B4 selects an item.
- Enabled the existing fullscreen rendering mode to request browser fullscreen on the Windows playback preview stage; pressing Esc exits fullscreen while playback state remains selected.
- Kept Raspberry OS rendering disabled/planned and preserved backend playback selection semantics.
- Added regression coverage for Windows preview/fullscreen markup and media URL projection.
- Bumped version metadata from v0.5.19 to v0.5.20 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.19 - 2026-05-12 18:39 Tallinn

- Updated `start_win.cmd` so it runs `npm run build` after dependency checks/install and before launching `npm run api`.
- The Windows launcher now stops before starting the API server if the production build fails.
- Bumped version metadata from v0.5.18 to v0.5.19 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.18 - 2026-05-12 18:34 Tallinn

- Updated current implementation/status documentation to reflect the completed NEW AUTH passive skipped-proof UX, active `Verify with iCloudPD` provider-proof action, and Slice 3 regression/redaction coverage.
- Added `docs/IMPLEMENTATION_STATUS_UPDATE_20260512_NEW_AUTH_PROVIDER_VERIFICATION.md` as the latest status update report for the Slice 1-3 login reconciliation work.
- Updated categorized status docs so local session files remain evidence only, passive status remains read-only, active provider proof uses `GET /api/auth/new/status`, and install verification remains separate from session proof.
- Updated README, HOW_TO_RUN, and documentation indexes with the v0.5.18 status-doc refresh.
- Bumped version metadata from v0.5.17 to v0.5.18 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.17 - 2026-05-12 18:21 Tallinn

- Slice 3: added focused NEW AUTH provider-verification UX regression coverage and operator documentation.
- Verified that passive skipped-proof status renders actionable copy, keeps `GET /api/auth/new/status?mode=passive` read-only, and leaves active provider proof on `GET /api/auth/new/status`.
- Added transit/logging coverage proving the active provider-verification action uses the shared frontend API client instead of bypassing request logging.
- Added redaction coverage for provider communication shown through the NEW AUTH modal/history path.
- Documented the distinction between `Verify iCloudPD install`, passive `Check login`, and active `Verify with iCloudPD`.
- Bumped version metadata from v0.5.16 to v0.5.17 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.16 - 2026-05-12 17:58 Tallinn

- Slice 2: added the NEW AUTH `Verify with iCloudPD` provider-session proof action for the passive skipped-provider-proof state.
- Wired `new-auth-verify-provider-session` through the existing runtime-truth action map and shared `requestJson`/event-history request path, targeting active `GET /api/auth/new/status` instead of passive `GET /api/auth/new/status?mode=passive`.
- Preserved existing passive check-login semantics, iCloudPD install verification, login/2FA flow, backend endpoint contracts, and secret redaction behavior.
- Added regression coverage for the new active provider-proof action, button metadata, initial state/action compatibility, and View A rendering.
- Bumped version metadata from v0.5.15 to v0.5.16 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.15 - 2026-05-12 17:33 Tallinn

- Slice 1: mapped `NEW_AUTH_PROVIDER_PROOF_SKIPPED` passive new-auth status into a clear actionable UI state instead of a vague pending state.
- The NEW AUTH card now shows `Session files found, provider verification not run yet.` with explanatory copy telling the user that passive status did not contact iCloudPD.
- Preserved passive status semantics: `GET /api/auth/new/status?mode=passive` still does not start provider proof, backend contracts are unchanged, and displayed provider/auth data remains sanitized.
- Added/updated regression coverage for the passive skipped-provider-proof state projection.
- Bumped version metadata from v0.5.14 to v0.5.15 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.14 - 2026-05-12 17:23 Tallinn

- Added root `start_win.cmd` Windows launcher according to the default project setup expectation.
- The launcher checks for `node` and `npm`, installs dependencies with `npm install --verbose` when `node_modules` is missing, then opens separate terminals for `npm run api` and `npm run dev`.
- Bumped version metadata from v0.5.13 to v0.5.14 in `VERSION`, `package.json`, and `package-lock.json`.
- Preserved existing package scripts and runtime behavior; the new script is an additive Windows convenience entrypoint.

## 0.5.13 - 2026-05-12 16:00 Tallinn

- **Wave 2 – Read‑only runtime projections**. Added a live runtime projection endpoint to the backend, wired the dashboard to fetch the projection, and provided safe preload behaviour:
  - Added `projectionLive` to `RUNTIME_EXECUTION_ENDPOINTS` and a `getRuntimeLiveProjection()` helper in `dashboard/services/runtimeExecutionService.ts`.
  - Added `runtimeLiveProjectionHandler` and route `'GET /api/runtime/projection/live'` to `server/index.ts`, assembling a combined `LiveRuntimeProjection` with field provenance labels.
  - Added `loadLiveRuntimeProjection()` to the runtime‑truth demo actions and a `refresh-running-process` action dispatch in `runtimeTruthBehavior.ts`.
  - Modified `app.ts` to run safe preloads on first entry to View A and to refresh last‑run and running‑process data when switching to views C and D, respectively.
  - Updated the running process view to support both mock preview and live monitor modes with dynamic hero copy, badges, controls and log titles.
  - Bumped the project version to 0.5.13 and updated `VERSION`, `package.json` and `package-lock.json` accordingly.


## 2026-05-12 15:50 Tallinn

- Added `docs/RUNTIME_TRUTH_AUTHORITY_MAP_20260512.md` capturing the final runtime truth authority model.  The document codifies that SQLite is the durable source of truth, lock files are for process coordination only, logs are for audit/debugging, `conf/runtime‑truth.json` is a non‑authoritative projection, front‑end local state is transient and backend projections must declare field sources.  It provides view‑specific guidance and recommended next slices without changing any behaviour.
- Added `shared/runtimeProjectionContracts.ts` defining runtime projection source enums, runtime namespaces, a generic `RuntimeField<T>` wrapper, and high‑level contracts for worker health, last‑run, playback, screen and live runtime projections.  These TypeScript contracts are framework‑agnostic and do not implement any runtime logic.
- Added `tests/runtimeProjectionContracts.test.js` verifying that the runtime projection sources and namespaces are exported correctly and contain all expected values.
- Updated `docs/main_readme.md` to link to the new runtime truth authority map document.
- This documentation and contract slice does not alter runtime, frontend or backend behaviour, and does not bump package versions.

## 2026-05-12 14:16 Tallinn

- Added `docs/IMPLEMENTATION_GOAL_STATUS_RECONCILIATION_20260512.md` as a canonical reconciliation of implementation goals, current statuses, unresolved questions and conflicts.  The document consolidates existing status docs, harmonises status vocabulary and provides a recommended implementation order without changing runtime behaviour.
- Updated `docs/main_readme.md` to link to the new reconciliation document.
- This documentation update does not bump the repository version or modify any code.

## 0.5.12 - 2026-05-10 23:08 Tallinn

- Fixed `B2-REAL_DOWNLOAD` backend auth gating to use the same NEW AUTH provider-proof session model as `/api/auth/new/status`.
- Preserved the dedicated `POST /api/runtime/download/real-run` route, batch selector behavior, and existing B2 mock/test download action.
- Added regression tests for missing NEW AUTH session blocking and provider-proof-authenticated runtime gate success.

## 0.5.11 - 2026-05-10 21:37 Tallinn

- Added a View B `B2-REAL_DOWNLOAD` companion action beside the existing B2 test download action.
- Added `POST /api/runtime/download/real-run` as a dedicated authenticated real iCloudPD download route with safe batch-size normalization.
- Added a frontend selector for real-download batch size and guarded the action behind known authenticated session state while preserving backend verification.
- Preserved existing B2 mock/test download behavior at `POST /api/runtime/download/run`.
- Tests run: `npm test -- --test-reporter=spec tests/runtimeExecutionService.test.js tests/authIcloudpdProvider.test.js tests/viewB.buttonWorkflow.test.js`.


## 0.5.10 - 2026-05-10 20:50 Tallinn

- Restored `TRANSFERABLE_REPO_PACKAGER.cmd` as a tracked repo utility.
- Kept `zip_ignore.json` as a local-only archive ignore configuration by adding it to `.gitignore`.
- Removed the stale local `dashboard/inspect/guideCopy.json` artifact from the working tree; current inspect copy remains sourced from `dashboard/inspect/guideCopy.ts` and split modules.

## 0.5.9 - 2026-05-10 20:10 Tallinn

- Slice 9: extracted the runtime status route family into `server/routes/runtimeStatusRoutes.ts`.
- Files changed: `server/index.ts`, `server/routes/runtimeStatusRoutes.ts`, `tests/runtimeStatusRoutesCompatibility.test.js`, `VERSION`, `package.json`, `package-lock.json`, and `CHANGELOG.md`.
- Behavior preserved: `/api/runtime/orchestration/current` and `/api/runtime/orchestration/last` keep the same HTTP methods, paths, handlers, response shapes, and status behavior.
- Tests run: focused runtime status route compatibility test command attempted; typecheck compared against the Slice 7 baseline and Slice 8 state.
- Known remaining pre-existing failures: baseline typecheck is blocked by missing Node type definitions in this environment; focused tests are blocked because `tsx` is unavailable.

## 0.5.8 - 2026-05-10 20:05 Tallinn

- Slice 8: extracted the inspection route family into `server/routes/inspectionRoutes.ts`.
- Files changed: `server/index.ts`, `server/routes/inspectionRoutes.ts`, `tests/inspectionRoutesCompatibility.test.js`, `docs/active_workflow_docs/slice_8_9_route_selection.md`, `VERSION`, `package.json`, `package-lock.json`, and `CHANGELOG.md`.
- Behavior preserved: `/api/version` and `/api/init/verify-env` keep the same HTTP methods, paths, handlers, response shapes, and status behavior.
- Tests run: focused inspection route compatibility test command attempted; typecheck compared against the Slice 7 baseline.
- Known remaining pre-existing failures: baseline typecheck is blocked by missing Node type definitions in this environment.

## 0.5.7 - 2026-05-10 19:21 Tallinn

- Extracted the runtime-truth and pipeline lock maintenance route handlers into `server/routes/runtimeTruthRoutes.ts`.
- Preserved `/api/runtime-truth`, `/api/runtime/pipeline/issues/detect`, and `/api/runtime/pipeline/stale-locks/clear` endpoint paths, methods, response envelopes, and persisted runtime-truth file behavior.
- Bumped version metadata from v0.5.6 to v0.5.7.

## 0.5.6 - 2026-05-10 19:05 Tallinn

- Extracted the runtime screen-simulation route handlers and private simulation state into `server/routes/screenSimulationRoutes.ts`.
- Preserved the existing `/api/runtime/screen-simulation/state` and `/api/runtime/screen-simulation/configure` endpoints, response shapes, validation errors, and simulation-only hardware boundary.
- Bumped version metadata from v0.5.5 to v0.5.6.

## 0.5.5 - 2026-05-10 19:00 Tallinn

- Refactored the scheduler and CronEmulator route-key table into `server/routes/schedulerRoutes.ts` while preserving all existing endpoint paths, HTTP methods, and handler wiring.
- Added a scheduler route compatibility test that pins the extracted route family to the legacy route keys.
- Preserved `server/index.ts` request parsing, middleware flow, response handling, scheduler behavior, and cron emulator behavior.


## 2026-05-10 18:50 EEST — v0.5.4

### Added
- Added focused internal NEW AUTH helper modules for shared types, constants, command execution, path/session metadata, sanitization, and structured event shaping.

### Changed
- Refactored `server/auth/newAuthService.ts` into a smaller compatibility facade while preserving NEW AUTH endpoint/service behavior.
- Bumped version metadata from v0.5.3 to v0.5.4.

### Fixed
- None

### Removed
- None

## 2026-05-10 18:46 EEST — v0.5.3

### Added
- Added dedicated renderer utility and modal renderer modules while preserving the existing dashboard renderer compatibility entrypoint.

### Changed
- Extracted modal-specific rendering from `dashboard/services/renderers.ts` into a focused renderer module.
- Bumped version metadata from v0.5.2 to v0.5.3.

### Fixed
- None

### Removed
- None

## 2026-05-10 17:56 EEST — v0.5.2

### Added
- Added checked-in Windows CronEmulator entrypoint files for `regular_stage_worker`, `playback_worker`, and `screen_on_off_worker`.

### Changed
- Updated the default Windows CronEmulator crontab to call the three worker entrypoint files instead of inline placeholders or inline screen-simulation commands.
- Reused shared Raspberry cron row constants for all three scheduler workers while preserving the existing Raspberry disabled/planned UI target state.

### Fixed
- Kept `regular_stage_worker` scoped to B3.1-B3.5 in its entrypoint and left current playable item selection in `playback_worker`.

### Removed
- None

## 2026-05-10 17:38 EEST — v0.5.2

### Added
- Added documentation clarification that B3.5 owns queue preparation/building and `playback_worker` is the final worker-stage action that selects the current playable item from prepared playback state.

### Changed
- Reconciled B4 playback, placeholder, README, and code-verified status docs so they do not overclaim real preview/fullscreen rendering, Raspberry OS rendering, queue building inside `playback_worker`, or live Windows CronEmulator execution proof.
- Updated version metadata from v0.5.1 to v0.5.2.

### Fixed
- Corrected stale documentation wording that could imply `playback_worker` prepares/builds the queue or that CronEmulator vendoring proves live scheduler execution.

### Removed
- None

## 2026-05-10 17:00 EEST — v0.5.1

### Added
- Vendored CronEmulator under `tools/CronEmulator` as normal tracked repository files instead of an implicit nested Git repository.
- Added a tracked `crontab_emulated.example.txt` template and pytest configuration for local CronEmulator tests.

### Changed
- Updated ignore rules so CronEmulator runtime crontab, logs, caches, bytecode, and virtualenvs stay out of Git.
- Bumped version metadata from v0.5.0 to v0.5.1.

### Fixed
- None

### Removed
- Removed the root Git gitlink dependency for `tools/CronEmulator`.

## 2026-05-10 16:52 EEST — v0.5.0

### Added
- Added a code-verified B4 playback flow closure/status document covering Run, route, worker, scheduler command, rendering controls, and remaining placeholders.
- Added a focused documentation guard to prevent the B4 status document from overclaiming real preview/fullscreen or Raspberry display support.

### Changed
- None

### Fixed
- None

### Removed
- None

## 2026-05-10 16:47 EEST — v0.5.0

### Added
- Added shared scheduler playback-worker command constants for Windows CronEmulator and Raspberry cron.
- Added focused scheduler command tests proving both platform rows reach `npm run api -- --scheduler playback-worker`.

### Changed
- Updated the View A Windows CronEmulator default install crontab so B4 playback uses the Slice 3 backend playback-worker entrypoint instead of `/path/to/playback_worker`.
- Kept Raspberry cron generation aligned with the same shared playback-worker command.
- Kept Node test/server-side initial scheduler rendering Windows-first while preserving browser platform detection in real frontend rendering.

### Fixed
- Fixed the parent-repo scheduler wiring gap where the Windows CronEmulator default textarea still contained a playback_worker placeholder.

### Removed
- None

## 2026-05-10 16:42 EEST — v0.5.0

### Added
- Added a backend playback selection service shared by the B4 HTTP route and the new playback_worker entrypoint.
- Added playback_worker single-run execution with a scheduler status file, worker lock file, selected-item evidence, skipped reasons, and failure reasons.
- Added focused playback_worker tests for selected, skipped, lock-conflict, route-payload-preservation, and no-rendering/no-B3/no-B5 boundaries.

### Changed
- Reused the shared Stage 6 selection service from `POST /api/runtime/playback/select-current` without changing the route path or successful/error response behavior.
- Added `--scheduler playback-worker` dispatch so scheduled playback commands no longer start the HTTP server by default.

### Fixed
- Closed the placeholder gap where the scheduled playback worker command was present in crontab text but had no backend worker dispatch path.

### Removed
- None

## 2026-05-10 16:35 EEST — v0.5.0

### Added
- Added B4 rendering mode controls for playback without rendering, preview rendering, and fullscreen rendering.
- Added Windows and disabled Raspberry OS rendering tabs for B4 while preserving backend playback selection behavior.
- Added focused View B tests for disabled-before-run, failed-run gating, successful-run enablement, and unchanged select-current endpoint wiring.

### Changed
- Connected the B4 UI to the shared playback renderer contract from Slice 1 without adding rendering dependencies or backend worker behavior.

### Fixed
- None

### Removed
- None

## 2026-05-10 16:24 EEST — v0.5.0

### Added
- Added a B4 playback rendering contract service that defines the default no-rendering mode, Windows/Raspberry rendering targets, and one shared browser-native renderer abstraction for future preview-window and fullscreen modes.
- Added focused tests for B4 rendering defaults, disabled preview/fullscreen gating, state normalization, and shared renderer identity.

### Changed
- Updated version metadata from v0.4.5 to v0.5.0.

### Fixed
- None

### Removed
- None

## 2026-05-10 15:59 EEST — v0.4.5

### Added
- Added project-local component sync verification and component communication smoke-test Codex skills.

### Changed
- Updated version metadata from v0.4.4 to v0.4.5.

### Fixed
- None

### Removed
- None

## 2026-05-10 15:55 EEST — v0.4.4

### Added
- Added project-local runtime worker implementation, worker verification, runtime service extraction, worker documentation reconciliation, and screen hardware contract Codex skills.

### Changed
- Updated version metadata from v0.4.3 to v0.4.4.

### Fixed
- None

### Removed
- None

## 2026-05-10 15:34 EEST — v0.4.3

### Added
- Added confirmation before NEW AUTH local iCloudPD session-file removal.
- Added regression coverage for read-only unknown NEW AUTH 2FA prompts and frontend submission guards.

### Changed
- Changed NEW AUTH unknown iCloudPD 2FA prompts to wait for a visible provider prompt before rendering a response input.
- Updated NEW AUTH 2FA submission handling to trim input and cancel empty submissions before calling the backend.
- Updated version metadata from v0.4.2 to v0.4.3.

### Fixed
- Fixed the operator path where an SMS code could be submitted while iCloudPD had not yet exposed whether it needed a device index or a six-digit code.

### Removed
- None.

## 2026-05-08 11:24 EEST — v0.4.2

### Added
- Added sanitized iCloudPD provider communication lines to the NEW AUTH split-modal terminal panel.
- Added focused regression coverage for terminal panel waiting state, provider preview rendering, and frontend secret/code redaction.

### Changed
- Updated NEW AUTH modal state passing so only safe provider preview text reaches the right-side communication panel.
- Updated version metadata from v0.4.1 to v0.4.2.

### Fixed
- Fixed the NEW AUTH communication panel appearing empty while sanitized provider output is available.

### Removed
- None.

## 2026-05-08 07:25 EEST — v0.4.1

### Added
- Added View B pipeline maintenance controls for detecting pipeline issues and clearing stale pipeline locks.
- Added backend runtime pipeline maintenance endpoints for stale persisted pipeline lock detection and cleanup.
- Added regression coverage for stale-lock helper behavior, endpoint constants, View B button placement/action wiring, and inspect metadata drift.

### Changed
- Updated View B inspect, real-vs-mock, backend-status, current-status, and placeholder documentation for the new pipeline maintenance controls.
- Updated version metadata from v0.4.0 to v0.4.1.

### Fixed
- Fixed the stale B3.2 pipeline-lock recovery path by allowing operators to detect stale persisted lock state before clearing only stale locks.
- Fixed inspect metadata coverage for the new pipeline maintenance buttons so they do not fall back to generic control copy.

### Removed
- None.

## 2026-05-08 07:11 EEST — v0.4.0

### Added
- Added a split NEW AUTH modal communication panel with separate status, prompt, and instruction surfaces plus regression coverage for modal prompt copy.
- Added the source-of-truth Codex skill for classifying repository truth claims, runtime evidence, target specifications, documentation-derived status, and unknown implementation state.
- Added the photo-frame event history triage Codex skill with an analyzer script for classifying scheduler, CronEmulator, pipeline lock, mock download, runtime truth, and nested failure evidence.

### Changed
- Changed scheduler GET target requests to send the selected scheduler target as query parameters aligned with the backend route contract.
- Updated version metadata from v0.3.61 to v0.4.0.

### Fixed
- Fixed View A scheduler GET control request construction so selected targets are preserved through frontend service calls and covered by button workflow regression tests.

### Removed
- None.

## 2026-05-08 05:59 EEST — v0.3.61

### Added
- Added Windows 11 CronEmulator control endpoints for checking, starting, stopping, installing a crontab, and reading the active crontab.
- Added View A 3A CronEmulator controls with login-style status circles, centralized scheduler button status copy, and terminal-style crontab textareas.
- Added regression coverage for CronEmulator endpoint crontab install/read behavior and View A CronEmulator button ordering, status circles, and textarea update rules.

### Changed
- Changed the Windows scheduler panel to expose `Check emulator scheduler`, `Run emulator`, `Stop emulator`, `Install crontab`, and `Get active crontab` controls.
- Updated version metadata from v0.3.60 to v0.3.61.

### Fixed
- Wired the Windows scheduler controls to real CronEmulator backend actions instead of leaving the new emulator operations as UI-only controls.

### Removed
- None.

## 2026-05-08 02:49 EEST — v0.3.60

### Added
- Added regression coverage proving passive NEW AUTH status does not classify active provider output or expose live 2FA prompts.
- Added route-level coverage proving `/api/auth/new/status?mode=passive` does not start provider proof.

### Changed
- Changed passive NEW AUTH status handling so passive checks are enforced before active-attempt inspection and provider proof.
- Updated Slice 4 two-factor diagnostics tests to use an injected fake provider process instead of platform-specific shell scripts.
- Updated version metadata from v0.3.59 to v0.3.60.

### Fixed
- Prevented the `Check login` passive status path from reading active iCloudPD output or triggering provider proof that could advance real provider authentication.

### Removed
- None.

## 2026-05-08 02:35 EEST — v0.3.59

### Added
- Added repo-level source comment discipline in `AGENTS.md` for future source-file edits.

### Changed
- Updated version metadata from v0.3.58 to v0.3.59.

### Fixed
- None.

### Removed
- None.

## 2026-05-08 02:32 EEST — v0.3.58

### Added
- Added regression coverage proving passive NEW AUTH status does not spawn provider proof.

### Changed
- Changed the NEW AUTH `Check login` button to call passive status mode so it observes current login/session state without starting provider authentication.
- Clarified button copy and operator docs that `Check login` is passive.
- Updated version metadata from v0.3.57 to v0.3.58.

### Fixed
- Prevented the dashboard `Check login` action from starting an `icloudpd` provider-proof subprocess.

### Removed
- None.

## 2026-05-08 02:25 EEST — v0.3.57

### Added
- Added regression coverage for NEW AUTH button-state recalculation after logged-out status and executable-readiness results.

### Changed
- Recalculated NEW AUTH button circles on action start and backend result so session-dependent login/check-login status cannot stay stale.
- Updated version metadata from v0.3.56 to v0.3.57.

### Fixed
- Cleared stale green login/check-login circles after logout or logged-out status while preserving iCloudPD verification as readiness-only.

### Removed
- None.

## 2026-05-06 16:35 EEST — v0.3.56

### Added
- Added docs-only closure update after NEW AUTH Slice 10 to align implementation-status, operator, backlog, and auth/pipeline docs with the completed new-auth endpoint family.
- Documented that NEW AUTH uses only `/api/auth/new/*` endpoints for the new card/control family.
- Documented visible two-factor prompts: `ENTER 6-DIGIT CODE` and `ENTER DEVICE INDEX (A)`.

### Changed
- Updated current-status docs so local session files alone are no longer described as authenticated.
- Clarified that `authenticated` requires provider proof or stronger test-download proof.
- Updated backlog wording so NEW AUTH Slices 1–10 are no longer tracked as unfinished implementation work.
- Clarified that View C has a backend last-run read path but restore/resume remains placeholder or decision-gated.
- Updated version metadata from v0.3.55 to v0.3.56.

### Fixed
- Removed stale status wording that said provider proof was still future work for NEW AUTH.
- Reconciled docs with the completed 2FA, login, logout, and test-download proof endpoint family.

### Removed
- None.

## 2026-05-06 15:00 EEST — v0.3.50

### Added
- Added NEW AUTH Slice 5 interactive 2FA submission flow.
- Added validation for six‑digit verification codes and single‑letter device indices.
- Added new error codes `NEW_AUTH_INVALID_2FA_CODE`, `NEW_AUTH_INVALID_2FA_DEVICE_INDEX`, and `NEW_AUTH_NO_ACTIVE_2FA_CHALLENGE` for 2FA submission failures.

### Changed
- Disabled fallback login spawn for two‑factor submissions; submissions now require an active login attempt.
- Updated `/api/auth/new/submit-2fa` to return HTTP 400 for invalid or missing input and HTTP 409 for other errors.
- Updated version metadata from v0.3.49 to v0.3.50.

### Fixed
- Prevented two‑factor submissions from starting a new login when no active challenge exists.
- Ensured six‑digit code length is enforced and device index is validated before forwarding to the provider.

### Removed
- None.

## 2026-05-06 15:10 EEST — v0.3.51

### Added
- Added NEW AUTH Slice 6 real login flow using `.env` credentials through the backend service.
- Added structured login states and reason codes for login start, `requires_2fa`, `authenticated`, `failed`, and `unverified`.

### Changed
- Ensured that the login process reads configured `.env` values and does not expose the password in event messages or logs.
- Updated version metadata from v0.3.50 to v0.3.51.

### Fixed
- None.

### Removed
- None.

## 2026-05-06 15:20 EEST — v0.3.52

### Added
- Added NEW AUTH Slice 7 safe logout flow that counts removed session files and reports removal results.

### Changed
- Updated `/api/auth/new/logout` to return `removedFileCount` and `skippedFileCount` in the details payload.
- Ensured logout only deletes the configured session directory and refuses unsafe paths.
- Updated version metadata from v0.3.51 to v0.3.52.

### Fixed
- Prevented session cleanup from leaving behind stale session files by recreating the directory after deletion.

### Removed
- None.

## 2026-05-06 15:30 EEST — v0.3.53

### Added
- Added NEW AUTH Slice 8 test-download proof endpoint. A new backend route `/api/auth/new/test-download` verifies an authenticated session and returns success if the session is valid.
- Added a frontend service method `runNewAuthTestDownload` to trigger the test-download proof.

### Changed
- Registered the new endpoint in the server router and new auth routes, and updated the new auth service endpoint map.
- Updated version metadata from v0.3.52 to v0.3.53.

### Fixed
- None.

### Removed
- None.

## 2026-05-06 15:40 EEST — v0.3.54

### Added
- Added NEW AUTH Slice 9 UI and event-history hardening. Improved button state transitions and clarified prompts for 2FA and login flows.
- Added structured diagnostics in event history to surface operations, endpoints, reason codes, provider proof, user prompts, and content flags to the user.

### Changed
- Enhanced UI copy to clearly explain provider installation, local session state, provider proof, 2FA requirements, authenticated state, logged-out state, and test-download results.
- Updated version metadata from v0.3.53 to v0.3.54.

### Fixed
- None.

### Removed
- None.

## 2026-05-06 15:50 EEST — v0.3.55

### Added
- Added NEW AUTH Slice 10 final audit and closure. Completed all remaining slices and documentation updates for the new authentication system.
- Added a final audit report describing the endpoints, states, safety considerations, and usage guidelines.

### Changed
- Verified that all NEW AUTH controls call only `/api/auth/new/*` endpoints and that old auth endpoints remain intact.
- Audited secret safety to ensure passwords, two‑factor codes, cookies, and session contents are never exposed in logs, UI, or tests.
- Audited authentication truth: sessions are authenticated only after provider proof or test‑download proof; local session files alone are never trusted.
- Updated version metadata from v0.3.54 to v0.3.55.

### Fixed
- None.

### Removed
- None.

## 2026-05-06 14:46 EEST — v0.3.49

### Added
- Added NEW AUTH Slice 4 provider-proof 2FA diagnostics so provider output that reaches a two-factor prompt is classified as `NEW_AUTH_PROVIDER_REQUIRES_2FA`.
- Added visible user action prompts for 2FA-required responses: `ENTER 6-DIGIT CODE` and `ENTER DEVICE INDEX (A)`.
- Added regression coverage for 2FA-vs-timeout classification, prompt extraction, and visible prompt rendering outside raw JSON.

### Changed
- Changed `/api/auth/new/status` classification priority so 2FA provider prompts win over generic timeout when both are present.
- Updated version metadata from v0.3.48 to v0.3.49.

### Fixed
- Fixed misleading status diagnostics where iCloudPD output clearly requested 2FA but the UI primarily reported a provider-proof timeout.
- Preserved sanitized provider previews and secret/session redaction while exposing only safe prompt metadata.

### Removed
- None.

## 2026-05-06 12:58 EEST — v0.3.48

### Added
- Added NEW AUTH Slice 3 provider-proof status verification for saved local iCloudPD sessions.
- Added regression coverage proving local session files are not promoted to authenticated without provider verification.

### Changed
- Changed `/api/auth/new/status` so session-like files now report `unverified` unless iCloudPD provider proof verifies the session.
- Updated version metadata from v0.3.47 to v0.3.48.

### Fixed
- Removed the temporary Slice 2 message that treated local session files as authenticated until provider proof existed.
- Redacted provider-proof command paths and secret-adjacent values from status diagnostics.

### Removed
- None.

## 2026-04-29 16:24 EEST — v0.3.47

### Added
- Completed NEW AUTH Slice 3 endpoint handlers for real login, 2FA submission, and local session cleanup under the new /api/auth/new/* route family.
- Added safe iCloudPD login command execution using .env values, pending-2FA state detection, 2FA stdin submission support, and deterministic non-secret Slice 3 verification coverage.

### Changed
- Replaced Slice 2 placeholder handlers for /api/auth/new/login, /api/auth/new/submit-2fa, and /api/auth/new/logout with structured backend behavior.
- Updated version metadata from v0.3.46 to v0.3.47.

### Fixed
- Added local-session cleanup path safety checks so logout refuses broad or unsafe directories.

### Removed
- None.

## 2026-04-29 16:15 EEST — v0.3.46

### Added
- Added NEW AUTH Slice 2 backend route family for `1A-STASH-OFF` using new `/api/auth/new/*` endpoints only.
- Added safe iCloudPD executable verification, structured real session-status inspection, and session path/file metadata inspection.
- Added `tests/newAuthSlice2.verify.mjs` to verify route registration, missing/executable iCloudPD handling, structured status responses, and session-file secrecy.

### Changed
- Wired the Slice 1 frontend helper to avoid sending JSON bodies on GET-only NEW AUTH endpoints.
- Registered safe Slice 3 placeholder responses for login, 2FA submit, and logout under the new endpoint family without aliasing old auth routes.
- Updated version metadata from v0.3.45 to v0.3.46.

### Fixed
- Prevented NEW AUTH command verification timers and child-process handles from keeping verification scripts alive after checks complete.

### Removed
- None.


## 2026-04-29 15:50 EEST — v0.3.45

### Added
- Added Slice 1 NEW AUTH View A card `1A-STASH-OFF` with five frontend actions, per-button status circles, explanatory status text, and a login modal shell with 2FA input.
- Added new frontend-only API helper functions targeting only `/api/auth/new/*` endpoint paths.
- Added runtime-truth state/action wiring for the new card without reusing existing auth/login endpoints.

### Changed
- Extended inspect metadata and auth-button status copy for the new auth controls.
- Added blinking yellow running/pending status styling and row-level status text styling for the new auth card.
- Updated version metadata from v0.3.44 to v0.3.45.

### Fixed
- None.

### Removed
- None.

## 2026-04-29 14:10 EEST — v0.3.44

### Added
- Added final Slice 17 closure boundary contracts for dashboard shared constants and inspect-guide JSON exports.
- Added a closure audit record for the function-boundary typing migration.

### Changed
- Updated version metadata from v0.3.43 to v0.3.44.
- Preserved existing runtime values, UI copy, route behavior, auth behavior, scheduler semantics, database behavior, and runtime stage ordering.

### Fixed
- None.

### Removed
- None.

## 2026-04-29 14:10 EEST — v0.3.43

### Added
- Added Slice 16 function boundary types for runtime-truth persistence and inspect-mode summary helper contracts.

### Changed
- Added named persistence endpoint/payload contracts and inspect summary metadata contracts without changing runtime behavior, endpoint payloads, UI labels, auth behavior, scheduler semantics, or database behavior.
- Updated version metadata from v0.3.42 to v0.3.43.

### Fixed
- None.

### Removed
- None.

## 2026-04-29 14:09 EEST — v0.3.42

### Added
- Added Slice 15 function boundary types for runtime-truth scheduler, auth-button, truth-seed, and database-viewer state helper contracts.

### Changed
- Added named runtime-truth state helper types and explicit return types without changing runtime behavior, endpoint payloads, UI labels, scheduler semantics, or database behavior.
- Updated version metadata from v0.3.41 to v0.3.42.

### Fixed
- None.

### Removed
- None.

## 2026-04-29 14:01 EEST — v0.3.41

### Added
- Added Slice 13+14 function boundary types for remaining database service result boundaries and low-risk server-side tooling scripts.

### Changed
- Replaced repeated inline database runtime result return shapes with named local interfaces and added JSDoc helper contracts to server-side maintenance scripts without changing runtime behavior.
- Updated version metadata from v0.3.40 to v0.3.41.

### Fixed
- None.

### Removed
- None.

## 2026-04-29 13:44 EEST — v0.3.40

### Added
- Added Slice 11+12 TypeScript function boundary types for runtime stage orchestration and server route-adjacent helper boundaries.

### Changed
- Added named request context, handler result, environment check, runtime truth, media collection, database viewer logging, scheduler payload, and orchestration state contracts without changing endpoint payloads, scheduler semantics, or runtime stage ordering.
- Updated version metadata from v0.3.39 to v0.3.40.

### Fixed
- None.

### Removed
- None.

## 2026-04-29 13:05 EEST — v0.3.39

### Added
- Added Slice 9+10 TypeScript function boundary types for database persistence, project logging, and scheduler host runtime boundaries.

### Changed
- Added named database service, SQLite bridge, logger, scheduler status, lock, and log-entry contracts without changing SQL behavior, scheduler semantics, endpoint payloads, or runtime stage ordering.
- Updated version metadata from v0.3.38 to v0.3.39.

### Fixed
- None.

### Removed
- None.

## 2026-04-29 12:56 EEST — v0.3.38

### Added
- Added Slice 7+8 TypeScript function boundary types for auth domain, auth routes, auth persistence, auth session resume, icloudpd provider, provider registry, process runner, and sanitizer modules.

### Changed
- Added named auth/provider/session/icloudpd contracts without changing auth endpoint payload shapes, provider behavior, secret redaction behavior, or icloudpd command construction semantics.
- Updated version metadata from v0.3.37 to v0.3.38.

### Fixed
- None.

### Removed
- None.

## 2026-04-29 12:37 EEST — v0.3.37

### Added
- Added Slice 6 JSDoc function boundary types for low-risk JavaScript test helpers.

### Changed
- Added explicit DOM fixture, fetch stub, and transit record test helper types without changing test assertions or production behavior.
- Updated version metadata from v0.3.36 to v0.3.37.

### Fixed
- None.

### Removed
- None.

## 2026-04-29 12:27 EEST — v0.3.36

### Added
- Added Slice 5 TypeScript function boundary types for the inspect guide tooltip controller.

### Changed
- Added explicit controller dependency, public controller API, tooltip detail, and DOM element group types without changing inspect-mode tooltip behavior or visible UI copy.
- Updated version metadata from v0.3.35 to v0.3.36.

### Fixed
- None.

### Removed
- None.

## 2026-04-29 12:19 EEST — v0.3.35

### Added
- Added Slice 4 TypeScript function boundary types for dashboard renderer helpers and the transit terminal service.

### Changed
- Added explicit render input, modal, transport, log/history, step-list, transit record, and terminal API types without changing rendered HTML strings or transit formatting behavior.
- Updated version metadata from v0.3.34 to v0.3.35.

### Fixed
- None.

### Removed
- None.

## 2026-04-29 12:08 EEST — v0.3.34

### Added
- Added Slice 3 TypeScript function boundary types for runtime-truth persistence and top-level runtime-truth state service entrypoints.

### Changed
- Added explicit listener, mutator, persistence dependency, persistence API, queue option, and runtime action payload types without changing runtime behavior.
- Updated version metadata from v0.3.33 to v0.3.34.

### Fixed
- None.

### Removed
- None.


## 2026-04-29 11:55 EEST — v0.3.33

### Added
- Added Slice 2 TypeScript function boundary types for runtime-truth action utility helpers and duplicate-action guard helpers.

### Changed
- Added explicit parameter and return types around existing runtime-truth logging, status mapping, payload summary, scheduler capability extraction, and guard callbacks without changing runtime behavior.
- Updated version metadata from v0.3.32 to v0.3.33.

### Fixed
- None.

### Removed
- None.

## 2026-04-29 11:44 EEST — v0.3.32

### Added
- Added Slice 1 low-risk TypeScript function boundary types for the dashboard API client and dashboard service wrappers.

### Changed
- Added explicit parameter and return types around existing request/response metadata paths without changing endpoint URLs, payload keys, UI copy, or runtime behavior.
- Updated version metadata from v0.3.31 to v0.3.32.

### Fixed
- None.

### Removed
- None.

## 2026-04-28 17:55 EEST — v0.3.31

### Added
- Added `docs/vision_and_implementation/VIEW_A_AUTH_PREFLIGHT_BUTTONS.md` documenting every View A `1A-AUTH` button, endpoint, semantic success rule, status-circle meaning, inspect metadata expectation, and legacy B1 compatibility boundary.
- Added focused 2FA tests covering the auth button semantic status classifier and the current unsupported non-interactive `icloudpd` 2FA provider boundary.

### Changed
- Hardened the `Submit 2FA` button status rule so it turns green only when both authenticated status and completed 2FA are proven by backend/provider state.
- Documented remaining old B1 action/status keys as intentional compatibility adapters for the visible View A `1A-AUTH` card.
- Updated auth and dashboard vision docs to reference the new button-level auth preflight spec.
- Updated version metadata from v0.3.30 to v0.3.31.

### Fixed
- Fixed a 2FA overclaiming risk where completed 2FA status alone could mark the `Submit 2FA` button successful without also proving authenticated state.

### Removed
- None.

## 2026-04-28 16:47 EEST — v0.3.30

### Added
- Added Slice 2 structured auth button status/help copy in `dashboard/data/authButtonStatusCopy.js` for every View A `1A-AUTH` button and every status state.
- Added tooltip/help text generation for auth buttons so titles, ARIA labels, and status shell metadata update from the shared copy source.
- Added inspect metadata coverage for all auth buttons across Explain controls, Explain values, Show real vs mock, and Show backend status modes.
- Added tests proving auth button copy coverage and inspect metadata coverage for all target auth controls.

### Changed
- Updated View A auth button rendering to use semantic help copy instead of raw per-request messages only.
- Updated 1A-AUTH value/backend metadata so the auth card uses `state.authPreflight.*` and the legacy `B1` compatibility key intentionally, rather than falling back to generic View A init result metadata.
- Updated version metadata from v0.3.29 to v0.3.30.

### Fixed
- Fixed missing per-button inspect metadata for auth controls including refresh status, reset local attempt, logout, check login, verify icloudpd, login using `.env`, 2FA submit, and single-file diagnostic download.

### Removed
- None.

## 2026-04-28 16:15 EEST — v0.3.29

### Added
- Added Slice 1 per-button auth status indicators for View A `1A-AUTH`, including neutral, running, pending, success, failed, and blocked visual states.
- Added runtime-truth button state storage under `authPreflight.buttonStates` so each auth control can resolve independently instead of relying only on the legacy `B1` card status.
- Added frontend/runtime tests covering auth button indicator rendering and semantic state transitions.

### Changed
- Updated View A auth rendering to wrap every auth control in a status shell without changing the existing auth endpoints or data-action names.
- Updated auth runtime action handling so button indicators use semantic backend/provider results rather than treating every HTTP response as green success.
- Updated version metadata from v0.3.28 to v0.3.29.

### Fixed
- Fixed the View A auth UI gap where individual buttons did not show their own execution/result state.

### Removed
- None.

## 2026-04-26 20:08 EEST — v0.3.28

### Added
- Added Slice 3 target architecture, pipeline/workers, auth/2FA, scheduler/runtime recovery, and final reconciliation documentation under `docs/vision_and_implementation/`.
- Added `docs/active_workflow_docs/vision_slice3_prompt_analysis_critique_refinement.md` with the analyzed, critiqued, and refined Slice 3 prompt.
- Added `docs/vision_and_implementation/reconciliation/FINAL_VISION_SPEC_RECONCILIATION_REPORT.md` as the final 3-slice reconciliation report.

### Changed
- Updated the vision/spec documentation README, authority map, unresolved questions, and deprecated/superseded docs log for Slice 3 closure.
- Recorded that auth tests, full `npm test`, and `npm run task-docs:check` were intentionally skipped under Slice 3 constraints.
- Updated version metadata from v0.3.27 to v0.3.28.

### Fixed
- None.

### Removed
- None.

## 2026-04-26 19:59 EEST — v0.3.27

### Added
- Added Slice 2 current vision/specification documents under `docs/vision_and_implementation/`: project vision, current implementation spec, and dashboard views spec.
- Added `docs/active_workflow_docs/vision_slice2_prompt_analysis_critique_refinement.md` with the analyzed, critiqued, and refined Slice 2 prompt.
- Added `docs/vision_and_implementation/reconciliation/SLICE2_CURRENT_VISION_SPEC_REPORT.md` to record Slice 2 outputs and verification notes.

### Changed
- Updated the vision/spec documentation README and unresolved questions list for Slice 2.
- Updated `docs/vision_and_implementation/DEPRECATED_SUPERSEDED_DOCS_LOG.md` to record Slice 2 harvesting status without moving or deleting old docs.
- Recorded that `npm run task-docs:check` timed out twice and should not be rerun in Slice 3 without user approval or prior inspection.
- Updated version metadata from v0.3.26 to v0.3.27.

### Fixed
- None.

### Removed
- None.

## 2026-04-26 19:47 EEST — v0.3.26

### Added
- Added Slice 1 vision/specification documentation authority baseline under `docs/vision_and_implementation/`.
- Added `docs/vision_and_implementation/DEPRECATED_SUPERSEDED_DOCS_LOG.md` to track deprecated, superseded, and historical documentation candidates without moving or deleting files.
- Added `docs/active_workflow_docs/vision_slice1_prompt_analysis_critique_refinement.md` as the prompt analysis, critique, and refined Slice 1 prompt record.

### Changed
- Updated version metadata from v0.3.25 to v0.3.26.

### Fixed
- None.

### Removed
- None.

## [0.3.25] - 2026-04-26 18:08 EEST

### Added
- Added Part 3 Slice 4 final Browser Repo Verifier & Doc Curator report under `docs/active_workflow_docs/`.
- Finalized the documentation truth matrix and recommended documentation authority model.
- Updated the active workflow docs index for Slice 4 finalization artifacts.

### Notes
- Documentation-only workflow finalization.
- No production code was changed.
- No existing documentation was moved or deleted.

## [0.3.24] - 2026-04-26 17:20 EEST

### Added
- Added `docs/active_workflow_docs/` as the active output folder for `DOCUMENTATION_ANALYSIS_OVERHAUL_AND_RECONCILIATION_LIKE_1PF`.
- Added current part-one documentation inventory outputs and part-two repo structure analysis outputs to the active workflow docs folder.
- Added a prompt-analysis record documenting the active workflow docs folder rule.


## 2026-04-26 04:14 EEST — v0.3.23

- Updated auth API step tests to match the backend-owned honest provider failure contract.
- Preserved the runtime behavior where missing/unavailable icloudpd returns a safe provider failure instead of a fake successful/blocking login state.
- Updated version metadata from v0.3.22 to v0.3.23.

> Note: changelog entries before v0.3.3 are preserved as legacy history and are not backfilled. Structured forward-only enforcement begins at v0.3.3.
## 2026-04-26 03:18 EEST — v0.3.22

### Added
- Added View A `1A-AUTH — VERIFY ICLOUDPD` between `1A VERIFY .ENV` and `2A DB`.
- Added backend-owned `POST /api/auth/verify-icloudpd` readiness endpoint for icloudpd executable/config checks without claiming authenticated login.

### Changed
- Rewired View A auth controls to explicit `Verify icloudpd`, `Check login`, `Login using .env values`, and `Logout` actions.
- Updated version metadata to v0.3.22.

### Fixed
- Kept login checking backend-owned through session verification instead of frontend inference from required files or local UI state.

### Removed
- None


## 2026-04-26 00:51 EEST — v0.3.21

### Added
- Added Slice 3 documentation/status closure for the restored View A / B1 backend auth integration.

### Changed
- Updated B1 button verification, inspect metadata, and implementation overview docs so B1 is described as backend-auth-backed through `/api/auth/*` instead of frontend-only/mock.
- Updated version metadata from v0.3.20 to v0.3.21.

### Fixed
- Corrected stale B1 auth wording that still described the restored auth control as mock, placeholder, frontend-only, or missing backend wiring.

### Removed
- None


## 2026-04-25 22:45 EEST — v0.3.20

### Added
- Added merge-closure metadata for the sliced auth/provider and database-service import.

### Changed
- Updated version metadata from v0.3.11 to v0.3.20 to align the target repository with the completed sliced merge state.
- Documented the already-merged backend auth/provider foundation, mocked auth verification boundary, and centralized Node-side database service.

### Fixed
- Corrected stale documentation status that still described backend authentication as entirely missing after Slice 1.

### Removed
- None


## 2026-04-23 00:21 EEST — v0.3.11

### Added
- None

### Changed
- None

### Fixed
- None

### Removed
- None

## 2026-04-22 23:53 EEST — v0.3.10

### Added
- None

### Changed
- None

### Fixed
- None

### Removed
- None

## 2026-04-22 21:09 EEST — v0.3.9

### Added
- None

### Changed
- None

### Fixed
- None

### Removed
- None

## 2026-04-22 20:45 EEST — v0.3.8

### Added
- None

### Changed
- None

### Fixed
- None

### Removed
- None

## 2026-04-22 20:21 EEST — v0.3.7

### Added
- None

### Changed
- None

### Fixed
- None

### Removed
- None

## 2026-04-22 19:44 EEST — v0.3.6

### Added
- None

### Changed
- None

### Fixed
- None

### Removed
- None

## 2026-04-22 19:32 EEST — v0.3.5

### Added
- None

### Changed
- None

### Fixed
- None

### Removed
- None

## 2026-04-22 19:26 EEST — v0.3.4

### Added
- None

### Changed
- None

### Fixed
- None

### Removed
- None

## 2026-04-22 18:58 EEST — v0.3.3

### Added
- Added `docs/VERSIONING_AND_CHANGELOG_POLICY.md` as the forward-only governance document for SemVer, changelog structure, and Git hook compliance from `v0.3.3` onward.
- Added `scripts/version_guard.mjs` with repo validation, commit-message validation, and deterministic version/changelog preparation support.
- Added repo-local `commit-msg` and strengthened `pre-commit` hooks plus Windows/Linux hook-install helpers.

### Changed
- Updated `README.md` and `docs/IMPLEMENTATION_STATUS_AUDIT.md` so the new governance policy is discoverable and treated as authoritative for future compliance work.
- Updated `VERSION`, `package.json`, and `package-lock.json` to `0.3.3` as the first forward-only enforcement release.

### Fixed
- Fixed the repository governance gap where new changes could land without synchronized version metadata, structured changelog updates, or commit-message enforcement.

### Removed
- None

## 2026-04-19 18:22 EEST — v0.3.0
- Performed safe inclusion and validation pass across the incoming frontend bundle and the audited system-documentation bundle.
- Kept the stronger modular frontend from the incoming project, including separate view files for A, B, C, and D, shared runtime-truth mock state, generated test data, and the Vite-based package setup.
- Included the stronger audited system documents `00_TABLE_OF_CONTENTS.md` through `14_VERSIONING_AND_CHANGELOG_RULES.md`.
- Preserved the frontend view documentation files because they remained consistent with the current UI surface and did not contradict the stronger system documents.
- Added `vite.config.js` so `npm run dev` works from the repository root while keeping the frontend files under `dashboard/`.
- Updated top-level README and documentation control text to clarify precedence between system documents and frontend view documents.

## 2026-04-20 19:00 EEST — v0.3.1
- Added the central `docs/issues_errors_discrepancies.md` registry and recorded the first verified HIGH issues.
- Fixed overlapping B3 pipeline stage execution in the frontend runtime-truth layer by enforcing a shared pipeline lock and sequential auto-stage execution.
- Fixed duplicate B4 playback and real-run start behavior by adding single-instance guards and idempotent start handling.

## 2026-04-20 19:16 EEST — v0.3.2
- Fixed B5 screen simulation so toggle and timeout changes now drive shared screen/playback truth and the B4 preview state.
- Added re-entrant action guards for generic control actions and the B1 login flow to prevent overlapping timers and duplicate UI runs.
- Recorded and verified ISSUE-0003 and ISSUE-0004 in the central issues registry.
