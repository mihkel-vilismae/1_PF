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
