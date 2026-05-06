# Operator Setup and Auth Notes

## Purpose

Provide practical operator-facing setup/run/auth guidance consolidated from current run and auth documentation, without promoting historical or speculative behavior.

## Absorbed source docs

- `HOW_TO_RUN.md`
- `README.md` (run and workflow sections)
- `docs_to_parse/VERSIONING_AND_CHANGELOG_POLICY.md`
- `docs_to_parse/AI_AUTHENTICATION_2FA_HANDOFF.md`
- `docs_to_parse/AUTH_ICLOUDPD_MANUAL_VERIFICATION.md`
- `docs_to_parse/AUTH_ICLOUDPD_SESSION_VERIFICATION.md`
- `docs_to_parse/active_workflow_docs/part3_slice3_reconciliation_findings.md`

## Canonical notes

### Run/setup baseline

Minimum local run sequence:

```bash
npm install
npm run api
npm run dev
```

Then open the Vite local URL.

### Auth setup baseline (iCloudPD path)

Required local values:

- `user`
- `pw`
- `ICLOUDPD_COOKIE_DIR`
- `DOWNLOAD_DIR` (used by verification flow when present)
- `DB_PATH` (runtime SQLite database location)

Optional:

- `ICLOUDPD_BIN`
- `ICLOUDPD_DOMAIN`
- `ICLOUDPD_AUTH_TIMEOUT_MS`
- `TEST_DB_PATH` (test-only SQLite database location; keep separate from `DB_PATH`)

### Database path setup baseline

- `DB_PATH` identifies the runtime SQLite database used by init/database and runtime-backed flows.
- `TEST_DB_PATH` identifies the test-only SQLite database location when test flows need an explicit database path.
- Real and test database paths must not overlap; `verify-env` reports an error when a configured `TEST_*` path overlaps the matching real path.

### Auth behavior boundaries

- Auth/session truth is backend-owned and exposed via `/api/auth/*`.
- Persisted auth state is not proof of active authentication.
- `POST /api/auth/resume` is the verification path after restart/reload.
- 2FA detection is implemented; default backend-driven 2FA submission can return unsupported when non-interactive verification is not safely available.
- Manual, user-owned verification is still required for real account login/session proof.

### Practical operator usage notes

1. Run auth preflight (`/api/auth/run` or dashboard B1 action).
2. If challenged, complete supported 2FA steps manually.
3. Use `/api/auth/resume` to confirm session validity.
4. Treat unsupported/provider-unavailable outcomes as honest boundary states, not silent failures.
5. Keep secrets out of docs, logs, and issue text.



### NEW AUTH operator flow after Slice 10

The NEW AUTH dashboard flow is owned by `/api/auth/new/*` only. The endpoint family is:

- `GET /api/auth/new/status`
- `POST /api/auth/new/verify-icloudpd`
- `GET /api/auth/new/session-files`
- `POST /api/auth/new/login`
- `POST /api/auth/new/submit-2fa`
- `POST /api/auth/new/logout`
- `POST /api/auth/new/test-download`

Operator truth rules:

1. Verify iCloudPD first.
2. Check status next.
3. If 2FA is required, the dashboard must visibly show `ENTER 6-DIGIT CODE` and/or `ENTER DEVICE INDEX (A)`.
4. Submit 2FA only through the NEW AUTH controls.
5. Treat `authenticated` as valid only when provider proof or stronger test-download proof succeeds.
6. Use logout to remove only configured NEW AUTH session files.
7. Never paste passwords or 2FA codes into logs, docs, screenshots, or issue text.

### Version/changelog governance notes for operators

- `VERSION` is canonical version source.
- Commit classes map to SemVer bump policy.
- Doc-only changes still require patch bump and changelog entry.
- Guard script: `node scripts/version_guard.mjs repo`.

## Conflict / reduction notes

- Reduced overlapping auth docs into one operator-facing note set; detailed internal code-path narratives were not copied.
- Retained the conservative non-fake-auth rule from source docs: no authenticated claim without provider-backed verification.
- Did not promote workflow audit observations to runtime behavior truth.

## Migration status

| Source doc | Migration status | Notes |
|---|---|---|
| `HOW_TO_RUN.md` | merged | kept as active command baseline |
| `AI_AUTHENTICATION_2FA_HANDOFF.md` | merged/reduced | kept behavior boundaries and manual verification limits |
| `AUTH_ICLOUDPD_MANUAL_VERIFICATION.md` | merged/reduced | kept setup inputs and manual verification flow |
| `AUTH_ICLOUDPD_SESSION_VERIFICATION.md` | merged/reduced | kept resume-session truth rule |
| `VERSIONING_AND_CHANGELOG_POLICY.md` | merged (operator subset) | retained operator-relevant governance checkpoints |
