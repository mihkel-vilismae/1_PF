# View E validation hermetic contract

Version introduced: v0.8.41

`npm run validate:view-e` validates the View E database-viewer backend surface without trusting operator-local runtime state.

## Contract

The validator must:

- create a proof-owned temporary env file outside the repository;
- pass that file to the API server with `INIT_ENV_FILE`;
- force the validation database, download directory, log directory, and cookie directory into the same temporary root;
- ignore any checked-out or ignored repo `.env` file for the validation run;
- ignore ambient `DB_PATH`, `DOWNLOAD_DIR`, `LOG_DIR`, `ICLOUDPD_COOKIE_DIR`, `TEST_DB_PATH`, `TEST_DOWNLOAD_DIR`, and `TEST_LOG_DIR` values from the parent shell;
- exercise the same View E behavior as before: verify/connect before DB creation, recreate-empty, table listing, invalid row lookup, and database-viewer logging start/stop;
- delete its temporary validation directory after the run; and
- print only sanitized metadata such as the temporary DB path and env-isolation mode.

## Non-claims

This validator does not prove real iCloud provider access, production DB contents, Raspberry runtime behavior, native playback, scheduler behavior, reboot recovery, power-loss recovery, or live Windows proof wrappers.

It also does not rewrite operator `.env` files. A hostile or stale local `.env` must not change whether this validation passes.

## Test coverage

`tests/viewEValidationHermetic.test.js` creates a hostile `.env` pointing at an existing schema-valid SQLite database and runs `scripts/validate-view-e.mjs` with hostile ambient env variables. The test passes only if the validator ignores that state, uses a proof-owned temp env, avoids leaking the hostile password string, and leaves the repo `.env` content unchanged.

## Operator command

```bash
npm run validate:view-e
```

For parallel or isolated test runs, the port may be overridden without changing the app runtime contract:

```bash
VALIDATE_VIEW_E_PORT=4318 npm run validate:view-e
```
