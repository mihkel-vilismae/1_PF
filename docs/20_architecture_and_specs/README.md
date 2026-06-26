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
- [V2 Real Playback Goals](v2_goals/goals.md) — Defines the current V2 victory conditions: autonomous playback, autonomous recovery after power loss, and the tier-2 screen on/off activity goal.
- [V2 Operator Pages OpenSpec](openspec/v2_operator_pages_openspec.md) — Defines pages `01` through `09`, shared components, reuse rules, page placement, and proof boundaries for the V2 operator path.
- [V2 Implementation Status](openspec/V2_ImplementationStatus.md) — Tracks each planned V2 page/control/status and whether it is visual, placeholder, wired, tested, unresolved, or future.
- [V2 Goal Summary](openspec/V2_GoalSummary.md) — Captures the current operator intent behind the V2 pages and `09 REAL PLAYBACK`.
- [V2 Issue Register](openspec/V2_IssueRegister.md) — Tracks known V2 design questions and verification gaps.

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

## Native playback

- [Native Playback Runner Spec](./native_playback_runner_spec.md) — Defines backend-owned OS-native fullscreen playback, player adapters, disabled defaults, and worker integration rules.

## Media pipeline providers

- [Media Pipeline Provider Interfaces](./media_pipeline_provider_interfaces.md) — Defines the backend-only Python provider contracts and fallback-chain rules for GPS parsing and reverse geocoding.

## Runtime truth local state

- [Runtime Truth Local State Contract](./runtime_truth_local_state.md) — Defines why `conf/runtime-truth.seed.json` is tracked while `conf/runtime-truth.json` is ignored local runtime state.

## OpenSpec contracts

- [OpenSpec documentation index](openspec/README.md) — forward-looking contracts that are not implementation proof.
- [Raspberry OS missing feature OpenSpec](openspec/raspberry_os_missing_features_openspec.md) — documentation-only Raspberry OS contract for launcher, tools, playback, scheduler, recovery, power-loss, evidence export, and operator-guide gaps.
- [Raspberry cron worker runtime OpenSpec](openspec/raspberry_cron_worker_runtime_openspec.md) — defines app-running as active cron plus three worker lanes with singleton, duplicate-skip, cross-worker independence, and stale-lock recovery proof boundaries.
- [Endpoint contract inventory OpenSpec](openspec/endpoint_contract_inventory_openspec.md) — same-origin HTTP API route-surface map and drift guard.

- [V2 Operator Pages OpenSpec](openspec/v2_operator_pages_openspec.md) — V2 page/component/reuse/proof contract for the planned nine-page operator flow.
- [V2 Implementation Status](openspec/V2_ImplementationStatus.md) — status tracker for V2 elements and proof gaps.
- [V2 Goal Summary](openspec/V2_GoalSummary.md) — source-of-truth summary for the current V2 implementation intent.
- [V2 Issue Register](openspec/V2_IssueRegister.md) — issue register for recovery, PIR, cron, auth, stale locks, file validity, and proof gaps.

- [Raspberry local tool checker OpenSpec](openspec/raspberry_local_tool_checker_openspec.md) — implemented Raspberry tool-readiness preflight contract and non-claims.

- [Project Completeness Reporting OpenSpec](openspec/project_completeness_reporting_openspec.md) — defines source priority, proof honesty, and percentage rules for `print overall project completeness` reports.
