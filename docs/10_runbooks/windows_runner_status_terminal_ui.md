# Windows runner/status scripts

## Root-script cleanup note

The root keeps only `full_windows_runner_status.cmd` as the user-facing Windows terminal GUI launcher. Supporting Windows scripts live under `start_scripts/windows/`, proof launchers under `start_scripts/windows/proofs/`, Raspberry launchers under `start_scripts/raspberry/`, and packaging helpers under `start_scripts/packaging/`.


This slice keeps one root-level Windows terminal GUI launcher for local development/operator use and moves supporting scripts under `start_scripts/`.

## Files

- `start_scripts/windows/start_win.cmd` — moved Windows launcher wrapper that delegates to `START_WIN.PS1`.
- `start_scripts/windows/stop_all_win.cmd` — convenience wrapper that stops the repo-owned service terminals/processes started by `START_WIN.PS1` or the runner UI.
- `start_scripts/windows/STOP_ALL_WIN.PS1` — process-matching implementation used by `start_scripts/windows/stop_all_win.cmd`.
- `full_windows_runner_status.cmd` — root terminal UI launcher and preferred Windows operator entry point.
- `start_scripts/windows/FULL_WINDOWS_RUNNER_STATUS.PS1` — terminal UI with Start All, Stop All, Refresh Status, and auto-refreshing status table.

## Terminal UI behavior

`full_windows_runner_status.cmd` opens a terminal menu with:

1. Start All — runs `start_scripts/windows/START_WIN.PS1`; it opens backend, frontend, and status monitor as tabs in one Windows Terminal window when `wt.exe` is available, with separate `cmd.exe` windows as fallback.
2. Stop All — runs `start_scripts/windows/STOP_ALL_WIN.PS1`.
3. Refresh Status — manually refreshes status.
4. Quit — closes the runner UI.

The right-side status panel checks:

- Backend API on port `4301`.
- Frontend Vite on port `5173`.
- Component status monitor process.
- SQLite database file presence.

The menu auto-refreshes every 5 seconds by default and shows:

- latest update time in Estonia time,
- human-readable age like `5 seconds ago`, `1 minute ago`, etc.

## Safety boundary

The stop script avoids broad arbitrary process killing. It targets repo-owned launcher command lines, repo-owned service terminal hosts, and project-default port owners matching Node/npm/Vite command shapes. It deliberately stops the service `cmd`/PowerShell hosts so Windows Terminal service tabs close; it does not intentionally kill the Windows Terminal application hosting the runner UI.
