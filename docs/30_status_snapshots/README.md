# Status Snapshots

Estonian timestamp: 2026-05-24 23:31 EEST

## Purpose

This folder is for dated implementation and verification snapshots.

## Belongs here

- dated implementation status reports.
- verification snapshots.
- known-gap summaries tied to a specific baseline or date.

## Does not belong here

- timeless current-truth docs.
- future target specs.
- old task prompts without verification results.

## Authority rule

Snapshots are true only for the checked baseline/date. Re-verify against current code/tests/evidence before using them as current truth. Code, tests, generated evidence packs, and runtime artifacts are stronger than old documentation when there is a conflict.

## Navigation

Use these repository-level documentation guides before adding or moving files:

- [Documentation Index](../DOC_INDEX.md)
- [Documentation Freshness Matrix](../DOC_FRESHNESS_MATRIX.md)
- [Documentation Reorganization Plan](../DOC_REORGANIZATION_PLAN.md)

Do not physically move files into this folder until the move is covered by a link-aware documentation slice.

## Canonical 2026-05-12 snapshots moved in Slice 11

The following status snapshots now have canonical copies under `docs/30_status_snapshots/2026-05-12/`:

- [Implementation Goal Status Reconciliation](2026-05-12/IMPLEMENTATION_GOAL_STATUS_RECONCILIATION_20260512.md)
- [Runtime Truth Authority Map](2026-05-12/RUNTIME_TRUTH_AUTHORITY_MAP_20260512.md)
- [NEW AUTH Provider Verification UX Status Update](2026-05-12/IMPLEMENTATION_STATUS_UPDATE_20260512_NEW_AUTH_PROVIDER_VERIFICATION.md)

The old root-level `docs/*.md` paths are retained as compatibility pointers only.

## Canonical categorized status snapshots moved in Slice 12

Estonian timestamp: 2026-05-25 01:05 EEST

The following categorized current-status snapshots now have canonical copies under `docs/30_status_snapshots/2026-05-12/`:

- [B4 Playback Flow Status](2026-05-12/b4_playback_flow_status.md)
- [Button and View Verification Status](2026-05-12/button_and_view_verification_status.md)
- [Code-Verified Dashboard Implementation Status](2026-05-12/code_verified_dashboard_implementation_status.md)
- [Documented Current System State](2026-05-12/documented_current_system_state.md)
- [Known Gaps and Unresolved Questions](2026-05-12/known_gaps_and_unresolved_questions.md)

The old `docs/categorized/current_implementation_status_docs/*.md` paths are retained as compatibility pointers only. The category `main_readme.md` remains in place until the old-index replacement slice.

## 2026-05-25 main-goal implementation snapshot

Estonian timestamp: 2026-05-25 20:55 EEST

The latest main-goal status snapshot is [Main Goal Implementation Status — Autonomous Picture Frame](2026-05-25/MAIN_GOAL_IMPLEMENTATION_STATUS_20260525.md). It separates implemented, partial, mock/demo, planned, and decision-gated areas for the autonomous picture-frame goal across login, download, parsing, queueing, playback, Windows fullscreen development rendering, and Raspberry production rendering.

