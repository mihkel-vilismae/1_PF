# Overall Project Completeness Reporting Runbook

Status: active reporting runbook  
Introduced: v0.8.139  
Related OpenSpec: [`../20_architecture_and_specs/openspec/project_completeness_reporting_openspec.md`](../20_architecture_and_specs/openspec/project_completeness_reporting_openspec.md).  
Related registry: [`../40_backlog_and_tasks/overall_project_goal_registry.md`](../40_backlog_and_tasks/overall_project_goal_registry.md).

## Purpose

Use this runbook when the operator asks for **print overall project completeness** or similar wording.

The report must be useful for planning implementation, but it must not overstate proof. A documented goal, scaffolded proof command, or planned UI is not the same as a proven runtime behavior.

## Required startup checks

1. Print `VERSION`, `package.json` version, and git HEAD.
2. Read `overall_project_goal_registry.json` and the status enum registry.
3. Check whether `runtime_data/proofs/` exists and contains relevant latest proof artifacts.
4. If proof artifacts are absent, print `NOT_ENOUGH_LIVE_PROOF_DATA` for live proof scoring.
5. Use active OpenSpec and active backlog/registry docs before snapshots or archives.

## Required tables

Print these tables in this order:

1. All goals table.
2. Spec table.
3. Milestone goals table.
4. Grade table.
5. Slice table.
6. Overall completeness percentage by category.
7. Data gaps/source conflicts.
8. Next safest slice recommendations.

## Status handling

Use `docs/20_architecture_and_specs/reference/project_status_enum_registry.md` exactly. If a row has an unknown status, stop and repair the registry before printing a percentage.

## Planned command handling

Rows with `proof_command_state = PLANNED_COMMAND` are not runnable. They may appear in future-slice tables, but must not be included in copy-paste proof command blocks.

## Debug page split

Always split Debug page scoring into at least two categories:

| Category | Meaning |
|---|---|
| Debug docs/OpenSpec | OpenSpec, runbook, goal registry, and static docs tests. |
| Debug runtime/UI | Actual `/debug` route, sidebar link, version tracker, panes, crontab controls, worker actions, and runtime proofs. |

Do not let Debug documentation completeness increase Debug runtime/UI completeness.

## Raspberry proof split

Windows/local proof and Raspberry target proof must remain separate. A local proof can support development readiness but cannot prove Raspberry hardware/display/iCloud behavior.

## Safe percentage formulas

Preferred strict formula:

```text
strict proof completeness = PROVEN rows / required rows
```

Optional explicitly labeled formula:

```text
partial-weighted estimate = (PROVEN rows + 0.5 * PARTIAL/PRE_PASS rows) / required rows
```

Never print an unlabeled percentage.

## Maintenance rule

When adding a new project goal:

1. Add/update the active OpenSpec or backlog source.
2. Add/update `overall_project_goal_registry.json` and `.md`.
3. Use a normalized status enum.
4. Mark proof command state as implemented, planned, docs audit, artifact-only, or none.
5. Add or update proof/tests before claiming `PROVEN`.
6. Run `npm run proof:overall-project-completeness-registry`.
