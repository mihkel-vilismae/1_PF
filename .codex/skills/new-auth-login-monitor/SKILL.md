---
name: new-auth-login-monitor
description: Safely monitor the 12_PF/1234_PF NEW AUTH iCloudPD login flow while an operator presses dashboard buttons. Use when Codex needs to follow `/api/auth/new/*` requests, sanitized auth logs, Transit terminal evidence, and iCloudPD cookie/session file metadata without changing files or exposing passwords, Apple 2FA codes, cookies, tokens, authorization headers, or raw session contents.
---

# New Auth Login Monitor

## Overview

Observe the live NEW AUTH flow and classify what happened from sanitized runtime evidence. This skill is read-only unless the user explicitly asks for implementation work.

## Privacy Boundary

- Do not ask for, print, or inspect Apple passwords, 2FA codes, raw cookie/session contents, tokens, auth headers, or provider secrets.
- It is safe to inspect cookie/session file names, lengths, timestamps, and whether files exist.
- Treat `logs/logindebug.log`, `logs/full_log.log`, `logs/full_log_verbose.log`, and Transit terminal output as potentially sensitive even when sanitized; summarize only the relevant non-secret facts.
- If the user pastes a code or secret, do not repeat it back.

## Baseline

1. Treat the current runtime state as the observation baseline.
2. Record log file sizes and timestamps before watching:
   - `logs/logindebug.log`
   - `logs/full_log.log`
   - `logs/full_log_verbose.log`
3. Record safe cookie metadata before watching:
   - directory: `runtime_data/icloudpd_cookies` unless `.env` shows a different `ICLOUDPD_COOKIE_DIR`
   - fields: `Name`, `Length`, `LastWriteTime`
4. If the user deleted logs or reloaded the page, reset the baseline to the current file offsets.

## Watching

Use short polling windows while the operator presses buttons. Read only new log text after the baseline offset. If a polling command is interrupted, re-check current file sizes and continue from the latest safe baseline.

Prefer evidence in this order:

1. `logindebug.log` for `/api/auth/*` request/response payload summaries.
2. `full_log.log` for route, status code, and duration.
3. `full_log_verbose.log` for lifecycle details when needed.
4. Cookie/session metadata for file creation, removal, or timestamp/size changes.
5. Transit terminal for user-visible event-history or command-output context.

## Classification

Classify each observed button/action with the available evidence:

- Passive/local only: `GET /api/auth/new/status?mode=passive`, `providerProof.attempted=false`, or `NEW_AUTH_PROVIDER_PROOF_SKIPPED`.
- Install readiness only: `POST /api/auth/new/verify-icloudpd`; this does not prove authenticated login.
- Login attempt: `POST /api/auth/new/login`; check whether it started iCloudPD, reached pending 2FA, failed, or completed with verified session proof.
- Active provider proof: `GET /api/auth/new/status` without `mode=passive`; this should contact iCloudPD when configured and available.
- 2FA follow-up: `POST /api/auth/new/submit-2fa`; do not expose submitted values.
- Local logout: `POST /api/auth/new/logout`; report removed/skipped file counts and whether remote logout was claimed.
- Session file inspection: `GET /api/auth/new/session-files`; report metadata only.

## Learned Patterns

- After a successful interactive iCloudPD 2FA flow, the immediate `POST /api/auth/new/submit-2fa` response can still report `state: pending_2fa` and `twoFactorPromptKind: unknown` if the mapper preserves the prior prompt classification while the sanitized provider output already contains the success text.
- Treat sanitized provider output containing iCloudPD's successful auth messages plus fresh cookie/session file timestamps as strong completion evidence, but still label it as log/file evidence until active provider proof runs.
- Confirm completion with `GET /api/auth/new/status` without `mode=passive`; a verified run should report `state: authenticated`, `providerProof.attempted=true`, `providerProof.verified=true`, and `reasonCode: NEW_AUTH_PROVIDER_VERIFIED`.
- `GET /api/auth/new/status?mode=passive` after cookies exist may report `state: unverified` and `NEW_AUTH_PROVIDER_PROOF_SKIPPED`; this means provider proof was intentionally skipped, not that login failed.
- When `session-files` or passive status reports fewer session-like files than the directory listing, preserve both facts: the endpoint's session count follows backend classification, while directory metadata may include both cookie and `.session` files.
- For strongest conclusions, correlate the timeline across `login`, `submit-2fa`, the provider auth-completed marker, cookie/session timestamp updates, and any later active provider-proof status.
- If request counts differ between `full_log.log`, `logindebug.log`, and `full_log_verbose.log`, treat that as log granularity or retention variance until a request-id-correlated failure proves otherwise.
- If a `submit-2fa` response stays `pending_2fa` while `providerOutputPreview` contains explicit iCloudPD success text, inspect `server/auth/newAuthService.ts` before changing the UI; the mapper should classify authenticated markers before generic 2FA wording such as "two-factor authentication expires."
- Preserve a regression test in `tests/newAuthInteractiveLifecycle.test.js` for successful iCloudPD output that still mentions 2FA expiry, because that phrase can otherwise be mistaken for a fresh prompt.

## Confidence Rubric

- High: auth-completed provider marker, fresh cookie/session metadata, and active provider proof all agree.
- Medium: auth-completed provider marker and fresh cookie/session metadata agree, but active provider proof has not run or is ambiguous.
- Low: evidence stops at pending 2FA, provider-proof skipped, or cookie/session metadata is missing or unchanged.

## Report Format

When new evidence appears, report briefly:

1. Endpoint/action fired.
2. Method, path, status code, and request id when available.
3. Backend auth state/result: logged out, pending 2FA, provider proof skipped, verified, failed, blocked, or unknown.
4. Cookie/session metadata change: created, removed, unchanged, timestamp changed, size changed, or directory missing.
5. Whether iCloudPD appears to have been contacted or the action was passive/local only.
6. Any mismatch between UI state, logs, Transit terminal, and cookie evidence.
7. Safest next button/action.

## Safety Notes

- Do not run cleanup or logout unless the user explicitly requests it.
- Do not initiate real login from the terminal unless the user explicitly asks; let the operator type secrets into their own UI/terminal.
- Do not present local session files alone as authenticated login. They are evidence only until active provider proof or stronger verification succeeds.
