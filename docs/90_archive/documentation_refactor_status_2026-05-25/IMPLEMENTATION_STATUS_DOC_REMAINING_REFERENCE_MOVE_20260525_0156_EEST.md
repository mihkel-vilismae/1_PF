# Implementation Status — Remaining Reference/Workflow Move

Estonian timestamp: 2026-05-25 01:56 EEST

## Scope

Documentation-only Slice 17 moved selected remaining reference/workflow docs into clear canonical target folders with compatibility pointers at their old paths.

## Moved to canonical locations

| Old path | Canonical path | Handling |
|---|---|---|
| `docs/categorized/other_documentation/archive_and_reference_material.md` | `docs/90_archive/reference_material_2026-05-10/archive_and_reference_material.md` | historical/reference archive material |
| `docs/categorized/other_documentation/documentation_workflow_and_inventory.md` | `docs/10_runbooks/documentation_workflow_and_inventory.md` | documentation workflow runbook |
| `docs/categorized/other_documentation/default_project_settings_and_elements_checklist.md` | `docs/20_architecture_and_specs/reference/default_project_settings_and_elements_checklist.md` | reusable reference/spec checklist |
| `docs/active_workflow_docs/slice_8_9_route_selection.md` | `docs/40_backlog_and_tasks/active_workflow/slice_8_9_route_selection.md` | active workflow planning note |

## Preserved

- Source code was not changed.
- Root docs were not moved.
- Tool-local docs were not moved.
- Old paths remain compatibility pointers.
- Known ignored dirty/unrelated files were not touched.

## Validation summary

- Canonical files exist at their new paths.
- Old paths remain compatibility pointers.
- DOC_INDEX, DOC_FRESHNESS_MATRIX, and DOC_REORGANIZATION_PLAN reference canonical and compatibility paths.
- Markdown fence balance passes for changed docs.
- No implementation source files changed.

## Next recommended slice

Run a full documentation link audit and final old-index replacement decision. Do not remove compatibility pointers until link references are checked.
