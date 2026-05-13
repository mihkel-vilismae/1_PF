# Marked For Removal

## Entry 1: View A `1A-AUTH` icloudpd verification card

Status: Marked for removal.

Reason: The visible dashboard block shown in the provided screenshot has been identified and should be removed in a later implementation pass.

The screenshot is the View A `1A-AUTH` card rendered by:

`dashboard/views/initView.ts` (line 269)

The exact rendering function is `renderAuthCard(state)`. It outputs the visible block:

- `1A-AUTH`
- `Verify icloudpd`
- `BACKEND`
- auth step list
- backend auth status text
- button row
- result surface
- log surface

The buttons shown in the screenshot are defined earlier in the same file:

`dashboard/views/initView.ts` (line 24)

That `AUTH_BUTTONS` list contains:

```ts
verify-icloudpd
check-login
login-using-env
logout-b1-auth
refresh-b1-auth-status
reset-b1-auth
test-b1-login-download-one
```

The runtime wiring for those button actions is here:

`dashboard/services/runtimeTruth/runtimeTruthAuthActions.ts` (line 23)

The frontend API endpoint definitions are here:

`dashboard/services/authPreflightService.ts` (line 10)

Server route registration is here:

`server/index.ts` (line 408)

Important note: although the visible card is now `1A-AUTH`, the code still uses `B1` as a compatibility key for status/log state. That is intentional and documented in comments around `dashboard/views/initView.ts` (line 21) and `runtimeTruthAuthActions.ts` (line 16).

No runtime files were changed by this marking entry.
