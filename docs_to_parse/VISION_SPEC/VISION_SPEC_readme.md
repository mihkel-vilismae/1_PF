# Vision/Spec Documents Bundle

Created: 2026-04-26 20:47 EEST.

This folder collects the vision/specification documents created during the documentation reconciliation and follow-up Q&A work. It is a documentation-only bundle; it is not a full repository ZIP and does not include `.git` history.

## Naming standard

All bundled markdown documents now use a common naming pattern:

```text
NN-short-kebab-case-title.md
```

- `NN` is the ranked reading/authority number.
- Names are lowercase.
- Words are separated with hyphens.
- The bundle index is stored as `VISION_SPEC_readme.md` in this repository and is ranked last as the file guide.

## Recommended reading order

Start with document **#1**. It is the best current single-file authority because it merges the newest user decisions with the strongest repository-created specs. Then read the addenda and implementation/status documents as needed.

## Ranked Markdown File Index

| # | File | Authority / Status | Main Area | Source | Use this when... | Notes |
|---:|---|---|---|---|---|---|
| 1 | `chat_generated_addenda/01-merged-vision-spec-top5-authority.md` | Highest current working authority | Consolidated vision/spec | Chat-generated merge of top 5 authority sources | Start here for future planning, prompts, or implementation scope | Newest explicit Q&A decisions override older conflicting docs. |
| 2 | `chat_generated_addenda/02-final-voice-ai-vision-spec-clarifications.md` | High-authority addendum | Final clarification decisions | Follow-up Voice AI Q&A | Apply latest scope clarifications after reading #1 | Captures no external integrations, no archival planning, and notification preview gap. |
| 3 | `chat_generated_addenda/03-raspberry-pi-autonomy-runtime-failure-qa.md` | High-authority addendum | Raspberry Pi autonomy and failure handling | Voice AI Q&A | Implementing autonomous runtime, stale locks, low disk mode, offline mode, power recovery, or playback continuity | Important production-behavior addendum for Raspberry Pi. |
| 4 | `chat_generated_addenda/04-post-slice3-qa-decisions-summary.md` | High-authority Q&A summary | User decisions after Slice 3 | Voice AI Q&A | Need the detailed decision trail behind the merged spec | Covers mock/real separation, GPS/geocoding, auth sessions, cron, docs cleanup. |
| 5 | `05-project-vision.md` | Active repo authority | Product vision | Slice 2 repo docs | Need the project identity, goal, and product direction | Should absorb later Q&A decisions in the next repo update. |
| 6 | `06-target-architecture-spec.md` | Active repo authority | Target architecture | Slice 3 repo docs | Need intended architecture and boundaries | Should be reconciled with newer autonomy and runtime addenda. |
| 7 | `07-current-implementation-spec.md` | Active repo authority | Current implementation status | Slice 2 repo docs | Need to distinguish implemented, partial, planned, unknown, and deprecated behavior | Main implementation-status document. |
| 8 | `08-pipeline-and-workers-spec.md` | Active repo authority | Pipeline and workers | Slice 3 repo docs | Working on stages, workers, queues, locks, or worker behavior | Should absorb stale-lock and playback/offline decisions later. |
| 9 | `09-scheduler-and-runtime-recovery-spec.md` | Active repo authority | Scheduler, cron, recovery | Slice 3 repo docs | Working on cron, Windows cron emulator, Linux/Raspberry Pi scheduling, or recovery | Should absorb low-disk/offline/stale-lock details later. |
| 10 | `10-auth-and-2fa-spec.md` | Active repo authority | Authentication and 2FA | Slice 3 repo docs | Working on iCloud auth, 2FA, sessions, or login behavior | Later decisions clarify valid sessions should be reused until re-login is truly needed. |
| 11 | `11-dashboard-views-spec.md` | Active repo authority | Dashboard views | Slice 2 repo docs | Working on View A, View B, View C, View D, or dashboard responsibilities | Later decisions add notification preview/testing as a dashboard coverage gap. |
| 12 | `12-documentation-authority-map.md` | Active repo authority map | Documentation governance | Slice 1 + Slice 3 repo docs | Need to understand which docs are authoritative, historical, or superseded | Use before moving or deleting docs. |
| 13 | `reconciliation/13-final-vision-spec-reconciliation-report.md` | Reconciliation authority | Final Slice 3 reconciliation | Slice 3 repo docs | Need end-of-slice reconciliation result and summary of changes | Audit trail; not the best single product spec. |
| 14 | `chat_generated_addenda/14-qa-vs-april-2026-spec-comparison.md` | Comparison / reconciliation aid | Differences vs April 2026 spec | Chat-generated comparison | Need to see what changed between new Q&A decisions and the April 2026 authority spec | Bridge document for updating older docs. |
| 15 | `15-vision-and-implementation-reading-guide.md` | Navigation / index | Reading order for repo docs | Slice 1-3 repo docs | Need a quick guide to the repo docs folder | `VISION_SPEC_readme.md` is the better guide for this folder. |
| 16 | `16-unresolved-questions.md` | Open questions tracker | Unresolved decisions | Slice 1-3 repo docs | Need the list of items that still need user decisions | Some items were answered later in Q&A addenda and need next-pass updates. |
| 17 | `17-deprecated-superseded-docs-log.md` | Documentation cleanup tracker | Deprecated/superseded docs | Slice 1-3 repo docs | Planning doc relocation, harvesting, or deletion marking | Records candidates and reasons; does not move files. |
| 18 | `reconciliation/18-slice2-current-vision-spec-report.md` | Slice report | Slice 2 work summary | Slice 2 repo docs | Need audit trail for current vision/current implementation doc creation | Lower authority than actual spec files. |
| 19 | `reconciliation/19-slice1-source-inventory-report.md` | Slice report | Source inventory | Slice 1 repo docs | Need initial documentation inventory and authority basis | Lower authority than final authority map. |
| 20 | `VISION_SPEC_readme.md` | Bundle index | Bundle file guide | Generated bundle README | Need the ranked file table and naming standard | This file is the entrypoint for the ZIP bundle. |

## Authority interpretation

- **Highest current working authority**: best single document to start from for future planning or prompts.
- **High-authority addendum**: newer explicit user decisions that should override older conflicting content.
- **Active repo authority**: documentation created inside the repo during the 3-slice reconciliation workflow.
- **Tracker/report**: useful evidence and audit material, but not usually the first source for product behavior.
- **Bundle index**: navigation only; it is not a product specification.

## Practical next-update reading order

1. Read `chat_generated_addenda/01-merged-vision-spec-top5-authority.md`.
2. Apply the two newer addenda: `chat_generated_addenda/02-final-voice-ai-vision-spec-clarifications.md` and `chat_generated_addenda/03-raspberry-pi-autonomy-runtime-failure-qa.md`.
3. Update the repo docs under `docs/VISION_SPEC/` so they include the newer decisions.
4. Update `16-unresolved-questions.md` by removing or marking questions that were answered in the addenda.
5. Keep `07-current-implementation-spec.md` separate from future/target vision so the project never loses track of what is actually implemented.

## Rename map

| Old file | New file |
|---|---|
| `chat_generated_addenda/MERGED_VISION_SPEC_FROM_TOP5.md` | `chat_generated_addenda/01-merged-vision-spec-top5-authority.md` |
| `chat_generated_addenda/FINAL_VOICE_AI_VISION_SPEC_CLARIFICATIONS.md` | `chat_generated_addenda/02-final-voice-ai-vision-spec-clarifications.md` |
| `chat_generated_addenda/RASPBERRY_PI_AUTONOMY_RUNTIME_FAILURE_QA.md` | `chat_generated_addenda/03-raspberry-pi-autonomy-runtime-failure-qa.md` |
| `chat_generated_addenda/POST_SLICE3_QA_DECISIONS_SUMMARY.md` | `chat_generated_addenda/04-post-slice3-qa-decisions-summary.md` |
| `PROJECT_VISION.md` | `05-project-vision.md` |
| `TARGET_ARCHITECTURE_SPEC.md` | `06-target-architecture-spec.md` |
| `CURRENT_IMPLEMENTATION_SPEC.md` | `07-current-implementation-spec.md` |
| `PIPELINE_AND_WORKERS_SPEC.md` | `08-pipeline-and-workers-spec.md` |
| `SCHEDULER_AND_RUNTIME_RECOVERY_SPEC.md` | `09-scheduler-and-runtime-recovery-spec.md` |
| `AUTH_AND_2FA_SPEC.md` | `10-auth-and-2fa-spec.md` |
| `DASHBOARD_VIEWS_SPEC.md` | `11-dashboard-views-spec.md` |
| `DOCUMENTATION_AUTHORITY_MAP.md` | `12-documentation-authority-map.md` |
| `reconciliation/FINAL_VISION_SPEC_RECONCILIATION_REPORT.md` | `reconciliation/13-final-vision-spec-reconciliation-report.md` |
| `chat_generated_addenda/QA_vs_April2026_Spec_Comparison.md` | `chat_generated_addenda/14-qa-vs-april-2026-spec-comparison.md` |
| `docs/vision_and_implementation/README.md` | `15-vision-and-implementation-reading-guide.md` |
| `UNRESOLVED_QUESTIONS.md` | `16-unresolved-questions.md` |
| `DEPRECATED_SUPERSEDED_DOCS_LOG.md` | `17-deprecated-superseded-docs-log.md` |
| `reconciliation/SLICE2_CURRENT_VISION_SPEC_REPORT.md` | `reconciliation/18-slice2-current-vision-spec-report.md` |
| `reconciliation/SLICE1_SOURCE_INVENTORY_REPORT.md` | `reconciliation/19-slice1-source-inventory-report.md` |
