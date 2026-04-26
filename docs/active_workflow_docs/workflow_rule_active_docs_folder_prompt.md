# Workflow Rule Prompt — Active Workflow Docs Folder

Workflow: `DOCUMENTATION_ANALYSIS_OVERHAUL_AND_RECONCILIATION_LIKE_1PF`

Estonian timestamp: 2026-04-26 17:20 EEST

## User request

When running this workflow on a repo, generate a folder called `/docs/active_workflow_docs/` and store the results/reports in that folder. Give a good prompt, critique, analyze, refine, and run it.

## Analysis

The workflow already produced multiple reports outside the repository workspace. That is useful for immediate chat delivery, but weak for long-term repo governance because the reports are detached from the repo state they describe.

The correct durable behavior is to create a repo-local workflow output folder under `docs/` so the analysis artifacts travel with the repo and can be referenced by later documentation cleanup, reconciliation, and implementation agents.

## Critique

The raw instruction is directionally correct, but it needs stronger rules:

1. The folder should be created automatically if missing.
2. The folder should be reused if already present.
3. Reports should use stable filenames that identify workflow part/order.
4. The folder should contain an index README.
5. The workflow should avoid scattering generated reports across the repo root, `docs/`, `task_docs/`, or chat-only artifacts.
6. Superseded reports should not be silently deleted.
7. The workflow should preserve existing repo content and avoid changing runtime behavior.

## Refined prompt

```text
You are running the repository documentation workflow named DOCUMENTATION_ANALYSIS_OVERHAUL_AND_RECONCILIATION_LIKE_1PF.

Before generating any workflow report, create or reuse this folder:

  docs/active_workflow_docs/

Store all generated workflow artifacts in that folder, including:
- documentation inventories
- repo structure reports
- LOC summaries
- skill definitions used for the run
- prompt-analysis records
- reconciliation notes
- handoff documents

Create or update:

  docs/active_workflow_docs/README.md

The README must list each generated artifact, the workflow part it belongs to, and its purpose.

Do not scatter active workflow reports into the repo root or unrelated docs folders.
Do not delete old reports unless explicitly instructed.
Do not change production code while performing documentation analysis.
Preserve existing repo behavior.
```

## Run result

Implemented for this repository by creating:

```text
docs/active_workflow_docs/
```

and storing the current part-one and part-two workflow reports and skill definitions inside it.

## Preserved

- Existing source code behavior
- Existing documentation files outside the new workflow folder
- Existing repository layout, except for adding the active workflow docs folder

## Changed

- Added a dedicated active workflow output folder
- Added a workflow folder README
- Copied current documentation inventory and repo structure reports into that folder
- Added this prompt-analysis and workflow-rule record

## Risks / tradeoffs

- This adds more documentation files before the cleanup/reconciliation phase.
- The tradeoff is intentional because these files are active workflow evidence and should remain available until the reconciliation pass decides what to consolidate or archive.
