# Auth Session Snapshot Contract OpenSpec

Status: planned-safe proof contract for operator-assisted real-provider login.

The system may record sanitized app-owned auth/session snapshots before and after manual login.
Snapshots must include only metadata such as auth state, session directory presence, file count, newest mtime, and usability classification.
They must not include Apple IDs, passwords, 2FA codes, cookies, tokens, or session file contents.

Required states: AUTH_REQUIRED, AUTH_READY_FOR_OPERATOR, AUTH_IN_PROGRESS, AUTH_SESSION_DETECTED, AUTH_SESSION_USABLE, AUTH_BLOCKED.
