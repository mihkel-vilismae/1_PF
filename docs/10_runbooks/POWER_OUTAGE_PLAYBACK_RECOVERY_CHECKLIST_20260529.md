# Power-Outage Playback Recovery Checklist

Created: 29.05.2026, 18:05:00 EEST

## Purpose

Use this checklist to verify that Windows and Raspberry OS playback can recover from a restart using the persisted playback resume checkpoint. This is an operator/runtime checklist; it does not replace automated regression tests.

## Safety boundaries

- Test Mode and Real Mode remain separate.
- Download, Index, GPS parser, Geocode, and Queue are not modified by checkpoint restore.
- Geocode remains deterministic placeholder-only until a future real provider exists.
- Fullscreen restore is user-triggered because browsers may block automatic fullscreen after restart.

## Pre-test setup

| Step | Action | Evidence to capture |
|---:|---|---|
| 1 | Start API and frontend normally. | API URL, frontend URL, version in top-right display. |
| 2 | Open Windows Playback View or Raspberry OS Playback View. | Screenshot of selected OS playback view. |
| 3 | Refresh queue/current playback contract. | Current item name and resolved address. |
| 4 | Start rotation or switch to fullscreen. | Current item, pause/fullscreen state, visible resume checkpoint status. |
| 5 | Wait at least one heartbeat interval. | Backend request log or history showing checkpoint save request. |

## Simulated outage test

| Step | Action | Expected result | Evidence to capture |
|---:|---|---|---|
| 1 | Note the visible current item before shutdown. | Item name/address/timer are known. | Screenshot or copied UI values. |
| 2 | Stop frontend/API as if power was lost. | No graceful app-only reset is required. | Terminal close/restart note. |
| 3 | Restart API and frontend. | App starts without manual DB repair. | Startup terminal output. |
| 4 | Open the same OS playback view. | View reads `/api/runtime/playback/resume-checkpoint`. | Browser/network log or history entry. |
| 5 | Confirm restored item. | Same valid item is selected if checkpoint is fresh and still in contract. | Screenshot of restored item. |
| 6 | If fullscreen had been requested, click `Restore fullscreen playback`. | Fullscreen opens only after user action. | Screenshot or note. |
| 7 | Confirm rotation state. | Paused state and remaining timer are restored approximately. | UI timer/rotation status. |

## Failure/fallback checks

| Scenario | Expected behavior | Evidence to capture |
|---|---|---|
| Checkpoint missing | Resume status says missing; normal playback contract is used. | Resume status line. |
| Checkpoint stale | Resume status says stale; UI does not blindly trust timer. | Resume status line and fallback item. |
| Referenced media missing | Backend marks checkpoint invalid or UI falls back safely. | API payload and UI fallback. |
| Browser rejects fullscreen | UI remains usable and reports fullscreen request failure in history. | History/log entry. |
| Video timestamp seek fails | Same video may start from beginning; note best-effort behavior. | Operator note. |

## Subjective assessment table

| Platform | Last item restored? | Timer restored approximately? | Fullscreen restore button worked? | Video timestamp tested? | Subjective assessment |
|---|---|---|---|---|---|
| Windows | Pending | Pending | Pending | Pending | Pending |
| Raspberry OS | Pending | Pending | Pending | Pending | Pending |

## Evidence to copy back into project docs

- Version number tested.
- Runtime mode tested.
- Platform tested.
- Last item before restart.
- Restored item after restart.
- Resume checkpoint API payload.
- Screenshot or copied status line.
- Any failure/fallback behavior.
