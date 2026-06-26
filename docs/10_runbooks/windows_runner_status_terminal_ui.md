# Windows runner/status scripts

## Root-script cleanup note

The root keeps only `full_windows_runner_status.cmd` as the user-facing Windows terminal GUI launcher. Supporting Windows scripts live under `start_scripts/windows/`, proof launchers under `start_scripts/windows/proofs/`, Raspberry launchers under `start_scripts/raspberry/`, and packaging helpers under `start_scripts/packaging/`.


This slice keeps one root-level Windows terminal GUI launcher for local development/operator use and moves supporting scripts under `start_scripts/`.

## Files

- `start_scripts/windows/start_win.cmd` — moved Windows launcher that starts the API, frontend, and component status monitor in separate terminals.
- `start_scripts/windows/stop_all_win.cmd` — new convenience wrapper that stops the processes started by `start_scripts/windows/start_win.cmd`.
- `start_scripts/windows/STOP_ALL_WIN.PS1` — process-matching implementation used by `start_scripts/windows/stop_all_win.cmd`.
- `full_windows_runner_status.cmd` — root terminal UI launcher and preferred Windows operator entry point.
- `start_scripts/windows/FULL_WINDOWS_RUNNER_STATUS.PS1` — terminal UI with Start All, Stop All, Refresh Status, and auto-refreshing status table.

## Terminal UI behavior

`full_windows_runner_status.cmd` opens a terminal menu with:

1. Start All — launches `start_scripts/windows/start_win.cmd` in a separate terminal.
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

The stop script avoids broad arbitrary process killing. It targets repo-owned launcher command lines and project-default port owners matching Node/npm/Vite command shapes.
