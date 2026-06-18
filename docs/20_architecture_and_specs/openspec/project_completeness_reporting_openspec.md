# Project Completeness Reporting OpenSpec

Status: active reporting contract  
Introduced: v0.8.136  
Applies to: `print overall project completeness`, `print all goals`, `print spectable`, `print milestone goals`, `print grade table`, `print slicetable`, and similar project-completeness prompts.

## Purpose

Completeness reports must be repeatable, source-backed, and proof-honest. This OpenSpec fixes the known gaps that made previous reports require manual merging across many documents.

## Covered data gaps

| Gap | Contract response |
|---|---|
| No single canonical overall goal registry | Use `docs/40_backlog_and_tasks/overall_project_goal_registry.md` and `.json` as the active merge point. |
| Runtime proof artifacts may be absent from ZIP | Print `NOT_ENOUGH_LIVE_PROOF_DATA` for live proof scoring when `runtime_data/proofs` is missing/incomplete. |
| Older snapshots can conflict with active OpenSpec | Use source priority from the goal registry and treat archives/snapshots as supporting only. |
| Debug page is docs-only | Keep Debug docs/OpenSpec and Debug runtime/UI as separate completeness categories. |
| Some proof commands are planned, not implemented | Use `proof_command_state` and never present `PLANNED_COMMAND` as runnable. |
| Partial statuses are not machine-normalized | Use `project_status_enum_registry.md` and registry `allowed_status_enums`. |

## Required output tables

A completeness report must print these tables unless the user narrows the request:

1. All goals table.
2. Spec table.
3. Milestone goals table.
4. Grade table.
5. Slice table.
6. Overall completeness percentage by category.
7. Data gaps and source conflicts.
8. Next safest slice recommendations.

## Source priority

Reports must use this order unless the user explicitly asks for historical comparison:

1. `VERSION`, `package.json`, and git HEAD.
2. Active OpenSpec docs under `docs/20_architecture_and_specs/openspec/`.
3. Machine-readable proof/gate evaluators under `tools/`.
4. Active queues/goal registries under `docs/40_backlog_and_tasks/`.
5. `README.md` and `docs/table_of_contents.md` for navigation only.
6. `docs/50_audits_and_migrations/**` and `docs/30_status_snapshots/**` as supporting context.
7. `docs/90_archive/**` only for history.

## Percentage formulas

Every percentage must name its formula.

### Strict proof completeness

Numerator: rows with `status_enum = PROVEN`.  
Denominator: rows in the selected category that are required for that category.

### Implementation completeness

Numerator: rows with `status_enum = PROVEN` or `IMPLEMENTED`, plus explicitly labeled partial weights if used.  
Denominator: rows in the selected category that require runtime behavior.

### Documentation/spec completeness

Numerator: rows with `SPECIFIED`, `CONTRACTED`, `DOCS_ONLY`, `PRE_PASS`, `PARTIAL`, `IMPLEMENTED`, or `PROVEN` when the category is explicitly documentation/spec coverage.  
Denominator: docs/spec rows in that category.

Reports must not combine those formulas into one unlabeled number.

## Runtime proof artifact rule

If latest proof artifacts are available under `runtime_data/proofs/`, reports may run or reference proof evaluators such as `npm run proof:raspberry-v1-readiness`.

If artifacts are absent from the repo ZIP, reports must say:

`NOT_ENOUGH_LIVE_PROOF_DATA — live proof artifact scoring cannot be completed from this ZIP alone.`

They may still print a documented-status estimate if the source is named, for example the v1 traceability matrix or a user-uploaded Raspberry proof bundle.

## Debug page separation rule

Debug page work introduced around v0.8.130-v0.8.133 is documentation/OpenSpec/test coverage only unless a later implementation commit proves runtime UI behavior. Reports must show at least two categories:

| Category | Meaning |
|---|---|
| Debug docs/OpenSpec | OpenSpec, runbook, goal registry, and docs tests. |
| Debug runtime/UI | Actual route, sidebar entry, version tracker, panes, crontab UI, worker actions, and runtime proofs. |

Debug docs/OpenSpec completeness must not raise Debug runtime/UI completeness.

## Planned proof command rule

A proof target marked `PLANNED_COMMAND` is not runnable. Reports must print it as planned/future and must not include it in “commands to run now” blocks.

A proof target marked `IMPLEMENTED_COMMAND` may be printed as runnable only if it exists in `package.json` scripts or a direct tool file referenced by package scripts.

## Archive and snapshot rule

Older snapshots can explain why a feature exists, but cannot override active OpenSpec or current proof artifacts. If an older snapshot conflicts with an active registry row, the active registry row wins and the conflict is listed under data gaps.

## Required non-claims

Completeness reports must include these non-claims when relevant:

- Documentation/OpenSpec coverage is not runtime implementation.
- Windows/local proof is not Raspberry hardware proof.
- A scaffolded proof runner is not a passed proof artifact.
- Missing `runtime_data/proofs` means live proof scoring is incomplete.
- Planned proof commands must not be represented as runnable.
