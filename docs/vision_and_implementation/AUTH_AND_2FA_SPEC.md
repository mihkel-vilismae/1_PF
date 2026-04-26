# Authentication and 2FA Specification

Status: Slice 3 authentication/2FA specification.
Created: 2026-04-26 20:08 EEST.
Scope: auth provider boundary, safe status projection, and unresolved 2FA behavior.

## Target principle

Authentication must be backend-owned and provider-evidenced. The UI must not claim authenticated status from local button state, presence of configuration files, or optimistic frontend assumptions.

## Target auth state model

Target states:

| State | Meaning |
|---|---|
| `logged_out` | No valid provider session is known. |
| `checking` / `verifying` | Backend is checking provider/session readiness. |
| `logging_in` | Backend has started provider login or verification. |
| `pending_2fa` | Provider requires user confirmation or a 2FA code. |
| `authenticated` | Provider-backed proof says the session is valid. |
| `provider_failed` | Provider command/check failed safely. |
| `unknown` | Backend cannot prove a stronger state yet. |

Exact names can follow existing backend constants, but the public meaning should stay stable.

## Existing backend endpoints

| Endpoint | Target role | Current status |
|---|---|---|
| `GET /api/auth/status` | Return safe public auth projection. | IMPLEMENTED / PARTIAL |
| `POST /api/auth/verify-icloudpd` | Check provider/config readiness without claiming login success. | IMPLEMENTED / PARTIAL |
| `POST /api/auth/run` | Start provider login/session verification boundary. | PARTIAL |
| `POST /api/auth/2fa/submit` | Submit or record 2FA input/transition. | PARTIAL / NEEDS_VERIFICATION |
| `POST /api/auth/test-login-download-one` | Diagnostic provider-backed single-file download check. | PARTIAL / NEEDS_USER_DECISION |
| `POST /api/auth/reset` | Reset local auth state. | IMPLEMENTED / PARTIAL |
| `POST /api/auth/logout` | Clear/logout through safe backend path. | IMPLEMENTED / PARTIAL |
| `POST /api/auth/resume` | Re-check persisted state/session. | IMPLEMENTED / PARTIAL |

## Secret-safety rules

1. Never return raw passwords, cookies, tokens, authorization headers, session values, or raw 2FA codes to the frontend.
2. Never write raw secrets into normal logs.
3. Public auth status must be a redacted/safe projection.
4. Provider output should be sanitized before persistence or UI display.
5. Test fixtures should use mocks or redacted values.

## 2FA behavior target

The target user experience should be explicit:

1. User starts auth preflight from View A.
2. Backend verifies provider readiness.
3. Backend starts provider login/session check.
4. If provider requests 2FA, UI displays a clear `pending_2fa` state.
5. User submits required confirmation/code only through the backend-owned path.
6. Backend re-checks provider state.
7. UI becomes authenticated only after provider-backed proof.

The exact `icloudpd` interaction model remains NEEDS_USER_DECISION / NEEDS_VERIFICATION because provider behavior may depend on CLI version, existing session files, and whether 2FA is interactive.

## Session validity rule

The strictest target rule is:

- `authenticated=true` only after real provider verification or a verified persisted session re-check.

A weaker “trust recently verified session for fixed duration” rule is possible, but it requires a user decision and a documented timeout policy.

## Tests and verification rule

Auth tests were intentionally not run during Slice 3 because the user instructed not to run auth tests. Future auth verification should be separated into:

- mocked secret-safe automated tests;
- manual provider verification steps;
- diagnostic test-download route checks;
- no fake success assertions.

## Open decisions

1. Should persisted provider sessions be trusted for a fixed time window, or always re-verified before claiming `authenticated`?
2. Should the single-file test download remain in View A or move to diagnostics/admin tooling?
3. How should interactive `icloudpd` 2FA be represented in the dashboard if the provider requires terminal interaction?
4. Should real-provider auth validation be kept manual-only to avoid brittle automated tests?
