# Terminal Demo View 0 Map + View 6 Blank Shell OpenSpec

## Version

Introduced in `2.0.10`.

## Source planning docs

This slice integrates the uploaded branch planning docs only within the narrowed beeline scope:

- `PF_login_View0_Map_Debug_Page_Overview_ACR.md`
- `PF_login_View6_Playback_Page_Overview_XACR.md`

Deferred items from those docs, such as View 0 test-page modals and View 6 playback controls, are intentionally not implemented here.

## Scope

| View | Required behavior in this slice |
|---|---|
| `0` | Render `Table of Contents and Debug` with a `View Map` section and an empty `Testing` section. |
| `6` | Remain a blank/empty playback page shell only. |

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

View `0` also renders a second section named `Testing`. It is empty except for safe placeholder copy. It does not run debug actions.

## View 6 blank page

View `6` must remain an empty shell. It must not render playback buttons in this slice.

## Non-goals

- No View `0` Enter/test-page modal yet.
- No test page code routing such as `0A` or `7D` yet.
- No View `6` playback buttons yet.
- No fixture copy, queue access, browser playback, fullscreen playback, or overlay playback.
- No workers, auth, DB writes, file copies, or cron behavior.
