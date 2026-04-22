# CHANGELOG

> Note: changelog entries before v0.3.3 are preserved as legacy history and are not backfilled. Structured forward-only enforcement begins at v0.3.3.

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
