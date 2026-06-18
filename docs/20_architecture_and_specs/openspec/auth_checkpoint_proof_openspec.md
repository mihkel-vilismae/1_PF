# OpenSpec — Authentication checkpoint proof

Status: documentation-only proof contract  
Introduced: v0.8.127

## Purpose

Some real-provider stages cannot be proven safely by source code or a browser observation alone. Authentication is the first such stage for iCloud/iCloudPD work. This OpenSpec defines an app-owned checkpoint flow that lets an operator perform manual login, then lets the app/proof runner record a sanitized, machine-readable state that later real-provider proofs can consume.

The checkpoint is a bridge between manual authentication and automated proof stages. It must not become a way for an assistant, console note, browser-open event, or handwritten marker to claim authentication success.

## State model

| State | Meaning | Allowed next state |
|---|---|---|
| `AUTH_REQUIRED` | The app knows no usable provider session has been proven. | `AUTH_READY_FOR_OPERATOR`, `AUTH_BLOCKED` |
| `AUTH_READY_FOR_OPERATOR` | The app has prepared the login/checkpoint boundary and the operator may log in. | `AUTH_IN_PROGRESS`, `AUTH_BLOCKED` |
| `AUTH_IN_PROGRESS` | A manual/operator login attempt is underway or expected. | `AUTH_SESSION_DETECTED`, `AUTH_BLOCKED` |
| `AUTH_SESSION_DETECTED` | Local session material or provider-visible login state was detected. | `AUTH_SESSION_USABLE`, `AUTH_BLOCKED` |
| `AUTH_SESSION_USABLE` | A safe provider check proved the session can be used. | downstream real-provider proofs |
| `AUTH_BLOCKED` | Login/session proof cannot proceed safely or successfully. | retry from `AUTH_READY_FOR_OPERATOR` after operator action |

## Proof authority

The proof authority is the app/proof runner artifact, not the assistant and not the browser console.

Allowed evidence:

- a sanitized app-owned auth checkpoint artifact;
- backend/provider verification status;
- proof runner output with explicit `proof_status`;
- sanitized logs that identify state transitions without secrets.

Insufficient evidence by itself:

- a browser window opened to a login page;
- a console message typed by the operator;
- the assistant saying it saw a login screen;
- local session files without active provider verification;
- shell exit code without reading internal `proof_status`.

## Secret boundary

Authentication proof artifacts must never include:

- passwords;
- two-factor codes;
- cookies;
- provider tokens;
- authorization headers;
- Apple ID raw values;
- `.env` values;
- raw provider output that could contain sensitive account/session data.

Artifacts may include sanitized booleans, state names, timestamps, provider/tool versions, command names, redacted account labels, and high-level provider result categories.

## Downstream proof contract

Real-provider/download proofs should consume `AUTH_SESSION_USABLE` or an equivalent sanitized auth artifact before attempting real work. They must not re-infer authentication from arbitrary browser state.

Example downstream gates:

- real iCloud/iCloudPD media source proof;
- real download continuation proof;
- regular worker product pipeline proof;
- later provider-specific proof runners.

## Non-claims

This document does not implement a runtime proof command. It does not prove login, iCloud access, media download, GPS/geocode, or regular worker product behavior. It defines the state and evidence contract future implementation slices must satisfy.


## Implementation note — v0.8.161

`proof:auth-checkpoint-state` records a sanitized app-owned checkpoint envelope. The command may return `BLOCKED` when no usable provider session is present, and this is an honest outcome. A `PASSED` checkpoint requires `AUTH_SESSION_USABLE`, a passed provider check, and app-owned session detection. The artifact still does not prove media download or Raspberry v1 readiness.
