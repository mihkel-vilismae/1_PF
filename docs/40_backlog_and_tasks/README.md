# Backlog and Tasks

> Current checkpoint: `v0.10.47`. This README was refreshed in the docs/launcher reconciliation pass; code, focused tests, proof artifacts, and runtime evidence override stale prose.

Estonian timestamp: 2026-05-24 23:31 EEST

## Purpose

This folder is for backlog items, TODOs, implementation prompts, and future work notes.

## Belongs here

- planned slices and task prompts.
- TODO lists.
- not-yet-implemented ideas.
- future verification work.

## Does not belong here

- claims that something is already implemented unless verified elsewhere.
- current-truth documentation.
- operator runbooks intended for normal use.

## Canonical TODO batches

- [2026-05-13 TODO batch](todo_2026-05-13/) contains backlog/TODO prompts moved from `_TODO_13_05_26/` in Slice 9.
- The original `_TODO_13_05_26/` paths remain as compatibility pointers where moved.
- `_TODO_13_05_26/F_page.txt` is intentionally not moved because it is an ignored dirty/unrelated file for the current workflow.


## Canonical backlog category docs

- [Active implementation backlog](task_documentation_still_to_implement/active_implementation_backlog.md) contains planning tasks that are not implementation proof.
- [Rejected or superseded tasks](task_documentation_still_to_implement/rejected_or_superseded_tasks.md) preserves rejected/superseded planning decisions.
- [Verification and reconciliation tasks](task_documentation_still_to_implement/verification_and_reconciliation_tasks.md) tracks verification work that must be checked against code/tests/evidence before becoming current truth.
- The original `docs/categorized/task_documentation_still_to_implement/` document paths remain as compatibility pointers where moved.

## Authority rule

Backlog docs are planning material. They must not be treated as completed implementation without code, tests, or evidence. Code, tests, generated evidence packs, and runtime artifacts are stronger than old documentation when there is a conflict.

## Navigation

Use these repository-level documentation guides before adding or moving files:

- [Documentation Index](../DOC_INDEX.md)
- [Documentation Freshness Matrix](../DOC_FRESHNESS_MATRIX.md)
- [Documentation Reorganization Plan](../DOC_REORGANIZATION_PLAN.md)

Do not physically move files into this folder until the move is covered by a link-aware documentation slice.

## Active workflow route-selection note moved in Slice 17

Estonian timestamp: 2026-05-25 01:56 EEST

Slice 17 moved this active workflow planning note into the canonical backlog/task area:

- [Slice 8 and Slice 9 Route Selection](active_workflow/slice_8_9_route_selection.md)
- [Runtime Gap Implementation Plan — 2026-05-30](active_workflow/runtime_gap_implementation_plan_20260530.md) turns current doc-audit findings into ordered proof/implementation slices.

The old `docs/active_workflow_docs/slice_8_9_route_selection.md` path remains a compatibility pointer only. Treat this as planning/workflow context, not current implementation proof.

## Overall project completeness registry

- [Overall Project Goal Registry](overall_project_goal_registry.md) is the active source registry for project-completeness reports. It combines v1 gates, Debug page goals, and active backlog items while keeping proof states and source paths explicit.
- [Overall Project Goal Registry JSON](overall_project_goal_registry.json) is the machine-readable companion used by proof/tests.

## Current V2 next-plan

- [V2 next implementation plan](V2_NEXT_IMPLEMENTATION_PLAN_20260626.md) — post-B5 sequence from troubleshooting/recovery through victory proof.
