# Authoritative Missing Functionality Ledger

This is the living authoritative tracker for missing functionality discovered during `BUTTON_VERIFICATION_WORKFLOW` runs.

Use this file as the single source of truth for gaps where current implementation does not meet authoritative behavior requirements.

## Update Rules

- Add a new row when a new missing-functionality finding is confirmed.
- Update the existing row when the same finding changes status or scope.
- Keep evidence pointers to the latest per-button report and relevant code/spec references.

## Current Findings

| Finding ID | First logged | Area | Status | Missing functionality | Evidence |
| --- | --- | --- | --- | --- | --- |
| MF-1A-OVERLAP | 2026-04-23 | View A / 1A (`verify-env`) | Open | `1A` is partially implemented vs authoritative spec: current backend validates key presence/shape but does not enforce test-vs-real path overlap rejection. | `docs/button_verification_results/VIEW_A_1A_VERIFY_ENV.md`; `docs/VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md` (environment isolation requirements); `server/index.js` (`buildEnvCheck`/`validateEnvValue` logic). |
| MF-3A-CRON-FLOW | 2026-04-23 | View A / 3A (`install-cron`, `check-cron`, `print-cron`) | Open | `3A` actions are real and wired, but partial vs authoritative spec because implementation is Windows Task Scheduler capability/status/print, not the required Raspberry Pi cron canonical verification flow. | `docs/button_verification_results/VIEW_A_3A_INSTALL_SCHEDULER.md`; `docs/button_verification_results/VIEW_A_3A_CHECK_SCHEDULER.md`; `docs/button_verification_results/VIEW_A_3A_PRINT_SCHEDULER.md`; `docs/VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md` (scheduler cron requirements). |
| MF-B1-PLACEMENT | 2026-04-23 | View B / B1 (`run-b1`) | Open | B1 auth flow remains in View B as frontend simulation, but authoritative spec places B1 auth in View A init/preflight with real auth intent. | `docs/button_verification_results/VIEW_B_B1_LOGIN_FLOW.md`; `docs/VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md:168-185`; `docs/VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md:910-920`. |
| MF-B2-MOCK-DOWNLOAD-SOURCE | 2026-04-23 | View B / B2 and B3.1 (`run-b2`, `run-b3-1`) | Open | Authoritative test-flow intent requires generated test-data mock-download semantics, but current stage-1 backend path executes `icloudpd` worker semantics. | `docs/button_verification_results/VIEW_B_B2_DOWNLOAD_TEST_ACTION.md`; `docs/button_verification_results/VIEW_B_B3_1_DOWNLOAD_STAGE.md`; `docs/VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md:289-319`; `server/index.js:650-667`. |
| MF-B3-INSPECT-DRIFT | 2026-04-23 | View B / B3 (`run-b3-auto`, `run-b3-3`, `run-b3-4`) | Open | Inspect metadata still marks key B3 controls as mock/missing backend even though runtime behavior now calls live backend endpoints. | `docs/button_verification_results/VIEW_B_B3_AUTO_RUN_ALL_STAGES.md`; `docs/button_verification_results/VIEW_B_B3_3_PARSE_GPS_STAGE.md`; `docs/button_verification_results/VIEW_B_B3_4_GEOCODE_STAGE.md`; `dashboard/inspect/guideCopy.json:263-277`; `dashboard/inspect/guideCopy.json:363-382`; `dashboard/services/runtimeTruth/runtimeTruthBehavior.js:120-123`. |
| MF-B3-4-GEOCODER-SEMANTICS | 2026-04-23 | View B / B3.4 (`run-b3-4`) | Open | Geocode stage is backend-backed but remains explicitly deterministic-placeholder geocoder behavior, not full real-equivalent semantics. | `docs/button_verification_results/VIEW_B_B3_4_GEOCODE_STAGE.md`; `server/index.js:819-827`; `docs/VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md:194-203`. |
| MF-B4-PLAYBACK-LOOP | 2026-04-23 | View B / B4 (`run-b4`) | Open | B4 currently performs real playback selection, but full authoritative playback-loop behavior (notably automatic progression semantics) remains incomplete in this control path. | `docs/button_verification_results/VIEW_B_B4_PLAYBACK_SELECTION.md`; `docs/VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md:604-641`; `dashboard/services/runtimeTruth/runtimeTruthDemoActions.js:358-391`. |
