# Browser Repo Verifier & Doc Curator — 1PF Documentation Reconciliation Mode

Workflow: `DOCUMENTATION_ANALYSIS_OVERHAUL_AND_RECONCILIATION_LIKE_1PF`  
Part: 3  
Purpose: Compare documentation claims against repository reality and produce a safe, evidence-backed documentation reconciliation report.

## Operating mode

This skill runs in slices. It must not delete, move, or rewrite existing documentation during analysis slices. It must store generated reports only under:

```text
docs/active_workflow_docs/
```

## Slice model

| Slice | Purpose | Output style |
|---:|---|---|
| 1 | Build evidence index, documentation inventory, and refined rules | Foundation reports |
| 2 | Create table-first documentation truth matrix | One row per document |
| 3 | Build reconciliation findings and authority model | Future doc structure and actions |
| 4 | Finalize report, update metadata, package repo | Final report and ZIP |

## Repo-specific rules for 12_PF

1. Treat the uploaded ZIP as the immutable snapshot.
2. Treat `docs/active_workflow_docs/` as generated workflow output.
3. Include root docs, `docs/`, and `docs/OLD_DOCS/` in documentation scope.
4. Use `task_docs/` and `.codex/skills/` as supporting context only unless explicitly requested.
5. Compare documentation claims to repo evidence from:
   - `package.json` scripts
   - `VERSION`
   - `schema.sql`
   - `server/index.js`
   - `server/scripts/sqlite_admin.py`
   - `dashboard/`
   - `tests/`
   - `scripts/`
   - `tools/`
6. Distinguish recommendation from action. This skill may recommend update, merge, archive, or deletion later, but it must not perform those actions during analysis.

## Classification model for later slices

Primary classification, exactly one:

- authoritative/current
- current but incomplete
- old but still useful
- duplicate/overlapping
- stale/outdated
- contradictory
- unclear / needs deeper verification

Secondary labels, zero or more:

- mentions old path
- mentions missing command
- mentions missing endpoint
- conflicts with implementation
- conflicts with another doc
- repeats another doc
- useful historical context
- should be merged
- should be archived
- should be kept as source-of-truth
- too thin / insufficient
- needs HOW_TO_RUN regeneration
- needs schema verification
- needs endpoint verification
- needs test verification

## Evidence discipline

Every major classification must cite concrete repo evidence such as file presence, missing paths, npm scripts, endpoints, schema tables, test files, headings, or conflicting documentation claims.

## Safety constraints

- Do not modify production code.
- Do not delete documentation.
- Do not move documentation.
- Do not rewrite existing documentation except generated reports in `docs/active_workflow_docs/`.
- Preserve existing behavior.
- Use one logical commit only when packaging the final documentation update.
