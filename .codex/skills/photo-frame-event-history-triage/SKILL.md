---
name: photo-frame-event-history-triage
description: Triage 12_PF dashboard Event history exports and embedded runtime evidence. Use when Codex is given copied Event history JSON, scheduler/CronEmulator event payloads, pipeline lock events, mock download events, runtime truth boot messages, or asks to classify whether dashboard events show healthy runtime behavior, nested failures, mock-only success, schema drift, or the smallest regression-safe next action.
---

# Photo Frame Event History Triage

## Overview

Classify dashboard Event history exports without confusing HTTP/UI success with real runtime health. Separate verified evidence from inference and keep recommendations local to the relevant 12_PF surface.

## Quick Workflow

1. Preserve the raw export as evidence. Do not rewrite or normalize it before triage.
2. If the export is JSON, run the helper for a deterministic first pass:

```powershell
python .codex/skills/photo-frame-event-history-triage/scripts/analyze_event_history.py path\to\event-history.json
```

3. Inspect nested payloads, especially `details.response.body`, before deciding severity.
4. Produce a short report with: headline status, verified evidence, inferred meaning, uncertainties, smallest next action, and regression risk.

## Classification Rules

- Treat top-level `type: success` as only the dashboard/API action result. Check nested scheduler jobs and logs before calling the runtime healthy.
- For `SCHEDULER` or `CronEmulator` payloads, classify `task.running: true` and API responses separately from `jobs[*].last_result` and nested `logs[*].status`.
- Repeated `/path/to/...` cron commands mean placeholder commands are being executed, not real repo workers.
- `invalid_json` inside a PowerShell cron row usually means command quoting stripped JSON quotes before the backend received the body.
- `PIPELINE` with `reason: pipeline_lock_held` is an execution blocker. If `lockAcquiredAt` or `lockAgeSeconds` is null, state that stale-lock diagnosis is incomplete.
- Download/test events with `mode: generated_test_data_copy` are mock/test evidence, not proof of real iCloud or production download behavior.
- When copied file counts change but `mediaFilesBefore`, `mediaFilesAfter`, and `newMediaFiles` do not, call out that copied files were not newly counted as media.
- Missing `atIso`, `atTallinn`, or `details` on some events is event schema inconsistency, not necessarily runtime failure.

## Report Format

Use this shape unless the user asks for a different format:

- **Headline:** one sentence that distinguishes dashboard/API success from runtime health.
- **Verified:** facts directly present in the export, including timestamps and endpoint names when relevant.
- **Inferred:** likely meaning based on known 12_PF patterns; label as inference.
- **Uncertain:** what the export cannot prove.
- **Next action:** the smallest safe action, usually one affected surface at a time.
- **Regression risk:** what should remain unchanged or what could be accidentally broken.

## 12_PF Surfaces

Map findings to the narrowest surface:

- CronEmulator scheduler bridge: `server/index.ts`, `dashboard/services/initService.ts`, `dashboard/views/initView.ts`, `shared/schedulerPlatformCapabilities.ts`.
- Runtime truth/event presentation: dashboard event history state and runtime truth services.
- Pipeline locks: backend runtime pipeline action handling and lock metadata.
- Mock download/test actions: runtime download endpoints and generated test data flow.

Do not propose broad architecture changes from a log export alone. Recommend code edits only after inspecting the relevant source files.

## Helper Script

`scripts/analyze_event_history.py` reads an Event history JSON export from a file path or stdin and prints a compact first-pass report. Use it to find repeated known patterns; do not treat it as a substitute for source inspection when implementation changes are requested.

If the helper reports nested failures under a successful scheduler event, phrase the conclusion as: "The scheduler API action succeeded, but one or more scheduled jobs are failing."
