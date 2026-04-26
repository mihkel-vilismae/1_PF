# Pipeline and Workers Specification

Status: Slice 3 target pipeline and worker specification.
Created: 2026-04-26 20:08 EEST.
Scope: staged media pipeline, worker roles, lock expectations, and current gaps.

## Pipeline overview

Target pipeline order:

```text
download -> index -> parse GPS -> geocode -> queue slideshow -> playback select-current
```

Each stage should be safe to run repeatedly. Stages should update durable state instead of deleting history. Failures should be recorded with explicit status/reason fields and logs.

## Stage specification

| Stage | Target purpose | Current status | Target notes |
|---|---|---|---|
| Download | Bring media into the configured downloads/originals folder. | PARTIAL | Current route can copy generated/mock data. Real provider download should stay behind provider/auth boundary. |
| Index | Register media files and variants in the database. | IMPLEMENTED / PARTIAL | Should remain idempotent and preserve existing records. |
| Parse GPS | Extract GPS coordinates from media metadata. | IMPLEMENTED / PARTIAL | Should process queued files and record success/failure without deleting records. |
| Geocode | Resolve GPS coordinates to address text. | PARTIAL | Current deterministic placeholder must be clearly separated from real provider geocoding. Coordinate cache reuse is target behavior. |
| Queue slideshow | Select eligible assets for playback queue. | IMPLEMENTED / PARTIAL | Skip reasons should remain deterministic and visible. |
| Playback select-current | Select the current media item from ready candidates. | IMPLEMENTED / PARTIAL | Full autonomous playback loop is target worker behavior, not fully implemented by this route alone. |

## Worker model

| Worker | Target schedule | Target responsibility | Active truth |
|---|---|---|---|
| Regular stage worker | Example: every 10 minutes or long-running loop. | Run the next needed pipeline work in sequence. | Its lock file. |
| Playback worker | Example: every 1 minute or long-running loop. | Maintain current playback selection and visual output. | Its lock file. |
| Screen on/off worker | Example: every 3 minutes or event-aware loop. | Manage PIR/keyboard/mouse/screen activity behavior. | Its lock file. |

The exact schedule is still a user decision. The documented example remains:

```text
*/10 * * * * regular_stage_worker
* * * * * playback_worker
*/3 * * * * screen_on_off_worker
```

## Lock-file rule

Lock files are the intended source of truth for active worker instances.

Target lock behavior:

1. A worker tries to acquire its own lock before running.
2. If the lock exists and the owning process is valid, the worker exits or reports `already_running`.
3. If the lock is stale, the worker records the stale-lock event and safely replaces it.
4. On normal shutdown, the worker releases its lock.
5. Dashboard and scheduler status checks should read backend-projected lock status rather than inferring from UI state.

Exact lock file names and locations remain NEEDS_USER_DECISION.

## Log rule

Logs are evidence, history, and debugging trail. Logs should not be the primary answer to “is this worker currently running?” unless lock evidence is unavailable and the status is explicitly marked as inferred.

Target log files should include at least:

- worker start/stop;
- lock acquisition/release;
- stale lock detection;
- stage selected;
- records processed;
- skipped reasons;
- errors/exceptions;
- recovery decisions after restart.

## Database state rule

The database should store durable pipeline truth:

- media asset identity;
- variants/file paths;
- GPS parse status;
- geocode/address status;
- queue eligibility;
- playback queue entries;
- current/last selected playback item;
- orchestration summaries where appropriate.

The database should not be overwritten just to hide old history. Existing user preference is to update statuses rather than delete records.

## Dashboard relationship to workers

Target dashboard behavior:

1. Display worker status using backend-owned projections.
2. Offer manual stage actions for development and diagnostics.
3. Avoid pretending manual button execution is the same thing as autonomous worker operation.
4. Keep test/mock routes visually separated from real runtime routes.
5. Show lock/log/database evidence when explaining worker state.

## Current gaps

1. Full worker scripts/processes are not yet specified down to file names and lock paths.
2. View C and View D still need real backend projections for recovery and live runtime monitoring.
3. Stage 1 real iCloud download path needs provider-backed implementation and auth integration decisions.
4. Real geocoding provider behavior and caching policy need implementation details.
5. Scheduler installation behavior differs by platform and needs final user decisions.
