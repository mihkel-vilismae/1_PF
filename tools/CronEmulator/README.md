# CronEmulator

A lightweight Windows 11 cron emulator dashboard written in Python.

It reads `crontab_emulated.txt` from the project root, displays the raw file in a terminal-like panel, parses each cron row into table entries, shows human-readable timing, shows seconds until the next run, and records per-job run logs.

## Project capability

This project can be used to emulate cron behavior on Windows by loading cron-style entries from `crontab_emulated.txt`, calculating due times, and running matching commands through its scheduler.

## Default crontab

The live `crontab_emulated.txt` file is local runtime state and is intentionally not tracked by the parent repository. Use `crontab_emulated.example.txt` as the checked-in template for the default rows:

```cron
*/10 * * * * powershell -NoProfile -ExecutionPolicy Bypass -File ".\entrypoints\regular_stage_worker.ps1"
* * * * * powershell -NoProfile -ExecutionPolicy Bypass -File ".\entrypoints\playback_worker.ps1"
*/3 * * * * powershell -NoProfile -ExecutionPolicy Bypass -File ".\entrypoints\screen_on_off_worker.ps1"
```

These rows keep the three workers separate: regular stages B3.1-B3.5, playback selection, and screen simulation.

## Quick start

On Windows, double-click:

```bat
start_win.cmd
```

Or from PowerShell:

```powershell
./start_scripts/start_win.ps1
```

To emulate a different crontab file, pass its path:

```powershell
./start_scripts/start_win.ps1 C:\path\to\crontab.txt
```

To show command-line help:

```powershell
./start_scripts/start_win.ps1 --help
```

To persist cron call logs, including command output, pass a JSON Lines log file:

```powershell
./start_scripts/start_win.ps1 C:\path\to\crontab.txt --log-file logs\cron_calls.jsonl
```

Then open the URL printed in the terminal, usually:

```text
http://127.0.0.1:8765
```

## What you will see

- A header showing the loaded crontab file path and scheduler state.
- A terminal-like raw crontab panel.
- A parsed jobs table with job name, raw cron row, readable schedule, command, next run timestamp, countdown seconds, last run, and last result.
- A run log panel that can be filtered by selected cron job.

## Safety note

The scheduler executes commands from `crontab_emulated.txt` when started. Review the file before starting the scheduler.

Persistent cron call logs written with `--log-file` include captured command output. Choose a log location appropriate for any sensitive output produced by scheduled commands.
