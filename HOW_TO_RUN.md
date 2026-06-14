# How to Run


## Documentation navigation

Before following older runbooks or task notes, check the current documentation navigation files:

- [`docs/DOC_INDEX.md`](docs/DOC_INDEX.md) is the main map for documentation by purpose.
- [`docs/DOC_FRESHNESS_MATRIX.md`](docs/DOC_FRESHNESS_MATRIX.md) explains which docs are current, stale, historical, or risky.
- [`docs/DOC_REORGANIZATION_PLAN.md`](docs/DOC_REORGANIZATION_PLAN.md) must be checked before moving documentation files.
- [`docs/AUTH_EVIDENCE_PACK.md`](docs/AUTH_EVIDENCE_PACK.md) is the starting point for login/auth artifact debugging.

Do not treat old TODO docs, `task_docs/`, backlog docs, or vision/spec docs as current implementation truth without code, test, or generated-evidence verification.

```bash
npm install --verbose
npm run build
npm run api
npm run dev
```

On Windows, you can also run `start_win.cmd` from the repository root. It checks Node/npm, installs dependencies when needed, runs `npm run build`, then starts the API server, Vite frontend, and component-status monitor in separate terminals.

For a fuller Windows startup pass, run `start_win_full.cmd` from the repository root. It installs dependencies with verbose npm output, runs `npm test`, runs `npm run build`, opens API, frontend, and component-status monitor tabs when Windows Terminal is available, falls back to separate `cmd.exe` windows, and opens the frontend in the default browser. See [`docs/10_runbooks/windows_full_launcher.md`](docs/10_runbooks/windows_full_launcher.md).

Open the local Vite URL in your browser.

Use `example.env` as the local environment template and keep one local runtime env file: `.env`. Do not use a checked-in `test.env`; dashboard Test Mode uses the `TEST_*` paths defined in `.env` or safe `test_runtime_data` defaults. Keep `DB_PATH` for the real runtime SQLite database and `TEST_DB_PATH` for test-only database work; those original `.env` paths must not overlap.

## NEW AUTH provider verification check

Open View A and use the NEW AUTH card for the new `/api/auth/new/*` flow.

- `Check login` performs the passive status request: `GET /api/auth/new/status?mode=passive`.
- If the UI says `Session files found, provider verification not run yet.`, local session files exist but provider proof has not been run.
- Press `Verify with iCloudPD` to run active provider verification through `GET /api/auth/new/status`.
- `Verify iCloudPD install` only checks executable/config readiness through `POST /api/auth/new/verify-icloudpd`; it does not prove authenticated login.

Provider output, passwords, 2FA codes, cookies, session contents, tokens, and authorization headers must remain redacted in the modal, event history, and logs.

Status documentation for this flow is recorded in `docs/IMPLEMENTATION_STATUS_UPDATE_20260512_NEW_AUTH_PROVIDER_VERIFICATION.md`.


## Windows native playback mpv setup

`start_win_full.cmd` now verifies or installs repo-local mpv before running tests/build and launching the dashboard. The `.cmd` stays thin and delegates to `start_scripts/start_win_full.ps1`, which delegates the actual mpv logic to:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install_mpv_windows.ps1
```

The installer target is:

```text
tools/mpv/windows/mpv.exe
```

The binary is runtime-installed and ignored by Git. If it already exists and verifies with `--version`, it is reused. If the download is blocked, the launcher prints a warning and continues normal dashboard startup; `proof:live-windows-native-playback` will remain blocked until mpv is available.

## Live Windows native playback proof launcher

Use this dedicated launcher when you want to prove real Windows native playback with repo-local `mpv.exe`:

```powershell
clear
cd S:\PF_login
.\start_live_windows_native_playback_proof.cmd
```

This command is intentionally separate from `start_win_full.cmd`. Normal `start_win_full.cmd` still keeps native playback disabled by default. The proof launcher creates a proof-only env file at `runtime_data/live_windows_native_playback_proof.env`, appends `NATIVE_PLAYBACK_ENABLED=true`, starts an owned API process on `http://127.0.0.1:4301`, waits until `/api/native-playback/status` reports native playback enabled, runs `npm run proof:live-windows-native-playback`, stops only the API process it started, packs logs/proofs/artifacts into a ZIP under Downloads, and opens Explorer on that ZIP.

Optional worker-autostart run:

```powershell
clear
cd S:\PF_login
.\start_live_windows_native_playback_proof.cmd -WorkerAutostart
```

The proof launcher calls `scripts\install_mpv_windows.ps1` with the repo root explicitly. This fixes launcher-time path handling and keeps `tools/mpv/windows/mpv.exe` runtime-installed and ignored by Git.


### Windows mpv installer path note

The Windows mpv installer redacts repo-local absolute paths with escaped regex patterns, so paths such as `S:\PF_login` are safe during installer verification. Normal `start_win_full.cmd` still does not enable native playback by default; use `start_live_windows_native_playback_proof.cmd` for the opt-in live proof.


### v0.8.5 note — mpv version verification

The Windows mpv installer verifies `tools/mpv/windows/mpv.exe` with `mpv.exe --version` using redirected stdout/stderr. Normal multiline mpv version output is recorded as sanitized evidence and must not be treated as a failed install.



### v0.8.9 note — worker stdout proof parser redaction fix

The live Windows native playback proof now tolerates legacy sanitized worker stdout where numeric fields were replaced with unquoted `[REDACTED]` placeholders. The proof keeps strict media identity checks, but it can still extract `worker_selected_item` from the playback worker output after sanitization. Missing video media remains an explicit coverage limitation, not a failure of image-only native playback proof.

### v0.8.8 note — worker-autostart native proof timeout cleanup

Worker-autostart native playback now detaches/unrefs the OS player process so `playback_worker` can exit after launching native playback instead of waiting on the player lifetime. The live proof also extracts the worker-selected item from stdout even when surrounding log lines are present, and the stop route can target the persisted owned native playback PID without killing arbitrary `mpv`/`vlc` processes by name.

### v0.8.7 note — worker native autostart exact selected item

`playback_worker` native auto-start now launches the exact media asset selected by Stage 6. It no longer re-resolves current/next playback state through a generic native start path after selection, because that can advance to another queue item and make the worker-selected item differ from the native item. Use the worker-autostart proof launcher to validate this path on Windows:

```powershell
clear
cd S:\PF_login
.\start_live_windows_native_playback_proof.cmd -WorkerAutostart
```

### v0.8.6 note — worker-autostart native playback proof

Worker-autostart live native playback proof now validates the item selected by `playback_worker` against native playback status directly after the worker run. In `-WorkerAutostart` mode the proof does not call the direct `/api/native-playback/start-current` route after the worker, because doing so can advance to a different next item and invalidate the worker identity proof. Missing video queue coverage is recorded as a limitation unless a video-specific proof run is explicitly required.



### v0.8.10 - Native Windows video playback proof

Added `proof:live-windows-native-video-playback`, an opt-in Windows proof that requires a real video item to be current/next before launching native playback. Missing video media is reported as `BLOCKED`, not as fake proof.


### v0.8.11 - Controlled Windows native recovery proof

Added `proof:live-windows-native-recovery`, a target-safe proof track for controlled API restart/recovery. It explicitly does not claim Windows reboot or Raspberry power recovery.


### v0.8.12 - Live Windows scheduler proof track

Added `proof:live-windows-scheduler`, a blocked-by-default target proof track for scheduled worker invocations. It separates CronEmulator contract evidence from live Windows scheduler evidence and does not claim Raspberry cron or Windows reboot behavior.

### v0.8.13 note — target proof-owned launchers

Dedicated Windows wrappers now exist for the v0.8.10–v0.8.12 target proof tracks:

```powershell
.\start_live_windows_native_video_playback_proof.cmd
.\start_live_windows_native_recovery_proof.cmd
.\start_live_windows_scheduler_proof.cmd
```

The video and recovery wrappers start a proof-owned API with a proof-only env file before running the proof command, then export an evidence ZIP and stop only the owned API process. The scheduler wrapper exports scheduler proof evidence without claiming Raspberry cron, Windows reboot, or arbitrary Task Scheduler success. Normal `start_win_full.cmd` remains unchanged and does not enable native playback by default.

### v0.8.14 note — generated video fixture repair

The committed `generated_test_data` dataset now includes repaired synthetic proof-only video fixtures. The former zero-byte `videos_with_gps` and `videos_no_gps` blocker paths are directories, and the dataset README/manifest align with the repaired filesystem. Validate with:

```bash
npm run proof:verify-generated-test-data
```

These fixtures are proof/test data only. They do not prove real iPhone capture, iCloud ingestion, Raspberry playback, monitor-pixel correctness, or reboot recovery.

### v0.8.22 — proof-only native video seed/select path

The live Windows native video playback proof now seeds one deterministic `generated_test_data` video fixture into the Test Mode database before checking `/api/runtime/playback/current`. This is a proof-only route under `/api/testing/live-windows-native-video/seed`; it does not change normal production playback ordering and the proof still cannot pass unless native playback reports a running video item with `currentMediaType=video`. Local `tools/mpv/` and `tools/ffmpeg/` bundles remain ignored and must not be vendored into baseline ZIPs.

### v0.8.23 - Live native video proof Test Mode header fix

Fixed the Windows native video proof launcher so the proof-only seed route is called in Test Mode instead of Real Mode. This preserves the seed route guard, keeps production playback ordering unchanged, and still requires real target evidence before native video playback can be claimed as PASS.


### v0.8.24 note — proof-seeded native video current item

The live Windows native video proof seed route now demotes other READY rows inside the Test Mode proof database so the deterministic generated video fixture becomes the current/next playback item for the proof run. This remains proof-only behavior and does not change normal production playback ordering. BLOCKED video proof artifacts now include seed/current stage evidence for diagnosis.

### v0.8.25 note — controlled Windows native recovery orchestration

`proof:live-windows-native-recovery` now performs a proof-owned controlled API restart: it captures the selected item, starts native playback, stops only the proof-owned API process, restarts the API with the same proof env, verifies the same selected item after restart, relaunches native playback, and stops the owned native playback process. This is not a full Windows reboot proof and does not prove Raspberry or power-loss recovery.


### v0.8.26 - Proof-owned live Windows scheduler evidence collection

Added bounded proof-owned scheduler evidence collection for `proof:live-windows-scheduler`. The proof labels its mode as `proof-owned-scheduler-loop`, invokes regular/playback/screen-on-off worker entrypoints, records timestamps/counts, verifies playback worker duplicate-lock protection, and still does not claim Raspberry cron, Windows reboot, or power-loss proof; Windows Task Scheduler is out of scope.


### v0.8.27 - Windows native proof milestone documentation

Consolidated the v0.8.26 Windows proof checkpoint in `docs/proofs/windows_native_proof_milestone_v0.8.26.md`. The milestone records target-machine PASSED evidence for generated video fixture validation, native Windows image playback, worker-autostart image playback, native Windows video playback, controlled API-restart native recovery, and the proof-owned live Windows scheduler loop. It keeps limitations explicit: Windows Task Scheduler is out of scope, no full Windows reboot proof, no Raspberry cron/reboot/power-loss proof, no monitor-pixel proof, and no vendored `tools/mpv/` or `tools/ffmpeg/` binaries in Git.

## Windows scheduler scope

Windows Task Scheduler is not part of PF_login project scope. Do not run or reintroduce Windows Task Scheduler-only proof commands unless the project scope is explicitly reversed. The supported Windows scheduler evidence path is the project-owned proof loop:

```powershell
npm run proof:live-windows-scheduler
```

Use the Windows reboot/restart recovery preflight below for the safe manual-reboot proof contract.

## Windows reboot/restart recovery preflight

Run this safe preflight before any future manual target-machine reboot proof:

```powershell
npm run proof:windows-reboot-recovery-preflight
```

The preflight does not reboot Windows. Windows Task Scheduler is not part of PF_login project scope. It checks project-owned launcher/proof prerequisites, local-only `tools/mpv/` / `tools/ffmpeg/` boundaries, cleanup rules, and explicit non-claims.

### v0.8.31 — Raspberry OS OpenSpec docs

Raspberry OS support is currently documented as an OpenSpec planning contract at `docs/20_architecture_and_specs/openspec/raspberry_os_missing_features_openspec.md`. The OpenSpec lists missing Raspberry launcher, local media tool checks, native image/video playback, address overlay, path portability, project-owned scheduler loop, worker autostart, screen on/off, generated fixture validation on Raspberry, controlled recovery, manual reboot recovery, power-loss recovery, evidence export, and HOW_TO_RUN/operator guide work.

This is documentation only. It does not add Raspberry runtime commands, does not prove Raspberry playback/reboot/power-loss behavior, does not use Windows Task Scheduler, and does not vendor `tools/mpv/` or `tools/ffmpeg/` binaries.

## Raspberry app-running definition

For Raspberry OS, PhotoFrame “app is running” means cron is active and all three worker lanes are operational: `regular_stage_worker` every 10 minutes, `playback_worker` every 1 minute, and `screen_on_off_worker` every 3 minutes. The v0.8.44 OpenSpec records this requirement at [`docs/20_architecture_and_specs/openspec/raspberry_cron_worker_runtime_openspec.md`](docs/20_architecture_and_specs/openspec/raspberry_cron_worker_runtime_openspec.md).

This runbook note is documentation only. It does not prove Raspberry cron, reboot recovery, or power-loss recovery.

## v0.8.51 worker status/lock instrumentation

The scheduler CLI entrypoints now write status/lock evidence for all three worker lanes:

```bash
npm run api -- --scheduler regular-stage-worker
npm run api -- --scheduler playback-worker
npm run api -- --scheduler screen-on-off-worker
```

The regular and screen workers are instrumentation-only in this slice; they do not claim real download/index/GPS/geocode/queue product work or physical screen hardware control.

## Raspberry app-running PASS harness

On Raspberry with managed cron rows, run:

```bash
npm run proof:raspberry-app-running-pass
```

The command remains `BLOCKED` off-target and does not claim reboot or power-loss recovery.

## Raspberry reboot evidence generator

Prepare before manual reboot:

```bash
npm run proof:raspberry-reboot-evidence -- --prepare
```

After reboot, collect evidence:

```bash
npm run proof:raspberry-reboot-evidence -- --collect
```

This does not reboot automatically and does not prove physical power-loss recovery.

## Raspberry managed cron preflight

Check whether the PF_login managed three-worker cron rows are installed:

```bash
npm run proof:raspberry-cron-preflight
```

Install or replace only the PF_login managed block:

```bash
npm run proof:raspberry-cron-preflight -- --install
```

The command preserves crontab rows outside the PF_login managed block.

## Raspberry install/runtime blocker repair helpers

After extracting a PF_login ZIP on Raspberry/Linux, repair/check project-owned executable bits before native playback proof:

```bash
npm run proof:raspberry-executable-permissions -- --repair
```

Before running scheduler workers that need runtime config, create/check `.env` from `example.env` when missing:

```bash
npm run proof:raspberry-env-preflight -- --create
```

Then install/check the PF_login managed cron block:

```bash
npm run proof:raspberry-cron-preflight -- --install
npm run proof:raspberry-cron-preflight
```

These helpers do not prove app-running, reboot recovery, physical power-loss recovery, production iCloud continuation, or real geocode provider behavior by themselves. They remove known Raspberry install/runtime blockers observed in the v0.8.54 evidence pack.


## Raspberry v1.0 release-gate readiness

After collecting Raspberry target proof artifacts, evaluate the answered v1.0 release gate matrix:

```bash
npm run proof:raspberry-v1-readiness
```

This command reads latest `runtime_data/proofs/*.json` artifacts and reports which v1.0 gates still block release. It does not run missing real iCloud, GPS/geocode, native playback, dashboard, reboot, or power-loss proofs by itself.


## Raspberry proof false-negative repair note

As of v0.8.58, Raspberry cron and worker-startup evaluators preserve raw command output internally for matching/parsing, then sanitize final proof artifacts. This avoids false `BLOCKED` results where cron rows were installed or preflight commands printed `PASSED`, but redaction removed scheduler fragments or broke JSON parsing in the evaluator.

## Raspberry three-worker startup smoke proof

After extracting/installing dependencies, run the worker startup smoke proof:

```bash
npm run proof:raspberry-worker-startup-smoke -- --prepare
```

This does not install cron and does not prove the full cron workflow. It proves the three worker commands can start cleanly on Raspberry after executable, `.env`, and SQLite DB preflights.

## v0.8.59 app-running evidence repair

`proof:raspberry-worker-evidence` and `proof:raspberry-app-running-pass` now evaluate raw `crontab -l` output internally before writing sanitized proof artifacts. This keeps installed worker rows recognizable even when repo paths are redacted from final evidence.

## Raspberry address overlay proof gate

After a real display-overlay observation, run:

```bash
PF_RASPBERRY_ADDRESS_OVERLAY_EVIDENCE_FILE=/path/to/address_overlay_evidence.json npm run proof:raspberry-address-overlay-device-display
```

The evidence file must explicitly state the native display path, address text, rendered overlay, and operator observation.

## Raspberry regular worker product pipeline proof gate

After a real regular_stage_worker product pipeline run, provide its evidence file and run:

```bash
PF_RASPBERRY_REGULAR_STAGE_WORKER_PRODUCT_EVIDENCE_FILE=/path/to/regular_worker_product_evidence.json npm run proof:raspberry-regular-stage-worker-product-pipeline
```

This is a v1.0 gate for real download/import, indexing, GPS extraction, geocoding, and queue preparation.

## Raspberry app-running target pack

Run the current target app-running proof chain:

```bash
npm run proof:raspberry-app-running-target-pack
```

This is the fastest command to identify the first setup/startup/cron/app-running blocker after unpacking the repo on Raspberry.

## Raspberry address overlay evidence template

Create the operator evidence template:

```bash
npm run proof:raspberry-address-overlay-template
```

Only set the generated fields to `true` after a real device-display observation.

## Raspberry regular worker product evidence template

Create the regular worker product evidence template:

```bash
npm run proof:raspberry-regular-product-template
```

Only set generated fields to `true` after a real regular_stage_worker product pipeline run.

## Uploadable app-running target-pack ZIP

As of v0.8.65, this command writes an uploadable evidence ZIP path in its JSON output:

```bash
npm run proof:raspberry-app-running-target-pack
```

Upload the reported `bundleZipPath` for analysis. The ZIP packages existing proof artifacts and runtime evidence but does not create extra proof claims.

### Raspberry v1 readiness target pack (v0.8.66)

Run on Raspberry from the repo root:

```bash
npm install --verbose
npm run proof:raspberry-app-running-target-pack
```

The v0.8.66 target pack now collects the full current v1 readiness proof set that is available before future product/provider gates: target tooling, generated fixtures, executable/env preflights, worker startup, cron install, worker evidence, cron worker runtime, app-running status/chain/pass, native image/video playback, and the v1 readiness summary. Upload the printed `bundleZipPath`.

This command still does not claim real iCloud/GPS/geocode, address overlay, regular product pipeline, dashboard status, reboot recovery, or power-loss recovery unless those individual proof artifacts pass.

## Raspberry v1 question matrix docs

The current v1 question-matrix decisions and derived roadmap live in:

- `docs/20_architecture_and_specs/openspec/raspberry_v1_question_matrix_decisions_openspec.md`
- `docs/40_backlog_and_tasks/raspberry_v1_plan_from_question_matrix.md`

Unanswered matrix items are intentionally marked as open/defaulted. Do not treat them as confirmed v1 requirements until updated by the user.
