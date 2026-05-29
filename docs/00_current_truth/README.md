# Current Truth Documentation

Estonian timestamp: 2026-05-24 23:31 EEST

## Purpose

This folder is for latest verified, evidence-backed, or explicitly current documentation only.

## Belongs here

- latest baseline-specific implementation truth.
- evidence-backed docs that have been checked against code, tests, or generated artifacts.
- short current-state summaries that point to supporting evidence.

## Does not belong here

- old TODO notes, speculative plans, or historical task prompts.
- vision-only docs unless they are verified as current behavior.
- status snapshots that have not been reconciled with current code/tests/evidence.

## Authority rule

Files here should be treated as current-truth candidates, but code, tests, and generated evidence packs still override documentation when they conflict. Code, tests, generated evidence packs, and runtime artifacts are stronger than old documentation when there is a conflict.

## Navigation

Use these repository-level documentation guides before adding or moving files:

- [Documentation Index](../DOC_INDEX.md)
- [Documentation Freshness Matrix](../DOC_FRESHNESS_MATRIX.md)
- [Documentation Reorganization Plan](../DOC_REORGANIZATION_PLAN.md)
- [View/card Test Mode vs Real Mode classification](../VIEW_CARD_MODE_CLASSIFICATION.md) — all-view Universal/Test-only/Real-only card classification, including the B2 mock/generated versus B2 real iCloudPD split.
- [Card/button implementation status audit](../CARD_BUTTON_IMPLEMENTATION_STATUS.md) — A/B/D `.card` button/control inventory, status snapshot, user-observed subjective assessment, and follow-up issue list; verify against code/tests before runtime claims.
- [User-observed card status and issues snapshot](../30_status_snapshots/2026-05-26/USER_OBSERVED_CARD_STATUS_AND_ISSUES_20260526_1457_EEST.md) — dated user-observed A/B/D card/button status and follow-up issue list; less authoritative than code/tests/runtime evidence.

Do not physically move files into this folder until the move is covered by a link-aware documentation slice.

## Current contents

- [NEW AUTH Evidence Pack](AUTH_EVIDENCE_PACK.md) — canonical current-truth guidance for safe login/auth artifact debugging.
- [Main Issues and Improvement Guide](PROJECT_ISSUES_AND_IMPROVEMENT_GUIDE_20260528.md) — high-level, evidence-aware planning guide for recurring project issues, provider gaps, workflow safeguards, and verification strategy.
- [PC/runtime worker-stage verification checklist](../10_runbooks/PC_RUNTIME_WORKER_STAGE_VERIFICATION_CHECKLIST_20260529.md) — operator checklist for testing Download, Index, GPS parser, Geocode, and Queue on the PC before filling subjective assessment status.

Compatibility note: `../AUTH_EVIDENCE_PACK.md` is kept as a pointer only so older links continue to work.
