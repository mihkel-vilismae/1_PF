# Architecture and Specs

Estonian timestamp: 2026-05-24 23:31 EEST

## Purpose

This folder is for architecture, target behavior, contracts, interfaces, and design specifications.

## Belongs here

- component and interface descriptions.
- target behavior specifications.
- auth/runtime/dashboard architecture notes.
- contract and adapter documentation.

## Does not belong here

- implementation-status snapshots that only describe one date.
- operator runbooks.
- old task prompts that were never reconciled into specs.

## Authority rule

Specs describe intended structure and behavior. They are not proof that the current repo already implements every detail. Code, tests, generated evidence packs, and runtime artifacts are stronger than old documentation when there is a conflict.

## Navigation

Use these repository-level documentation guides before adding or moving files:

- [Documentation Index](../DOC_INDEX.md)
- [Documentation Freshness Matrix](../DOC_FRESHNESS_MATRIX.md)
- [Documentation Reorganization Plan](../DOC_REORGANIZATION_PLAN.md)

Do not physically move files into this folder until the move is covered by a link-aware documentation slice.


## Canonical vision/spec docs moved in Slice 13

Estonian timestamp: 2026-05-25 01:18 EEST

The first controlled vision/spec move placed these canonical files here:

- [Architecture, Runtime, and Recovery Spec](architecture_runtime_and_recovery_spec.md)
- [Dashboard, Auth, and Pipeline Spec](dashboard_auth_pipeline_spec.md)
- [Product Vision and Authority](product_vision_and_authority.md)

The old `docs/categorized/vision_spec_docs/` paths remain compatibility pointers. Keep `docs/categorized/vision_spec_docs/main_readme.md` in place until the old-index replacement slice.

## Canonical auth flow reference docs moved in Slice 14

Estonian timestamp: 2026-05-25 01:28 EEST

The first controlled auth flow reference move placed this canonical file here:

- [NEW AUTH Provider Verification Flow](auth/NEW_AUTH_PROVIDER_VERIFICATION_FLOW.md)

The old `docs/NEW_AUTH_PROVIDER_VERIFICATION_FLOW.md` path remains a compatibility pointer. Treat this document as an architecture/reference guide, not proof that the current runtime is authenticated. Generated evidence packs, code, and tests remain stronger than this reference when they conflict.

## Reusable project reference/spec material moved in Slice 17

Estonian timestamp: 2026-05-25 01:56 EEST

Slice 17 moved this reusable project reference/spec checklist into the canonical architecture/spec area:

- [Default Project Settings and Elements Checklist](reference/default_project_settings_and_elements_checklist.md)

The old `docs/categorized/other_documentation/default_project_settings_and_elements_checklist.md` path remains a compatibility pointer only. Treat this as reusable reference/spec material, not proof that every item is implemented in this repository.

## Playback recovery

- [Playback Resume Checkpoint Spec](./playback_resume_checkpoint_spec.md) — Defines power-outage playback resume checkpoints, restore policy, and fallback behavior.
