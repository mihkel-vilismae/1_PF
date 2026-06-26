# V2 Issue Register

Estonian timestamp: 2026-06-26 09:34 EEST

## Purpose

This register tracks V2 design questions, likely problems, and verification gaps. It exists so unresolved work is visible instead of being mistaken for completed behavior.

## Status vocabulary

| Status | Meaning |
| --- | --- |
| `open` | Needs design, implementation, or proof. |
| `needs verification` | May already work, but current evidence is insufficient. |
| `needs solution` | Known/suspected problem. |
| `deferred` | Later milestone by design. |
| `closed` | Solved and proven by code/tests/evidence. |

## Register

| ID | Area | Problem | Desired behavior | Status | Related pages | Proof/test needed |
| --- | --- | --- | --- | --- | --- | --- |
| `V2-ISSUE-001` | Recovery saved state | Define exactly what state is saved. | State is lightweight enough for frequent autosave and sufficient to resume operation. | open | `06`, `09` | State schema tests and restart recovery proof. |
| `V2-ISSUE-002` | Playback recovery | Exact video timestamp recovery may be fragile. | Restore same current media item; restarting video from beginning is acceptable. | open | `06`, `08`, `09` | Playback checkpoint/recovery proof. |
| `V2-ISSUE-003` | Interrupted downloads | Power loss may leave partial/corrupt files. | Detect/reject corrupt or incomplete media before pipeline advances. | open | `04`, `05`, `09` | Download interruption fixture/proof. |
| `V2-ISSUE-004` | Non-media/random files | Drag/drop and filesystem may contain random files. | Non-image/video files are visible as `other` but cannot pollute playback pipeline. | open | `08`, `09` | File classification and queue filtering tests. |
| `V2-ISSUE-005` | PIR signal | Real PIR hardware signal may not be available during development. | Provide simulation/emulation first; later prove hardware input. | needs solution | `07`, `09` | PIR emulator contract and later Raspberry hardware proof. |
| `V2-ISSUE-006` | Mouse/keyboard activity | Direct testing needed. | Mouse/keyboard activity keeps/wakes screen and resets inactivity timeout. | needs verification | `07`, `09` | Browser activity tests. |
| `V2-ISSUE-007` | Windows cron emulator | User does not want Windows custom emulator as real path. | Real path uses Raspberry/Raspberry-related scheduler; WSL-like dev route only if useful. | open | `03`, `09` | Scheduler boundary test/docs. |
| `V2-ISSUE-008` | Emulator-labeled scheduler buttons | Some requested buttons are emulator-worded. | Keep them test-only/visual unless explicitly approved; do not wire into real path. | open | `03` | Implementation status marking and UI tests. |
| `V2-ISSUE-009` | Browser auth reliability | Browser auth is preferred but may fail in practice. | Use browser UI first; command-line auth fallback is acceptable and documented. | needs verification | `02`, `09` | New-auth proof and fallback runbook/proof. |
| `V2-ISSUE-010` | Troubleshooting stale locks | Detect/clear stale lock behavior may exist but exact semantics are uncertain. | Document and prove stale-only behavior before marking reliable. | needs verification | `05`, `09` | Stale-lock tests/proofs. |
| `V2-ISSUE-011` | Component duplication risk | Repeated screenshot sections could tempt copy-paste implementation. | Extract/reuse shared components and keep pages composed. | open | all | Code review/diffstat; large-file containment check. |
| `V2-ISSUE-012` | Fake readiness | UI can look complete before behavior works. | `Implementation status` overlay and docs must show true status. | open | all | Status metadata tests; docs sync checks. |
| `V2-ISSUE-013` | Event Log placement | Every page needs Event Log without duplicating code. | One shared event/history component or clearly extracted renderer. | open | all | Render test on all pages. |
| `V2-ISSUE-014` | GPS/address metadata | Drag/drop files may not expose GPS/address immediately. | Show columns; fill unknown values honestly; pipeline resolves when available. | open | `08`, `09` | Metadata extraction/projection tests. |
| `V2-ISSUE-015` | Final page scope creep | `09 REAL PLAYBACK` could become too large if every test button is copied in. | Only bring real operational controls/status from proven pages. | open | `09` | Real Playback composition review. |

## Review rule

Before any V2 implementation handoff, update this register if new issues are discovered or if a status changes.
