# Terminal Demo Auth View Shells OpenSpec

## Version

Introduced in `2.0.12`.

## Purpose

This slice implements the remaining-view beeline Batch B shell contract for the default authorization surface and the iCloudPD login view.

It is a UI shell only. It does not execute iCloudPD, read or delete session files, generate evidence packs, call workers, mutate the DEMO DB, copy files, start playback, or touch cron.

View `0` and View `6` are unchanged in this slice.

## View `D` — iCloudPD authorization section

The default operator view renders an `ICLOUDPD AUTHORIZATION` section.

| Shell item | Behavior |
|---|---|
| Authorization status row | Read-only `planned shell only` status rendered with reusable `StatusRing` and `StatusRow`. |
| `[I] Go to login view` | Navigation shell that tells the operator to press `I`; it does not run auth. |

## View `I` — NEW AUTH login shell

View `I` renders the newer NEW AUTH button set only.

| Button shell |
|---|
| `Verify iCloudPD install` |
| `Verify with iCloudPD` |
| `Login using .env values` |
| `Check login` |
| `Log out and remove existing session` |
| `Show auth/session paths and files` |
| `Generate auth evidence pack` |
| `List auth evidence packs` |

Older compatibility auth buttons are forbidden in View `I`.

## Reusable components

| Component | Status |
|---|---|
| `SectionFrame` | Used for auth shell sections. |
| `StatusRing` | Implemented reusable display-only status marker. |
| `StatusRow` | Implemented reusable read-only label/value/status row. |

## Non-goals

- No iCloudPD process starts.
- No auth/session files are read, written, deleted, listed, or packaged.
- No login status is verified.
- No auth evidence pack is generated.
- No View `0` behavior change.
- No View `6` behavior change.
- No worker, DB, playback, file-copy, or cron behavior.
