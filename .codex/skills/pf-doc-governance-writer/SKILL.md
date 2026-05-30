---
name: pf-doc-governance-writer
description: Use when creating, updating, moving, or validating documentation in S:\PF_login so docs follow the canonical numbered folder structure, preserve compatibility pointers and old index navigation policy, update DOC_INDEX.md and DOC_FRESHNESS_MATRIX.md when needed, and verify local Markdown links before completion.
---

# PF Documentation Governance Writer

Use this skill for documentation generation and documentation maintenance in this repository. It is a workflow for safe doc placement and truth labeling, not a source of runtime truth.

## Read First

Before making documentation claims, reorganizing docs, or choosing a destination, read:

- `AGENTS.md`
- `docs/DOC_REFACTOR_CLOSURE_REPORT_20260525.md`
- `docs/table_of_contents.md`
- `docs/DOC_INDEX.md`
- `docs/DOC_FRESHNESS_MATRIX.md`
- `docs/DOC_REORGANIZATION_PLAN.md`
- `docs/DOC_LINK_AUDIT.md`

Use these as navigation and policy constraints. Prefer code, tests, generated evidence, and direct runtime checks over documentation when implementation truth matters.

## Classify the Request

Classify each requested doc or doc change into one primary type:

- Current verified or evidence-backed truth
- Operator runbook or how-to
- Architecture, contract, target behavior, or reference spec
- Dated implementation or status snapshot
- Backlog, TODO, task prompt, or future-work note
- Audit, migration, placeholder, or refactor report
- Historical or provenance material
- Tool-local documentation
- Test-data documentation

If the request mixes types, split the output into clearly labeled files or sections instead of blending authority levels.

## Canonical Placement

Use the repository's canonical placement rules:

- `docs/00_current_truth/` for verified or evidence-backed current truth only.
- `docs/10_runbooks/` for operator procedures and how-to material.
- `docs/20_architecture_and_specs/` for architecture, contracts, target behavior, and reusable specs.
- `docs/30_status_snapshots/<YYYY-MM-DD>/` for dated implementation/status snapshots.
- `docs/40_backlog_and_tasks/` for backlog, TODOs, task prompts, and future-work notes.
- `docs/50_audits_and_migrations/` for audits, migration plans, placeholder reports, and refactor reports.
- `docs/90_archive/` for historical and provenance material.
- `tools/<tool-name>/` for tool-local docs.
- `generated_test_data/` for test-data documentation.

Do not add new canonical content to `docs/categorized/*`, root compatibility pointers, old task paths, or other legacy navigation locations unless the user explicitly asks for pointer-only handling.

## Truth Labels

For substantive doc content, separate:

- `Verified`: checked against current code, tests, generated evidence, or runtime output in this task.
- `Inferred`: follows from repository patterns or existing docs but was not directly verified.
- `Unverified`: plausible or requested, but no direct evidence was checked.
- `Historical`: useful provenance, not current implementation truth.

Do not claim implementation behavior is preserved or current unless the relevant code path, test, runtime output, or generated evidence was checked.

## Compatibility Policy

- Keep compatibility pointers and old category indexes intact by default.
- Do not retire, delete, or rewrite compatibility pointers unless the user explicitly scopes a link-retirement audit.
- New links should point to canonical numbered folders.
- If moving a doc, preserve old-path compatibility pointer behavior unless the user explicitly says not to.
- Treat old category indexes as compatibility navigation, not as canonical destinations.

## Required Collateral Updates

When adding, moving, deleting, or materially reclassifying canonical documentation, update:

- `docs/table_of_contents.md`
- `docs/DOC_INDEX.md`
- `docs/DOC_FRESHNESS_MATRIX.md`

Record the new or changed path, document kind, authority, freshness, topics if relevant, and any compatibility-pointer status. If these files are not updated, state why the doc inventory did not need to change.

For new current-truth, runbook, spec, status, backlog, audit, or archive files, also update the nearest canonical folder `README.md` when it functions as a local catalog.

## Verification

Before completing a doc task:

1. Inspect `git diff --check`.
2. Verify local Markdown links for every changed Markdown file and any touched index or pointer file.
3. Confirm new docs are in canonical locations and legacy pointers/indexes were not silently changed.
4. Report what was verified, what was inferred, and what remains uncertain.

If no repository-specific link checker exists, use a targeted local-link check or a small one-off script for the changed files. Do not claim a full documentation link audit unless the full audit was actually run.

## Output Contract

For non-trivial doc work, report:

- Task understanding
- Verified current-state summary
- Request classification and placement decision
- Preserved behavior and modified documentation behavior
- Files changed
- Diff summary
- Verification commands and results
- Regression risks and compatibility-pointer impact
- Commit breakdown if the user asks for commit-ready work

## Guardrails

Do not:

- Treat archived, backlog, TODO, spec, or compatibility-pointer docs as current implementation truth without direct evidence.
- Centralize tool-local docs into `docs/` by default.
- Mix unrelated refactors into documentation generation.
- Skip `docs/table_of_contents.md`, `DOC_INDEX.md`, and `DOC_FRESHNESS_MATRIX.md` maintenance when the canonical inventory changes.
- Present generated documentation as proof that the implementation works.
