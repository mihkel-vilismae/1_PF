# Auth Logout EPERM Fix Design — 2026-05-28

Estonian timestamp: 2026-05-28 12:41 EEST

## Goal

Fix the Windows-only `EPERM` failure in the auth logout unit test without changing production auth persistence behavior or weakening logout assertions.

## Design choice

Use an in-memory `AuthPersistence` test double in `tests/authLogout.test.js` and configure it through `configureAuthServiceForTests({ persistence })` before each test.

This is the smallest safe fix because:

- the failure is caused by the test using the repo runtime auth-state file,
- production persistence already has separate coverage in `tests/authPersistence.test.js`,
- auth service unit tests already use the same in-memory pattern in `tests/authService.test.js`,
- logout behavior remains fully exercised through `runAuthPreflight()` and `logoutAuth()`.

## Rejected alternatives

| Alternative | Rejection reason |
| --- | --- |
| Add retry loops to production `authPersistence.save()` | Broader production behavior change; not necessary for a unit-test isolation failure. |
| Swallow `EPERM` in production persistence | Could hide real filesystem problems in live auth state handling. |
| Modify the failing assertion only | Would weaken the test and leave shared-file flakiness in place. |
| Delete `runtime_data/auth/auth-state.json` before tests | Still touches shared runtime state and can conflict with a running app. |
| Use a temp file persistence for this unit test | Safer than shared runtime state, but still filesystem-dependent on Windows. In-memory is cleaner for service semantics. |

## Implementation checklist

1. Import `beforeEach` from `node:test` in `tests/authLogout.test.js`.
2. Add a local `createMemoryAuthPersistence()` helper.
3. Call `configureAuthServiceForTests({ persistence: createMemoryAuthPersistence() })` in `beforeEach()`.
4. Remove per-test bare `configureAuthServiceForTests()` calls to avoid resetting back to default filesystem persistence.
5. Keep all existing logout assertions intact.
6. Run targeted auth logout and auth persistence tests.
7. Run the broader auth-related tests if practical.

## Preservation rules

- Do not change `server/auth/authPersistence.ts` production semantics.
- Do not change provider logout behavior.
- Do not change auth state projection/redaction behavior.
- Do not change Windows runtime paths.
- Do not weaken or remove existing logout assertions.
