---
name: photo-frame-logging-change
description: Make or audit regression-safe logging changes in the 12_PF photo-frame repository. Use when Codex changes backend project logs, full_log.log, full_log_verbose.log, logindebug.log, dashboard transit/event-history logging, database-viewer logging, requestId propagation, logging env flags, redaction behavior, or tests/docs that describe logging truth.
---

# Photo Frame Logging Change

## Overview

Use this skill to change logging without turning diagnostics into a second runtime system or a secret leak. Treat logs as evidence/debug output unless current code proves they are an authority for a specific behavior.

## Evidence First

Read only the surfaces relevant to the request:

- `AGENTS.md` for comment and regression rules.
- `server/logging/projectLogger.ts` for project log file ownership.
- `server/index.ts` for backend request handling, response writing, requestId echoing, verbose lifecycle logging, and database-viewer logging.
- `server/auth/authLogSanitizer.ts` before changing auth, request, response, or verbose redaction.
- `dashboard/services/apiClient.ts` and `tests/transitGateway.test.js` for frontend request/response transit logging.
- `dashboard/services/runtimeTruth/*` when UI log/history entries are affected.
- `tests/initApi.step1.test.js`, `tests/projectLogger.test.js`, and the focused test for the touched surface.
- `example.env` and `.env` only for config keys; avoid exposing private values.
- Current docs/status files only when the request asks for documentation or implementation-truth reconciliation.

## Logging Surface Map

Keep these surfaces distinct:

- Backend project logs: `error.log`, `debug.log`, per-start `log_*.log`, and `full_log.log` through `createProjectLogger`.
- Verbose backend lifecycle logs: `full_log_verbose.log`, gated by `FULL_LOG_VERBOSE=true`, with sanitized JSONL request/response lifecycle entries.
- Auth/login diagnostics: `logindebug.log`; sanitize credentials, cookies, sessions, provider output, and 2FA values.
- Frontend transit logs: `dashboard/services/apiClient.ts`; every operator-visible backend call should use the shared `requestJson()` path unless there is a verified reason not to.
- Dashboard card logs and Event history: `pushLog()` and `pushHistory()` state, intended for operator UI evidence, not durable backend authority.
- Database-viewer logging: process-local activity capture for DB viewer actions only; do not expand it into a full SQL audit unless explicitly requested.

## Workflow

1. Identify the exact log surface and trigger.
   - Name the button/action, endpoint, worker, or backend path.
   - State whether the change is frontend transit, backend file logging, auth debug logging, DB viewer logging, or UI history.
2. Verify current behavior from code or tests.
   - Do not claim preservation until the relevant route/helper/test has been checked.
   - If logs in `logs/` are used as evidence, classify them as mutable runtime state.
3. Define the smallest contract change.
   - Specify the event name, JSON fields, requestId/correlation behavior, env gate, file path, and enabled/disabled behavior.
   - Preserve existing routes, response payloads, response headers, status codes, and existing log sinks unless the user explicitly asks to change them.
4. Apply redaction before persistence.
   - Redact by key before writing headers, query params, request bodies, response bodies, errors, or provider output.
   - Treat these keys and variants as sensitive: `authorization`, `cookie`, `set-cookie`, `password`, `pw`, `token`, `apiKey`, `api_key`, `secret`, `session`, `credential`, `2fa`, `twoFactor`, `otp`, and raw `code`.
   - Keep key names where useful and replace values with the repo redaction marker.
   - Truncate large payloads with a clear marker; do not log binary/file contents as raw data.
5. Implement locally.
   - Prefer extending `projectLogger` and the existing request path over creating a parallel logger.
   - Keep writes best-effort and non-fatal; logging failures must not change API responses.
   - Follow existing JSONL style and async write-chain behavior.
6. Add focused tests.
   - Cover enabled and disabled env behavior when the feature is gated.
   - Assert requestId/correlation fields, status/duration fields, and redaction.
   - Assert existing log sinks or frontend transit behavior still works when touched.
7. Verify and report.
   - Run the smallest relevant test command first.
   - Run `git diff --check`.
   - Run `npm run typecheck` when useful, but separate pre-existing broad type failures from logging changes.

## Prompt Checklist

When refining a logging task prompt, make sure it answers:

- Which log surface changes?
- What event(s) are emitted?
- What exact file or UI state receives the log?
- What enables or disables it?
- What requestId/correlation rule applies?
- What fields are included and redacted?
- What must remain unchanged?
- What focused tests prove the behavior?

## Output Requirements

For non-trivial logging changes, report:

- Verified current behavior.
- Modified behavior and preserved behavior.
- Files changed.
- Exact verification commands and outcomes.
- Redaction assumptions and any remaining user-side validation.
- Suggested commit message.
