# Categorized Documentation Index


## Current documentation navigation

Use these current navigation files before using older categorized docs as authority:

- [`docs/DOC_INDEX.md`](DOC_INDEX.md) is the main map for documentation by purpose, kind, authority, freshness, and topic.
- [`docs/DOC_FRESHNESS_MATRIX.md`](DOC_FRESHNESS_MATRIX.md) explains which docs are current, stale, historical, or risky.
- [`docs/DOC_REORGANIZATION_PLAN.md`](DOC_REORGANIZATION_PLAN.md) must be checked before moving documentation files.
- [`docs/AUTH_EVIDENCE_PACK.md`](AUTH_EVIDENCE_PACK.md) is the starting point for login/auth artifact debugging.

Old TODO docs, `task_docs/`, backlog docs, and vision/spec docs remain useful context. They must not be treated as current implementation truth without code, test, or generated-evidence verification.
## Final reference/index handling decision

As of 2026-05-25 01:47 EEST, this categorized documentation index remains in place as a compatibility navigation entry point. The canonical organization map is still [`docs/DOC_INDEX.md`](DOC_INDEX.md), freshness/trust decisions are in [`docs/DOC_FRESHNESS_MATRIX.md`](DOC_FRESHNESS_MATRIX.md), and future move decisions must follow [`docs/DOC_REORGANIZATION_PLAN.md`](DOC_REORGANIZATION_PLAN.md).

Do not treat this legacy categorized index as the newest implementation truth. Use it to find preserved historical category entry points, then verify claims against code, tests, generated evidence packs, or the canonical target folders.

## Slice 18 link audit status

As of 2026-05-25 02:06 EEST, this doc root compatibility index was retained in place after the full documentation link audit. Use [DOC_LINK_AUDIT.md](DOC_LINK_AUDIT.md) for the audit result and [OLD_INDEX_REPLACEMENT_DECISION.md](OLD_INDEX_REPLACEMENT_DECISION.md) for the old-index replacement decision.

This file remains compatibility navigation only. New canonical documentation should go to the numbered target folders documented in `DOC_INDEX.md` and `DOC_REORGANIZATION_PLAN.md`.

## 2026-05-10 playback boundary update

B3.5 owns playback queue preparation/building. B4 and `playback_worker` select the current playable item from already prepared queue/state as the final worker-stage action before the loop can begin again. Preview/fullscreen rendering remain non-real media display, Raspberry OS rendering remains disabled/planned, and Windows CronEmulator playback-worker command wiring remains partial because it depends on the expected `tools/CronEmulator` launch context.

## Purpose

This documentation set replaces the temporary `docs_to_parse/` staging bundle with a categorized, smaller canonical documentation structure.

The consolidation is documentation-only. No source code, tests, runtime behavior, API contracts, schemas, or implementation logic were inspected or changed as part of this documentation pass.

## Documentation-derived status warning

Implementation status in this documentation set is derived only from documentation sources. It must not be treated as code-verified behavior. If documentation and code disagree, code/tests and direct verification remain the only implementation truth.

## Category index

| Category | Purpose | Entry point |
|---|---|---|
| `vision_spec_docs` | Product vision, normative specs, architecture intent, dashboard/auth/pipeline contracts. | `docs/categorized/vision_spec_docs/main_readme.md` |
| `current_implementation_status_docs` | Documentation-derived current status, button/view verification evidence, known gaps. | `docs/categorized/current_implementation_status_docs/main_readme.md` |
| `task_documentation_still_to_implement` | Still-actionable implementation, verification, and reconciliation tasks that do not conflict with vision/spec authority. | `docs/categorized/task_documentation_still_to_implement/main_readme.md` |
| `other_documentation` | Operator notes, run/setup guidance, documentation workflow, default project checklist, archive/reference material. | `docs/categorized/other_documentation/main_readme.md` |

## Authority rules

1. Active vision/spec docs override current-status docs, task docs, workflow logs, and archive/reference docs.
2. Current-status docs describe documented reality snapshots only; they do not rewrite vision/spec intent.
3. Task docs that conflict with active vision/spec docs are not preserved as actionable work. They are recorded as rejected or superseded.
4. Archive docs may provide context, but they do not override active docs.
5. If two active docs conflict, prefer the more specific doc, the stricter safety rule, and the rule that avoids inventing behavior.
6. Weaker documentation claims about current code are treated as implementation debt or status evidence, not canonical truth.

## Global conflict summary

| Conflict | Resolution |
|---|---|
| Root `README.md` and older workflow docs elevated `VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md` as the universal top authority. | Preserve it as foundational reference, but use the active authority-map tiering and current vision/spec set for day-to-day canonical rules unless explicitly re-promoted. |
| Some task/workflow docs treated active workflow artifacts as authority candidates. | Keep workflow artifacts as evidence and process guidance only. They cannot override vision/spec docs. |
| Older status/audit docs conflict with `VISION_SPEC/07-current-implementation-spec.md`. | Prefer the active current implementation spec and record older status material as reference evidence. |
| Older button overviews conflict with stricter View A auth/preflight button semantics. | Prefer the newer strict button semantics. |
| April 2026 voice spec wording can imply fixed destructive cron install semantics. | Prefer the active scheduler/runtime recovery spec: scheduler install/check behavior is platform-bound and capability-reported where documented. |
| `VISION_SPEC_readme.md` elevates chat addenda while `12-documentation-authority-map.md` defines tiered authority. | Prefer authority-map tiering unless an explicit promotion decision exists. |

## Generated documentation structure

```text
docs/
  main_readme.md
  categorized/
    vision_spec_docs/
      main_readme.md
      product_vision_and_authority.md
      architecture_runtime_and_recovery_spec.md
      dashboard_auth_pipeline_spec.md
    current_implementation_status_docs/
      main_readme.md
      documented_current_system_state.md
      button_and_view_verification_status.md
      known_gaps_and_unresolved_questions.md
    task_documentation_still_to_implement/
      main_readme.md
      active_implementation_backlog.md
      verification_and_reconciliation_tasks.md
      rejected_or_superseded_tasks.md
    other_documentation/
      main_readme.md
      operator_setup_and_auth_notes.md
      documentation_workflow_and_inventory.md
      default_project_settings_and_elements_checklist.md
      archive_and_reference_material.md
```


## Slice 17 canonical reference locations

As of 2026-05-25 01:56 EEST, selected remaining reference/workflow docs have canonical target-folder locations:

| Canonical document | Previous compatibility pointer | Use rule |
|---|---|---|
| `docs/90_archive/reference_material_2026-05-10/archive_and_reference_material.md` | `docs/categorized/other_documentation/archive_and_reference_material.md` | Reference/provenance only. |
| `docs/10_runbooks/documentation_workflow_and_inventory.md` | `docs/categorized/other_documentation/documentation_workflow_and_inventory.md` | Documentation workflow/runbook guidance. |
| `docs/20_architecture_and_specs/reference/default_project_settings_and_elements_checklist.md` | `docs/categorized/other_documentation/default_project_settings_and_elements_checklist.md` | Reusable reference/spec checklist, not proof of implementation. |
| `docs/40_backlog_and_tasks/active_workflow/slice_8_9_route_selection.md` | `docs/active_workflow_docs/slice_8_9_route_selection.md` | Planning/workflow context only. |

## Additional repo-local reference docs

| Document | Scope | Authority limit |
|---|---|---|
| `docs/categorized/other_documentation/default_project_settings_and_elements_checklist.md` | User-supplied checklist of ideal default project settings, files, workflows, and quality gates. | Aspirational/reference only; it does not assert that this repository currently implements every item and does not create active implementation tasks unless separately promoted. |
| `docs/IMPLEMENTATION_GOAL_STATUS_RECONCILIATION_20260512.md` | Canonical reconciliation of implementation goals, statuses, unresolved questions and conflicts as of 2026‑05‑12. | Documentation-only; snapshot‑safe; does not modify behaviour or assert implementation truth. |
| `docs/RUNTIME_TRUTH_AUTHORITY_MAP_20260512.md` | Defines the final authority model for runtime state and truth as of 2026‑05‑12. | Documentation‑only; codifies decisions about SQLite, lock files, logs, `conf/runtime‑truth.json`, front‑end state and backend projections without changing behaviour. |
| `docs/IMPLEMENTATION_STATUS_UPDATE_20260512_NEW_AUTH_PROVIDER_VERIFICATION.md` | Latest status update for NEW AUTH passive skipped-proof UX, active provider verification, shared request logging, and redaction coverage. | Documentation/status update only; records Slice 1-3 implementation state without changing auth behavior. |

## Global old-to-new migration map

Every source document from `docs_to_parse/` is mapped below. Status values are `merged`, `reduced to reference`, `rejected due to conflict`, `obsolete`, or `dropped`.

| Source document | Category | Status | Handling |
|---|---|---|---|
| `active_workflow/INSPECT_CONTROLS_SLICE1_ANALYSIS.md` | task_documentation_still_to_implement | reduced to reference | Workflow-only repair instructions; not behavioral authority. |
| `active_workflow/INSPECT_CONTROLS_SLICE2_VERIFICATION.md` | task_documentation_still_to_implement | reduced to reference | Verification evidence only. |
| `active_workflow_docs/README.md` | other_documentation | merged | Workflow/inventory context merged into documentation workflow notes. |
| `active_workflow_docs/part1_documentation_inventory_skill.md` | other_documentation | reduced to reference | Inventory method retained as process reference. |
| `active_workflow_docs/part1_quick_documentation_inventory_with_loc.md` | other_documentation | merged | Inventory details reduced into workflow/inventory docs. |
| `active_workflow_docs/part2_analyzing_repo_file_folder_structure_skill.md` | other_documentation | reduced to reference | Process reference only; no code analysis preserved as truth. |
| `active_workflow_docs/part2_repo_file_folder_structure_analysis.md` | other_documentation | reduced to reference | Structural analysis reduced to reference because code was not rechecked. |
| `active_workflow_docs/part3_browser_repo_verifier_doc_curator_report.md` | other_documentation | reduced to reference | Browser verification report retained as historical process evidence. |
| `active_workflow_docs/part3_browser_repo_verifier_doc_curator_skill_improved.md` | other_documentation | reduced to reference | Skill/process detail reduced to reference. |
| `active_workflow_docs/part3_documentation_truth_matrix.md` | other_documentation | merged | Authority/truth matrix concepts merged into workflow notes. |
| `active_workflow_docs/part3_prompt_analysis_critique_refinement.md` | other_documentation | reduced to reference | Prompt artifact retained as reference only. |
| `active_workflow_docs/part3_recommended_doc_authority_model.md` | other_documentation | merged | Authority model guidance merged into workflow notes. |
| `active_workflow_docs/part3_slice1_documentation_scope_inventory.md` | other_documentation | reduced to reference | Scope inventory reduced into migration map context. |
| `active_workflow_docs/part3_slice1_repo_evidence_index.md` | other_documentation | reduced to reference | Evidence index retained as reference only. |
| `active_workflow_docs/part3_slice2_classification_notes.md` | other_documentation | reduced to reference | Classification notes reduced into category indexes. |
| `active_workflow_docs/part3_slice3_reconciliation_findings.md` | task_documentation_still_to_implement | merged | Verification leads preserved; authority-candidate framing rejected. |
| `active_workflow_docs/vision_slice1_prompt_analysis_critique_refinement.md` | other_documentation | reduced to reference | Prompt artifact retained as reference only. |
| `active_workflow_docs/vision_slice2_prompt_analysis_critique_refinement.md` | other_documentation | reduced to reference | Prompt artifact retained as reference only. |
| `active_workflow_docs/vision_slice3_prompt_analysis_critique_refinement.md` | other_documentation | reduced to reference | Prompt artifact retained as reference only. |
| `active_workflow_docs/workflow_rule_active_docs_folder_prompt.md` | other_documentation | reduced to reference | Workflow rule retained as process reference only. |
| `AI_AUTHENTICATION_2FA_HANDOFF.md` | current_implementation_status_docs | merged | Auth handoff status merged into current status and operator auth notes. |
| `AUTH_ICLOUDPD_MANUAL_VERIFICATION.md` | current_implementation_status_docs | merged | Manual verification guidance merged into current status and operator auth notes. |
| `AUTH_ICLOUDPD_SESSION_VERIFICATION.md` | current_implementation_status_docs | merged | Session verification behavior merged into current status and operator auth notes. |
| `button_verification_results/AUTHORITATIVE_MISSING_FUNCTIONALITY.md` | current_implementation_status_docs | merged | Missing functionality evidence merged into button/view status and gaps docs. |
| `button_verification_results/INDEX.md` | current_implementation_status_docs | merged | Index status merged into button/view status summary. |
| `button_verification_results/RUN_LOG.md` | current_implementation_status_docs | merged | Run log reduced into verification status notes. |
| `button_verification_results/VIEW_A_1A_VERIFY_ENV.md` | current_implementation_status_docs | merged | Per-button status merged into button/view status summary. |
| `button_verification_results/VIEW_A_2A_CHECK_DB.md` | current_implementation_status_docs | merged | Per-button status merged into button/view status summary. |
| `button_verification_results/VIEW_A_2A_DELETE_DB.md` | current_implementation_status_docs | merged | Per-button status merged into button/view status summary. |
| `button_verification_results/VIEW_A_2A_INSPECT_DB.md` | current_implementation_status_docs | merged | Per-button status merged into button/view status summary. |
| `button_verification_results/VIEW_A_2A_RECREATE_DB.md` | current_implementation_status_docs | merged | Per-button status merged into button/view status summary. |
| `button_verification_results/VIEW_A_3A_CHECK_SCHEDULER.md` | current_implementation_status_docs | merged | Per-button status merged into button/view status summary. |
| `button_verification_results/VIEW_A_3A_INSTALL_SCHEDULER.md` | current_implementation_status_docs | merged | Per-button status merged into button/view status summary. |
| `button_verification_results/VIEW_A_3A_PRINT_SCHEDULER.md` | current_implementation_status_docs | merged | Per-button status merged into button/view status summary. |
| `button_verification_results/VIEW_B_B1_LOGIN_FLOW.md` | current_implementation_status_docs | merged | Per-button status merged into button/view status summary. |
| `button_verification_results/VIEW_B_B2_DOWNLOAD_TEST_ACTION.md` | current_implementation_status_docs | merged | Per-button status merged into button/view status summary. |
| `button_verification_results/VIEW_B_B3_1_DOWNLOAD_STAGE.md` | current_implementation_status_docs | merged | Per-button status merged into button/view status summary. |
| `button_verification_results/VIEW_B_B3_2_INDEX_STAGE.md` | current_implementation_status_docs | merged | Per-button status merged into button/view status summary. |
| `button_verification_results/VIEW_B_B3_3_PARSE_GPS_STAGE.md` | current_implementation_status_docs | merged | Per-button status merged into button/view status summary. |
| `button_verification_results/VIEW_B_B3_4_GEOCODE_STAGE.md` | current_implementation_status_docs | merged | Per-button status merged into button/view status summary. |
| `button_verification_results/VIEW_B_B3_5_ENQUEUE_PLAYBACK_STAGE.md` | current_implementation_status_docs | merged | Per-button status merged into button/view status summary. |
| `button_verification_results/VIEW_B_B3_AUTO_RUN_ALL_STAGES.md` | current_implementation_status_docs | merged | Per-button status merged into button/view status summary. |
| `button_verification_results/VIEW_B_B4_PLAYBACK_SELECTION.md` | current_implementation_status_docs | merged | Per-button status merged into button/view status summary. |
| `button_verification_results/VIEW_B_B5_SCREEN_SIMULATION_CONTROLS.md` | current_implementation_status_docs | merged | Per-button status merged into button/view status summary. |
| `button_verification_workflow/BUTTON_VERIFICATION_ACCELERATION_LAYER.md` | task_documentation_still_to_implement | merged | Verification process retained as evidence for future audits. |
| `button_verification_workflow/BUTTON_VERIFICATION_WORKFLOW.md` | task_documentation_still_to_implement | rejected due to conflict | Verification workflow retained, but its top-authority claim is superseded by authority-map tiering. |
| `buttons_and_implementation_overview.md` | current_implementation_status_docs | reduced to reference | Older status overview retained as uncertain evidence. |
| `CANONICAL_SCHEMA_PROPOSAL.md` | task_documentation_still_to_implement | merged | Proposed schema work merged into active backlog and verification tasks. |
| `default_project_setup/DASHBOARD_INSPECT_CONTROLS_PATTERN.md` | other_documentation | merged | Inspect-controls pattern retained as setup/reference guidance. |
| `IMPLEMENTATION_STATUS_AUDIT.md` | current_implementation_status_docs | reduced to reference | Older/stale audit claims kept as reference; active current implementation spec wins conflicts. |
| `OLD_DOCS/00_TABLE_OF_CONTENTS.md` | other_documentation | obsolete | Historical table of contents reduced to archive reference. |
| `OLD_DOCS/01_SYSTEM_OVERVIEW.md` | vision_spec_docs | reduced to reference | Historical overview retained as non-authoritative archive context. |
| `OLD_DOCS/02_SYSTEM_INVARIANTS.md` | vision_spec_docs | reduced to reference | Historical invariants retained as non-authoritative archive context. |
| `OLD_DOCS/03_ARCHITECTURE.md` | vision_spec_docs | reduced to reference | Historical architecture retained as non-authoritative archive context. |
| `OLD_DOCS/04_SINGLE_SOURCE_OF_TRUTH.md` | vision_spec_docs | reduced to reference | Historical truth model retained as non-authoritative archive context. |
| `OLD_DOCS/05_STATE_MACHINE.md` | vision_spec_docs | reduced to reference | Historical state machine retained as non-authoritative archive context. |
| `OLD_DOCS/06_DATABASE_SCHEMA.md` | vision_spec_docs | reduced to reference | Historical schema retained as non-authoritative archive context. |
| `OLD_DOCS/07_PIPELINE_STAGES.md` | vision_spec_docs | reduced to reference | Historical pipeline detail retained as non-authoritative archive context. |
| `OLD_DOCS/08_WORKERS_AND_OWNERSHIP.md` | vision_spec_docs | reduced to reference | Historical worker ownership retained as non-authoritative archive context. |
| `OLD_DOCS/09_CRON_AND_WATCHDOG.md` | vision_spec_docs | reduced to reference | Historical cron/watchdog detail retained as non-authoritative archive context. |
| `OLD_DOCS/10_CONCURRENCY_AND_LOCKING.md` | vision_spec_docs | reduced to reference | Historical locking detail retained as non-authoritative archive context. |
| `OLD_DOCS/11_LOGGING_AND_EVENT_MODEL.md` | vision_spec_docs | reduced to reference | Historical logging model retained as non-authoritative archive context. |
| `OLD_DOCS/12_STATE_AND_RECOVERY.md` | vision_spec_docs | reduced to reference | Historical recovery model retained as non-authoritative archive context. |
| `OLD_DOCS/13_FRONTEND_BACKEND_CONTRACT.md` | vision_spec_docs | reduced to reference | Historical frontend/backend contract retained as non-authoritative archive context. |
| `OLD_DOCS/14_VERSIONING_AND_CHANGELOG_RULES.md` | other_documentation | obsolete | Superseded by active versioning/changelog policy. |
| `OLD_DOCS/15_CURRENT_IMPLEMENTATION_STATUS.md` | current_implementation_status_docs | reduced to reference | Legacy status retained as archive evidence only. |
| `OLD_DOCS/16_DOCUMENTATION_RECONCILIATION_REPORT.md` | other_documentation | reduced to reference | Historical reconciliation reduced to archive notes. |
| `OLD_DOCS/17_REPO_ANALYSIS_AND_DOC_UPDATE_PROMPT.md` | other_documentation | dropped | Historical prompt artifact not preserved as active guidance. |
| `OLD_DOCS/18_CANONICAL_BACKEND_CONTRACT_SET.md` | vision_spec_docs | reduced to reference | Historical contract set retained as archive context only. |
| `OLD_DOCS/19_BACKEND_RUNTIME_CONTRACT.md` | vision_spec_docs | reduced to reference | Historical runtime contract retained as archive context only. |
| `OLD_DOCS/20_STATE_AND_TRUTH_CONTRACT.md` | vision_spec_docs | reduced to reference | Historical state/truth contract retained as archive context only. |
| `OLD_DOCS/21_EXECUTION_AND_RECOVERY_CONTRACT.md` | vision_spec_docs | reduced to reference | Historical execution/recovery contract retained as archive context only. |
| `OLD_DOCS/22_ACCEPTANCE_AND_VALIDATION_CONTRACT.md` | vision_spec_docs | reduced to reference | Historical acceptance contract retained as archive context only. |
| `OLD_DOCS/23_VIEW_A_INIT_RECONCILIATION_PROMPT.md` | other_documentation | dropped | Historical prompt artifact not preserved as active guidance. |
| `OLD_DOCS/DASHBOARD_OVERVIEW.md` | vision_spec_docs | reduced to reference | Historical dashboard overview retained as archive context only. |
| `OLD_DOCS/issues_errors_discrepancies.md` | current_implementation_status_docs | reduced to reference | Legacy discrepancy registry retained as archive evidence only. |
| `OLD_DOCS/VIEW_A_INIT.md` | vision_spec_docs | reduced to reference | Historical View A doc retained as archive context only. |
| `OLD_DOCS/VIEW_B_TEST.md` | vision_spec_docs | reduced to reference | Historical View B doc retained as archive context only. |
| `OLD_DOCS/VIEW_C_LAST_RUN_INFO.md` | vision_spec_docs | reduced to reference | Historical View C doc retained as archive context only. |
| `OLD_DOCS/VIEW_D_RUNNING_PROCESS.md` | vision_spec_docs | reduced to reference | Historical View D doc retained as archive context only. |
| `OLD_DOCS/VIEW_E_DATABASE_VIEWER.md` | vision_spec_docs | reduced to reference | Historical View E doc retained as archive context only. |
| `VERSIONING_AND_CHANGELOG_POLICY.md` | other_documentation | merged | Active governance retained in operator/workflow docs. |
| `vision_and_implementation/AUTH_AND_2FA_SPEC.md` | vision_spec_docs | reduced to reference | Earlier naming set; active numbered spec is canonical. |
| `vision_and_implementation/CURRENT_IMPLEMENTATION_SPEC.md` | current_implementation_status_docs | reduced to reference | Earlier naming set; active numbered current implementation spec is canonical. |
| `vision_and_implementation/DASHBOARD_VIEWS_SPEC.md` | vision_spec_docs | reduced to reference | Earlier naming set; active numbered spec is canonical. |
| `vision_and_implementation/DEPRECATED_SUPERSEDED_DOCS_LOG.md` | other_documentation | reduced to reference | Earlier naming set; active numbered deprecated/superseded log is canonical. |
| `vision_and_implementation/DOCUMENTATION_AUTHORITY_MAP.md` | other_documentation | reduced to reference | Earlier naming set; active numbered authority map is canonical. |
| `vision_and_implementation/PIPELINE_AND_WORKERS_SPEC.md` | vision_spec_docs | reduced to reference | Earlier naming set; active numbered spec is canonical. |
| `vision_and_implementation/PROJECT_VISION.md` | vision_spec_docs | reduced to reference | Earlier naming set; active numbered spec is canonical. |
| `vision_and_implementation/README.md` | vision_spec_docs | reduced to reference | Earlier bundle index retained as archive context only. |
| `vision_and_implementation/SCHEDULER_AND_RUNTIME_RECOVERY_SPEC.md` | vision_spec_docs | reduced to reference | Earlier naming set; active numbered spec is canonical. |
| `vision_and_implementation/TARGET_ARCHITECTURE_SPEC.md` | vision_spec_docs | reduced to reference | Earlier naming set; active numbered spec is canonical. |
| `vision_and_implementation/UNRESOLVED_QUESTIONS.md` | task_documentation_still_to_implement | obsolete | Superseded by `VISION_SPEC/16-unresolved-questions.md`. |
| `vision_and_implementation/VIEW_A_AUTH_PREFLIGHT_BUTTONS.md` | vision_spec_docs | merged | Specific strict button semantics absorbed into dashboard/auth/pipeline spec. |
| `vision_and_implementation/reconciliation/FINAL_VISION_SPEC_RECONCILIATION_REPORT.md` | other_documentation | merged | Final reconciliation context retained in workflow/reference docs. |
| `vision_and_implementation/reconciliation/SLICE1_SOURCE_INVENTORY_REPORT.md` | other_documentation | reduced to reference | Slice report retained as historical reference only. |
| `vision_and_implementation/reconciliation/SLICE2_CURRENT_VISION_SPEC_REPORT.md` | other_documentation | reduced to reference | Slice report retained as historical reference only. |
| `VISION_SPEC/05-project-vision.md` | vision_spec_docs | merged | Primary active product vision absorbed into product vision/authority doc. |
| `VISION_SPEC/06-target-architecture-spec.md` | vision_spec_docs | merged | Primary active architecture spec absorbed into architecture/runtime doc. |
| `VISION_SPEC/07-current-implementation-spec.md` | current_implementation_status_docs | merged | Primary documentation-derived current status absorbed into current-state docs. |
| `VISION_SPEC/08-pipeline-and-workers-spec.md` | vision_spec_docs | merged | Active pipeline/workers spec absorbed into architecture/runtime and dashboard/pipeline docs. |
| `VISION_SPEC/09-scheduler-and-runtime-recovery-spec.md` | vision_spec_docs | merged | Active scheduler/recovery spec absorbed into architecture/runtime doc. |
| `VISION_SPEC/10-auth-and-2fa-spec.md` | vision_spec_docs | merged | Active auth/2FA spec absorbed into product vision and dashboard/auth docs. |
| `VISION_SPEC/11-dashboard-views-spec.md` | vision_spec_docs | merged | Active dashboard views spec absorbed into dashboard/auth/pipeline doc. |
| `VISION_SPEC/12-documentation-authority-map.md` | other_documentation | merged | Authority tiering merged into global index and workflow docs. |
| `VISION_SPEC/15-vision-and-implementation-reading-guide.md` | other_documentation | merged | Reading guide reduced into category indexes and workflow notes. |
| `VISION_SPEC/16-unresolved-questions.md` | task_documentation_still_to_implement | merged | Active unresolved decisions merged into backlog and verification tasks. |
| `VISION_SPEC/17-deprecated-superseded-docs-log.md` | other_documentation | merged | Supersession tracking merged into workflow/reference docs. |
| `VISION_SPEC/VISION_SPEC_readme.md` | other_documentation | merged | Bundle index and rename map merged into workflow/reference docs. |
| `VISION_SPEC/chat_generated_addenda/01-merged-vision-spec-top5-authority.md` | vision_spec_docs | merged | Non-conflicting addendum decisions selectively absorbed into vision/spec docs. |
| `VISION_SPEC/chat_generated_addenda/02-final-voice-ai-vision-spec-clarifications.md` | vision_spec_docs | merged | Non-conflicting addendum decisions selectively absorbed into vision/spec docs. |
| `VISION_SPEC/chat_generated_addenda/03-raspberry-pi-autonomy-runtime-failure-qa.md` | vision_spec_docs | merged | Non-conflicting runtime/autonomy decisions selectively absorbed into vision/spec docs. |
| `VISION_SPEC/chat_generated_addenda/04-post-slice3-qa-decisions-summary.md` | vision_spec_docs | merged | Non-conflicting post-slice decisions selectively absorbed into vision/spec docs. |
| `VISION_SPEC/chat_generated_addenda/14-qa-vs-april-2026-spec-comparison.md` | other_documentation | reduced to reference | Comparison bridge retained as reference only. |
| `VISION_SPEC/reconciliation/13-final-vision-spec-reconciliation-report.md` | other_documentation | merged | Final reconciliation report merged into workflow/reference docs. |
| `VISION_SPEC/reconciliation/18-slice2-current-vision-spec-report.md` | other_documentation | reduced to reference | Lower-authority slice report retained as historical reference. |
| `VISION_SPEC/reconciliation/19-slice1-source-inventory-report.md` | other_documentation | reduced to reference | Lower-authority slice report retained as historical reference. |
| `VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md` | vision_spec_docs | reduced to reference | Foundational authority preserved, but active authority-map tiering controls conflicts unless explicitly re-promoted. |

## Documentation refactor closure

As of 2026-05-25 02:18 EEST, the broad documentation refactor is closed as an organization pass. See [`DOC_REFACTOR_CLOSURE_REPORT_20260525.md`](DOC_REFACTOR_CLOSURE_REPORT_20260525.md) for the final canonical folder structure, compatibility pointer policy, link-audit status, and rules for where future docs should be added.
