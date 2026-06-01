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

