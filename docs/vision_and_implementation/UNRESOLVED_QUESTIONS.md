# Unresolved Questions

Status: Slice 1 baseline.  
Created: 2026-04-26 19:47 EEST.

These questions are intentionally not blocking Slice 1. They should be answered or narrowed after Slice 3 once the full vision/spec set exists.

## Product vision

1. Should the project be described primarily as a Raspberry Pi photo-frame runtime with a development dashboard, or as a broader cross-platform dashboard-first system?
2. Should the final user-facing product prioritize autonomous slideshow reliability, dashboard observability, or pipeline configurability first?

## Documentation authority

1. Should `docs/VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md` remain a high-level authority after the new vision/spec docs are complete, or should it become a parsed historical reference?
2. Should `docs/OLD_DOCS/` be moved later into `docs/docs_parsed/`, `docs/to_be_deleted/`, or kept as a permanent historical archive?
3. Should `task_docs/` remain in place or be treated as parsed historical implementation notes after useful content is harvested?

## Runtime truth / locks / logs

1. Final wording is still needed for the relationship between lock files and log files: lock files appear intended as active-instance truth, while logs are evidence/history/debug trail.
2. Which runtime state must be persisted in the database versus files/logs/runtime-truth JSON?

## Pipeline and workers

1. Are the regular stage worker, playback worker, and screen on/off worker required to be independent long-running processes, cron-triggered scripts, or both depending on platform?
2. Should the dashboard start workers directly, only inspect them, or both?

## Authentication and 2FA

1. What is the exact intended user flow for iCloud 2FA when `icloudpd` requires interactive confirmation?
2. Should authentication status be considered valid only after a real provider verification, or can a recently verified persisted session be trusted for a fixed duration?

## Scheduler / cron / cron emulator

1. Should Windows scheduler support remain a placeholder/legacy feature while Fedora/Raspberry Pi cron becomes canonical?
2. Should the Windows cron emulator be part of this repo or a separate utility repo?
