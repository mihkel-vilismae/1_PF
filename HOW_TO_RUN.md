# How to Run

## Use this for quickstart

From the repository root on Windows PowerShell, run:

```powershell
.\full_windows_runner_status.cmd
```

From `cmd.exe`, this also works:

```cmd
full_windows_runner_status.cmd
```

This is the preferred operator launcher/status helper. It opens the terminal UI for Start All, Stop All, Refresh Status, and component status. Start All opens backend, frontend, and status monitor as tabs in one Windows Terminal window when `wt.exe` is available; Stop All targets those repo-owned service terminals and their child processes.

Example local absolute path, if this repo was extracted under `S:\_PHOTOFRAMES`:

```text
S:\_PHOTOFRAMES\PF_login_v0.10.20_dashboard_dom_stability_fix_full_git\full_windows_runner_status.cmd
```

## Current launcher and database paths

- Windows launcher: `start_scripts/windows/START_WIN.PS1`.
- Raspberry launcher: `start_scripts/raspberry/START_RASPBERRYOS.SH`.
- Canonical SQLite schema: `database/schema.sql`.
- Existing `.env` and SQLite DB files are preserved by the launchers; the DB is created only when the configured `DB_PATH` does not exist.

## Manual

```bash
npm install --verbose
npm run build
npm run api
npm run dev
```

Open the local Vite URL in your browser.

## More detail

Use these when you need more than the quickstart:

- Full preserved run reference: [`docs/10_runbooks/how_to_run_full_reference.md`](docs/10_runbooks/how_to_run_full_reference.md).
- Windows runner/status terminal UI: [`docs/10_runbooks/windows_runner_status_terminal_ui.md`](docs/10_runbooks/windows_runner_status_terminal_ui.md).
- Full Windows startup workflow: [`docs/10_runbooks/windows_full_launcher.md`](docs/10_runbooks/windows_full_launcher.md).
- Raspberry OpenSpec/operator guide: [`docs/20_architecture_and_specs/openspec/raspberry_os_missing_features_openspec.md`](docs/20_architecture_and_specs/openspec/raspberry_os_missing_features_openspec.md).
- Proof documentation index: [`docs/proofs/README.md`](docs/proofs/README.md).

## Scope reminders

- `HOW_TO_RUN.md` must stay short and quickstart-oriented. Put long operator notes in `docs/10_runbooks/` and link them here.
- Windows Task Scheduler is not part of PF_login project scope; use the project-owned scheduler/proof paths documented in proof runbooks.
- Native playback and iCloud proofs remain explicit opt-in proof/operator flows; normal launchers do not silently claim those proofs.
