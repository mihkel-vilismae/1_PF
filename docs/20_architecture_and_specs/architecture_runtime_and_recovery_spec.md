# Architecture, Runtime, and Recovery Spec

## Purpose

Define the target architecture and runtime/recovery contract: layer boundaries, worker model, scheduler modes, concurrency, restart/reclaim behavior, and durable truth sources.

## Absorbed source docs

- `docs_to_parse/VISION_SPEC/06-target-architecture-spec.md`
- `docs_to_parse/VISION_SPEC/08-pipeline-and-workers-spec.md`
- `docs_to_parse/VISION_SPEC/09-scheduler-and-runtime-recovery-spec.md`
- `docs_to_parse/VISION_SPEC/chat_generated_addenda/01-merged-vision-spec-top5-authority.md`
- `docs_to_parse/VISION_SPEC/chat_generated_addenda/03-raspberry-pi-autonomy-runtime-failure-qa.md`
- `docs_to_parse/VISION_SPEC/chat_generated_addenda/04-post-slice3-qa-decisions-summary.md`
- `docs_to_parse/VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md` (foundation reference where non-conflicting)

## Canonical rules

### Architecture boundaries

1. Dashboard UI observes and controls; backend/services own execution truth.
2. Backend API validates requests, exposes safe projections, and mediates provider boundaries.
3. Stage services perform deterministic pipeline operations and should be idempotent where practical.
4. Worker processes own autonomous loops and enforce single-instance execution per worker type.

### Runtime model

Pipeline order:

```text
download -> index -> parse GPS -> geocode -> queue slideshow -> playback select-current
```

Worker classes:

1. Regular stage worker
2. Playback worker
3. Screen on/off worker

For Raspberry app-running claims, the three worker classes are not optional background details. The runtime claim requires active cron plus all three operational lanes: `regular_stage_worker` every 10 minutes, `playback_worker` every 1 minute, and `screen_on_off_worker` every 3 minutes. Each lane must enforce same-worker singleton behavior, duplicate same-worker skip behavior, cross-worker independence, and stale-lock recovery before reboot or power-loss claims can be made.

Lock files are active-instance truth. Logs are evidence/history. SQLite stores durable pipeline and playback state.

### Scheduler and platform behavior

1. Scheduler control modes are capability-based:
   - print only
   - status check
   - install (only when platform support is real and intentionally requested)
   - unsupported (explicitly reported)
2. Raspberry Pi/Linux target real cron behavior.
3. Windows target is cron-emulator based for development; it must not be presented as real Unix cron parity.
4. Default schedules remain configurable and decision-bound; example cadence may be documented but is not a hard production lock unless explicitly promoted.

### Recovery, restart, and reclaim rules

1. After restart/power loss, workers relaunch via scheduler according to platform rules.
2. Workers must acquire lock before execution.
3. Stale locks must be detected, logged, and safely reclaimed/invalidated.
4. Recovery resumes from durable state (DB/queues/current playback) instead of resetting from scratch.
5. Playback should continue where possible during degraded states (for example offline or low-disk pipeline pause states), while online-dependent stages can pause.
6. Recovery/live status must be projected to dashboard from backend-owned lock/log/DB state, not frontend simulation.


### Recovery engine strategy boundary

The active v0.10.87 recovery architecture treats recovery as a service/subsystem, not a fourth always-running worker. `PF_V2_RECOVERY_ENGINE` selects the recovery strategy; it does not select a private incompatible state format.

| Boundary | Rule |
|---|---|
| Durable state | Project-owned canonical `recovery.snapshot.v1`. |
| Strategy engine | Selected behavior for restart-check, resume-target, diagnostics, and fallback policy. |
| Compatibility | Based on `schemaVersion`, not `metadata.createdByEngine`. |
| Engine metadata | Informational provenance only. |
| Future engines | Must use additive/namespaced metadata if extra strategy details are needed. |

`v1` is the default file-backed strategy. `v2-stub` proves the architecture can select another strategy and understand canonical state, but it is not a production recovery implementation. Physical power-loss proof remains a later target-machine evidence gate.

### Concurrency and safety rules

1. One worker instance per worker type at a time.
2. Stage progression must not rely on destructive history deletion.
3. Retries/restarts must avoid corrupting durable state.
4. Active runtime state claims must come from lock and backend projection, not UI optimism.

### Decision-bound details (keep explicit)

1. Exact lock file path/name conventions are mostly converging (runtime-data lock folder pattern) but still finalized by user-directed implementation.
2. Long-term role of `conf/runtime-truth.json` remains unresolved.
3. Exact low-disk threshold and stale-lock timeout values are target guidance (for example around 1 GB and 15 minutes) and should remain configurable until finalized.

## Conflict / reduction notes

- If April 2026 merged text suggests fixed/destructive cron install semantics, active scheduler spec semantics win: platform-aware capability reporting and explicit install intent.
- Addenda autonomy rules (offline/low-disk/playback continuity/stale-lock recovery) are retained as target runtime behavior; no claim of current full implementation.
- Archive workflow/status commentary was removed from canon; only implementation-affecting runtime rules were kept.

## Migration status

| Source | Status | Notes |
|---|---|---|
| `06-target-architecture-spec.md` | ABSORBED | Layer model, boundary rules, platform profile |
| `08-pipeline-and-workers-spec.md` | ABSORBED | Pipeline/worker/lock/log/DB rules |
| `09-scheduler-and-runtime-recovery-spec.md` | ABSORBED | Scheduler modes and recovery contract |
| `chat_generated_addenda/01,03,04` | ABSORBED (selective) | Runtime-autonomy clarifications and conflict-safe scheduler details |
| April 2026 merged spec scheduler details | REDUCED_WITH_CONFLICT_NOTE | Foundation retained; active scheduler semantics control |
| Historical runtime docs in `OLD_DOCS/*` | REDUCED_TO_REFERENCE | Not canonical here |

