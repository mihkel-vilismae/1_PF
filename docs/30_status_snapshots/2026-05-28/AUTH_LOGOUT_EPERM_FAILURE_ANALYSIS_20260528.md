# Auth Logout EPERM Failure Analysis — 2026-05-28

Estonian timestamp: 2026-05-28 12:39 EEST

## Scope

This note analyzes the Windows launcher failure where the full test suite reports one failing test:

- `tests/authLogout.test.js`
- `logout clears auth state and reports provider cleanup outcome honestly`
- `EPERM: operation not permitted, open 'S:\PF_login\runtime_data\auth\auth-state.json'`

The analysis is repo-backed and limited to the auth logout test and auth persistence boundary.

## Observed failure

The failing test attempts a provider-backed logout flow after `runAuthPreflight()` persists auth state. In the current test file, each test calls `configureAuthServiceForTests()` with no explicit persistence double.

Because no test persistence is supplied, `configureAuthServiceForTests()` creates the default auth persistence layer. The default auth state path resolves to:

```text
runtime_data/auth/auth-state.json
```

When the Windows full test suite runs from `S:\PF_login`, that resolves to:

```text
S:\PF_login\runtime_data\auth\auth-state.json
```

The reported error is therefore coming from the shared repo runtime folder, not from an isolated test-only temp location.

## Source map

| Area | Evidence | Notes |
| --- | --- | --- |
| Logout test | `tests/authLogout.test.js` | Calls `configureAuthServiceForTests()` without an explicit persistence test double. |
| Auth service test setup | `server/auth/authService.ts` | `configureAuthServiceForTests()` falls back to `createAuthPersistence()` when `persistence` is omitted. |
| Default auth persistence | `server/auth/authPersistence.ts` | Default file path is `runtime_data/auth/auth-state.json` under `process.cwd()`. |
| Existing safe pattern | `tests/authService.test.js` | Uses an in-memory `createMemoryAuthPersistence()` in `beforeEach()`. |

## Root cause

The auth logout unit test is not isolated from the repo-managed runtime auth state file. On Windows, the shared `runtime_data/auth/auth-state.json` file can be unavailable because of a concurrent app process, filesystem lock, antivirus/indexing, or stale permissions. That produces `EPERM` during the test even though the logout semantics themselves are otherwise covered and most surrounding auth tests pass.

## Constraint

The fix should not weaken logout behavior. It should keep the test proving that:

1. the provider logout boundary is called when available,
2. provider logout outcome is reported honestly,
3. local auth state is cleared,
4. no secret/session/token-like content leaks in the unavailable-provider result.

## Smallest safe direction

Use an isolated in-memory auth persistence test double in `tests/authLogout.test.js`, matching the pattern already used by `tests/authService.test.js`. This keeps the test focused on auth service behavior and prevents Windows filesystem state from making a unit test flaky.
