---
name: icloudpd-login
description: Guide icloudpd authentication, Apple iCloud 2FA prompts, auth-only runs, device-index/SMS flows, cookie-directory setup, and safe diagnosis of login/session problems. Use when Codex works with icloudpd commands, ICloud Photos login output, trusted-device verification codes, cookie reuse, Windows PowerShell icloudpd setup, repository runtime cookie directories, or authentication failures before photo download automation.
---

# icloudpd Login

## Overview

Use this skill to help a user safely authenticate `icloudpd`, understand 2FA prompts, and verify cookie/session setup before any iCloud Photos download or automation work.

Do not ask the user to reveal Apple passwords, 2FA codes, cookies, or session files. The user must type secrets directly into their own terminal.

## Workflow

1. Identify the command and working directory.
   - Check whether the run uses `--auth-only`, `--cookie-directory`, `--username`, `--directory`, or download filters.
   - Treat relative cookie paths such as `.` as relative to the shell's current working directory.
   - Before starting auth, make sure the shell is already in the intended cookie directory when using `--cookie-directory .`; otherwise the run can succeed in the wrong folder.
   - On Windows, prefer PowerShell examples unless the user is clearly using another shell.

2. Explain the observed state from terminal output.
   - `Processing user` means `icloudpd` accepted the username argument.
   - `Authenticating...` means the Apple login/session flow is running.
   - `Two-factor authentication is required (2fa)` means Apple requires a trusted-device or SMS verification code.
   - `Please enter two-factor authentication code:` means the process is paused and waiting for the user to type the code locally.
   - `Please enter two-factor authentication code or device index (a) to send SMS with a code:` means the user may enter the listed device index first, such as `a`, to request an SMS code.
   - `Please enter two-factor authentication code that you received over SMS:` means the user should enter the current six-digit SMS code locally.
   - `Great, you're all set up` followed by `Authentication completed successfully` means the auth-only phase completed and cookies should now be written in the configured cookie directory.
   - `Invalid code, should be six digits. Try again` means `icloudpd` rejected the local input format before Apple verification.
   - `Incorrect verification code. (-21669)` means Apple rejected the submitted 2FA code.
   - `Authentication required for Account. (421)` can appear before a fresh 2FA challenge; if it is followed by a 2FA prompt, treat it as part of the login flow rather than a final failure.

3. Keep authentication and download phases separate.
   - `--auth-only` should only authenticate and save/reuse session data.
   - Do not tell the user photos should download from an auth-only run.
   - After authentication succeeds, run a separate download command that reuses the same `--cookie-directory`.

4. Verify cookies without exposing secrets.
   - It is safe to inspect whether files exist in the cookie directory.
   - Do not print cookie contents. Report only file names, lengths, and timestamps.
   - Compare metadata in the exact cookie directory passed to `--cookie-directory`; a successful run in another folder does not prove this target folder is authenticated.
   - For repository-integrated flows, prefer running from or pointing directly at the repo runtime cookie directory so the backend and manual verification use the same session files.
   - If needed, list names and timestamps only:

```powershell
Get-ChildItem -Force . | Select-Object Name,Length,LastWriteTime
```

5. Diagnose common outcomes.
   - If the same 2FA prompt appears every run, confirm the same cookie directory is being reused and writable.
   - If a manual terminal run succeeds but an app or dashboard still appears logged out, check whether the app uses a different cookie directory.
   - If an app wraps `icloudpd` interactively, confirm it preserves the same live process between the device-index submission and the later six-digit SMS code submission.
   - If the app says no active 2FA challenge exists after a code submission, suspect the child process exited, timed out, or was replaced before the second response reached it.
   - If the previous run was cancelled with Ctrl+C, explain that authentication may not have completed and cookies may be missing or incomplete.
   - If a wrong 2FA code was entered, tell the user to wait for a current trusted-device/SMS code and enter exactly six digits in the terminal.
   - If auth succeeds but downloads fail, move to download-specific diagnosis instead of repeating login advice.
   - If Apple flags repeated logins, slow down and avoid automated retry loops.
   - If credentials changed, stale cookies may need to be moved aside or replaced, but do not delete session files unless the user asks.

## Command Patterns

Authenticate only:

```powershell
icloudpd --username "user@example.com" --cookie-directory . --auth-only
```

Authenticate into a specific repository runtime cookie directory:

```powershell
Set-Location "I:\path\to\repo\runtime_data\icloudpd_cookies"
icloudpd `
  --username "user@example.com" `
  --cookie-directory . `
  --auth-only
Get-ChildItem -Force . | Select-Object Name,Length,LastWriteTime
```

Reuse the same cookies for a later download:

```powershell
icloudpd --username "user@example.com" --cookie-directory . --directory "C:\path\to\photos"
```

Check the installed version:

```powershell
icloudpd --version
```

## Safety Rules

- Never ask for or display the user's password, Apple 2FA code, cookie values, or raw session file contents.
- If the user pastes a real 2FA code, do not repeat it back; remind them to redact future codes even though short-lived codes usually expire quickly.
- Treat non-obfuscated debug logs as sensitive because Apple session headers, cookies, account IDs, and web auth tokens may appear in them.
- Do not run commands that initiate login unless the user explicitly asks; interactive prompts require the user at the terminal.
- Prefer explaining what the terminal is waiting for and what should happen next.
- When suggesting cleanup, prefer renaming or moving old cookie directories over deletion unless the user explicitly requests deletion.
- State what was directly observed from logs versus what is inferred from typical `icloudpd` behavior.

## Response Pattern

When the user shares `icloudpd` login output:

1. Summarize the state in plain language.
2. Identify whether it is waiting for local user input.
3. Explain where cookies should be written.
4. Give the next command only if the current phase is complete.
5. Include a privacy reminder only when secrets, codes, or cookies are involved.
