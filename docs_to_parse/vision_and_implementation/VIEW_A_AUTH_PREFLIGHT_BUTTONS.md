# View A 1A-AUTH Auth Preflight Buttons

Status: Slice 3 auth UI finalization spec.
Updated: 2026-04-28 17:50 EEST.
Scope: View A `1A-AUTH` auth-preflight buttons, button status indicators, inspect metadata, endpoint truth, and compatibility naming.

## Current ownership

`1A-AUTH` is the current visible owner of the iCloud/`icloudpd` authentication preflight controls in View A.

Some internal `data-action` values and runtime-truth keys still contain `b1` because authentication originally lived in the old B1 flow. Those names are retained as compatibility adapters for existing tests, runtime state, logs, and action dispatch. They must not be interpreted as View B ownership.

New auth-preflight work should use `1A-AUTH` / `authPreflight` wording in UI, docs, and comments. A risky wholesale rename of the legacy action IDs should only happen in a dedicated migration slice with compatibility tests.

## Status circle meanings

| Circle state | Meaning |
|---|---|
| Neutral / empty | The button has not been used yet in the current runtime-truth state. |
| Yellow / running | The backend request has started and is waiting for a safe result. |
| Yellow / pending | The backend returned an incomplete or waiting state, usually provider or user follow-up. |
| Green / success | The backend result satisfied that button's semantic success rule. |
| Red / failed | The backend/provider result failed or did not satisfy that button's success rule. |
| Red / blocked | The backend/provider boundary explicitly blocked or does not support the requested flow. |

A simple HTTP `200` is not enough to turn an auth button green. Each button has its own semantic success rule.

## Button endpoint and truth table

| Button | Compatibility action ID | Endpoint | Mutates state? | Green/success rule |
|---|---|---|---|---|
| Verify icloudpd | `verify-icloudpd` | `POST /api/auth/verify-icloudpd` | Reads provider/config readiness. | Required config and `icloudpd` readiness are proven. This is not login success. |
| Check login | `check-login` | `POST /api/auth/resume` | Verifies/resumes provider session state. | Safe public auth state is `authenticated` from provider/session proof. |
| Login using `.env` values | `login-using-env` | `POST /api/auth/run` | Starts provider login attempt using server-side `.env` values. | Provider evidence proves authenticated state. |
| Logout | `logout-b1-auth` | `POST /api/auth/logout` | Clears local auth state and local provider-cookie artifacts where supported. | Backend reports local/provider cleanup completed. Remote Apple logout is not claimed. |
| Submit 2FA | `submit-b1-2fa` | `POST /api/auth/2fa/submit` | Submits a code through the backend route. | Both `auth.status === authenticated` and `two_factor_status === complete` are proven. Unsupported non-interactive `icloudpd` 2FA stays blocked/pending. |
| Refresh status | `refresh-b1-auth-status` | `GET /api/auth/status` | Read-only. | Safe public auth projection loads successfully. This does not mean authenticated. |
| Reset local attempt | `reset-b1-auth` | `POST /api/auth/reset` | Clears local auth attempt state only. | Backend confirms local attempt state reset. It does not clear remote sessions. |
| TEST LOGIN BY DOWNLOADING A SINGLE FILE | `test-b1-login-download-one` | `POST /api/auth/test-login-download-one` | Runs a diagnostic provider download into the configured test/runtime area. | Diagnostic download succeeds according to backend/provider evidence. |

## 2FA honesty rule

The current `icloudpd` process runner does not safely automate non-interactive 2FA completion through the backend endpoint. When the provider reports that backend-driven 2FA is unsupported, the UI must show blocked or pending status, not green success.

The `Submit 2FA` button may only become green when the backend safe public state proves both:

1. the auth state is `authenticated`; and
2. `two_factor_status` is `complete`.

A provider response that merely says 2FA is required, unknown, unsupported, or still waiting must remain yellow/pending or red/blocked.

## Inspect metadata behavior

The inspect systems should explain every auth button:

- Explain controls: what the operator button does.
- Explain values: what the displayed status/result/log values mean.
- Show real vs mock: whether the button is a real backend call, provider-dependent, diagnostic, local-only, or partial/unsupported.
- Show backend status: endpoint, read/write behavior, provider boundary, and success criteria.

## Preserved compatibility

Preserved compatibility keys:

- `state.statusByKey.B1`
- `state.logs.B1`
- legacy `data-action` values ending in `b1`
- existing runtime action dispatch for these keys

These are preserved to avoid regressions in tests and runtime behavior. They are now documented as adapters for the visible View A `1A-AUTH` card.
