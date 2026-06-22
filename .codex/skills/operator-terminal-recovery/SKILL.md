---
name: operator-terminal-recovery
description: Recover PF_login operator workflows when dashboard clicking, typing, refresh, or modal input is blocked by using verified localhost API or repository commands. Use when the UI cannot submit an action, repeatedly refreshes, loses input, or the operator needs a small PowerShell fallback with expected output and safe state-change boundaries.
---

# Operator Terminal Recovery

## Boundary

Use terminal fallback to continue an existing operator workflow, not to bypass authorization, safety gates, confirmations, or real/mock separation.

Read-only diagnostics are allowed by default. Run state-changing localhost requests only when the user explicitly asks to perform the corresponding action or is already attempting that exact dashboard action.

Never ask the user to paste passwords, 2FA codes, cookies, tokens, or private session contents into chat. Secret-bearing values must be entered locally by the operator.

## Workflow

1. Identify the blocked dashboard action and current runtime mode.
2. Verify the backend target.
   - Prefer current launcher/runtime output, frontend service definitions, or `vite.config.ts`.
   - Do not assume port `4301` or `8787`.
3. Verify the exact route contract.
   - Read the frontend service call and backend route/handler.
   - Confirm method, path, body shape, confirmation fields, and side effects.
4. Start with a read-only reachability/status request when available.
5. Provide one small PowerShell block at a time.
   - Set the base URL once.
   - Use `Invoke-RestMethod`.
   - State expected success and common blocked/error outcomes.
6. For local secret input, use an interactive prompt or instruct the user to type directly into their terminal; never embed example secret values in commands.
7. Correlate the response with sanitized logs or request IDs when the result is ambiguous.
8. Distinguish:
   - UI-only failure;
   - API validation error;
   - backend/product failure;
   - proof script defect;
   - expected `BLOCKED` result.

## Command Pattern

Use verified values only:

```powershell
$baseUrl = "http://127.0.0.1:<verified-port>"
Invoke-RestMethod -Method Get -Uri "$baseUrl/<verified-status-path>"
```

For a state-changing request, construct the body from the current route contract and keep secret input local. Do not publish placeholder credentials or fake 2FA values as runnable examples.

## Safety

- Do not call logout, delete, reset, install, download, playback, scheduler, hardware, or proof opt-in routes unless that exact effect is authorized.
- Do not retry real-provider or hardware actions in loops.
- Do not print full responses when they may contain provider output; select sanitized status fields.
- Prefer the existing dashboard/API path over direct file mutation.

## Report Format

Provide:

- blocked UI action;
- verified backend URL and route;
- side-effect classification;
- terminal command;
- expected output;
- observed output when run;
- safest next action;
- what remains a UI defect versus a backend/product issue.
