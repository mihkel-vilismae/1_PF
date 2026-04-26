# Deprecated and Superseded Documentation Log

Status: Slice 3 updated candidate log.
Created: 2026-04-26 19:47 EEST.
Updated: 2026-04-26 20:08 EEST.
Scope: tracks deprecated, superseded, historical, and parse-candidate documentation without moving or deleting files.

## Rule

A document listed here is not automatically deleted. It is a candidate for later harvesting, archival, or relocation. Before any file is moved to `docs/to_be_deleted/`, useful content must be harvested and the moved file must receive a deletion marker.

## Candidate groups

| Path/group | Candidate status | Reason | Slice 3 handling |
|---|---|---|---|
| `docs/OLD_DOCS/` | HISTORICAL_REFERENCE / PARSE_CANDIDATE | Contains older implementation and planning docs that may conflict with current repo state. | Keep in place; harvest before relocation. |
| `task_docs/` | HISTORICAL_WORKFLOW_REFERENCE / PARSE_CANDIDATE | Contains implementation-task history and generated task docs. | Keep in place; avoid treating as final product spec. |
| Older button/status docs outside current authority set | SUPERSEDED_CANDIDATE | Some claims are replaced by current `docs/vision_and_implementation/` status labels. | Keep as evidence until a dedicated doc cleanup slice. |
| `docs/VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md` | NEEDS_USER_DECISION | Previously high authority, but may now be superseded by this reconciled spec set. | Do not move; ask user whether it remains high-level authority. |
| `docs/buttons_and_implementation_overview.md` | NEEDS_USER_DECISION / PARSE_CANDIDATE | Useful button map may overlap with dashboard specs and button verification results. | Do not move; decide after dashboard/button docs consolidation. |

## Replacement map created by Slice 3

| New/current doc | Supersedes or reduces reliance on |
|---|---|
| `PROJECT_VISION.md` | Scattered product-vision notes in old planning docs. |
| `CURRENT_IMPLEMENTATION_SPEC.md` | Stale implementation-status summaries that do not distinguish current reality from intent. |
| `DASHBOARD_VIEWS_SPEC.md` | Older view-role explanations that blur mock/test/real boundaries. |
| `TARGET_ARCHITECTURE_SPEC.md` | Scattered architecture intent docs. |
| `PIPELINE_AND_WORKERS_SPEC.md` | Scattered pipeline/worker notes. |
| `AUTH_AND_2FA_SPEC.md` | Stale auth descriptions that imply fake/frontend auth state. |
| `SCHEDULER_AND_RUNTIME_RECOVERY_SPEC.md` | Scattered cron/scheduler/recovery notes. |
| `DOCUMENTATION_AUTHORITY_MAP.md` | Ad hoc authority assumptions. |

## Required future deletion marker

If a later slice moves a file into `docs/to_be_deleted/`, add this marker at the top of the moved file:

```markdown
# FOR DELETION

Status: Deprecated / duplicate / superseded.
Reason: <specific reason>
Replacement: <new authority doc or docs>
Reviewed: <Estonian timestamp>
```

## Next recommended cleanup slice

Run a dedicated documentation relocation slice that:

1. Reads each candidate file.
2. Harvests unique useful content into active docs or parsed references.
3. Marks fully superseded docs.
4. Moves harvested reference docs into `docs/docs_parsed/`.
5. Moves truly superseded docs into `docs/to_be_deleted/` with the required marker.
6. Does not permanently delete files.
