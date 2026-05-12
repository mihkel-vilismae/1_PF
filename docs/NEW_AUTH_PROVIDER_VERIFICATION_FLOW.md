# NEW AUTH provider verification flow

This note documents the Slice 1 to Slice 3 login UX reconciliation around passive status, local session files, and active iCloudPD provider proof.

## Authority rule

Local session files are not enough to claim that the user is authenticated. The dashboard may show that local session files exist, but it must only show authenticated success after the backend has verified provider proof or an equivalent stronger proof.

## Passive status

The passive status action is intentionally read-only:

```text
GET /api/auth/new/status?mode=passive
```

When local session files exist but passive mode did not contact iCloudPD, the backend may return:

```text
NEW_AUTH_PROVIDER_PROOF_SKIPPED
```

The frontend maps that result to this actionable state:

```text
Session files found, provider verification not run yet.
```

The explanation shown to the operator is:

```text
Local iCloudPD session files exist, but passive status did not contact iCloudPD. Verify with iCloudPD to confirm the session is still valid.
```

This state is not a login success and must not be treated as provider-verified authentication.

## Active provider verification

The active verification action is a separate NEW AUTH control:

```text
Verify with iCloudPD
```

It calls:

```text
GET /api/auth/new/status
```

It must not call the passive endpoint:

```text
GET /api/auth/new/status?mode=passive
```

The action reuses the shared frontend API client so outbound and inbound transit records continue to be logged.

## Separate install readiness check

The install/readiness check remains separate:

```text
Verify iCloudPD install
POST /api/auth/new/verify-icloudpd
```

That action checks executable/config readiness only. It does not prove that the Apple/iCloud session is authenticated.

## Secret boundary

Provider communication shown in the modal, event history, or logs must remain sanitized. Raw passwords, 2FA codes, cookies, session contents, tokens, authorization headers, and other secrets must not be displayed.
