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
