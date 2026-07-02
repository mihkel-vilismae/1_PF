# Terminal Demo Remaining View Shells Preflight OpenSpec

## Version

Introduced in `2.0.11`; updated in `2.0.19` after View `0` route work and View `6` real fixture playback superseded the earlier blank-shell assumptions.

## Purpose

This document is the honest planning contract for the next terminal Demo Mode beeline after View `0` and View `6` advanced beyond their initial shells.

The goal is to prepare the remaining view-shell work without claiming that those remaining view shells are already implemented.

## Scope guard

| View | Status in this beeline |
|---|---|
| `0` | Stable for this beeline. Keep the map/testing page and test-route selector behavior unchanged unless explicitly reopened. |
| `6` | Stable for this beeline. Keep the real fixture-backed playback page and disabled queue-backed section unchanged unless explicitly reopened. |

## Current implementation state

| View key | Current state |
|---|---|
| `D` | Implemented as the existing default operator screen with the iCloudPD authorization shell added in `2.0.12`. |
| `L` | Logs shell exists. Planned: real logs/status/truth inspection and tail/read behavior. |
| `I` | NEW AUTH login shell implemented in `2.0.12`; button actions remain placeholders only. |
| `1` | Empty shell exists. Planned: Download stage shell. |
| `2` | Empty shell exists. Planned: Indexing stage shell. |
| `3` | Empty shell exists. Planned: GPS Parser stage shell. |
| `4` | Empty shell exists. Planned: Geocode stage shell. |
| `5` | Empty shell exists. Planned: Enqueue stage shell. |

## Planned shell contracts

### View `D` — Default operator view

Implemented shell addition: an `iCloudPD authorization` section. This remains a shell and does not execute auth.

| Planned item | Shell contract |
|---|---|
| Authorization status row | Read-only status row with a ring/status marker and no auth execution. |
| `Go to login view` button | Navigation shell to View `I`; no login/auth action. |

### View `I` — iCloudPD login view

View `I` uses only the newer NEW AUTH button set as shell buttons.

| Planned button shell |
|---|
| `Verify iCloudPD install` |
| `Verify with iCloudPD` |
| `Login using .env values` |
| `Check login` |
| `Log out and remove existing session` |
| `Show auth/session paths and files` |
| `Generate auth evidence pack` |
| `List auth evidence packs` |

Forbidden: older compatibility auth buttons must not appear in View `I`.

### View `L` — Logs view

Planned shell: list the core runtime log/status/truth files without tailing or reading them yet.

| Planned file label |
|---|
| `terminal-button-actions.jsonl` |
| `regular-worker.truth.jsonl` |
| `playback-worker.truth.jsonl` |
| `screen-worker.truth.jsonl` |
| `regular-worker.status.json` |
| `playback-worker-status.json` |
| `screen-on-off-worker-status.json` |

### Stage views `1`-`5`

| View | Planned shell |
|---|---|
| `1` | Download stage view with `Copy one file from generated test images` button shell. |
| `2` | Indexing stage view shell. |
| `3` | GPS Parser stage view shell. |
| `4` | Geocode stage view shell. |
| `5` | Enqueue stage view shell. |

## Reusable component rule

Views should compose reusable terminal UI components instead of duplicating section, status, or navigation rendering.

| Component | Status |
|---|---|
| `SectionFrame` | Implemented foundation component. Use for shared section framing. |
| `ViewMapSection` | Implemented foundation component. Use for hotkey-to-view map rendering. |
| `StatusRing` | Implemented component for display-only status markers. |
| `StatusRow` | Implemented component for read-only status rows. |
| `RpiStagesSection` | Planned reusable RPI stage truth/status section. |
| `RpiWorkersSection` | Planned reusable RPI worker truth/status section. |

## Non-goals for this preflight

- Do not modify View `0` behavior.
- Do not modify View `6` behavior beyond proof/wording hardening.
- Do not implement iCloudPD auth execution; View `D` and View `I` shells are visible only.
- Do not tail/read log files in View `L` yet.
- Do not copy generated media from View `1` yet.
- Do not run indexing, GPS parsing, geocode, or enqueue actions from stage views yet.
- Do not add workers, cron, DB mutations, queue-backed playback, auth execution, or View `1` file-copy side effects.

## Proof expectation

`proof:terminal-demo-view-shell-beeline-preflight` must prove that this document stays honest: planned shells are documented, View `0` and View `6` current behavior is stable for this beeline, and no text claims that the remaining view shells are already implemented.
