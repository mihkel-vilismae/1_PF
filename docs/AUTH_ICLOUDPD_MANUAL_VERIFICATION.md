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

## Sanitized observed CLI flow

Observed local manual flow, sanitized to remove the Apple ID, SMS destination details, SMS code, cookie values, session tokens, and account-derived filenames:

```text
mkdir <scratch-auth-dir>
cd <scratch-auth-dir>
icloudpd --username <apple-id> --cookie-directory . --auth-only

Processing user: <apple-id>
Authenticating...
Two-factor authentication is required (2fa)
  a: *** **NN
Please enter two-factor authentication code or device index (a) to send SMS with a code: a
Please enter two-factor authentication code that you received over SMS: <sms-code>
Great, you're all set up. The script can now be run without user interaction until 2FA expires.
Authentication completed successfully
```

The successful run created two sensitive local artifacts in the cookie directory:

- an account-derived `LWP-Cookies-2.0` cookie jar containing Apple/iCloud cookies, web auth tokens, PCS service cookies, and trust/session cookies;
- a matching `.session` JSON file containing fields such as `client_id`, `session_id`, `scnt`, `account_country`, `session_token`, `trust_eligible`, and `trust_token`.

Both files are authentication secrets. Documentation, UI logs, tests, and issue reports must identify their shape only and must never include real values or the account-derived filenames.

The useful product requirement from this observation is:

1. Dashboard B1 should drive the same `icloudpd --auth-only` login experience through the existing backend auth boundary.
2. When `icloudpd` asks for a device/SMS destination selection, the dashboard should show only a sanitized challenge option such as `a: *** **NN`.
3. The user should be able to submit the device index first, then submit the received SMS/2FA code.
4. The backend should write the resulting `icloudpd` cookie/session artifacts only under `ICLOUDPD_COOKIE_DIR`.
5. The backend should verify the created session before returning authenticated state.
6. The public auth state must not expose the Apple ID, SMS code, cookie directory, cookie contents, `.session` contents, raw process output, or raw command arguments.

Current implementation gap: the default backend runner starts `icloudpd --auth-only` with `execFile` and does not keep an interactive process open for the two prompt steps shown above. Matching the observed dashboard behavior requires extending the existing provider runner/session boundary to own an interactive `icloudpd` process or using a proven `icloudpd` interface that can complete the same challenge flow and verify the resulting session. Do not mark dashboard 2FA as complete by writing state directly or by trusting the existence of files alone.

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
