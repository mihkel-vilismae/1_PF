# Terminal Demo Remaining View Shells Preflight OpenSpec

## Version

Introduced in `2.0.11`.

## Purpose

This document is the honest planning contract for the next terminal Demo Mode beeline after View `0` and View `6` were created in `2.0.10`.

The goal is to prepare the remaining view-shell work without claiming that those view shells are already implemented.

## Scope guard

| View | Status in this beeline |
|---|---|
| `0` | Frozen for this chat. Keep the current map page and empty `Testing` section unchanged unless explicitly reopened. |
| `6` | Frozen for this chat. Keep the blank playback shell unchanged unless explicitly reopened. |

## Current implementation state

| View key | Current state |
|---|---|
| `D` | Implemented as the existing default operator screen. Planned: add iCloudPD authorization shell. |
| `L` | Empty shell exists. Planned: logs/status/truth inspection shell. |
| `I` | Empty shell exists. Planned: NEW AUTH login shell only. |
| `1` | Empty shell exists. Planned: Download stage shell. |
| `2` | Empty shell exists. Planned: Indexing stage shell. |
| `3` | Empty shell exists. Planned: GPS Parser stage shell. |
| `4` | Empty shell exists. Planned: Geocode stage shell. |
| `5` | Empty shell exists. Planned: Enqueue stage shell. |

## Planned shell contracts

### View `D` — Default operator view

Planned addition: an `iCloudPD authorization` section.

| Planned item | Shell contract |
|---|---|
| Authorization status row | Read-only status row with a ring/status marker and no auth execution. |
| `Go to login view` button | Navigation shell to View `I`; no login/auth action. |

### View `I` — iCloudPD login view

View `I` must use only the newer NEW AUTH button set.

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
| `StatusRing` | Planned component for status markers. |
| `StatusRow` | Planned component for read-only status rows. |
| `RpiStagesSection` | Planned reusable RPI stage truth/status section. |
| `RpiWorkersSection` | Planned reusable RPI worker truth/status section. |

## Non-goals for this preflight

- Do not modify View `0` behavior.
- Do not modify View `6` behavior.
- Do not implement iCloudPD auth execution.
- Do not tail/read log files in View `L` yet.
- Do not copy generated media from View `1` yet.
- Do not run indexing, GPS parsing, geocode, or enqueue actions from stage views yet.
- Do not add workers, cron, DB mutations, playback, or file-copy side effects.

## Proof expectation

`proof:terminal-demo-view-shell-beeline-preflight` must prove that this document stays honest: planned shells are documented, View `0` and View `6` are frozen for this beeline, and no text claims that the remaining view shells are already implemented.
