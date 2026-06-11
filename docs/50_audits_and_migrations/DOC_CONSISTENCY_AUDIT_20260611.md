# Documentation Consistency Audit — 2026-06-11

## Scope

This audit reviewed the active PF_login v0.8.31 documentation after the Raspberry OS OpenSpec slice. It focused on stale commands, proof index coverage, OpenSpec gaps, scope contradictions, and next implementation slices.

## Summary

| Area | Finding | Resolution in v0.8.32 |
|---|---|---|
| Stale command references | `HOW_TO_RUN.md` still referenced the removed `proof:windows-task-scheduler-dry-run` package script, removed from `package.json` in v0.8.29. | Replaced with the Windows scheduler scope note and the supported `proof:live-windows-scheduler` path. |
| Documentation freshness | `docs/DOC_FRESHNESS_MATRIX.md` was dated 2026-05-30 and did not include v0.8.24-v0.8.31 proof/OpenSpec milestones. | Refreshed the matrix through v0.8.32. |
| Changelog ordering | The top of `CHANGELOG.md` mixed v0.8.31, v0.8.27, v0.8.30, and v0.8.28 sections. | Normalized the current top section newest-first and marked v0.8.28 as superseded. |
| Proof command index | `docs/proofs/README.md` did not list every current `proof:*` npm script. | Expanded the proof command table to cover every current proof script. |
| Regression coverage | Active docs could reference removed npm scripts without failing tests. | Added `tests/docsNpmScriptReferences.test.js`. |

## What is proven now

- Generated video fixture validation: PASSED in the preserved Windows proof stack.
- Native Windows image playback: PASSED.
- Native Windows worker-autostart image playback: PASSED.
- Native Windows video playback: PASSED.
- Controlled Windows native recovery: PASSED as controlled API/process restart, not OS reboot.
- Proof-owned live Windows scheduler loop: PASSED.
- Windows reboot/restart recovery preflight: PASSED, preflight only.
- Raspberry OS missing-feature contract: documented as OpenSpec only.

## What remains unimplemented or not proven

| Area | Status |
|---|---|
| Full Windows reboot recovery | NOT_RUN / not proven. |
| Raspberry local tool checker/path preflight | NOT_IMPLEMENTED. |
| Raspberry runtime launcher | NOT_IMPLEMENTED. |
| Raspberry native image/video playback | NOT_IMPLEMENTED / NOT_RUN. |
| Raspberry project-owned scheduler loop | NOT_IMPLEMENTED / NOT_RUN. |
| Raspberry controlled recovery | NOT_IMPLEMENTED / NOT_RUN. |
| Raspberry manual reboot recovery | NOT_IMPLEMENTED / NOT_RUN. |
| Raspberry power-loss recovery | BLOCKED unless real hardware/operator evidence is collected. |
| Production iCloud continuation proof | NOT current proof milestone. |
| Monitor-pixel/focus proof | NOT_RUN. |

## Scope decisions

Windows Task Scheduler is not part of PF_login project scope. Everything related only to Windows Task Scheduler is unnecessary and should not be recommended, implemented, or documented as a future path unless the user explicitly reverses this decision.

The supported Windows scheduler evidence path is the project-owned proof loop / CronEmulator-style evidence path.

## OpenSpec issues and next work

| Issue | Recommendation |
|---|---|
| Raspberry OpenSpec is broad and documentation-only. | Split future implementation into small preflight/launcher/playback/scheduler/recovery slices. |
| Raspberry operator commands do not exist yet. | Next slice should add Raspberry local tool checker + path portability preflight before runtime playback. |
| Raspberry evidence export is only specified. | Add exporter after launcher/path preflight, before target-machine playback proof. |
| Raspberry power-loss proof requires real hardware/operator evidence. | Keep BLOCKED until physical target proof is intentionally run. |

## Recommended next slice

```text
ACR TASK — Add Raspberry local tool checker and path portability preflight.

Preserve active PF_login behavior. Windows Task Scheduler remains out of scope. Implement a safe Raspberry documentation/preflight slice that checks Linux/Raspberry path assumptions, verifies local tool availability or install guidance for mpv/ffmpeg/ffprobe without vendoring binaries, defines runtime/log/evidence directories, and writes a preflight artifact. Do not claim Raspberry playback, cron/systemd/autostart, reboot, or power-loss recovery.
```
