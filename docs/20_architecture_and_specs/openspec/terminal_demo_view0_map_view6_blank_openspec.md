# Terminal Demo View 0 Map + View 6 Merged Contract OpenSpec

## Version

Introduced in `2.0.10`.

## Source planning docs

This slice integrates the uploaded branch planning docs only within the narrowed beeline scope:

- `PF_login_View0_Map_Debug_Page_Overview_ACR.md`
- `PF_login_View6_Playback_Page_Overview_XACR.md`

This compatibility OpenSpec started as the View 0 map / View 6 blank shell scope. In the merged View 0 + View 6 integration, View 0 now includes safe test-page routing and View 6 now renders the fixture-backed playback contract while keeping real playback deferred.

## Scope

| View | Required behavior in this slice |
|---|---|
| `0` | Render `map and testing - view 0` with `View Map`, `Testing`, default route `0A`, and typed test routes. |
| `6` | Render fixture-backed playback contract controls and a Codex placeholder modal, with queue-backed playback disabled. |

## View 0 map list

The `View Map` section must show exactly the main view destinations needed for this beeline:

| Key | Page name |
|---|---|
| `D` | Default operator view |
| `L` | Logs view |
| `I` | iCloudPD login view |
| `1` | Download stage view |
| `2` | Indexing stage view |
| `3` | GPS Parser stage view |
| `4` | Geocode stage view |
| `5` | Enqueue view |
| `6` | Playback view |

Pressing a listed key from View `0` must route to that page when no modal owns input.

## Testing section

View `0` also renders a second section named `Testing`. It accepts `Enter` to open the selector, accepts default route `0A`, and accepts typed routes such as `7D`. It does not run debug actions.

## View 6 fixture contract

View `6` renders disabled future queue-backed controls and enabled fixture-backed placeholder controls. Pressing a fixture button opens the exact placeholder message `this will be done by Codex` and logs `CODEX_DEFERRED` with `launchesPlayback=false`.

## Non-goals

- No real browser playback, fullscreen playback, or overlay playback.
- No queue-backed playback execution.
- No workers, auth, DB writes, file copies, or cron behavior.
