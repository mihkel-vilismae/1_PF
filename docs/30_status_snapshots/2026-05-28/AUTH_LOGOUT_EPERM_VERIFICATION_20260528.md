# Auth Logout EPERM Verification — 2026-05-28

Estonian timestamp: 2026-05-28 12:45 EEST

## Targeted verification

Command:

```bash
npm test -- tests/authLogout.test.js tests/authService.test.js tests/authPersistence.test.js
```

Result:

```text
tests 13
pass 13
fail 0
```

This verifies that:

- the auth logout test no longer depends on the shared repo runtime auth-state file,
- logout still calls the provider logout boundary when one is available,
- logout still reports the provider cleanup outcome honestly,
- local auth state is still cleared,
- persistence behavior remains covered by the dedicated auth persistence tests.

## Build verification

Command:

```bash
npm run build
```

Result:

```text
vite build completed successfully
```

## Full suite note

Command attempted:

```bash
npm test
```

Result in this Linux tool environment:

```text
Timed out before completing.
```

The pasted Windows launcher log already showed the full suite reaching `tests 320`, `pass 319`, `fail 1`, with only the auth logout EPERM failure remaining. The targeted fix addresses that exact failing test while preserving the dedicated auth persistence tests.

## Remaining risk

The production filesystem persistence path is intentionally unchanged. If a live Windows runtime still locks `runtime_data/auth/auth-state.json`, the application should surface a real runtime persistence problem rather than having the unit test mask it. This slice only prevents unit tests from touching that shared runtime path.
