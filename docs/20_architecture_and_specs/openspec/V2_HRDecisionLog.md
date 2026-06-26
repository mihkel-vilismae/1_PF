# V2 HR Decision Log

Estonian timestamp: 2026-06-26 10:54 EEST

## Purpose

This document records the operator answers to the implementation-planning question set for the V2 path toward `09 REAL PLAYBACK`.

It is an implementation decision log, not proof that the behavior already exists. When code changes are made, this log must stay aligned with [`V2_ImplementationStatus.md`](V2_ImplementationStatus.md), [`V2_IssueRegister.md`](V2_IssueRegister.md), and the future structured implementation-status JSON read by the V2 frontend overlay.

## Answered decisions

| ID | Decision | Implementation meaning |
| --- | --- | --- |
| `Q1` | Start from the latest OpenSpec docs package. | New implementation work should build from the docs/OpenSpec state, not directly from the earlier raw v0.10.29 baseline. |
| `Q2` | The next phase is documentation plus code inventory first. | Do not add UI before locating reusable components, endpoints, and proofs/tests. |
| `Q3` | Component reuse/extraction is mandatory. | Do not copy/paste repeated HTML blocks; extract shared components/renderers where needed. |
| `Q4` | `09 REAL PLAYBACK` remains explanation-only until isolated pieces are proven. | Do not compose the final real page prematurely. |
| `Q5` | New sidebar order is fixed: `07 PIR`, `08 PLAYBACK`, `09 REAL PLAYBACK`. | Do not reorder these pages. |
| `Q7` | Playback recovery may restart the same file from the beginning. | Exact timestamp resume is not required for victory. |
| `Q11` | Address/GPS playback rule needs a future toggle. | Do not hard-code a permanent rule yet; plan a control that can allow or require address data. |
| `Q12` | Windows cron emulator is fully excluded from the real path. | Real implementation uses Raspberry crontab and possibly WSL for development. |
| `Q13` | WSL controls may exist as disabled placeholders. | Any WSL UI must be clearly marked as WSL and disabled until explicitly enabled. |
| `Q14` | Keep the scheduler button concepts, but make them real-crontab backed. | Buttons previously associated with emulator behavior must be integrated with Raspberry crontab behavior, not Windows emulator behavior. |
| `Q15` | Cron intervals must be customizable. | Inspect existing crontab examples/configs for default values before locking UI defaults. |
| `Q16` | Every major card/div gets a top-right `?` icon. | Clicking it shows current explanation and implementation status for that section. |
| `Q17` | Implementation status overlay is V2-only. | Do not extend this overlay to non-V2 pages during this work. |
| `Q18` | Implementation status is stored in structured JSON. | The V2 frontend overlay reads JSON; the JSON and docs must remain synchronized. |
| `Q19` | Initial status colors: green done/proven, yellow in progress, red not implemented. | Other colors may be refined later, but these meanings are locked. |
| `Q20` | Keep `Explain controls`, `Explain values`, and add `Implementation status`; omit `Show marked for removal`. | Top toolbar behavior is V2-only and reality-based. |
| `Q21` | If a reused control lacks a test, add one first when reasonable/quick. | If coverage would be large/expensive, document the gap and align before proceeding. |
| `Q22` | Frontend buttons must work and handle backend replies gracefully. | Buttons need frontend tests; backend endpoints need separate backend tests; frontend should show success/error states instead of crashing on failures such as HTTP 500. |
| `Q23` | Final proof should include end-to-end autonomous playback and autonomous recovery proofs. | Playback proof should cover auth, download, pipeline, queue, and media display; recovery proof should cover abrupt termination/restart and state restoration. |
| `Q24` | PIR gets an emulation button first. | Clicking the emulation button simulates a PIR signal until real hardware integration is available. |
| `Q25` | Stale-lock buttons must be rediscovered from docs/original commits/tests. | User knows they worked before; verify exact implementation before marking reliable. |
| `Q26` | Provide a ZIP after every logical change/checkpoint. | Each implementation checkpoint should include a full Git ZIP artifact. |
| `Q27` | Reports must include per-file added/removed line counts. | Diffstat must be file-by-file, not just aggregate. |
| `Q28` | Inspection footprint must separate fully opened/read files from searched/partial files. | Reports should distinguish direct file reads from grep/search references. |
| `Q29` | Print unresolved items/risks at the end of every implementation report. | Known gaps stay visible. |
| `Q30` | `09 REAL PLAYBACK` may show test-related controls, but they must be disabled. | Final page should not enable test-only behavior by default. |

## Still open or intentionally deferred

| ID | Open decision | Current boundary |
| --- | --- | --- |
| `Q6` | Exact minimum recovery-state schema. | It must at least restore the same current media/queue context; exact fields are decided after code inventory. |
| `Q8` | Autosave trigger/frequency. | Likely important state/stage changes and/or resource-aware interval; decide after inspecting runtime cost. |
| `Q9` | Exact corrupt/partial download handling implementation. | Corrupt files should be deleted and redownloaded; incomplete/corrupt files must not enter DB or advance through pipeline. |
| `Q10` | Exact random-file UI treatment in `08 PLAYBACK`. | Non-media files can enter the queue/table, but when selected the system must report that they are not image/video instead of trying to play them. |

## Final proof intent

The final proof package should demonstrate two primary victory paths:

1. **Autonomous playback proof**: after authentication, the system downloads one or more files, moves them through Download → Index → GPS parser → Geocode → Queue, then displays the resulting image/video in the visual media player with address overlay behavior where available.
2. **Autonomous recovery proof**: while the system is running, the proof simulates abrupt termination or power-loss-like shutdown, restarts the system, and verifies that the restored state matches the pre-shutdown state well enough to continue operation.

## Reporting contract

Every implementation report should include start/end timestamps, baseline/new HEAD, commit list, per-file line additions/removals, inspection footprint split into fully opened/read files and searched/partial references, tests/proofs run, tests/proofs not run, preserved behavior, changed behavior, and unresolved items/risks.
