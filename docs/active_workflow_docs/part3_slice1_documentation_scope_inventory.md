# Part 3 Slice 1 — Documentation Scope Inventory

Workflow: `DOCUMENTATION_ANALYSIS_OVERHAUL_AND_RECONCILIATION_LIKE_1PF`  
Slice: 1 of 4  
Snapshot: `12_PF v0.3.24`  
Generated: 2026-04-26 17:26 EEST

## Purpose

This file is the Slice 1 documentation scope inventory. It does not make final truth classifications yet. It lists documentation files, locations, LOC, first headings, and surface purposes so Slice 2 can build the full documentation truth matrix.

## Scope note

`docs/active_workflow_docs/` is included in the file inventory because it exists under `docs/`, but it is treated as generated workflow output. It should not be mixed with product/source-of-truth documentation during authority decisions.

## Documentation counts by area

|Area|Files|LOC|
|---|---|---|
|.codex/skills|6|516|
|active_workflow_docs|6|836|
|docs/OLD_DOCS|31|4380|
|docs/button_verification_results|21|823|
|docs/button_verification_workflow|2|873|
|docs/current|8|3425|
|generated_test_data|1|41|
|root/supporting|4|777|
|task_docs|9|1959|

## Documentation inventory

|#|Path|Area|LOC|Size bytes|First headings|Surface purpose|Slice 1 note|
|---|---|---|---|---|---|---|---|
|1|.codex/skills/button-workflow-verification/references/agent-patterns.md|.codex/skills|126|3052|# Agent Patterns For Repeated Button Audits<br>## Core Rule<br>## Pattern A - File Locator Explorer|Button verification workflow/result documentation.|Supporting context|
|2|.codex/skills/button-workflow-verification/references/compounding-reuse.md|.codex/skills|109|2193|# Compounding Reuse Strategy<br>## Keep These Artifacts Current<br>## Conditional Delegation Policy|Button verification workflow/result documentation.|Supporting context|
|3|.codex/skills/button-workflow-verification/references/repo-evidence-map.md|.codex/skills|44|1933|# 1_PF Button Verification Evidence Map<br>## Canonical Workflow<br>## View A Init|Button verification workflow/result documentation.|Supporting context|
|4|.codex/skills/button-workflow-verification/references/report-template.md|.codex/skills|55|1215|# Button Verification Report Template<br>## Scope<br>## Final Classification|Button verification workflow/result documentation.|Supporting context|
|5|.codex/skills/button-workflow-verification/SKILL.md|.codex/skills|118|6130|# Button Workflow Verification<br>## Overview<br>## Read First|Button verification workflow/result documentation.|Supporting context|
|6|.codex/skills/view-a-init-reconciliation/SKILL.md|.codex/skills|64|2516|# View A Init Reconciliation<br>## Read First<br>## Core Workflow|Local skill/workflow instructions.|Supporting context|
|7|CHANGELOG.md|root/supporting|212|6253|# CHANGELOG<br>## [0.3.24] - 2026-04-26 17:20 EEST<br>### Added|Version history and change log.|Candidate for Part 3 review|
|8|docs/active_workflow_docs/part1_documentation_inventory_skill.md|active_workflow_docs|23|723|# Documentation Inventory Skill<br>## Purpose<br>## Inputs|Local skill/workflow instructions.|Generated workflow artifact|
|9|docs/active_workflow_docs/part1_quick_documentation_inventory_with_loc.md|active_workflow_docs|123|28639|# Documentation Inventory — 12_PF 0.3.23<br>## Inventory Skill Used<br>## Summary|Generated workflow analysis artifact.|Generated workflow artifact|
|10|docs/active_workflow_docs/part2_analyzing_repo_file_folder_structure_skill.md|active_workflow_docs|42|1203|# Skill: Analyzing Repo File/Folder Structure<br>## Purpose<br>## Inputs|Local skill/workflow instructions.|Generated workflow artifact|
|11|docs/active_workflow_docs/part2_repo_file_folder_structure_analysis.md|active_workflow_docs|534|28675|# Repo File/Folder Structure Analysis Report<br>## Prompt analysis<br>## Critical refinement|Generated workflow analysis artifact.|Generated workflow artifact|
|12|docs/active_workflow_docs/README.md|active_workflow_docs|29|1570|# Active Workflow Docs<br>## Current workflow parts<br>## Rule|Repository overview and entry documentation.|Generated workflow artifact|
|13|docs/active_workflow_docs/workflow_rule_active_docs_folder_prompt.md|active_workflow_docs|85|3257|# Workflow Rule Prompt — Active Workflow Docs Folder<br>## User request<br>## Analysis|Generated workflow analysis artifact.|Generated workflow artifact|
|14|docs/AI_AUTHENTICATION_2FA_HANDOFF.md|docs/current|446|15569|# AI Authentication and 2FA Handoff<br>## Purpose<br>## Executive Summary|Authentication / iCloud / 2FA documentation.|Candidate for Part 3 review|
|15|docs/AUTH_ICLOUDPD_MANUAL_VERIFICATION.md|docs/current|127|5838|# iCloudPD Auth Provider Manual Verification<br>## Status<br>## Required configuration|Authentication / iCloud / 2FA documentation.|Candidate for Part 3 review|
|16|docs/AUTH_ICLOUDPD_SESSION_VERIFICATION.md|docs/current|170|7046|# iCloudPD Auth Session Verification<br>## Status<br>## Implemented backend boundary|Authentication / iCloud / 2FA documentation.|Candidate for Part 3 review|
|17|docs/button_verification_results/AUTHORITATIVE_MISSING_FUNCTIONALITY.md|docs/button_verification_results|23|5367|# Authoritative Missing Functionality Ledger<br>## Update Rules<br>## Current Findings|Authentication / iCloud / 2FA documentation.|Candidate for Part 3 review|
|18|docs/button_verification_results/INDEX.md|docs/button_verification_results|26|7466|# Button Verification Index|Button verification workflow/result documentation.|Candidate for Part 3 review|
|19|docs/button_verification_results/RUN_LOG.md|docs/button_verification_results|42|11241|# Button Verification Run Log|Button verification workflow/result documentation.|Candidate for Part 3 review|
|20|docs/button_verification_results/VIEW_A_1A_VERIFY_ENV.md|docs/button_verification_results|51|3498|# View A 1A Verify .env<br>## Scope<br>## Authoritative Spec Callout|Button verification workflow/result documentation.|Candidate for Part 3 review|
|21|docs/button_verification_results/VIEW_A_2A_CHECK_DB.md|docs/button_verification_results|45|2789|# View A 2A Check DB<br>## Scope<br>## Final Classification|Button verification workflow/result documentation.|Candidate for Part 3 review|
|22|docs/button_verification_results/VIEW_A_2A_DELETE_DB.md|docs/button_verification_results|45|2879|# View A 2A Delete DB<br>## Scope<br>## Final Classification|Button verification workflow/result documentation.|Candidate for Part 3 review|
|23|docs/button_verification_results/VIEW_A_2A_INSPECT_DB.md|docs/button_verification_results|45|2782|# View A 2A Inspect DB<br>## Scope<br>## Final Classification|Button verification workflow/result documentation.|Candidate for Part 3 review|
|24|docs/button_verification_results/VIEW_A_2A_RECREATE_DB.md|docs/button_verification_results|45|2866|# View A 2A Recreate DB<br>## Scope<br>## Final Classification|Button verification workflow/result documentation.|Candidate for Part 3 review|
|25|docs/button_verification_results/VIEW_A_3A_CHECK_SCHEDULER.md|docs/button_verification_results|51|3470|# View A 3A Check Scheduler<br>## Scope<br>## Authoritative Spec Callout|Button verification workflow/result documentation.|Candidate for Part 3 review|
|26|docs/button_verification_results/VIEW_A_3A_INSTALL_SCHEDULER.md|docs/button_verification_results|51|3723|# View A 3A Install Scheduler<br>## Scope<br>## Authoritative Spec Callout|Button verification workflow/result documentation.|Candidate for Part 3 review|
|27|docs/button_verification_results/VIEW_A_3A_PRINT_SCHEDULER.md|docs/button_verification_results|51|3430|# View A 3A Print Scheduler<br>## Scope<br>## Authoritative Spec Callout|Button verification workflow/result documentation.|Candidate for Part 3 review|
|28|docs/button_verification_results/VIEW_B_B1_LOGIN_FLOW.md|docs/button_verification_results|48|2732|# View A B1 Auth Preflight<br>## Scope<br>## Authoritative Spec Callout|Button verification workflow/result documentation.|Candidate for Part 3 review|
|29|docs/button_verification_results/VIEW_B_B2_DOWNLOAD_TEST_ACTION.md|docs/button_verification_results|37|2019|# View B B2 Download Test Action<br>## Scope<br>## Authoritative Spec Callout|Button verification workflow/result documentation.|Candidate for Part 3 review|
|30|docs/button_verification_results/VIEW_B_B3_1_DOWNLOAD_STAGE.md|docs/button_verification_results|33|1784|# View B B3.1 Download Stage<br>## Scope<br>## Final Classification|Button verification workflow/result documentation.|Candidate for Part 3 review|
|31|docs/button_verification_results/VIEW_B_B3_2_INDEX_STAGE.md|docs/button_verification_results|31|1542|# View B B3.2 Index Stage<br>## Scope<br>## Final Classification|Button verification workflow/result documentation.|Candidate for Part 3 review|
|32|docs/button_verification_results/VIEW_B_B3_3_PARSE_GPS_STAGE.md|docs/button_verification_results|33|1695|# View B B3.3 Parse GPS Stage<br>## Scope<br>## Final Classification|Button verification workflow/result documentation.|Candidate for Part 3 review|
|33|docs/button_verification_results/VIEW_B_B3_4_GEOCODE_STAGE.md|docs/button_verification_results|34|1839|# View B B3.4 Geocode Stage<br>## Scope<br>## Final Classification|Button verification workflow/result documentation.|Candidate for Part 3 review|
|34|docs/button_verification_results/VIEW_B_B3_5_ENQUEUE_PLAYBACK_STAGE.md|docs/button_verification_results|31|1693|# View B B3.5 Enqueue Playback Stage<br>## Scope<br>## Final Classification|Button verification workflow/result documentation.|Candidate for Part 3 review|
|35|docs/button_verification_results/VIEW_B_B3_AUTO_RUN_ALL_STAGES.md|docs/button_verification_results|33|1916|# View B B3 Auto Run All Stages<br>## Scope<br>## Final Classification|Button verification workflow/result documentation.|Candidate for Part 3 review|
|36|docs/button_verification_results/VIEW_B_B4_PLAYBACK_SELECTION.md|docs/button_verification_results|37|2050|# View B B4 Playback Selection<br>## Scope<br>## Authoritative Spec Callout|Button verification workflow/result documentation.|Candidate for Part 3 review|
|37|docs/button_verification_results/VIEW_B_B5_SCREEN_SIMULATION_CONTROLS.md|docs/button_verification_results|31|1935|# View B B5 Screen Simulation Controls<br>## Scope<br>## Final Classification|Button verification workflow/result documentation.|Candidate for Part 3 review|
|38|docs/button_verification_workflow/BUTTON_VERIFICATION_ACCELERATION_LAYER.md|docs/button_verification_workflow|237|7096|# Button Verification Acceleration Layer<br>## Step 0 - Reuse Existing Evidence First<br>## Delegation Pattern|Button verification workflow/result documentation.|Candidate for Part 3 review|
|39|docs/button_verification_workflow/BUTTON_VERIFICATION_WORKFLOW.md|docs/button_verification_workflow|636|7806|(none)|Button verification workflow/result documentation.|Candidate for Part 3 review|
|40|docs/buttons_and_implementation_overview.md|docs/current|570|16414|# Buttons and Implementation Overview<br>## Status and intended authority<br>## Update rule for future changes|Button verification workflow/result documentation.|Candidate for Part 3 review|
|41|docs/CANONICAL_SCHEMA_PROPOSAL.md|docs/current|287|9902|# Canonical Schema Proposal<br>## Purpose<br>## Source Basis|Database schema notes or schema proposal.|Candidate for Part 3 review|
|42|docs/IMPLEMENTATION_STATUS_AUDIT.md|docs/current|227|19343|# Implementation Status Audit<br>## Purpose<br>## Source of truth used|Documentation headed: Implementation Status Audit|Candidate for Part 3 review|
|43|docs/OLD_DOCS/00_TABLE_OF_CONTENTS.md|docs/OLD_DOCS|126|6849|# Table of Contents (Master Control Document)<br>## Purpose<br>## Most Important Interpretation Rule|Documentation headed: Table of Contents (Master Control Document)|Candidate for Part 3 review|
|44|docs/OLD_DOCS/01_SYSTEM_OVERVIEW.md|docs/OLD_DOCS|85|3379|# System Overview<br>## Purpose<br>## Target System Shape|System architecture or overview documentation.|Candidate for Part 3 review|
|45|docs/OLD_DOCS/02_SYSTEM_INVARIANTS.md|docs/OLD_DOCS|45|2277|# System Invariants<br>## Purpose<br>## Global Invariants|System architecture or overview documentation.|Candidate for Part 3 review|
|46|docs/OLD_DOCS/03_ARCHITECTURE.md|docs/OLD_DOCS|78|2287|# Architecture<br>## Purpose<br>## Primary Components|System architecture or overview documentation.|Candidate for Part 3 review|
|47|docs/OLD_DOCS/04_SINGLE_SOURCE_OF_TRUTH.md|docs/OLD_DOCS|99|3301|# Single Source of Truth<br>## Purpose<br>## Canonical Backend Contract Alignment|Documentation headed: Single Source of Truth|Candidate for Part 3 review|
|48|docs/OLD_DOCS/05_STATE_MACHINE.md|docs/OLD_DOCS|91|2989|# State Machine<br>## Purpose<br>## Canonical Backend Contract Alignment|Documentation headed: State Machine|Candidate for Part 3 review|
|49|docs/OLD_DOCS/06_DATABASE_SCHEMA.md|docs/OLD_DOCS|140|3551|# Database Schema<br>## Purpose<br>## Storage Principles|Database schema notes or schema proposal.|Candidate for Part 3 review|
|50|docs/OLD_DOCS/07_PIPELINE_STAGES.md|docs/OLD_DOCS|64|2012|# Pipeline Stages<br>## Purpose<br>## Ordered Stages|Documentation headed: Pipeline Stages|Candidate for Part 3 review|
|51|docs/OLD_DOCS/08_WORKERS_AND_OWNERSHIP.md|docs/OLD_DOCS|73|2168|# Workers and Ownership<br>## Purpose<br>## Worker Set|Documentation headed: Workers and Ownership|Candidate for Part 3 review|
|52|docs/OLD_DOCS/09_CRON_AND_WATCHDOG.md|docs/OLD_DOCS|61|2909|# Cron and Watchdog<br>## Purpose<br>## Model|Documentation headed: Cron and Watchdog|Candidate for Part 3 review|
|53|docs/OLD_DOCS/10_CONCURRENCY_AND_LOCKING.md|docs/OLD_DOCS|84|3041|# Concurrency and Locking<br>## Purpose<br>## Canonical Backend Contract Alignment|Documentation headed: Concurrency and Locking|Candidate for Part 3 review|
|54|docs/OLD_DOCS/11_LOGGING_AND_EVENT_MODEL.md|docs/OLD_DOCS|75|1839|# Logging and Event Model<br>## Purpose<br>## Principles|Documentation headed: Logging and Event Model|Candidate for Part 3 review|
|55|docs/OLD_DOCS/12_STATE_AND_RECOVERY.md|docs/OLD_DOCS|76|3496|# State and Recovery<br>## Purpose<br>## Canonical Backend Contract Alignment|Documentation headed: State and Recovery|Candidate for Part 3 review|
|56|docs/OLD_DOCS/13_FRONTEND_BACKEND_CONTRACT.md|docs/OLD_DOCS|1023|28222|# Frontend / Backend Contract<br>## Purpose<br>## Current Implementation Truth|Documentation headed: Frontend / Backend Contract|Candidate for Part 3 review|
|57|docs/OLD_DOCS/14_VERSIONING_AND_CHANGELOG_RULES.md|docs/OLD_DOCS|50|1429|# Versioning and Changelog Rules<br>## Purpose<br>## Versioning Model|Version history and change log.|Candidate for Part 3 review|
|58|docs/OLD_DOCS/15_CURRENT_IMPLEMENTATION_STATUS.md|docs/OLD_DOCS|331|12071|# Current Implementation Status<br>## Purpose<br>## Repository Reality Summary|Documentation headed: Current Implementation Status|Candidate for Part 3 review|
|59|docs/OLD_DOCS/16_DOCUMENTATION_RECONCILIATION_REPORT.md|docs/OLD_DOCS|147|5395|# Documentation Reconciliation Report<br>## Purpose<br>## Why reconciliation was needed|Documentation headed: Documentation Reconciliation Report|Candidate for Part 3 review|
|60|docs/OLD_DOCS/17_REPO_ANALYSIS_AND_DOC_UPDATE_PROMPT.md|docs/OLD_DOCS|59|2235|# Repo Analysis and Implementation-Docs Update Prompt<br>## Primary objective<br>## Non-negotiable rules|Documentation headed: Repo Analysis and Implementation-Docs Update Prompt|Candidate for Part 3 review|
|61|docs/OLD_DOCS/18_CANONICAL_BACKEND_CONTRACT_SET.md|docs/OLD_DOCS|90|7218|# Canonical Backend Contract Set<br>## Consolidation Strategy<br>## Proposed New Doc Set|Documentation headed: Canonical Backend Contract Set|Candidate for Part 3 review|
|62|docs/OLD_DOCS/19_BACKEND_RUNTIME_CONTRACT.md|docs/OLD_DOCS|255|8658|# Backend Runtime Contract<br>## Purpose<br>## Sources Absorbed|Documentation headed: Backend Runtime Contract|Candidate for Part 3 review|
|63|docs/OLD_DOCS/20_STATE_AND_TRUTH_CONTRACT.md|docs/OLD_DOCS|197|7676|# State And Truth Contract<br>## Purpose<br>## Sources Absorbed|Documentation headed: State And Truth Contract|Candidate for Part 3 review|
|64|docs/OLD_DOCS/21_EXECUTION_AND_RECOVERY_CONTRACT.md|docs/OLD_DOCS|269|8671|# Execution And Recovery Contract<br>## Purpose<br>## Sources Absorbed|Documentation headed: Execution And Recovery Contract|Candidate for Part 3 review|
|65|docs/OLD_DOCS/22_ACCEPTANCE_AND_VALIDATION_CONTRACT.md|docs/OLD_DOCS|124|4724|# Acceptance And Validation Contract<br>## Purpose<br>## Sources Absorbed|Documentation headed: Acceptance And Validation Contract|Candidate for Part 3 review|
|66|docs/OLD_DOCS/23_VIEW_A_INIT_RECONCILIATION_PROMPT.md|docs/OLD_DOCS|121|5286|# View A Init Reconciliation Prompt<br>## Purpose<br>## Critique Of The Current Prompt|Documentation headed: View A Init Reconciliation Prompt|Candidate for Part 3 review|
|67|docs/OLD_DOCS/DASHBOARD_OVERVIEW.md|docs/OLD_DOCS|84|5492|# Dashboard Overview<br>## Purpose<br>## Views|Documentation headed: Dashboard Overview|Candidate for Part 3 review|
|68|docs/OLD_DOCS/issues_errors_discrepancies.md|docs/OLD_DOCS|196|9184|# Issues / Errors / Discrepancies Registry<br>## Audit Coverage Summary<br>## Issue Index|Documentation headed: Issues / Errors / Discrepancies Registry|Candidate for Part 3 review|
|69|docs/OLD_DOCS/VIEW_A_INIT.md|docs/OLD_DOCS|67|3974|# View A — Init<br>## Purpose<br>## Sections|Documentation headed: View A — Init|Candidate for Part 3 review|
|70|docs/OLD_DOCS/VIEW_B_TEST.md|docs/OLD_DOCS|82|3693|# View B — Test<br>## Purpose<br>## Sections|Documentation headed: View B — Test|Candidate for Part 3 review|
|71|docs/OLD_DOCS/VIEW_C_LAST_RUN_INFO.md|docs/OLD_DOCS|41|1960|# View C — Last Run Info<br>## Purpose<br>## Required Display States|Documentation headed: View C — Last Run Info|Candidate for Part 3 review|
|72|docs/OLD_DOCS/VIEW_D_RUNNING_PROCESS.md|docs/OLD_DOCS|64|2901|# View D — Running Process<br>## Purpose<br>## Runtime Preview vs Test Mode|Documentation headed: View D — Running Process|Candidate for Part 3 review|
|73|docs/OLD_DOCS/VIEW_E_DATABASE_VIEWER.md|docs/OLD_DOCS|83|4573|# View E — Database Viewer<br>## Purpose<br>## Workflow|Documentation headed: View E — Database Viewer|Candidate for Part 3 review|
|74|docs/VERSIONING_AND_CHANGELOG_POLICY.md|docs/current|170|4439|# Forward-Only Versioning and Changelog Policy<br>## Purpose<br>## Scope|Version history and change log.|Candidate for Part 3 review|
|75|docs/VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md|docs/current|1428|45678|# VOICE AI AUTHORITATIVE SPEC - MERGED (2026-04-22)<br>## Source 1<br># Authoritative Voice AI Implementation Overview|Authentication / iCloud / 2FA documentation.|Candidate for Part 3 review|
|76|generated_test_data/README.md|generated_test_data|41|1646|# Photo Frame Test Dataset<br>## What this dataset covers<br>## Recommended uses|Repository overview and entry documentation.|Supporting context|
|77|HOW_TO_RUN.md|root/supporting|9|104|# How to Run|Run/start instructions and operational handoff.|Candidate for Part 3 review|
|78|placeholder_implementations.md|root/supporting|373|55828|# Placeholder Implementation Audit<br>## Authority Note<br>## Latest Update (Step 2 Wave A queue-backed current-item selection)|Documentation headed: Placeholder Implementation Audit|Supporting context|
|79|README.md|root/supporting|183|5118|# Photo Frame Dashboard System<br>## 1. Project Overview<br>## Authoritative Behavioral Spec (Top Priority)|Repository overview and entry documentation.|Candidate for Part 3 review|
|80|task_docs/2026-04-20_dashboard-transit-terminal.md|task_docs|64|2988|# Task Doc — Dashboard Transit Terminal + Single Gateway<br>## Summary<br>## Status|Task-specific implementation notes.|Supporting context|
|81|task_docs/2026-04-20_explain-controls-inspect-mode.md|task_docs|232|9790|# Task Doc — Explain Controls Inspect Mode Button<br>## Summary<br>## Status|Task-specific implementation notes.|Supporting context|
|82|task_docs/2026-04-20_explain-values-source-mode.md|task_docs|224|9484|# Task Doc — Explain Values Source Mode Button<br>## Summary<br>## Status|Task-specific implementation notes.|Supporting context|
|83|task_docs/2026-04-20_runtime-backend-foundation.md|task_docs|374|16020|# Task Doc — Runtime Backend Foundation<br>## Status<br>## Summary|Task-specific implementation notes.|Supporting context|
|84|task_docs/2026-04-20_show-backend-status-mode.md|task_docs|276|11798|# Task Doc — Show Backend Status Inspection Mode Button<br>## Summary<br>## Status|Task-specific implementation notes.|Supporting context|
|85|task_docs/2026-04-20_show-real-vs-mock-mode.md|task_docs|258|10549|# Task Doc — Show Real vs Mock Inspection Mode Button<br>## Summary<br>## Status|Task-specific implementation notes.|Supporting context|
|86|task_docs/2026-04-20_view-e-database-viewer.md|task_docs|445|16095|# Task Doc — View E Database Viewer<br>## Status<br>## Summary|Task-specific implementation notes.|Supporting context|
|87|task_docs/_TABLE_OF_CONTENTS.md|task_docs|42|3703|# Task Docs Table of Contents<br>## Authority<br>## Registry|Task-specific implementation notes.|Supporting context|
|88|task_docs/README.md|task_docs|44|1496|# Task Docs<br>## When to add a doc<br>## Naming convention|Repository overview and entry documentation.|Supporting context|
