# Unresolved Questions

Status: Slice 3 final unresolved specification list.
Created: 2026-04-26 19:47 EEST.
Updated: 2026-04-26 20:08 EEST.

These questions are not blockers for the documentation set, but they should be answered before implementation slices that change runtime behavior, auth, scheduler installation, or documentation relocation.

## Product vision

1. Should the project be described primarily as a Raspberry Pi photo-frame runtime with a development dashboard, or as a broader cross-platform dashboard-first system?
2. Should the next implementation priority be autonomous slideshow reliability, dashboard observability, or pipeline configurability?
3. Should View E/database inspection be a core product view or developer/admin tooling?

## Dashboard views

1. Should View C read `/api/runtime/orchestration/last`, a new recovery endpoint, or a worker-owned durable state projection?
2. Should View D monitor lock files, DB state, logs, or a combined backend projection?
3. Should View B run-all continue using sequential frontend actions, or switch to backend orchestration as the canonical path?
4. Should simulated preview controls remain visible after real equivalents exist, or move behind an explicit simulator mode?

## Runtime truth / locks / logs

1. What are the exact lock file names and locations for regular stage, playback, and screen on/off workers?
2. Which state belongs in SQLite, which belongs in lock files, which belongs in logs, and which belongs in `conf/runtime-truth.json`?
3. Should `conf/runtime-truth.json` remain long-term or become development-only?
4. How should `runtime_state` relate to worker locks and current playback state?

## Pipeline stages

1. Should Stage 1 keep generated/mock copy behavior as a test mode while real iCloud download is a separate provider-backed path?
2. Which geocoding provider should replace the deterministic placeholder, and what rate-limit/cache policy should be used?
3. Should one pipeline worker run all stages sequentially, or should each stage have its own independent worker later?
4. What is the exact status lifecycle for failed GPS, failed geocode, missing file, and skipped queue entries?

## Authentication and 2FA

1. Should `authenticated` require a live provider verification every time, or may a recently verified persisted session be trusted for a configured duration?
2. What exact user flow should handle interactive `icloudpd` 2FA?
3. Should real-provider auth checks stay manual-only, with automated tests limited to mocks and secret-safe boundaries?
4. Should `TEST LOGIN BY DOWNLOADING A SINGLE FILE` remain in View A, or move to diagnostics/admin tooling?

## Scheduler / cron / cron emulator

1. Should Windows scheduler support remain print/status-only while Fedora/Raspberry Pi cron becomes canonical?
2. Should the Windows cron emulator live in this repo or in a separate utility repo?
3. Should scheduler controls install real jobs, only print recommended job definitions, or support both with confirmation?
4. Are the current example cadences final: regular worker every 10 minutes, playback every 1 minute, screen worker every 3 minutes?

## Documentation authority and cleanup

1. Should `docs/VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md` become parsed historical reference after the new specs, or remain a high-level authority?
2. Should `docs/OLD_DOCS/` later move to `docs/docs_parsed/`, `docs/to_be_deleted/`, or a permanent archive?
3. Should `task_docs/` remain as historical implementation notes or be harvested into active docs and then archived?
4. Which deprecated/superseded docs can be marked fully used-up after content harvesting?
