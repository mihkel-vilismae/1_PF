# Part 3 Slice 3 — Recommended Documentation Authority Model

Workflow: `DOCUMENTATION_ANALYSIS_OVERHAUL_AND_RECONCILIATION_LIKE_1PF`  
Skill mode: `Browser Repo Verifier & Doc Curator — 1PF Documentation Reconciliation Mode`  
Input snapshot: post-Slice-2 `12_PF v0.3.24` repository state.  
Generated: 2026-04-26 18:04 EEST

## Safety statement

No documentation was moved, deleted, or rewritten in this slice. This file is a recommended future authority model only.

## Proposed authority rule

Use a small set of current, verified documents as reader-facing source-of-truth. Keep historical docs as evidence until their useful content has been deliberately harvested or superseded.

## Recommended source-of-truth candidates

| Path | Exists | Proposed authority role | Recommended action | Confidence |
|---|---:|---|---|---|
| `README.md` | Yes | Root project overview and quick orientation. | keep/update | medium |
| `CHANGELOG.md` | Yes | Version history and change log. | keep/update | high |
| `VERSION` | Yes | Version source-of-truth | keep as source-of-truth | high |
| `package.json` | Yes | npm script/package metadata source-of-truth | keep as source-of-truth | high |
| `schema.sql` | Yes | database schema source-of-truth | keep as source-of-truth | high |
| `docs/VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md` | Yes | Authentication/iCloud provider documentation. | keep/update | medium |
| `docs/IMPLEMENTATION_STATUS_AUDIT.md` | Yes | Database/schema or persistence-related documentation. | keep/update | medium |
| `docs/buttons_and_implementation_overview.md` | Yes | Authentication/iCloud provider documentation. | keep/update | medium |
| `docs/VERSIONING_AND_CHANGELOG_POLICY.md` | Yes | Version history and change log. | keep/update | medium |
| `docs/AI_AUTHENTICATION_2FA_HANDOFF.md` | Yes | Authentication/iCloud provider documentation. | keep/update | medium |


## Recommended supporting-reference docs

| Area | Supporting docs | Future handling |
|---|---|---|
| Active workflow evidence | `docs/active_workflow_docs/part*.md` | Keep as workflow evidence, not user-facing product docs. |
| Button verification evidence | `docs/button_verification_results/*.md` | Keep as evidence records; summarize through one button overview/index. |
| Button verification workflow | `docs/button_verification_workflow/*.md` | Keep if still used by agents; otherwise archive after summary. |
| Task docs | `task_docs/*.md` | Use as implementation history/evidence, not current product authority unless validated. |
| Codex skills | `.codex/skills/**/*.md` | Keep as workflow/agent rules, separate from product documentation. |

## Recommended docs to regenerate or update later

| Path | Reason | Priority |
|---|---|---|
| `HOW_TO_RUN.md` | Regenerate from package scripts, server entrypoint, tests, dashboard startup, and platform notes. | high |
| `docs/CANONICAL_SCHEMA_PROPOSAL.md` | Convert from proposal wording to verified schema reference only after field-level schema comparison. | medium |
| `docs/AI_AUTHENTICATION_2FA_HANDOFF.md` | Update after endpoint-level auth verification and merge/point to manual/session docs. | medium |
| `docs/buttons_and_implementation_overview.md` | Keep as button-facing overview; reconcile with per-button result docs. | medium |

## Recommended archive policy

1. Do not delete `docs/OLD_DOCS/` until useful content has been harvested.
2. Keep historical docs under an explicit archive area with a banner explaining they are not current source-of-truth.
3. Promote only verified facts into current docs.
4. Every archive/deletion decision should cite the replacement source-of-truth document.
5. Button result evidence can remain as historical proof even if summarized elsewhere.

## Recommended merge targets

### Authentication / iCloud login docs

| File | Exists | Slice 2 classification/action |
|---|---:|---|
| `docs/AI_AUTHENTICATION_2FA_HANDOFF.md` | Yes | current but incomplete / update |
| `docs/AUTH_ICLOUDPD_MANUAL_VERIFICATION.md` | Yes | current but incomplete / update |
| `docs/AUTH_ICLOUDPD_SESSION_VERIFICATION.md` | Yes | current but incomplete / update |

### Schema / DB docs

| File | Exists | Slice 2 classification/action |
|---|---:|---|
| `docs/CANONICAL_SCHEMA_PROPOSAL.md` | Yes | current but incomplete / update |
| `docs/OLD_DOCS/06_DATABASE_SCHEMA.md` | Yes | old but still useful / archive |
| `docs/OLD_DOCS/13_FRONTEND_BACKEND_CONTRACT.md` | Yes | old but still useful / archive |

### System architecture historical docs

| File | Exists | Slice 2 classification/action |
|---|---:|---|
| `docs/OLD_DOCS/01_SYSTEM_OVERVIEW.md` | Yes | old but still useful / archive |
| `docs/OLD_DOCS/02_SYSTEM_INVARIANTS.md` | Yes | old but still useful / archive |
| `docs/OLD_DOCS/03_ARCHITECTURE.md` | Yes | old but still useful / archive |
| `docs/OLD_DOCS/04_SINGLE_SOURCE_OF_TRUTH.md` | Yes | old but still useful / archive |
| `docs/OLD_DOCS/05_STATE_MACHINE.md` | Yes | old but still useful / archive |
| `docs/OLD_DOCS/12_STATE_AND_RECOVERY.md` | Yes | old but still useful / archive |
| `docs/OLD_DOCS/20_STATE_AND_TRUTH_CONTRACT.md` | Yes | old but still useful / archive |

### Button verification docs

| File | Exists | Slice 2 classification/action |
|---|---:|---|
| `docs/button_verification_results/AUTHORITATIVE_MISSING_FUNCTIONALITY.md` | Yes | old but still useful / archive |
| `docs/button_verification_results/INDEX.md` | Yes | old but still useful / archive |
| `docs/button_verification_results/RUN_LOG.md` | Yes | old but still useful / archive |
| `docs/button_verification_results/VIEW_A_1A_VERIFY_ENV.md` | Yes | old but still useful / archive |
| `docs/button_verification_results/VIEW_A_2A_CHECK_DB.md` | Yes | old but still useful / archive |
| `docs/button_verification_results/VIEW_A_2A_DELETE_DB.md` | Yes | old but still useful / archive |
| `docs/button_verification_results/VIEW_A_2A_INSPECT_DB.md` | Yes | old but still useful / archive |
| `docs/button_verification_results/VIEW_A_2A_RECREATE_DB.md` | Yes | old but still useful / archive |
| `docs/button_verification_results/VIEW_A_3A_CHECK_SCHEDULER.md` | Yes | old but still useful / archive |
| `docs/button_verification_results/VIEW_A_3A_INSTALL_SCHEDULER.md` | Yes | old but still useful / archive |
| `docs/button_verification_results/VIEW_A_3A_PRINT_SCHEDULER.md` | Yes | old but still useful / archive |
| `docs/button_verification_results/VIEW_B_B1_LOGIN_FLOW.md` | Yes | old but still useful / archive |



## Recommended docs to leave untouched for now

| Area | Reason |
|---|---|
| `docs/OLD_DOCS/` | Old but useful; needs harvesting before archive/deletion decisions. |
| `docs/button_verification_results/` | Evidence records; do not delete before summary and provenance preservation. |
| `docs/active_workflow_docs/` | Current workflow artifacts; required for Part 3 continuity. |
| `.codex/skills/` | Workflow skill docs; should not be mixed into product documentation. |

## Proposed future folder structure

```text
docs/
  README.md or DOCS_INDEX.md
  HOW_TO_RUN.md or root HOW_TO_RUN.md as canonical run handoff
  ARCHITECTURE.md
  AUTH.md
  DATABASE_SCHEMA.md
  API_ENDPOINTS.md
  BUTTONS_AND_VIEWS.md
  TESTING.md
  VERSIONING_AND_CHANGELOG_POLICY.md
  active_workflow_docs/
  archive/
    old_docs/
    button_verification_results/
```

## Explicit no-movement note

This Slice 3 run did not move, delete, rename, or rewrite any existing documentation. It only added generated reports under `docs/active_workflow_docs/`.

## Slice 4 handoff

Slice 4 should create the final `part3_browser_repo_verifier_doc_curator_report.md`, update `README.md` inside `docs/active_workflow_docs/`, then perform the final version/changelog update and ZIP packaging.
