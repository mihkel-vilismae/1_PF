# OS playback views — Slice 4 scheduler/log/worker observability

Timestamp: 2026-05-28 07:12:00 EEST

## Scope

Goal 1 / Slice 4 wires the Windows and Raspberry OS playback views to a read-only observability contract for scheduler, worker, and log panels.

The slice keeps the playback queue/media contract from Slice 2 and browser-side rotation/fullscreen flow from Slice 3 intact.

## Added contract

`GET /api/runtime/playback/observability?platform=windows|raspberry&limit=40`

The endpoint returns:

| Field | Purpose |
|---|---|
| `workers` | Regular state worker, playback worker, and on-off worker status rows. |
| `scheduler.entries` | Scheduler/cron terminal rows from Windows CronEmulator or Raspberry crontab evidence. |
| `logs.error.entries` | Error-only rows read from the active mode log directory `error.log`. |
| `logs.main.entries` | Main/runtime rows read from the active mode log directory `full_log.log`. |
| `runtimeMode` | Echoes the selected Test/Real mode from `X-Dashboard-Runtime-Mode`. |

## Mode boundaries

| Mode | Log root |
|---|---|
| Real Mode | `runtime_data/logs` |
| Test Mode | `test_runtime_data/logs` |

The backend uses the request context after Test/Real env mapping, so log panels follow the same mode boundary established earlier for DB/download/log paths.

## Windows vs Raspberry

| Platform | Scheduler source |
|---|---|
| Windows Playback | `buildWindowsCronRunLog()` / CronEmulator state API evidence. |
| Raspberry OS Playback | `buildRaspberryCronRunLog(context)` / project `full_log.log` crontab worker evidence. |

The contract is read-only. It does not start CronEmulator, install crontab rows, mutate queue rows, select playback items, or modify logs.

## Frontend behavior

The Windows/Raspberry playback views now:

- refresh observability when the OS playback view is opened;
- poll observability while an OS playback view is visible;
- render backend worker rows when available;
- render scheduler/error/main terminal rows from backend evidence when available;
- preserve fallback rows when no evidence exists yet;
- keep terminal `copy all`, `clear`, and `expand row` controls active.

## Deferred work

PIR/mouse/keyboard detection reuse remains outside this slice. It should happen after View B detection testing is implemented and verified.

Real Raspberry display power control and hardware-level screen on/off behavior are also deferred.

## Preserved behavior

Existing Views A, B, C, D, and E remain additive and unchanged. B2 Test/Real split, auth/iCloudPD behavior, database mutation endpoints, playback selection, queue media serving, rotation, and fullscreen overlay behavior are preserved.
