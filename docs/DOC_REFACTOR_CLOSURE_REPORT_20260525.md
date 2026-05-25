# Documentation Refactor Closure Report — 2026-05-25

Estonian timestamp: 2026-05-25 02:18 EEST

## Status


## AI-first documentation entrypoint

Future AI agents should start from [`AGENTS.md`](../AGENTS.md). The repository instruction file now points agents to this closure report, the documentation index, the freshness matrix, the reorganization plan, and the link audit before they rely on repository documentation as source of truth.

The documentation refactor is closed as a navigation and organization pass. Canonical target folders exist, selected docs have been moved into those folders with compatibility pointers, local Markdown links have been audited, and old category indexes are intentionally retained as compatibility navigation.

This report does not claim runtime behavior is correct. Code, tests, generated evidence packs, and direct runtime checks remain stronger than documentation.

## Canonical folder structure

| Canonical group | Folder | Use for |
| --- | --- | --- |
| 00_current_truth | docs/00_current_truth/ | Latest verified/evidence-backed docs only. Current canonical example: auth evidence-pack guide. |
| 10_runbooks | docs/10_runbooks/ | Operator and documentation workflow procedures. Verify commands before running. |
| 20_architecture_and_specs | docs/20_architecture_and_specs/ | Architecture, contracts, target behavior, and reusable reference specs. |
| 30_status_snapshots | docs/30_status_snapshots/ | Dated implementation/status snapshots. Useful evidence, not live truth. |
| 40_backlog_and_tasks | docs/40_backlog_and_tasks/ | Backlog, TODOs, active workflow notes, and task prompts. Planning only. |
| 50_audits_and_migrations | docs/50_audits_and_migrations/ | Audit, migration, placeholder and refactor reports. Re-run before trusting. |
| 90_archive | docs/90_archive/ | Historical/provenance docs. Preserve, do not treat as current truth. |

## Where to add new docs

| New document type | Put it here | Rule |
| --- | --- | --- |
| Current verified/evidence-backed truth | docs/00_current_truth/ | Only after code/tests/generated evidence support the claim. |
| Operator procedure or setup guide | docs/10_runbooks/ | Keep commands practical; verify paths/endpoints before publishing. |
| Architecture, contract, target behavior, design spec | docs/20_architecture_and_specs/ | Do not present target behavior as already implemented unless verified. |
| Implementation status snapshot | docs/30_status_snapshots/<date>/ | Date the snapshot and say what evidence it was based on. |
| Backlog, TODO, future task, active workflow note | docs/40_backlog_and_tasks/ | Planning only; never treat as implemented truth. |
| Audit, migration, refactor, placeholder report | docs/50_audits_and_migrations/ | Re-run before using as current truth. |
| Historical/provenance document | docs/90_archive/ | Archive does not mean delete; preserve provenance. |
| Tool-local README/HOW_TO_RUN | tools/<tool-name>/ | Keep with the tool; central docs may link to it only. |
| Test-data README | generated_test_data/ | Keep with the dataset. |

## Compatibility pointer policy

- Old moved paths remain as compatibility pointers so historical prompts and links do not break.
- New references should use canonical numbered folders, not old categorized paths.
- Compatibility pointers may be retired only in a later link-retirement slice after another full link audit proves they are no longer needed.
- Old category indexes remain compatibility navigation only, not current implementation truth.

## Link audit closure

| Metric | Value |
| --- | --- |
| Markdown files scanned | 135 |
| Local Markdown links checked | 146 |
| Broken local Markdown links after closure validation | 0 |
| Old indexes retained as compatibility navigation | 5 |

No broken local Markdown links were found by the closure validation pass.

## Completed slice summary

| Slice | Name | Status | Commit/output | Main change | Moved files? | Source code changed? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Auth evidence docs / artifact guidance | Done earlier | Auth evidence baseline | Added auth artifact/evidence guidance. | No | Earlier auth-evidence work included code. |
| 2 | Documentation grouping analysis | Done | 671986b | Added DOC_INDEX, DOC_FRESHNESS_MATRIX, DOC_REORGANIZATION_PLAN. | No | No |
| 3 | Root documentation navigation | Done | c88b6dd | Linked root entry docs to the new documentation navigation system. | No | No |
| 4 | Category index bridge links | Done | 752cea4 | Added bridge notices to categorized docs indexes. | No | No |
| 5 | Target folder skeletons | Done | 59a4579 | Added target folder README files only. | No | No |
| 6 | Move current-truth docs | Done | c368a65 | Moved canonical auth evidence guide into docs/00_current_truth and kept old path as pointer. | Yes | No |
| 7 | Move operator runbook | Done | 665f60e | Moved operator_setup_and_auth_notes.md into docs/10_runbooks and kept old path as pointer. | Yes | No |
| 8 | Archive historical task docs | Done | f4a4acf | Archived task_docs/*.md into docs/90_archive/task_docs_2026-04-20 and kept old paths as pointers. | Yes | No |
| 9 | Move backlog/TODO docs | Done | d83bfb5 | Moved selected non-ignored _TODO_13_05_26 docs into docs/40_backlog_and_tasks/todo_2026-05-13. | Yes | No |
| 10 | Move backlog category docs | Done | 3239406 | Moved selected backlog category docs into docs/40_backlog_and_tasks/task_documentation_still_to_implement. | Yes | No |
| 11 | Move root-level status snapshots | Done | bc996db | Moved three root-level 2026-05-12 status snapshots into docs/30_status_snapshots/2026-05-12. | Yes | No |
| 12 | Move categorized status snapshots | Done | e1be798 | Moved five categorized status snapshot docs into docs/30_status_snapshots/2026-05-12. | Yes | No |
| 13 | Move vision/spec docs | Done | 3adc647 | Moved three canonical vision/spec docs into docs/20_architecture_and_specs. | Yes | No |
| 14 | Move auth flow reference doc | Done | 200bd64 | Moved NEW_AUTH_PROVIDER_VERIFICATION_FLOW.md into docs/20_architecture_and_specs/auth. | Yes | No |
| 15 | Move audit/migration docs | Done | 03cd872 | Moved three audit/migration docs into docs/50_audits_and_migrations. | Yes | No |
| 16 | Reference/index handling decision | Done | 429f268 | Kept old category indexes in place as compatibility navigation and documented that decision. | No | No |
| 17 | Move remaining reference/workflow docs | Done | ccd7201 | Moved four remaining reference/workflow docs into canonical target folders and kept old paths as pointers. | Yes | No |
| 18 | Link audit and old-index decision | Done | 312f93a | Audited local Markdown links, fixed one CronEmulator doc link, retained old indexes as compatibility navigation. | No | No |
| 19 | Documentation refactor closure summary | Done now | closure commit | Created final closure report and future-document placement guidance. | No | No |

## Preserved

- Existing implementation source code was not changed by the documentation grouping/move/closure slices after the earlier auth-evidence implementation work.
- Existing historical content was preserved either at canonical archive locations or as compatibility pointers.
- Tool-local docs remain with their tools.
- Known ignored dirty/unrelated files remain outside this documentation-refactor scope.

## Final next action

Use this organized documentation layout as the baseline. Future work should only add new docs to canonical folders and should update DOC_INDEX.md plus DOC_FRESHNESS_MATRIX.md when new documentation is added.
