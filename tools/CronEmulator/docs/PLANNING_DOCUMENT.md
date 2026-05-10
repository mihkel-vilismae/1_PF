# Windows 11 Cron Emulator — Planning Document

## 1. Goal

Create a lightweight Python dashboard that emulates Raspberry Pi OS cron behavior on Windows 11 by reading `crontab_emulated.txt` from the project root.

## 2. MVP Scope

- Auto-load `crontab_emulated.txt`.
- Display the raw crontab in a terminal-like panel.
- Parse cron rows into a jobs table.
- Infer job names from command paths.
- Show human-readable timing.
- Show seconds until next run.
- Start/stop scheduler loop.
- Run selected job manually.
- Capture runtime logs and filter by selected job.

## 3. Crontab File Contract

The MVP supports five cron fields plus a command:

```text
minute hour day-of-month month day-of-week command
```

Supported MVP field forms are:

- `*`
- `*/N`
- single integer values

Blank lines and comments beginning with `#` are ignored.

## 4. Startup Raw Crontab Display

At startup, the app reads `crontab_emulated.txt` and renders its exact content in a terminal-style panel. The raw panel is separate from the parsed jobs table.

## 5. UI Requirements

The UI is a minimal local web dashboard served by Python's standard library HTTP server.

## 6. Parsed Job Table

Columns:

- Status
- Job name
- Human-readable timing
- Seconds until next run
- Next run timestamp
- Command
- Last run timestamp
- Last result
- Raw cron row

## 7. Human-Readable Cron Translation

Examples:

- `* * * * *` → Every minute
- `*/3 * * * *` → Every 3 minutes
- `*/10 * * * *` → Every 10 minutes

## 8. Next-Run and Countdown Behavior

The countdown is derived from the same schedule-matching function used by the scheduler. This prevents UI/scheduler drift.

## 9. Scheduler / Emulation Behavior

The scheduler checks once per second. A job is due at minute boundaries when its cron expression matches local time. Running jobs are tracked to avoid overlapping runs.

## 10. Execution Model

Commands are executed through `subprocess.run(..., shell=True)` for Windows compatibility with script and command paths. The MVP captures return code, stdout, and stderr summary.

## 11. Logging and Filtering

Runtime logs are held in memory for the MVP and exposed through the dashboard API. Logs can be filtered by selected job.

## 12. Architecture

Modules:

- `cron_parser.py` — file parsing, job model, readable timing.
- `scheduler.py` — next-run calculation, due detection, scheduler loop.
- `executor.py` — command execution boundary.
- `state.py` — application state, logs, reload behavior.
- `app.py` — HTTP server and dashboard assets.

## 13. Suggested Repository Structure

```text
CronEmulator/
  README.md
  HOW_TO_RUN.md
  CHANGELOG.md
  VERSION
  requirements.txt
  crontab_emulated.txt
  start_win.cmd
  start_scripts/start_win.ps1
  src/cronemulator/
  tests/
  docs/
  logs/
```

## 14. Testing Strategy

Tests cover parser behavior, human-readable timing, next-run calculation, due detection, and log filtering.

## 15. Risks and Tradeoffs

- Windows command execution differs from Linux cron.
- The app only runs jobs while open.
- Long-running jobs can overlap unless guarded.
- Executing arbitrary file commands is dangerous if the crontab file is untrusted.

## 16. Future Enhancements

- System tray mode.
- Windows service mode.
- Persistent SQLite logs.
- More cron syntax support.
- Notifications.
- Per-job enable/disable controls.

## 17. Implementation Slices

1. Scaffold docs, versioning, default crontab, and start scripts.
2. Implement parser, scheduler, executor, state, and dashboard.
3. Add tests and package verification.

## 18. Acceptance Criteria

- App starts on Windows via `start_win.cmd` or PowerShell script.
- Raw crontab appears immediately in the dashboard.
- Table contains three parsed default jobs.
- Each row shows seconds until next run.
- Scheduler can start/stop and log runs.
- Log filter can show a single selected job.
- Tests pass.
