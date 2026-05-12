# How to Run

```bash
npm install --verbose
npm run build
npm run api
npm run dev
```

On Windows, you can also run `start_win.cmd` from the repository root. It checks Node/npm, installs dependencies when needed, runs `npm run build`, then starts the API server and Vite frontend in separate terminals.

Open the local Vite URL in your browser.

Use `example.env` as the local environment template. Keep `DB_PATH` for the runtime SQLite database and `TEST_DB_PATH` for test-only database work; those paths must not overlap.

## NEW AUTH provider verification check

Open View A and use the NEW AUTH card for the new `/api/auth/new/*` flow.

- `Check login` performs the passive status request: `GET /api/auth/new/status?mode=passive`.
- If the UI says `Session files found, provider verification not run yet.`, local session files exist but provider proof has not been run.
- Press `Verify with iCloudPD` to run active provider verification through `GET /api/auth/new/status`.
- `Verify iCloudPD install` only checks executable/config readiness through `POST /api/auth/new/verify-icloudpd`; it does not prove authenticated login.

Provider output, passwords, 2FA codes, cookies, session contents, tokens, and authorization headers must remain redacted in the modal, event history, and logs.

Status documentation for this flow is recorded in `docs/IMPLEMENTATION_STATUS_UPDATE_20260512_NEW_AUTH_PROVIDER_VERIFICATION.md`.

