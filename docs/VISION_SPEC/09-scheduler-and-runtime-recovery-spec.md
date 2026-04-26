# Scheduler and Runtime Recovery Specification

Status: Slice 3 scheduler/runtime recovery specification.
Created: 2026-04-26 20:08 EEST.
Scope: scheduler targets, cron/cron-emulator expectations, locks, logs, and outage recovery.

## Scheduler purpose

The scheduler should ensure the photo-frame system keeps progressing without manual dashboard interaction. It should start or trigger workers, avoid duplicate instances, and make recovery after restart predictable.

## Platform targets

| Platform | Target role | Current status |
|---|---|---|
| Windows 11 | Development, testing, and possible cron-emulator workflow. | PARTIAL |
| Fedora | Near-term scheduler implementation and validation target. | DOCUMENTED_INTENT / PARTIAL |
| Raspberry Pi OS | Long-term autonomous deployment target. | DOCUMENTED_INTENT |

## Default schedule example

Current documented example:

```text
*/10 * * * * regular_stage_worker
* * * * * playback_worker
*/3 * * * * screen_on_off_worker
```

This is still NEEDS_USER_DECISION before it becomes a strict production default.

## Scheduler control modes

The dashboard scheduler controls should support honest capability reporting.

| Mode | Meaning |
|---|---|
| Print only | Show recommended cron/job definitions without installing them. |
| Status check | Report whether expected jobs appear installed/active for the current platform. |
| Install | Create/update jobs only when platform support is real and the user has intentionally requested it. |
| Unsupported | Clearly state that the current platform cannot safely install that scheduler type. |

## Windows cron emulator target

For Windows development, the cron emulator concept should remain separate from claiming real Unix cron support. A simple emulator may:

- read `crontab_emulated.txt`;
- display raw cron rows;
- parse job name and human-readable cadence;
- show seconds until next run;
- invoke configured scripts;
- log every invocation and result.

Whether the emulator belongs in this repo or a separate utility repo remains NEEDS_USER_DECISION.

## Runtime recovery target

After power loss or restart:

1. Scheduler/cron starts again according to platform rules.
2. Each worker attempts to acquire its lock.
3. Stale locks are detected and logged.
4. Workers resume from database/status queues instead of starting from scratch.
5. Existing media and cached address data remain usable offline.
6. Playback worker selects or continues a valid item from durable queue/current state.
7. Logs explain what happened before and after recovery.
8. Dashboard View C shows last known run/recovery data from backend-owned state, not local demo switches.
9. Dashboard View D shows current live runtime state from backend-owned worker/lock/log/DB projection, not simulated local preview state.

## Lock/log/database relationship

| Store | Target role |
|---|---|
| Lock files | Active worker-instance truth. |
| Logs | Evidence/history/debug trail. |
| SQLite DB | Durable media pipeline, queue, current/last state, and recoverable state. |
| Runtime truth JSON | Current dashboard bridge; long-term role needs decision. |

## Recovery status projection

The backend should eventually expose a compact recovery/live status projection for the dashboard:

- worker name;
- lock status;
- stale lock status;
- last start/finish time;
- last successful stage/action;
- last error;
- queue counts;
- current playback item;
- offline/online status where relevant;
- recommended next action.

## Current gaps

1. Exact worker script names and lock-file paths are not finalized.
2. Fedora/Raspberry Pi scheduler install/check behavior needs concrete implementation.
3. Windows cron emulator ownership is undecided.
4. View C and View D are not yet fully backend-owned recovery/live views.
5. The final relationship between `runtime_state`, `conf/runtime-truth.json`, lock files, and logs needs a concrete implementation plan.
