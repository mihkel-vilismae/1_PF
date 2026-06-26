# V2 Goal Summary

Estonian timestamp: 2026-06-26 09:34 EEST

## Purpose

This document is a faithful summary of the V2 planning conversation and the operator intent behind the next implementation work. It is not a transcript. It is the source-of-truth summary for page placement, component reuse rules, and the path toward `09 REAL PLAYBACK`.

## Central intent

The work is not merely to rearrange UI. The work is to build a V2 operator path that starts with isolated, understandable pages and ends with a working `09 REAL PLAYBACK` page.

Pages `01` through `08` are proving/staging pages. They let individual setup, authentication, scheduler, worker, troubleshooting, recovery, PIR, and playback pieces be displayed, reused, verified, and fixed in isolation.

`09 REAL PLAYBACK` is the final endpoint where proven pieces are composed into the actual customer-facing operation path.

## Main victory goals

The main victory goals are documented in [`../v2_goals/goals.md`](../v2_goals/goals.md). In plain terms:

1. The user logs in successfully.
2. Raspberry-oriented cron/scheduler jobs are installed.
3. Media starts downloading according to configured rules.
4. Media moves through Download, Index, GPS parser, Geocode, and Queue stages.
5. GPS coordinates are detected when available.
6. Coordinates are resolved to address strings.
7. Media enters the playback queue.
8. Fullscreen playback shows images/videos.
9. Address overlay is visible.
10. If power is lost and later restored, the system restarts, recovers saved state, and continues without manual repair.
11. Screen on/off behavior works from inactivity and activity sources.

## Sidebar/page requests

The V2 sidebar should contain:

| Page | Summary |
| --- | --- |
| `01 SETUP` | Verify `.env` and database controls. |
| `02 AUTHENTICATION` | NEW AUTH controls. |
| `03 STARTUP` | Raspberry scheduler/startup plus shared stage/worker rows. |
| `04 WORKERS` | B3.1 through B3.5 pipeline worker cards plus shared rows. |
| `05 TROUBLESHOOTING` | Pipeline stale-lock maintenance plus shared rows. |
| `06 RECOVERY` | Save/load/emulate power-off placeholder controls, later real recovery. |
| `07 PIR` | B5 activity/screen on-off visible subset only. |
| `08 PLAYBACK` | B4 rendering subsection plus drag/drop playback queue. |
| `09 REAL PLAYBACK` | Final real page, explanation first, then proven composition. |

## Component placement summary

| Page | Requested elements |
| --- | --- |
| `01 SETUP` | `1A Verify .env`, `2A Database controls`, Event Log. |
| `02 AUTHENTICATION` | `1A-STASH-OFF NEW AUTH`, Event Log. |
| `03 STARTUP` | Raspberry-focused `3A Scheduler controls`, `RPI-STAGES`, `RPI-WORKERS`, Event Log. |
| `04 WORKERS` | `B3.1 Download`, `B3.2 Index`, `B3.3 Parse GPS`, `B3.4 Geocode`, `B3.5 Enqueue playback`, `RPI-STAGES`, `RPI-WORKERS`, Event Log. |
| `05 TROUBLESHOOTING` | `Detect issues in pipeline`, `Clear stale locks`, `RPI-STAGES`, `RPI-WORKERS`, Event Log. |
| `06 RECOVERY` | `SAVE STATE`, `LOAD STATE`, `EMULATE POWER OFF`, Event Log. |
| `07 PIR` | only visible B5 activity-source/test/result/status controls, `RPI-WORKERS`, Event Log. |
| `08 PLAYBACK` | only visible B4 rendering controls, drag/drop queue table, `RPI-WORKERS`, Event Log. |
| `09 REAL PLAYBACK` | explanation initially, later selected proven controls/status from Startup, Workers, PIR, Playback, Recovery. |

## Reuse rule

The operator explicitly does not want copied/pasted HTML blocks. Implementation must reuse existing components or extract reusable components. This applies especially to repeated rows/cards such as Event Log, backend result panels, worker cards, stage rows, and status/explanation UI.

The correct implementation shape is:

```text
existing behavior/component
→ extract reusable renderer if needed
→ compose into V2 page
→ test the new placement
→ update implementation status honestly
```

The wrong implementation shape is:

```text
copy screenshot/source HTML
→ paste into every page
→ create many duplicate lines
→ claim completion without proof
```

## Status/explanation UI request

V2 should include a top-right status/explanation area near the version number.

Required controls:

- `Explain controls`;
- `Explain values`;
- `Implementation status`.

Do not include `Show marked for removal`.

Each major page section/card should also have a small top-right question/status icon. Clicking it should show the current explanation and implementation state for that section.

The implementation status UI must reflect reality and stay in sync with [`V2_ImplementationStatus.md`](V2_ImplementationStatus.md).

## Recovery intent

The recovery page begins with placeholder buttons, but its real purpose is serious: the system must recover from rough shutdown/power loss.

The future state should be lightweight and autosaved frequently. It should be enough to restore the current operational position, current media item/queue checkpoint, recovery flag, and required worker/runtime state. For playback, restoring the same file and starting it from the beginning is acceptable.

## Known issue attitude

Unsolved problems must be tracked, not hidden.

Examples:

- PIR hardware signal may require emulation;
- interrupted downloads may leave corrupt/partial files;
- non-media files must be rejected before playback;
- Windows cron emulator should not be the real path;
- stale-lock buttons need verification;
- browser auth is preferred but command-line auth fallback is acceptable.

## Documentation order

Before large UI implementation, the documentation package should be in place:

1. V2 goals;
2. V2 page OpenSpec;
3. V2 implementation status;
4. V2 goal summary;
5. V2 issue register;
6. TOC/README references;
7. ACR review docs.
