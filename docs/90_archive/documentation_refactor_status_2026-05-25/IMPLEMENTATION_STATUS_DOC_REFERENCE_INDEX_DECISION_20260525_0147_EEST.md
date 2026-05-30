# Implementation Status — Reference/Index Handling Decision

Estonian timestamp: 2026-05-25 01:47 EEST

## Scope

This documentation-only slice analyzed the remaining old documentation index/reference entry points after the main physical grouping moves. It decided to retain the old categorized index files as compatibility navigation instead of moving or deleting them now.

## Preserved

- No implementation source files were changed.
- No documentation files were moved, renamed, or deleted.
- Root and categorized index files remain available for old links.
- Tool-local docs remain with their tools.
- Known ignored dirty/unrelated files were not touched.

## Changed

Added explicit final handling notices to:

- `docs/main_readme.md`
- `docs/categorized/current_implementation_status_docs/main_readme.md`
- `docs/categorized/other_documentation/main_readme.md`
- `docs/categorized/task_documentation_still_to_implement/main_readme.md`
- `docs/categorized/vision_spec_docs/main_readme.md`

Updated organization docs:

- `docs/DOC_INDEX.md`
- `docs/DOC_FRESHNESS_MATRIX.md`
- `docs/DOC_REORGANIZATION_PLAN.md`

## Decision

The old indexes stay in place as compatibility navigation until a later full link-audit slice can prove they are safe to replace with redirect-only pointers or archive entries. New canonical documentation must be added to the target folders, not to the old categorized folders.

## Validation summary

- Compatibility indexes remain present.
- Added links point to existing files/folders.
- Markdown fence balance passed.
- No source-code files changed.
- No ignored dirty/unrelated files were included in slice scope.

## Next recommended slice

Move remaining reference material that has clear canonical destinations, or run a full link-audit before retiring old category indexes. Candidate areas include `docs/categorized/other_documentation/archive_and_reference_material.md`, `documentation_workflow_and_inventory.md`, and `default_project_settings_and_elements_checklist.md`.
