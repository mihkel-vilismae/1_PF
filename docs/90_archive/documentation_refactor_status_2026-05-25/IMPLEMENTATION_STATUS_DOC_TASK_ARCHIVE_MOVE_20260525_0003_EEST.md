# Implementation Status — Historical Task Docs Archive Move

Estonian timestamp: 2026-05-25 00:03 EEST

## Scope

Moved the historical `task_docs/*.md` batch into the archive folder with compatibility pointers at the old paths.

## Canonical archive folder

```text
docs/90_archive/task_docs_2026-04-20/
```

## Preserved

- Existing source code.
- Existing root documentation.
- Existing category index documentation.
- Existing tool-local documentation.
- Historical task-doc content, preserved under the archive folder.
- Old `task_docs/` paths as compatibility pointers.
- Known unrelated ignored files.

## Changed

- Moved nine historical task docs from `task_docs/` to `docs/90_archive/task_docs_2026-04-20/`.
- Replaced old `task_docs/` files with compatibility pointers.
- Updated `docs/90_archive/README.md`.
- Updated `docs/DOC_INDEX.md`, `docs/DOC_FRESHNESS_MATRIX.md`, and `docs/DOC_REORGANIZATION_PLAN.md` to reference canonical archive paths and compatibility pointers.

## Why files were moved now

The task docs were already classified as `historical_reference_only` and mapped to the archive folder. This was the safest first archive move because these files are old task prompts/provenance, not current implementation truth.

## Why other docs were not moved

Backlog, status snapshot, vision/spec, audit, and tool-local docs still need their own link-aware slices. Moving them together would mix authority levels and increase link-break risk.

## Validation summary

```text
DOC_TASK_ARCHIVE_MOVE_CHECK passed
canonical_archive=docs/90_archive/task_docs_2026-04-20
compatibility_pointers=task_docs/*.md
links=ok
source_changes=0
markdown_fences=ok
ignored_known_dirty_files=excluded_from_slice_scope
```

## Next recommended slice

Move backlog/TODO prompt docs into `docs/40_backlog_and_tasks/` with compatibility pointers and update the index/freshness/reorganization docs.
