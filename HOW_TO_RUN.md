# How to Run

> Current checkpoint: `v0.17.0`. This file is intentionally short; longer operator detail belongs in `docs/10_runbooks/`.

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
S:\_PHOTOFRAMES\PF_login_v0.10.67_target_live_proof_readiness_full_git\full_windows_runner_status.cmd
```

## Current launcher and database paths

- Repository/package version: `0.17.0`.
- Windows launcher: `start_scripts/windows/START_WIN.PS1`.
- Raspberry launcher: `start_scripts/raspberry/START_RASPBERRYOS.SH`.
- Canonical SQLite schema: `database/schema.sql`.
- Existing `.env` and SQLite DB files are preserved by the launchers; the DB is created only when the configured `DB_PATH` does not exist.
- V2 dashboard mode is a runnable frontend startup option with nine left-sidebar rows, shared Event history, status/help controls, Setup/Auth/Startup/Workers/Troubleshooting/Recovery/PIR/Playback controls, an integrated `09 REAL PLAYBACK` layout/projection, and a B12 proof gate.
- Live Raspberry, auth-provider, playback, and recovery success still require explicit proof artifacts; normal launchers do not claim those proofs.


## Terminal Demo Mode rehearsal

From the extracted repository root on Windows, run:

```cmd
VERIFY_TERMINAL_DEMO.CMD
```

This runs the terminal Demo Mode final proof pack and writes `terminal_demo_status.json`, `terminal_demo_status.md`, and a terminal-demo-only evidence ZIP under `terminal/demo/runtime_logs/operator_rehearsal/`.

Equivalent npm command:

```bash
npm run proof:terminal-demo-operator-rehearsal
```
If the rehearsal is BLOCKED or you have a terminal-demo evidence ZIP/folder, run:

```cmd
ANALYZE_TERMINAL_DEMO_EVIDENCE.CMD
REM or with explicit evidence path:
ANALYZE_TERMINAL_DEMO_EVIDENCE.CMD path\to\terminal_demo_operator_rehearsal.zip
```

This writes `terminal_demo_evidence_diagnosis.json` and `.md` under `terminal/demo/runtime_logs/evidence_diagnosis/`.


## Terminal Demo Mode transferable RC package proof

From the extracted repository root on Windows, run:

```cmd
VERIFY_TERMINAL_DEMO_TRANSFERABLE_PACKAGE.CMD
```

Equivalent npm command:

```bash
npm run proof:terminal-demo-transferable-package
```

This verifies the package is a clean transferable RC package with Git history, tracked packager helper, version/package identity, root launchers, and evidence-only proof output.


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


## Proofrunner modes

Generated proofrunner handoffs should usually be run in this order: `quick`, `blockers`, `platform`, then `full` only for the final sweep. Use `PF_PROOF_MODE=quick|blockers|platform|failed-last|minimum|full`; legacy `PF_PROOF_LAUNCHER_MODE=all|minimum` remains accepted for older automation.

## Terminal Demo Mode v1.0 final release proof

From a clean extracted repository root on Windows, run:

```cmd
VERIFY_TERMINAL_DEMO_V1_RELEASE.CMD
```

Equivalent npm command:

```bash
npm run proof:terminal-demo-v1-release
```

This verifies the final v1.0 release package and reports `TERMINAL_DEMO_MODE_V1_RELEASED` only when the frozen v1 evidence gate remains green. It is a release-only proof and does not add terminal-demo runtime behavior.

## Terminal Demo Mode v1.0 release-freeze proof

From a clean extracted repository root on Windows, run:

```cmd
VERIFY_TERMINAL_DEMO_V1_RELEASE_FREEZE.CMD
```

Equivalent npm command:

```bash
npm run proof:terminal-demo-v1-release-freeze
```

This collects final build/typecheck/proof evidence under `terminal/demo/runtime_logs/v1_release_freeze/` and reports `V1_READY_TO_RELEASE` only when the package is ready for a v1.0 release-only milestone.

### Terminal Demo DB image playback button proof

```powershell
npm run proof:terminal-demo-db-image-playback-button
```

Expected decision:

```text
TERMINAL_DEMO_DB_IMAGE_PLAYBACK_BUTTON_READY
```

This proof uses a temporary isolated DEMO database with the real playback table structure and verifies the terminal playback button does not depend on `DEMO_QUEUE_OUTPUT_PATH` JSON or mock rows.
