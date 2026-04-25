# iCloudPD Auth Provider Manual Verification

## Status

Implemented after the minimal B1 auth production path.

The backend now uses a real `icloudpd` provider adapter for the iCloud auth provider boundary. Automated tests mock process execution and do **not** perform real Apple login.

## Required configuration

The existing auth/env validation keys are reused:

- `user` — Apple/iCloud account email.
- `pw` — Apple/iCloud password or app-specific password accepted by the installed `icloudpd` flow.
- `ICLOUDPD_COOKIE_DIR` — local private cookie/session directory used by `icloudpd`.
- `DOWNLOAD_DIR` — used by the session verification dry-run path when available.

Optional:

- `ICLOUDPD_BIN` — override executable name/path if `icloudpd` is not on `PATH`.
- `ICLOUDPD_DOMAIN` — optional `icloudpd --domain` value.
- `ICLOUDPD_AUTH_TIMEOUT_MS` — provider command timeout.

## Provider command strategy

The backend calls `icloudpd` through `child_process.execFile`, not shell string concatenation.

Start/login command shape:

```text
icloudpd --username <user> --password <redacted> --cookie-directory <private-cookie-dir> --auth-only
```

Resume/session-check command shape:

```text
icloudpd --username <user> --password <redacted> --cookie-directory <private-cookie-dir> --directory <download-dir> --recent 1 --dry-run
```

The public auth projection never exposes password, raw 2FA code, cookie directory, session reference, or raw command arguments.

## 2FA behavior

`icloudpd` authentication is primarily CLI/interactive. The backend can detect output that indicates a 2FA challenge is required and map it to:

- `requires_2fa = true`
- `two_factor_status = required`
- `next_action = submit_two_factor_code`

The backend includes `/api/auth/2fa/submit`, but the default `icloudpd` runner reports `icloudpd_unsupported_2fa_flow` unless the installed/selected `icloudpd` execution path can consume the code non-interactively and verify the resulting session. This is intentional and avoids fake 2FA completion.

## Manual verification flow

1. Install `icloudpd` and ensure it is available:

```text
icloudpd --version
```

2. Configure `.env` with `user`, `pw`, `ICLOUDPD_COOKIE_DIR`, and `DOWNLOAD_DIR`.

3. Start the backend:

```text
npm run api
```

4. Open View A / Init and use B1, or call:

```text
POST /api/auth/run
```

5. Interpret results honestly:

- `authenticated` means the backend saw `icloudpd` output that proves a valid session.
- `requires_2fa` means `icloudpd` reported a 2FA/verification-code challenge.
- `provider_unavailable` with `icloudpd_executable_unavailable` means `icloudpd` is missing or not runnable.
- `provider_unavailable` with `icloudpd_unsupported_2fa_flow` means backend-driven 2FA completion is not supported by the selected CLI flow.

## Cleanup/logout

`POST /api/auth/logout` clears local `icloudpd` cookie/session artifacts when possible. It does not claim remote Apple logout.

## Security notes

- Do not commit `.env`.
- Do not paste real Apple credentials into logs or issues.
- Automated tests must continue mocking provider execution.
- Public payloads must remain safe projections only.
