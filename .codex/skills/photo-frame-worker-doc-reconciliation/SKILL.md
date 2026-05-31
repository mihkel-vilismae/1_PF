---
name: photo-frame-worker-doc-reconciliation
description: Reconcile 12_PF photo-frame worker documentation after scheduler or worker changes. Use when Codex changes regular_stage_worker, playback_worker, screen_on_off_worker, CronEmulator rows, scheduler host behavior, worker locks/logs/status, or implementation status claims.
---

# Photo Frame Worker Doc Reconciliation

## Operating Rule

Update docs only for verified implementation changes. Do not use docs to make unfinished worker behavior look complete.

## Read First

- `placeholder_implementations.md`
- `docs/categorized/current_implementation_status_docs/code_verified_dashboard_implementation_status.md`
- `docs/categorized/current_implementation_status_docs/documented_current_system_state.md`
- `docs/categorized/current_implementation_status_docs/known_gaps_and_unresolved_questions.md`
- `docs/categorized/task_documentation_still_to_implement/active_implementation_backlog.md`
- `docs/categorized/vision_spec_docs/architecture_runtime_and_recovery_spec.md`
- changed worker/scheduler files
- relevant tests or live evidence

Use `source-of-truth` alongside this skill for claim classification.

## Claim Rules

- Scheduler target wiring is not the same as real runtime worker execution.
- CronEmulator command execution is not the same as successful production behavior.
- B5 simulation is not real screen hardware.
- Stage 1 mock/generated download is not production provider download.
- Cache-first geocode provider wiring is not the same as production geocoding proof; network providers are disabled by default until deliberately activated and verified.
- GPS provider implementation is not the same as runtime proof for every source type; distinguish EXIF, sidecar, filename, and path-coordinate evidence.
- A worker is only complete when command, business logic, lock/status/log evidence, tests, and docs agree.

## Workflow

1. List the behavior that changed and the evidence proving it.
2. Classify each affected claim as code-verified, runtime-state, target-spec, documentation-derived, evidence-history, or unknown.
3. Update `placeholder_implementations.md` when a gap is closed, newly discovered, or reclassified.
4. Update current implementation status docs only where current code/tests prove the new status.
5. Update backlog only when a task is completed, split, renamed, or newly blocked.
6. Preserve active target-spec docs unless the user is changing intended architecture.
7. Keep wording precise: use `Partial`, `Mock-only`, `Simulation-only`, or `Implemented` only when supported by evidence.

## Output

Report:

- changed claims
- docs touched
- status before and after
- evidence used
- remaining gaps
- verification commands and results
