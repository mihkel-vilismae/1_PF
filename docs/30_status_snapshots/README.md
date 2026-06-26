# Status Snapshots

> Current checkpoint: `v0.10.65`. This README was refreshed in the docs/launcher reconciliation pass; code, focused tests, proof artifacts, and runtime evidence override stale prose.

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

## 2026-05-26 B2 real-download auth handoff snapshot

Estonian timestamp: 2026-05-26 03:18 EEST

The latest B2 real-download handoff snapshot is [B2 Real Download Auth Handoff Status](2026-05-26/B2_REAL_DOWNLOAD_AUTH_HANDOFF_STATUS_20260526.md). It records the Slice 1–4 bridge between active NEW AUTH provider proof and `POST /api/runtime/download/real-run`, including the preserved rule that passive session files alone do not authenticate real downloads.

## 2026-05-26 user-observed card status snapshot

Estonian timestamp: 2026-05-26 21:31 EEST

The latest user-observed View A/B/D card/button status snapshot is [User-observed card status and issues](2026-05-26/USER_OBSERVED_CARD_STATUS_AND_ISSUES_20260526_1457_EEST.md). It preserves the subjective assessment column and follow-up issue list from manual/user observations. Treat it as practical validation input, not stronger evidence than code, tests, generated artifacts, or runtime logs.
