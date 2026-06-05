# Photo Frame Dashboard System

This repository contains a dashboard-driven photo-frame system for managing staged media processing, runtime monitoring, and playback surfaces.

The system documentation is organized in canonical numbered folders under `docs/`: `00_current_truth`, `10_runbooks`, `20_architecture_and_specs`, `30_status_snapshots`, `40_backlog_and_tasks`, `50_audits_and_migrations`, and `90_archive`. Implementation status in documentation is not current runtime truth unless the document cites current code, tests, generated evidence, or runtime output.

## Windows full launcher

Run `start_win_full.cmd` from the repository root for the full Windows startup workflow. It installs dependencies, runs tests, builds the frontend, opens API, frontend, and component-status monitor tabs/windows when available, and opens `http://localhost:5173` in the default browser.

Use `start_win.cmd` for the older lighter startup path.

## Documentation entry points


### Documentation navigation

Use the current documentation navigation files before treating older docs as truth:

- [`docs/table_of_contents.md`](docs/table_of_contents.md) is the short top-level documentation table of contents.
- [`docs/DOC_INDEX.md`](docs/DOC_INDEX.md) is the main map for docs by purpose, kind, authority, and topic.
- [`docs/DOC_FRESHNESS_MATRIX.md`](docs/DOC_FRESHNESS_MATRIX.md) shows which docs are current, recent-but-verify, historical, or risky.
- [`docs/DOC_REORGANIZATION_PLAN.md`](docs/DOC_REORGANIZATION_PLAN.md) must be checked before moving or renaming documentation files.
- [`docs/DOC_REFACTOR_CLOSURE_REPORT_20260525.md`](docs/DOC_REFACTOR_CLOSURE_REPORT_20260525.md) summarizes the canonical folder layout and compatibility-pointer policy.
- [`docs/00_current_truth/AUTH_EVIDENCE_PACK.md`](docs/00_current_truth/AUTH_EVIDENCE_PACK.md) is the canonical starting point for login/auth artifact debugging.

Old TODO files, `task_docs/`, backlog docs, old categorized indexes, and vision/spec docs are useful context, but they are not current implementation truth unless code, tests, or generated evidence confirm them.

Start here:

- [`docs/table_of_contents.md`](docs/table_of_contents.md) for the short documentation map.
- [`docs/DOC_INDEX.md`](docs/DOC_INDEX.md) for the full documentation inventory.
- [`docs/00_current_truth/`](docs/00_current_truth/) for current evidence-backed guides.
- [`docs/10_runbooks/operator_setup_and_auth_notes.md`](docs/10_runbooks/operator_setup_and_auth_notes.md) for operator setup and auth notes.
- [`docs/10_runbooks/windows_full_launcher.md`](docs/10_runbooks/windows_full_launcher.md) for the full Windows startup workflow.
- [`docs/20_architecture_and_specs/auth/NEW_AUTH_PROVIDER_VERIFICATION_FLOW.md`](docs/20_architecture_and_specs/auth/NEW_AUTH_PROVIDER_VERIFICATION_FLOW.md) for the NEW AUTH provider-verification reference.
- [`docs/30_status_snapshots/`](docs/30_status_snapshots/) for dated implementation snapshots that must be rechecked against current code before use.

Legacy `docs/main_readme.md`, `docs/categorized/*`, `task_docs/`, and `_TODO_13_05_26/` paths are compatibility navigation only unless a current code/test/evidence check proves otherwise.

## Current documented state

The consolidated status docs describe the system as partially implemented, with mixed real backend behavior and simulated or placeholder-backed dashboard behavior.

Code-checked entrypoint summary:

| Area | Documented state |
|---|---|
| Frontend | Vite app under `dashboard/`, served by `npm run dev` on `http://localhost:5173/`. |
| Backend API | TypeScript server entrypoint at `server/index.ts`, started by `npm run api`. |
| Version display | Frontend reads backend version from `GET /api/version`; repo version is stored in `VERSION` and `package.json`. |
| NEW AUTH | Backend routes are under `/api/auth/new/*`; authentication claims still require endpoint/evidence checks. |
| Runtime/playback | Backend routes exist for orchestration, runtime pipeline stages, playback contracts, resume checkpoints, and native playback status/actions. |

This README does not assert source-code truth. Check code/tests directly before making implementation claims.

## Screen summary

The dashboard is a Vite browser UI with Views A-E plus Windows and Raspberry playback surfaces. The display-facing playback UI shows the selected media preview, media type, queue summary, resolved address caption, fullscreen controls, activity status, worker status, and terminal-style runtime logs.


## v0.8.1 code summary

v0.8.1 adds `proof:live-windows-native-playback`, an opt-in Windows-only proof runner for real OS-native playback evidence. The proof returns `BLOCKED` unless `PF_LIVE_WINDOWS_NATIVE_PLAYBACK_PROOF=1` is set, then checks browser playback/native playback media identity through existing routes and stops only the owned native playback process. Optional playback-worker auto-start evidence is gated by `PF_LIVE_WINDOWS_NATIVE_PLAYBACK_WORKER_AUTOSTART=1`. It does not claim Raspberry, monitor-pixel, or reboot-recovery proof.

## v0.8.0 code summary

v0.8.0 is the corrected minor-version baseline for the TEST MODE FAST EMULATOR control surface. It preserves v0.7.49 behavior and adds manual cronjob call buttons `1`, `2`, and `3` under the large start button. The manual button panel is disabled by default, includes explanation text plus hover details, and becomes enabled only after the large TEST MODE FAST EMULATOR start button has created the owned Test Mode controller run. The buttons record manual regular, playback, and screen-on-off cronjob calls in controller state and `logs/end2end_test.log`; they still do not claim real Raspberry cron, real Windows Task Scheduler, or arbitrary OS process control.

## v0.7.49 code summary

v0.7.49 completes Group B of the TEST MODE FAST EMULATOR UI/controller proof work. The View A Test Mode panel keeps the 6s / 3s / 12s fast-emulator cadence, disables the large start button after the backend start boundary succeeds, blocks duplicate starts, renders backend-owned status rows, and writes dedicated runtime evidence to `logs/end2end_test.log`. The log is runtime-generated and ignored by Git. The proof remains deterministic: it does not claim real Raspberry cron, real Windows Task Scheduler, real native fullscreen playback, or arbitrary OS process killing.

## v0.7.48.a code summary

v0.7.48.a adds Group 3 of the Test Mode whole-logic emulator workflow. View A now exposes controller status plus q/w/e/r/t controls for an owned Test Mode controller state. The backend adds status/control endpoints, keeps all controls blocked outside Test Mode, and preserves the safety boundary: only tracked Test Mode controller records may be stopped; the dashboard and arbitrary Node/Python/SQLite/system processes must not be killed.

## Architecture overview

High-level documented components:

- `dashboard/` - frontend UI, views, and inspect surfaces.
- `server/` - backend API routes, runtime services, auth, database, playback, scheduler, and worker entrypoints.
- `shared/` - shared TypeScript contracts.
- `docs/` - canonical numbered documentation, compatibility pointers, snapshots, specs, runbooks, audits, and archive material.
- `scripts/` - local tooling and governance helpers.
- `tools/` - tool-local utilities such as CronEmulator.
- staged pipeline model - download, index, GPS parsing, geocode, B3.5 queue preparation/building, and B4/current-item playback selection concepts as documented.

## How to run

Install dependencies:

```bash
npm install
```

Build the dashboard and start the frontend during manual development:

```bash
npm run build
npm run dev
```

On Windows, `start_win.cmd` checks dependencies, runs `npm run build`, then starts `npm run api`, `npm run dev`, and a component-status monitor in separate terminals. `start_win_full.cmd` delegates to `start_scripts/start_win_full.ps1`, which installs dependencies, runs tests, builds, starts API/frontend/status tabs or windows, and opens the browser.

Open the local app:

```text
http://localhost:5173/
```

Expected behavior depends on the current implementation state. The docs intentionally distinguish documented status from verified runtime behavior.


## Proof artifact workflows

Proof workflows document and collect sanitized evidence for behavior that cannot be proven by source code alone. Human docs live under [`docs/proofs/`](docs/proofs/), while generated runtime JSON is written under ignored `runtime_data/proofs/`.

| Script | Purpose | Default behavior |
|---|---|---|
| `npm run proof:full-test` | Runs the full test suite and writes structured local pass/fail/timeout evidence with parsed test counts when available. | Executes tests locally with serial Node/tsx test execution. |
| `npm run proof:real-icloudpd` | Proves the real iCloudPD pipeline through existing backend routes. | Writes `BLOCKED` unless explicitly enabled. |
| `npm run proof:geocode-provider` | Proves a real geocode provider and rejects placeholder-only proof. | Writes `BLOCKED` unless explicitly enabled. |
| `npm run proof:real-geocode-provider-chain` | Proves a configured real geocode provider, cache-first behavior, fallback from cache miss, human-readable address plausibility, and placeholder rejection. | Writes `BLOCKED` unless `PF_PROOF_ENABLE_REAL_GEOCODE_CHAIN=true` and provider config are supplied. |
| `npm run proof:address-display-ui` | Proves selected playback address evidence renders into the dashboard/display-facing playback UI. | Deterministic local UI render; writes sanitized JSON under `runtime_data/proofs/`. |
| `npm run proof:raspberry-recovery` | Collects Raspberry power-loss recovery proof from explicit hardware evidence. | Writes `BLOCKED` unless explicitly enabled. |

Generated proof artifacts must not include Apple IDs, passwords, 2FA codes, cookies, API keys, provider tokens, raw provider output, or private filesystem paths.

## Versioning and changelog workflow

The documentation set preserves the existing forward-only SemVer governance model.

Supported commit prefixes:

```text
feat:
fix:
docs:
refactor:
test:
chore:
```

Breaking-change markers:

```text
feat!:
fix!:
BREAKING CHANGE:
```

Local validation is documented in `docs/10_runbooks/operator_setup_and_auth_notes.md` and the versioning/changelog governance notes.

## Repository structure

```text
dashboard/        frontend views and inspect system
docs/             consolidated documentation
scripts/          helper scripts and repo tooling
.githooks/        repo-local Git hooks
tests/            test suite
VERSION           canonical repo version
CHANGELOG.md      forward-only changelog
```

## Notes for future work

- Do not treat archive/reference docs as active authority.
- Do not turn current-status docs into product requirements.
- Do not preserve task docs as actionable when they conflict with active vision/spec docs.
- Verify code paths directly before claiming implementation behavior.

## v0.8.2 code summary

v0.8.2 adds automatic Windows mpv setup to the full Windows launcher flow. `start_win_full.cmd` remains a thin wrapper, while `start_scripts/start_win_full.ps1` delegates to `scripts/install_mpv_windows.ps1` after `npm install --verbose`. The installer verifies or downloads a repo-local mpv binary to `tools/mpv/windows/mpv.exe`, writes sanitized install evidence under `runtime_data/proofs`, and never starts native fullscreen playback. If mpv setup is blocked by network/extraction availability, the normal dashboard launch continues with a warning and the live native playback proof remains blocked until mpv is installed.

### Dedicated live Windows native playback proof

For live Windows `mpv` native playback proof, use the dedicated launcher:

```powershell
clear
cd S:\PF_login
.\start_live_windows_native_playback_proof.cmd
```

This starts a proof-only API with native playback enabled through `runtime_data/live_windows_native_playback_proof.env`, runs `proof:live-windows-native-playback` against `http://127.0.0.1:4301`, exports an evidence ZIP, and keeps normal `start_win_full.cmd` behavior unchanged.


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

Added bounded proof-owned scheduler evidence collection for `proof:live-windows-scheduler`. The proof labels its mode as `proof-owned-scheduler-loop`, invokes regular/playback/screen-on-off worker entrypoints, records timestamps/counts, verifies playback worker duplicate-lock protection, and still does not claim Raspberry cron, Windows reboot, Windows Task Scheduler, or power-loss proof.


### v0.8.27 - Windows native proof milestone documentation

Consolidated the v0.8.26 Windows proof checkpoint in `docs/proofs/windows_native_proof_milestone_v0.8.26.md`. The milestone records target-machine PASSED evidence for generated video fixture validation, native Windows image playback, worker-autostart image playback, native Windows video playback, controlled API-restart native recovery, and the proof-owned live Windows scheduler loop. It keeps limitations explicit: no Windows Task Scheduler proof, no full Windows reboot proof, no Raspberry cron/reboot/power-loss proof, no monitor-pixel proof, and no vendored `tools/mpv/` or `tools/ffmpeg/` binaries in Git.

### v0.8.28 - Windows Task Scheduler dry-run proof contract

`npm run proof:windows-task-scheduler-dry-run` validates the command shape and cleanup boundary for future Windows Task Scheduler integration without installing persistent scheduled tasks. It keeps the v0.8.27 proof-owned scheduler loop evidence separate from real Task Scheduler runtime evidence.
