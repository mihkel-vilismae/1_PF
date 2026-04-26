# Active Workflow Docs

Workflow: `DOCUMENTATION_ANALYSIS_OVERHAUL_AND_RECONCILIATION_LIKE_1PF`

Estonian timestamp: 2026-04-26 17:20 EEST

This folder stores the active reports, prompt records, and lightweight skill definitions produced while running the documentation analysis and reconciliation workflow on this repository.

## Current workflow parts

| Part | File | Purpose |
|---:|---|---|
| 1 | `part1_quick_documentation_inventory_with_loc.md` | Surface-level inventory of documentation files, locations, headings, inferred purposes, and LOC. |
| 1 | `part1_documentation_inventory_skill.md` | Lightweight skill definition used to generate the documentation inventory. |
| 2 | `part2_repo_file_folder_structure_analysis.md` | Repository file/folder structure analysis with LOC, size, placement notes, and unusual structure findings. |
| 2 | `part2_analyzing_repo_file_folder_structure_skill.md` | Lightweight skill definition used to analyze repository structure. |
| 2 rule update | `workflow_rule_active_docs_folder_prompt.md` | Prompt analysis, critique, refined prompt, and durable rule for storing future workflow outputs here. |

## Rule

Every future run of this workflow on a repository should create or reuse:

```text
docs/active_workflow_docs/
```

All generated reports, report indexes, skill definitions, prompt records, and handoff notes for the current active workflow should be stored there.

Archived or superseded workflow outputs may later be moved to a separate archive folder only when an explicit documentation-retirement decision is made.
