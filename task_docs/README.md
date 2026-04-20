# Task Docs

This folder stores implementation-oriented notes for larger functionality changes so they stay easy to inspect later.

`_TABLE_OF_CONTENTS.md` is the authoritative index for this folder. Every file in `task_docs/` must be listed there, and any add/remove/rename/material update in this folder must update `_TABLE_OF_CONTENTS.md` in the same patch. Regenerate it with `npm run task-docs:toc`.

## When to add a doc

Create a new task doc when a change is more than a tiny fix, especially when it adds or alters:

- a new dashboard view
- backend endpoints or contracts
- database behavior or schema expectations
- state-machine or workflow behavior
- user-facing controls with multi-step logic

## Naming convention

Use one file per feature or change:

- `YYYY-MM-DD_short-feature-name.md`

Example:

- `2026-04-20_view-e-database-viewer.md`

## Recommended structure

Keep the doc practical and implementation-friendly:

1. summary
2. current repo truth
3. goals
4. non-goals
5. workflow / UX
6. backend + data expectations
7. acceptance criteria
8. open questions / risks
9. Codex-ready implementation prompt
10. GitHub issue / spec-style description

## Intent

The goal is simple: whenever a bigger feature is added or changed, leave behind a durable note here so future review is easier and the repo preserves the reasoning behind the functionality.
