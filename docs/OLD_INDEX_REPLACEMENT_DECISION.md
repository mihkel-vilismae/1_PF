# Old Index Replacement Decision

Estonian timestamp: 2026-05-25 02:06 EEST

## Decision

Retain the old category and `docs/main_readme.md` indexes as compatibility navigation for now. Do not convert them to redirect-only files yet.

## Reasoning

- The old indexes still provide useful local orientation for older prompts and historical category paths.
- Many old document paths are now compatibility pointers, so keeping category indexes reduces link-break risk while readers transition to canonical paths.
- The canonical navigation system is already `DOC_INDEX.md`, `DOC_FRESHNESS_MATRIX.md`, and `DOC_REORGANIZATION_PLAN.md`.
- A future redirect-only conversion should happen only after a link-retirement audit proves the old indexes are no longer needed as orientation pages.

## Retained compatibility indexes

| index | status | canonical navigation |
| --- | --- | --- |
| docs/main_readme.md | retained compatibility navigation | docs/DOC_INDEX.md |
| docs/categorized/current_implementation_status_docs/main_readme.md | retained compatibility navigation | docs/30_status_snapshots/ |
| docs/categorized/other_documentation/main_readme.md | retained compatibility navigation | docs/DOC_INDEX.md |
| docs/categorized/task_documentation_still_to_implement/main_readme.md | retained compatibility navigation | docs/40_backlog_and_tasks/ |
| docs/categorized/vision_spec_docs/main_readme.md | retained compatibility navigation | docs/20_architecture_and_specs/ |

## Future conversion criteria

A future slice may convert old indexes to redirect-only pointers only after all of these are true:

1. A full link audit finds no required references that depend on the old index content.
2. Root docs and canonical numbered folders provide equivalent or better navigation.
3. Compatibility pointers for moved docs have been retained or intentionally retired in a separate reviewed slice.
4. The move does not hide historical provenance or blur current-truth vs snapshot/spec/backlog distinctions.
