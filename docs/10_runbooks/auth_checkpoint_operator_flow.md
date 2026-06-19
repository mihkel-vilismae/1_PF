# Auth checkpoint operator flow

Status: proof-enabler runbook for the real iCloud media-source gate.

This runbook explains how an operator moves from an authentication-needed state to a sanitized app-owned proof checkpoint that downstream real-provider proofs may consume.

## Allowed states

| State | Meaning | May unblock real iCloud proof? |
|---|---|---:|
| `AUTH_REQUIRED` | No usable app-owned session proof exists yet. | No |
| `AUTH_READY_FOR_OPERATOR` | The app is ready for a human/operator login step. | No |
| `AUTH_IN_PROGRESS` | Login or provider verification is actively being performed. | No |
| `AUTH_SESSION_DETECTED` | The app detected a session-like condition, but it is not yet proven usable. | No |
| `AUTH_SESSION_USABLE` | The app-owned checkpoint and provider check both say the session is usable. | Yes, as an input only |
| `AUTH_BLOCKED` | The auth path cannot continue without operator/config repair. | No |

## Required transition

```text
AUTH_REQUIRED
-> AUTH_READY_FOR_OPERATOR
-> AUTH_IN_PROGRESS
-> AUTH_SESSION_DETECTED
-> AUTH_SESSION_USABLE
```

Only `AUTH_SESSION_USABLE` with provider check status `passed` and app-owned session detection may pass `npm run proof:auth-checkpoint-state`.

## Operator-safe proof inputs

The proof runner may receive these environment values for a test/proof run:

| Key | Expected kind | Secret handling |
|---|---|---|
| `AUTH_CHECKPOINT_STATE` | one allowed state name | value may be written because it is not a credential |
| `AUTH_CHECKPOINT_PROVIDER_CHECK` | `passed`, `blocked`, `failed`, or `not_run` | value may be written because it is not a credential |
| `AUTH_CHECKPOINT_SESSION_DETECTED` | `1` for detected; otherwise false | boolean only |
| `AUTH_CHECKPOINT_ACCOUNT_LABEL` | optional account label | always redacted to `[REDACTED_ACCOUNT]` |

## Forbidden proof evidence

Proof artifacts must never include passwords, two-factor codes, cookies, provider tokens, authorization headers, Apple ID raw values, raw `.env` values, or raw session files.

## Downstream usage

The auth checkpoint proof is an input to the real iCloud proof path. It does not perform login, download media, prove iCloudPD success, prove real download continuation, or prove Raspberry v1 readiness by itself.
