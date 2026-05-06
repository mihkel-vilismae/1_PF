# CHANGELOG

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
