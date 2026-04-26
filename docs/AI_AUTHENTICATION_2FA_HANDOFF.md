# AI Authentication and 2FA Handoff

Generated: 2026-04-26
Repository snapshot: current checkout at `I:\_____0000\12_PF`

## Purpose

This handoff explains how Apple/iCloud authentication and 2FA are implemented in the current repository so another AI agent can continue work without relying on stale backend assumptions.

This document supersedes older handoffs that reference `backend/pipeline.py`, `backend/icloudpd_runner.py`, or `PipelineBackend`. Those files are not present in this checkout. The current implementation is Node-based under `server/auth/`.

## Executive Summary

Authentication is partially implemented and backend-backed.

The dashboard does not fake a successful login locally. View A B1 calls the backend `/api/auth/*` route family, and the backend calls `icloudpd` through a provider adapter.

Current truth:

- `POST /api/auth/run` validates auth-related env values, calls the registered `icloudpd` provider, and persists a sanitized public auth state.
- The provider invokes `icloudpd --auth-only` through `child_process.execFile`.
- The backend can detect output that indicates 2FA is required and maps it to `requires_2fa: true`, `two_factor_status: "required"`, and `next_action: "submit_two_factor_code"`.
- `POST /api/auth/2fa/submit` exists and is wired from the UI, but the default `icloudpd` process runner does not keep an interactive process open or feed the code to stdin.
- The default 2FA submit path intentionally returns an unsupported/provider-unavailable result unless the selected provider runner can truly consume the code and verify the resulting session.
- Real Apple/iCloud login remains a manual/user-owned validation step. Automated tests mock provider behavior and must not use real credentials.

## Key Files

Frontend:

- `dashboard/views/initView.js`
- `dashboard/app.js`
- `dashboard/services/authPreflightService.js`
- `dashboard/services/runtimeTruth/runtimeTruthBehavior.js`
- `dashboard/services/runtimeTruth/runtimeTruthAuthActions.js`

Backend:

- `server/index.js`
- `server/auth/authRoutes.js`
- `server/auth/authService.js`
- `server/auth/authSessionService.js`
- `server/auth/authState.js`
- `server/auth/authPersistence.js`
- `server/auth/providers/providerRegistry.js`
- `server/auth/providers/icloudpdProvider.js`
- `server/auth/providers/icloudpdProcessRunner.js`
- `server/auth/providers/icloudpdSanitizer.js`

Docs and tests:

- `docs/AUTH_ICLOUDPD_MANUAL_VERIFICATION.md`
- `docs/AUTH_ICLOUDPD_SESSION_VERIFICATION.md`
- `docs/button_verification_results/VIEW_B_B1_LOGIN_FLOW.md`
- `tests/authIcloudpdProvider.test.js`
- `tests/authService.test.js`
- `tests/authApi.step1.test.js`
- `tests/authSessionService.test.js`
- `tests/authTwoFactor.test.js`
- `tests/authFrontendControls.test.js`
- `tests/viewB.buttonWorkflow.test.js`

## Frontend Flow

View A B1 renders auth controls in `dashboard/views/initView.js`.

Important UI behavior:

- `run-b1` starts auth preflight.
- `refresh-b1-auth-status` refreshes backend auth state.
- `submit-b1-2fa` is rendered only when the backend public auth state says `requires_2fa === true` and `two_factor_status === "required"`.
- `reset-b1-auth` clears local auth attempt state.
- `logout-b1-auth` requests provider logout/local cleanup.

`dashboard/app.js` handles `submit-b1-2fa` by reading `[data-auth-2fa-code]`, dispatching the action with `{ code }`, and clearing the input.

`dashboard/services/runtimeTruth/runtimeTruthBehavior.js` maps:

```text
run-b1 -> authActions.runAuthPreflightAction()
refresh-b1-auth-status -> authActions.refreshAuthStatus()
submit-b1-2fa -> authActions.submitAuthTwoFactorAction(code)
reset-b1-auth -> authActions.resetAuthPreflightAction()
logout-b1-auth -> authActions.logoutAuthPreflightAction()
```

`dashboard/services/authPreflightService.js` defines the backend route contract:

```text
GET  /api/auth/status
POST /api/auth/run
POST /api/auth/reset
POST /api/auth/2fa/submit
POST /api/auth/logout
```

The frontend action layer sanitizes secret-like fields before placing payloads into UI-visible logs/history. It must continue to treat backend public auth state as the only auth truth.

## Backend Routes

`server/index.js` registers:

```text
GET  /api/auth/status
POST /api/auth/run
POST /api/auth/2fa/submit
POST /api/auth/reset
POST /api/auth/logout
POST /api/auth/resume
```

`server/auth/authRoutes.js` maps those routes to service calls:

- `statusHandler` returns `getPublicAuthState()`.
- `runHandler` calls `runAuthPreflight({ checks, envValues })`.
- `twoFactorSubmitHandler` calls `submitAuthTwoFactor({ code, envValues })`.
- `resetHandler` calls `resetAuthState()`.
- `logoutHandler` calls `logoutAuth({ envValues })`.
- `resumeHandler` calls `resumeAuthSession({ envValues })`.

## Auth Service State Machine

`server/auth/authService.js` owns the in-process auth state and persistence updates.

Relevant module state:

```js
let currentAuthState = createDefaultAuthState();
let currentPersistence = createAuthPersistence();
let authOperationInProgress = false;
```

`runAuthPreflight()`:

1. rejects concurrent auth operations;
2. selects only auth-relevant readiness checks;
3. requires `user`, `pw`, and `ICLOUDPD_COOKIE_DIR`;
4. loads the registered provider from `providerRegistry`;
5. calls `provider.startLogin({ attemptId, provider, checks, envValues })`;
6. maps provider outcome to public auth state;
7. persists the public-safe state.

`submitAuthTwoFactor()`:

1. rejects concurrent auth operations;
2. requires the current public auth state to be waiting for 2FA;
3. rejects empty codes;
4. calls `provider.submitTwoFactor({ attemptId, twoFactorCode, envValues, providerSessionRef })`;
5. maps provider outcome to public auth state;
6. persists the public-safe state.

Important limitation: the service persists state, but it does not persist a live interactive `icloudpd` process. In the current default runner, there is no live stdin handle waiting for a 2FA code.

## Provider Registry

`server/auth/providers/providerRegistry.js` defines provider outcome constants:

```text
provider_unavailable
missing_config
started
requires_2fa
authenticated
failed
```

The default auth provider is `icloud`.

## iCloudPD Provider

`server/auth/providers/icloudpdProvider.js` implements the `icloud` provider boundary.

Provider methods:

- `startLogin(context)`
- `submitTwoFactor(context)`
- `resumeSession(context)`
- `logout(context)`

Configuration is built from `envValues` and process env:

- `user` or `APPLE_ID`
- `pw` or `APPLE_PASSWORD`
- `ICLOUDPD_COOKIE_DIR`
- optional `DOWNLOAD_DIR` / `TEST_DOWNLOAD_DIR`
- optional `ICLOUDPD_DOMAIN`
- optional `ICLOUDPD_AUTH_TIMEOUT_MS`

`startLogin()` checks config, checks whether `icloudpd` is executable, then calls `runner.startAuth({ config })`.

`submitTwoFactor()` checks config and code, checks whether `icloudpd` is executable, then calls `runner.submitTwoFactor({ config })`.

`resumeSession()` verifies an existing local session without requiring `pw`; it uses `user` and `ICLOUDPD_COOKIE_DIR`.

`logout()` clears local `icloudpd` cookie/session artifacts when possible. It does not claim remote Apple logout.

## iCloudPD Process Runner

`server/auth/providers/icloudpdProcessRunner.js` is the default process runner.

Executable selection:

```js
process.env.ICLOUDPD_BIN || 'icloudpd'
```

Availability check:

```text
icloudpd --version
```

Auth command shape:

```text
icloudpd --username <user> --password <redacted> --cookie-directory <private-cookie-dir> --auth-only
```

If `ICLOUDPD_DOMAIN` is configured, the runner adds:

```text
--domain <domain>
```

The runner uses `execFile`, not shell string concatenation. That reduces shell injection risk, but the auth-start command still passes the password as a process argument because that is the currently implemented `icloudpd` invocation.

Session verification command shape:

```text
icloudpd --username <user> --cookie-directory <private-cookie-dir> --directory <download-dir-or-cookie-dir> --recent <count> --dry-run
```

Session verification intentionally avoids passing the password on the command line.

## 2FA Detection

`icloudpdProvider.mapIcloudpdResultToOutcome()` sanitizes combined stdout/stderr and checks for 2FA-related text.

2FA is detected with a regex covering terms such as:

```text
two-factor
2fa
two-step
verification code
mfa
trusted device
trusted phone
enter code
security code
```

When detected, the provider returns:

```js
{
  outcome: 'requires_2fa',
  code: 'icloudpd_requires_2fa',
  message: 'icloudpd reported that a two-factor authentication challenge is required.',
  two_factor_method: 'sms' | 'trusted_device' | 'icloudpd_challenge',
  next_action: 'submit_two_factor_code',
  providerRawStatus: { sanitizedOutput }
}
```

`authService.mapProviderOutcomeToAuthState()` converts that to public auth state:

```js
{
  status: 'blocked',
  has_required_files: true,
  requires_2fa: true,
  two_factor_status: 'required',
  next_action: 'submit_two_factor_code',
  authenticatedUser: null
}
```

## 2FA Submission Reality

The route and UI exist:

```text
POST /api/auth/2fa/submit
```

But the default `createIcloudpdProcessRunner().submitTwoFactor()` currently returns:

```js
{
  exitCode: null,
  stdout: '',
  stderr: '',
  sanitizedCombinedOutput: 'icloudpd 2FA submission is interactive in supported CLI flows and is not safely automatable through this backend endpoint.',
  unsupportedTwoFactor: true
}
```

`icloudpdProvider.submitTwoFactor()` maps that to:

```js
{
  outcome: 'provider_unavailable',
  code: 'icloudpd_unsupported_2fa_flow',
  message: 'The installed icloudpd flow does not expose a safe non-interactive 2FA submission boundary for this backend endpoint...',
  next_action: 'complete_icloudpd_2fa_manually'
}
```

This is intentional. The current backend does not fake 2FA completion. It only completes 2FA if a selected/injected provider runner returns a verifiable authenticated outcome.

## Auth Persistence

`server/auth/authPersistence.js` stores public-safe auth state at:

```text
runtime_data/auth/auth-state.json
```

Important persistence behavior:

- persisted authenticated state is downgraded to `unknown`;
- `next_action` becomes `verify_provider_session`;
- `POST /api/auth/resume` must verify the provider session before the backend may return authenticated state.

Persisted state is not proof of current authentication.

## Public Auth State Rules

The frontend and tests should only rely on the public projection from `server/auth/authState.js`.

Public responses must not expose:

- Apple/iCloud password;
- app-specific password;
- raw 2FA code;
- cookie directory path;
- raw session reference;
- raw `icloudpd` stdout/stderr;
- full command line containing secrets.

## Current Local Evidence

Verified in this checkout:

- `icloudpd` is installed locally as version `1.32.2`.
- The repo contains no `backend/` directory.
- Auth routes are registered in `server/index.js`.
- B1 frontend controls are wired to `/api/auth/*`.
- `icloudpd` is invoked through `server/auth/providers/icloudpdProcessRunner.js`.
- 2FA detection is implemented in `server/auth/providers/icloudpdProvider.js`.
- Default backend-driven 2FA submission is unsupported by design in the current runner.

Focused auth tests pass when the API test fixture forces `icloudpd` to be missing:

```powershell
$env:ICLOUDPD_BIN='__missing_icloudpd_for_test__'
node --test tests/authIcloudpdProvider.test.js tests/authService.test.js tests/authTwoFactor.test.js tests/authApi.step1.test.js tests/authSessionService.test.js tests/authFrontendControls.test.js tests/viewB.buttonWorkflow.test.js
```

Observed result:

```text
38 tests passed, 0 failed
```

The same focused command without overriding `ICLOUDPD_BIN` produced two failing assertions in `tests/authApi.step1.test.js` because that test expects the executable-unavailable branch, but this local machine has `icloudpd` installed and the real fake-credential attempt returns a provider failure instead. That is test-environment sensitivity, not proof of real Apple login.

## Manual Verification Boundary

No AI agent should run real Apple/iCloud authentication automatically.

A human-owned manual verification path is:

1. configure `.env` with `user`, `pw`, `ICLOUDPD_COOKIE_DIR`, and `DOWNLOAD_DIR`;
2. start the backend with `npm run api`;
3. call `POST /api/auth/run` or use View A B1 `Run auth preflight`;
4. if 2FA is required, complete the supported `icloudpd` flow manually;
5. call `POST /api/auth/resume` after a local session exists;
6. accept `authenticated` only if the provider verifies the existing session.

## Known Gaps

1. Default backend-driven 2FA submission is not implemented for real interactive `icloudpd` flows.
2. Auth start still passes the password as a process argument.
3. `tests/authApi.step1.test.js` is sensitive to whether `icloudpd` is installed on PATH unless `ICLOUDPD_BIN` is overridden.
4. Real Apple/iCloud behavior depends on the installed `icloudpd` version and account-specific Apple security prompts.

## Safe Future Implementation Direction

Do not create a parallel auth system and do not fake UI success.

If backend-driven 2FA is required, implement it behind the existing provider boundary:

1. keep `/api/auth/*` routes unchanged unless there is a user-approved contract change;
2. preserve `authService` as the public state machine;
3. add or inject an `icloudpd` runner that can truly manage the selected 2FA flow;
4. if using an interactive process, own it in a backend session manager with explicit lifecycle, timeout, cleanup, and challenge IDs;
5. submit 2FA only to a live process that is known to be waiting for input;
6. verify the resulting session before returning `authenticated`;
7. keep public state sanitized;
8. add tests for request lifecycle behavior, including auth start, 2FA required, 2FA submit, unsupported 2FA, reset, logout, and resume.

## Minimal Mental Model

```text
View A B1 button
  -> dashboard runtime truth action
  -> dashboard authPreflightService
  -> /api/auth/run
  -> authRoutes.runHandler
  -> authService.runAuthPreflight
  -> providerRegistry.getProvider('icloud')
  -> icloudpdProvider.startLogin
  -> icloudpdProcessRunner.startAuth
  -> icloudpd --username ... --password ... --cookie-directory ... --auth-only
  -> sanitize and map output
  -> public auth state
  -> persisted auth-state.json
  -> dashboard renders backend state
```

For 2FA:

```text
icloudpd output mentions 2FA
  -> provider outcome requires_2fa
  -> public state requires_2fa=true, two_factor_status=required
  -> View A renders 2FA input
  -> POST /api/auth/2fa/submit
  -> current default runner reports icloudpd_unsupported_2fa_flow
  -> backend does not claim authenticated
```

## Regression-Safe Rules For Other AI Agents

1. Do not reintroduce stale `backend/pipeline.py` assumptions in this checkout.
2. Do not claim 2FA is complete unless the provider verifies the session.
3. Do not infer auth success from UI state or persisted JSON alone.
4. Do not expose passwords, 2FA codes, cookie paths, raw session refs, or raw provider logs.
5. Do not remove the conservative unsupported-2FA response without replacing it with a real verified flow.
6. Do not bypass `server/auth/authService.js` for dashboard auth state.
7. Do not run real Apple/iCloud login in automated tests.
8. Preserve `/api/auth/*` contracts unless explicitly approved.
9. Keep `POST /api/auth/resume` as the path for verifying persisted sessions after restart.
10. Update this handoff when auth behavior changes.
