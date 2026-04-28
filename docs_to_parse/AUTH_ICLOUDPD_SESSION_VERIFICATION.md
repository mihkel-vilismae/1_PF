# iCloudPD Auth Session Verification

## Status

As of **2026-04-24 22:50 EEST**, the backend owns the iCloud auth/session truth for the existing `icloudpd` provider boundary.

This document describes the implemented resume/session verification behavior after Slice 1 of the auth work. It does not claim that automated tests prove a real Apple/iCloud account login. Real-world credential verification remains a manual, user-owned step.

## Implemented backend boundary

The session verification path is implemented in the backend auth layer:

- `server/auth/authSessionService.js` owns resumed-session verification decisions.
- `server/auth/authService.js` loads persisted auth state, delegates resume verification to the session service, persists the updated state, and returns the public projection.
- `server/auth/authRoutes.js` wires `POST /api/auth/resume` through `resumeAuthSession()`.
- `server/auth/providers/icloudpdProvider.js` exposes the `icloudpd` provider boundary.
- `server/auth/providers/icloudpdProcessRunner.js` provides the `verifySession()` command path.

The dashboard must treat the backend response as the source of truth. It must not infer authentication from local UI state or from the existence of persisted auth data.

## What `/api/auth/resume` does

`POST /api/auth/resume` is the backend route for re-checking a previously persisted auth/session state after restart or reload.

The route now:

1. loads persisted auth state;
2. decides whether the persisted state requires provider verification;
3. calls the registered provider resume/session verification boundary when required;
4. maps the provider result into the normal backend auth state shape;
5. persists the updated state;
6. returns the sanitized public auth projection.

The important contract is:

> Persisted auth state is not proof of current authentication.

A saved state can indicate that verification is needed, but it cannot by itself make the backend return `authenticated=true`.

## When `authenticated=true` may be returned

The backend may return `authenticated=true` only when the provider confirms that the current `icloudpd` session is valid.

For the `icloudpd` provider, session verification is routed through the provider boundary and the process runner’s verification command path. Slice 1 adjusted the verification path so it does not pass the Apple/iCloud password on the command line for session verification.

If provider confirmation is not available, the backend must not promote the state to authenticated.

## State outcomes

### Confirmed authenticated session

Returned only after provider confirmation.

Expected public shape includes:

- `status: "authenticated"`
- `requires_2fa: false`
- `two_factor_status: "complete"`
- `next_action: "auth_ready"`

### 2FA required

If `icloudpd` output indicates a 2FA or verification-code challenge, the backend maps it honestly instead of faking success.

Expected public shape includes:

- `requires_2fa: true`
- `two_factor_status: "required"`
- `authenticatedUser: null`
- a next action such as `submit_two_factor_code`

The default backend 2FA submit route remains conservative: it only completes if the selected `icloudpd` execution flow can actually consume and verify a code non-interactively. Otherwise it reports the unsupported state instead of claiming success.

### Provider unavailable

If `icloudpd` is not installed, not on `PATH`, or cannot be started, the backend reports provider unavailability and keeps authentication false.

Typical result:

- blocked or unknown auth state, depending on the exact mapped outcome;
- error code such as `icloudpd_executable_unavailable`;
- `authenticatedUser: null`.

### Missing config

If required provider configuration is missing, the backend reports a configuration/preflight failure and keeps authentication false.

Typical result:

- `status: "preflight_failed"`
- `next_action: "fix_auth_configuration"`
- `authenticatedUser: null`.

### Verification failure or thrown provider error

If provider verification throws or fails before a usable auth state is produced, the backend returns a safe non-authenticated state.

Typical result:

- `status: "unknown"` or provider-failure status according to the existing mapper;
- `next_action` instructing inspection of the provider verification failure;
- no raw secret-bearing error details in the public response.

### No persisted state

If no persisted auth state exists, the backend does not call provider verification and does not claim authentication.

Typical result:

- `status: "unknown"`
- `next_action: "run_auth_preflight"`.

## Secrets and redaction rules

The public auth response, UI-facing logs, documentation examples, and test snapshots must not expose:

- Apple password;
- app-specific password;
- 2FA code;
- cookie directory path;
- session path;
- raw `icloudpd` stdout;
- raw `icloudpd` stderr;
- a full command line containing secrets.

Provider command execution uses `execFile` rather than shell string concatenation. Auth-start still depends on the selected `icloudpd` flow and may require credentials according to that tool’s behavior, but resumed-session verification should avoid passing the password when possible.

## Automated test boundary

Automated tests for auth/session verification are mocked only.

They verify backend behavior such as:

- no persisted state does not call provider verification;
- persisted state requiring verification cannot authenticate by itself;
- provider-confirmed session can authenticate;
- provider 2FA requirement does not fake success;
- provider unavailable and missing-config paths do not crash;
- provider thrown errors do not leak secrets;
- `/api/auth/resume` uses the backend verification path.

They do **not**:

- run real `icloudpd` authentication;
- call Apple/iCloud;
- use real credentials;
- prove that the user’s real Apple account can log in.

## Manual verification boundary

Real-world Apple/iCloud validation remains manual and user-owned.

A safe manual verification flow is:

1. install `icloudpd` locally;
2. configure the repo `.env` locally with the user-owned values;
3. start the backend locally;
4. run the View A auth preflight or call `POST /api/auth/run` locally;
5. complete any `icloudpd`/Apple 2FA flow manually if required;
6. call `POST /api/auth/resume` locally after a session exists;
7. confirm that the backend returns `authenticated=true` only if the provider verifies the session.

No automated test or AI-driven implementation step should run the real credential path.

## Known limitations

- `icloudpd` behavior differs by version and installed authentication flow.
- Backend-driven 2FA submission is not guaranteed unless the selected `icloudpd` flow supports non-interactive code submission and session verification.
- Manual verification is still required to prove a real user account and real local session.
- Broader full-suite test harness cleanup is separate from this auth documentation slice unless it directly blocks the mocked auth/session tests.
