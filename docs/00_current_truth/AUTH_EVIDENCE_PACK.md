# NEW AUTH Evidence Pack

Estonian timestamp: 2026-05-24 22:58 EEST

This document is the starting point for login/auth artifact debugging. It explains how future agents should use safe artifacts from NEW AUTH / iCloudPD login checks without confusing local session files with provider-verified login.

## Canonical location

This is the canonical current-truth copy of the NEW AUTH Evidence Pack guide. The legacy path `docs/AUTH_EVIDENCE_PACK.md` is retained only as a compatibility pointer for older links.

## Purpose

Use auth artifacts as evidence, not as secrets or as automatic proof that login works.

The useful evidence types are:

- passive NEW AUTH status responses
- active provider-verification responses
- safe session-file metadata
- sanitized provider output summaries
- dashboard event history
- backend request/response traces
- screenshots of the NEW AUTH panel
- redaction reports

## Safety rules

Never share or commit raw secrets:

- Apple ID or account email values
- Apple password
- 2FA or trusted-device codes
- cookies
- provider session file contents
- authorization headers
- bearer tokens
- API keys
- raw `.env` values
- raw iCloudPD session/cache files

Session files may only be represented as safe metadata:

- exists
- file count
- size
- modified timestamp
- sanitized display path
- contents captured: false

## Interpretation rules

| Evidence | Safe conclusion | Not safe to conclude |
|---|---|---|
| Passive status | The backend reported local/passive auth state. | Provider login is verified. |
| Session file metadata | Local session-like files exist or do not exist. | The session is valid with the provider. |
| Active provider proof | iCloudPD/provider accepted or rejected the session for that check. | Browser UI displayed the right state. |
| Dashboard event history | The frontend observed or triggered actions. | Backend/provider truth without API evidence. |
| Runtime test-download gate | Runtime accepted/rejected auth for protected action. | A real media download completed unless separately verified. |

## Recommended artifact folder shape

```text
debug_artifacts/auth/auth_attempt_<estonian_timestamp>/
  MANIFEST.json
  README.md
  TIMELINE.ndjson
  STATUS_MATRIX.md
  EVIDENCE_SUMMARY.md
  ISSUE_HYPOTHESES.md
  endpoint_snapshots/
  provider_communication/
  frontend/
  backend/
  redaction/
```

## How future agents should use this

1. Start with `MANIFEST.json`, `EVIDENCE_SUMMARY.md`, and `STATUS_MATRIX.md`.
2. Check `redaction/redaction_checks.json` before sharing artifacts.
3. Separate passive status, local session files, active provider proof, 2FA state, and runtime download gating.
4. Do not claim login works unless active provider proof or stronger runtime evidence supports it.
5. If the UI appears wrong, include screenshots and dashboard event history with the backend evidence.

## Current documentation warning

This document is documentation guidance. Before calling an evidence-pack endpoint, verify that the current checked-out repository implements that endpoint and that the route appears in code/tests.
