# V2 Issue Register

Estonian timestamp: 2026-06-26 10:54 EEST

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
| `V2-ISSUE-001` | Recovery saved state | Exact schema is still open. | At minimum restore same current media file/queue context; keep state lightweight. | open | `06`, `09` | State schema tests and restart recovery proof. |
| `V2-ISSUE-002` | Playback recovery | Exact video timestamp recovery may be fragile. | Restore same current media item; restarting video from beginning is acceptable. | open | `06`, `08`, `09` | Playback checkpoint/recovery proof. |
| `V2-ISSUE-003` | Interrupted downloads | Power loss may leave partial/corrupt files. | Delete corrupt/incomplete files, redownload where possible, and prevent them from entering DB/pipeline. | open | `04`, `05`, `09` | Download interruption fixture/proof and DB non-ingestion test. |
| `V2-ISSUE-004` | Non-media/random files | Drag/drop and filesystem may contain random files. | Non-media files can appear in the queue/table, but when selected must report not image/video and avoid playback/pipeline pollution. | open | `08`, `09` | File classification and graceful not-playable tests. |
| `V2-ISSUE-005` | PIR signal | Real PIR hardware signal may not be available during development. | Provide a PIR-emulation button first; later prove hardware input. | needs solution | `07`, `09` | PIR emulator contract and later Raspberry hardware proof. |
| `V2-ISSUE-006` | Mouse/keyboard activity | Direct testing needed. | Mouse/keyboard activity keeps/wakes screen and resets inactivity timeout. | needs verification | `07`, `09` | Browser activity tests. |
| `V2-ISSUE-007` | Windows cron emulator | User does not want Windows custom emulator as real path. | Real path uses Raspberry crontab; WSL controls may exist only as disabled placeholders. | open | `03`, `09` | Scheduler boundary test/docs. |
| `V2-ISSUE-008` | Former emulator scheduler buttons | Some requested buttons came from emulator UI. | Keep the button concepts but integrate with real crontab/scheduler behavior, not Windows emulator. | open | `03` | Crontab-backed action tests and implementation-status marking. |
| `V2-ISSUE-009` | Browser auth reliability | Browser auth is preferred but may fail in practice. | Use browser UI first; command-line auth fallback is acceptable and documented. | needs verification | `02`, `09` | New-auth proof and fallback runbook/proof. |
| `V2-ISSUE-010` | Troubleshooting stale locks | User knows detect/clear stale-lock behavior worked before, but exact semantics must be rediscovered. | Search docs and original commits/implementation, then prove stale-only behavior before marking reliable. | needs verification | `05`, `09` | Stale-lock tests/proofs and original-commit/docs trace. |
| `V2-ISSUE-011` | Component duplication risk | Repeated screenshot sections could tempt copy-paste implementation. | Extract/reuse shared components and keep pages composed. | open | all | Code review/diffstat; large-file containment check. |
| `V2-ISSUE-012` | Fake readiness | UI can look complete before behavior works. | `Implementation status` overlay and docs must show true status. | open | all | Status metadata tests; docs sync checks. |
| `V2-ISSUE-013` | Event Log placement | Every page needs Event Log without duplicating code. | One shared event/history component or clearly extracted renderer. | open | all | Render test on all pages. |
| `V2-ISSUE-014` | GPS/address metadata | Drag/drop files may not expose GPS/address immediately and playback policy is not final. | Show columns, fill unknown values honestly, and plan a toggle for allow/require address behavior. | open | `08`, `09` | Metadata extraction/projection tests and missing-address playback test. |
| `V2-ISSUE-015` | Final page scope creep | `09 REAL PLAYBACK` could become too large if every test button is copied in. | Bring real operational controls/status from proven pages; test-only controls may be present only disabled. | open | `09` | Real Playback composition review. |
| `V2-ISSUE-016` | Implementation-status sync | UI overlay, docs, and status source can drift. | Use structured JSON read by V2 frontend and keep it synchronized with `V2_ImplementationStatus.md`. | open | all V2 | JSON/docs sync test. |
| `V2-ISSUE-017` | Autosave policy | Exact trigger/frequency is not decided. | Decide resource-aware autosave after code inventory; likely state/stage-change and/or interval based. | open | `06`, `09` | Autosave durability tests. |
| `V2-ISSUE-018` | Frontend backend-response handling | Buttons may call endpoints but fail to render responses gracefully. | Buttons must handle success/errors including HTTP 500 without crashing; backend endpoints have separate tests. | open | operational pages | Frontend button/response tests plus backend endpoint tests. |

## Review rule

Before any V2 implementation handoff, update this register if new issues are discovered or if a status changes.
