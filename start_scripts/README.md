# Start scripts

> Current checkpoint: `v0.10.47`. The root `full_windows_runner_status.cmd` remains the preferred Windows operator entry point and the terminal UI displays the current repo version.

This folder holds operator-facing scripts that were moved out of the repository root to keep the root directory focused.

## Root launcher

Run this from the repository root for the graphical terminal-style Windows runner/status UI:

```cmd
full_windows_runner_status.cmd
```

That root launcher delegates to:

```text
start_scripts/windows/FULL_WINDOWS_RUNNER_STATUS.PS1
```

## Windows scripts

- `windows/start_win.cmd` — starts backend, frontend, and status monitor.
- `windows/START_WIN.PS1` — PowerShell start launcher variant.
- `windows/stop_all_win.cmd` — stop wrapper.
- `windows/STOP_ALL_WIN.PS1` — stop implementation.
- `windows/start_win_full.cmd` — full Windows startup wrapper.
- `windows/proofs/*.cmd` — Windows proof launchers.

## Raspberry scripts

- `raspberry/START_RASPBERRYOS.SH`
- `raspberry/start_raspberry_full.sh`

## Packaging scripts

- `packaging/TRANSFERABLE_REPO_PACKAGER.cmd`
- `packaging/UPDATE_LOCAL_REPO_FROM_ZIP.cmd`

## Boundary

Moving these scripts is an organization change. It does not change backend/frontend runtime behavior. The root-level `full_windows_runner_status.cmd` remains the preferred operator entry point on Windows.
