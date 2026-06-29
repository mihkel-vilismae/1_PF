# Terminal Demo v0.14.0 handoff

Generated: 2026-06-29

## Current artifact

- Version: `0.14.0`
- Milestone: operator evidence diagnosis / real-run blocker triage loop

## What v0.14.0 adds

- Root command `ANALYZE_TERMINAL_DEMO_EVIDENCE.CMD`.
- Npm command `terminal-demo:evidence-diagnosis`.
- Proof command `proof:terminal-demo-evidence-diagnosis`.
- Diagnosis tool `tools/run-terminal-demo-evidence-diagnosis.mjs`.
- The analyzer reads the latest `terminal/demo/runtime_logs/operator_rehearsal/` evidence folder by default or an explicit evidence ZIP/folder argument.
- It writes `terminal_demo_evidence_diagnosis.json` and `.md` under `terminal/demo/runtime_logs/evidence_diagnosis/`.
- It classifies common blockers: stale terminal runner repo-root detection, missing Node/npm, missing dependencies, folder/version mismatch, expected execution guard text, cron/no-cron context, and failed status checks.

## Boundaries preserved

- No native/fullscreen playback enabled.
- No screen on/off behavior enabled.
- No cron usage added.
- Worker execution remains guarded by explicit demo execution and scheduler safety flags.
- Evidence ZIP/report generation remains logs/status only; source repo files are not bundled.

## Recommended next milestone

`v0.15.0` should consume real operator evidence if the user provides it. If no real evidence is provided, run a v1.0 RC readiness audit and focus only on packaging/docs/proof honesty gaps.
