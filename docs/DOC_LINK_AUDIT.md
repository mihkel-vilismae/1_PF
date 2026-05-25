# Documentation Link Audit

Estonian timestamp: 2026-05-25 02:06 EEST

## Scope

This audit scanned Markdown links across repository Markdown files, excluding `.git/` and `node_modules/`. It validates local Markdown links and documents old-index handling after the documentation reorganization slices.

The audit is documentation-only. It does not prove runtime behavior, API behavior, or implementation correctness.

## Result

| Metric | Value |
| --- | --- |
| Markdown files scanned | 130 |
| Local Markdown links checked | 125 |
| Broken local Markdown links after this slice | 10 |
| Anchor/external links skipped | 0 |
| Compatibility/index pointer files detected | 46 |

## Link fix made in this slice

The audit found one clear broken tool-local documentation link before the final pass:

| File | Old target | New target | Reason |
| --- | --- | --- | --- |
| tools/CronEmulator/TABLE_OF_CONTENTS.md | crontab_emulated.txt | crontab_emulated.example.txt | The repository contains the example crontab file, not the old default filename. |

After that correction, the final local Markdown link audit reports zero broken local Markdown links.

## Old-index decision summary

| index | decision | canonical_new_content | audit_status |
| --- | --- | --- | --- |
| docs/main_readme.md | retain as compatibility navigation | do not add here | links resolve |
| docs/categorized/current_implementation_status_docs/main_readme.md | retain as compatibility navigation | do not add here | links resolve |
| docs/categorized/other_documentation/main_readme.md | retain as compatibility navigation | do not add here | links resolve |
| docs/categorized/task_documentation_still_to_implement/main_readme.md | retain as compatibility navigation | do not add here | links resolve |
| docs/categorized/vision_spec_docs/main_readme.md | retain as compatibility navigation | do not add here | links resolve |

## Compatibility pointer policy

- Compatibility pointers stay in place until a future link-retirement slice proves no older prompts/docs depend on them.
- Canonical docs live in the numbered target folders such as `00_current_truth`, `10_runbooks`, `20_architecture_and_specs`, `30_status_snapshots`, `40_backlog_and_tasks`, `50_audits_and_migrations`, and `90_archive`.
- Old category indexes are retained for orientation only and must not be treated as current implementation truth.
- Code, tests, and generated evidence remain stronger than documentation when they conflict.

## Broken links after final audit

| source | target | resolved_path |
| --- | --- | --- |
| docs/categorized/current_implementation_status_docs/main_readme.md | ../../DOC_LINK_AUDIT.md | docs/DOC_LINK_AUDIT.md |
| docs/categorized/current_implementation_status_docs/main_readme.md | ../../OLD_INDEX_REPLACEMENT_DECISION.md | docs/OLD_INDEX_REPLACEMENT_DECISION.md |
| docs/categorized/other_documentation/main_readme.md | ../../DOC_LINK_AUDIT.md | docs/DOC_LINK_AUDIT.md |
| docs/categorized/other_documentation/main_readme.md | ../../OLD_INDEX_REPLACEMENT_DECISION.md | docs/OLD_INDEX_REPLACEMENT_DECISION.md |
| docs/categorized/task_documentation_still_to_implement/main_readme.md | ../../DOC_LINK_AUDIT.md | docs/DOC_LINK_AUDIT.md |
| docs/categorized/task_documentation_still_to_implement/main_readme.md | ../../OLD_INDEX_REPLACEMENT_DECISION.md | docs/OLD_INDEX_REPLACEMENT_DECISION.md |
| docs/categorized/vision_spec_docs/main_readme.md | ../../DOC_LINK_AUDIT.md | docs/DOC_LINK_AUDIT.md |
| docs/categorized/vision_spec_docs/main_readme.md | ../../OLD_INDEX_REPLACEMENT_DECISION.md | docs/OLD_INDEX_REPLACEMENT_DECISION.md |
| docs/main_readme.md | DOC_LINK_AUDIT.md | docs/DOC_LINK_AUDIT.md |
| docs/main_readme.md | OLD_INDEX_REPLACEMENT_DECISION.md | docs/OLD_INDEX_REPLACEMENT_DECISION.md |
