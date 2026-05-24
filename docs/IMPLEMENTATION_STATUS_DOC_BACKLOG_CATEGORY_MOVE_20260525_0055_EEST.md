# Implementation Status — Backlog Category Docs Move

Estonian timestamp: 2026-05-25 00:55 EEST

## Scope

Moved the remaining selected backlog category documents from `docs/categorized/task_documentation_still_to_implement/` into the canonical backlog folder.

## Canonical files added

- `docs/40_backlog_and_tasks/task_documentation_still_to_implement/active_implementation_backlog.md`
- `docs/40_backlog_and_tasks/task_documentation_still_to_implement/rejected_or_superseded_tasks.md`
- `docs/40_backlog_and_tasks/task_documentation_still_to_implement/verification_and_reconciliation_tasks.md`

## Compatibility pointers preserved

- `docs/categorized/task_documentation_still_to_implement/active_implementation_backlog.md`
- `docs/categorized/task_documentation_still_to_implement/rejected_or_superseded_tasks.md`
- `docs/categorized/task_documentation_still_to_implement/verification_and_reconciliation_tasks.md`

## Preserved

- Existing source code was not changed.
- Existing root docs were not changed.
- Category `main_readme.md` files were not moved.
- Tool-local docs were not changed.
- Known ignored dirty/unrelated files were not touched.

## Why files were still not broadly moved

This slice moved only backlog category docs that had already been classified as planning material. Status snapshots, specs, audits, tool-local docs, and ignored dirty files remain out of scope so authority levels stay separated.

## Validation result

- Canonical backlog category files exist.
- Old categorized paths remain compatibility pointers.
- `DOC_INDEX.md`, `DOC_FRESHNESS_MATRIX.md`, and `DOC_REORGANIZATION_PLAN.md` reference both canonical and compatibility paths.
- Markdown fence balance passed.
- No implementation source files changed.

## Next recommended slice

Move dated implementation/status snapshot docs into `docs/30_status_snapshots/2026-05-12/` with compatibility pointers.
