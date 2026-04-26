# CHANGELOG

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
