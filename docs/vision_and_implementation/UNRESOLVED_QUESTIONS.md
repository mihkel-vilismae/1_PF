# Unresolved Questions

Status: Slice 2 updated list.
Created: 2026-04-26 19:47 EEST.
Updated: 2026-04-26 19:59 EEST.

These questions are intentionally not blocking Slice 2. They should be answered or narrowed after Slice 3 once the full vision/spec set exists.

## Product vision

1. Should the project be described primarily as a Raspberry Pi photo-frame runtime with a development dashboard, or as a broader cross-platform dashboard-first system?
2. Should the final user-facing product prioritize autonomous slideshow reliability, dashboard observability, or pipeline configurability first?
3. Should View E database inspection be treated as a core product view or as developer/admin tooling?

## Documentation authority

1. Should `docs/VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md` remain a high-level authority after the new vision/spec docs are complete, or should it become a parsed historical reference?
2. Should `docs/OLD_DOCS/` be moved later into `docs/docs_parsed/`, `docs/to_be_deleted/`, or kept as a permanent historical archive?
3. Should `task_docs/` remain in place or be treated as parsed historical implementation notes after useful content is harvested?
4. Should `docs/buttons_and_implementation_overview.md` remain an active working implementation map after Slice 3, or should its useful content be consolidated into dashboard/view specs?

## Runtime truth / locks / logs

1. Final wording is still needed for the relationship between lock files and log files: lock files appear intended as active-instance truth, while logs are evidence/history/debug trail.
2. Which runtime state must be persisted in the database versus files/logs/runtime-truth JSON?
3. Should `conf/runtime-truth.json` remain part of the long-term runtime model, or become only a development/dashboard bridge?
4. How should backend orchestration state in the SQLite `runtime_state` table relate to future worker locks?

## Pipeline and workers

1. Are the regular stage worker, playback worker, and screen on/off worker required to be independent long-running processes, cron-triggered scripts, or both depending on platform?
2. Should the dashboard start workers directly, only inspect them, or both?
3. Should the existing `/api/runtime/orchestration/*` endpoints become the canonical regular-stage-worker backend, or remain a dashboard/test orchestration helper?
4. Should Stage 1 keep mock/generated-data copying for test mode while real iCloud download lives in a separate provider-backed path?

## Authentication and 2FA

1. What is the exact intended user flow for iCloud 2FA when `icloudpd` requires interactive confirmation?
2. Should authentication status be considered valid only after a real provider verification, or can a recently verified persisted session be trusted for a fixed duration?
3. Should auth tests remain mocked and secret-safe only, with real iCloud validation always manual?
4. Should the `TEST LOGIN BY DOWNLOADING A SINGLE FILE` action remain in View A long-term or move into a separate diagnostics/admin area?

## Scheduler / cron / cron emulator

1. Should Windows scheduler support remain a placeholder/legacy feature while Fedora/Raspberry Pi cron becomes canonical?
2. Should the Windows cron emulator be part of this repo or a separate utility repo?
3. Should scheduler controls install real jobs, print recommended job definitions only, or support both modes with a destructive-install confirmation?
4. Should the three default jobs remain regular stage worker every 10 minutes, playback worker every 1 minute, and screen on/off worker every 3 minutes?

## Dashboard views

1. Should View C consume `/api/runtime/orchestration/last`, a future recovery endpoint, or a worker-owned durable state source?
2. Should View D become a live monitor for worker lock files, DB state, logs, or a combined backend projection?
3. Should View B's run-all button call frontend sequential stage actions or backend orchestration directly?
4. Should simulated preview controls remain visible after real equivalents exist, or move into a separate explicit simulator mode?
