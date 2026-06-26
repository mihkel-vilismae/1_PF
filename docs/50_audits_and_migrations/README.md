# Audits and Migrations

> Current checkpoint: `v0.10.65`. This README was refreshed in the docs/launcher reconciliation pass; code, focused tests, proof artifacts, and runtime evidence override stale prose.

Estonian timestamp: 2026-06-11 18:30 EEST

## Purpose

This folder is for audit reports, migration plans, refactor notes, and cleanup/reconciliation reports.

## Belongs here

- type/function audits.
- migration plans.
- placeholder/dead-code reports.
- documentation reconciliation reports.

## Does not belong here

- active run commands.
- current-truth summaries that are not audit-based.
- unverified speculative backlog prompts.

## Canonical audit and migration documents

These audit/migration documents are now canonical in this folder:

- [Type Function Audit and Migration Plan](TYPE_FUNCTION_AUDIT_AND_MIGRATION_PLAN.md)
- [Type Function Migration Closure Audit](TYPE_FUNCTION_MIGRATION_CLOSURE_AUDIT.md)
- [Placeholder Implementation Audit](placeholder_implementations.md)
- [Documentation Consistency Audit — 2026-06-11](DOC_CONSISTENCY_AUDIT_20260611.md)
- [PF_login Project Status Analysis — 2026-06-11](PF_LOGIN_PROJECT_STATUS_ANALYSIS_20260611.md)
- [Documentation and OpenSpec Coverage Grading Audit — 2026-06-16](DOCS_OPENSPEC_COVERAGE_GRADING_AUDIT_20260616.md)

Their old paths remain as compatibility pointers only. These documents are planning/review artifacts and must be rechecked against current code, tests, and generated evidence before being used as implementation truth.

## Authority rule

Audit and migration docs are planning/review tools. Re-run or re-check audits before making implementation claims. Code, tests, generated evidence packs, and runtime artifacts are stronger than old documentation when there is a conflict.

## Navigation

Use these repository-level documentation guides before adding or moving files:

- [Documentation Index](../DOC_INDEX.md)
- [Documentation Freshness Matrix](../DOC_FRESHNESS_MATRIX.md)
- [Documentation Reorganization Plan](../DOC_REORGANIZATION_PLAN.md)

Do not physically move files into this folder until the move is covered by a link-aware documentation slice.

## Recent root/script documentation cleanup

- [Root Script and Documentation Placement XACR — 2026-06-25](root_script_and_doc_placement_xacr_20260625.md)
