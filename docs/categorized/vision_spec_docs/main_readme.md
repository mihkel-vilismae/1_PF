# Vision Spec Docs - Canonical Set

> Current checkpoint: `v0.10.47`. This compatibility README is preserved for navigation/provenance; use root README, current OpenSpec docs, and proof evidence for live implementation truth.


## Documentation navigation notice

This category index is preserved for local and historical organization. For current cross-repository navigation, start with:

- [`docs/DOC_INDEX.md`](../../DOC_INDEX.md) — the current main map for documentation by purpose, kind, authority, and freshness.
- [`docs/DOC_FRESHNESS_MATRIX.md`](../../DOC_FRESHNESS_MATRIX.md) — the trust/freshness guide for current, stale, historical, and risky docs.
- [`docs/DOC_REORGANIZATION_PLAN.md`](../../DOC_REORGANIZATION_PLAN.md) — the required plan to check before moving documentation files.

Docs in this category may include snapshots, specs, backlog, or reference material. Do not treat them as current implementation truth unless code, tests, or generated evidence confirm the claim.
## Final reference/index handling decision

As of 2026-05-25 01:47 EEST, this category index remains in place as a compatibility pointer for older links and vision/spec orientation. The canonical vision/spec documents now live under [`../../20_architecture_and_specs/`](../../20_architecture_and_specs/).

Keep this file until a later old-index replacement slice performs a full link audit. Do not add new architecture/spec content here; add it under `docs/20_architecture_and_specs/` and update `docs/DOC_INDEX.md`.

## Slice 18 link audit status

As of 2026-05-25 02:06 EEST, this vision/spec category compatibility index was retained in place after the full documentation link audit. Use [../../DOC_LINK_AUDIT.md](../../DOC_LINK_AUDIT.md) for the audit result and [../../OLD_INDEX_REPLACEMENT_DECISION.md](../../OLD_INDEX_REPLACEMENT_DECISION.md) for the old-index replacement decision.

This file remains compatibility navigation only. New canonical documentation should go to the numbered target folders documented in `DOC_INDEX.md` and `DOC_REORGANIZATION_PLAN.md`.

## Purpose

This folder consolidates vision/spec documentation into a small active set for product direction, architecture/runtime rules, and dashboard/auth/pipeline contracts.

## Canonical files

1. `product_vision_and_authority.md`
2. `architecture_runtime_and_recovery_spec.md`
3. `dashboard_auth_pipeline_spec.md`

## Absorbed source docs

Primary active sources:

- `docs_to_parse/VISION_SPEC/05-project-vision.md`
- `docs_to_parse/VISION_SPEC/06-target-architecture-spec.md`
- `docs_to_parse/VISION_SPEC/08-pipeline-and-workers-spec.md`
- `docs_to_parse/VISION_SPEC/09-scheduler-and-runtime-recovery-spec.md`
- `docs_to_parse/VISION_SPEC/10-auth-and-2fa-spec.md`
- `docs_to_parse/VISION_SPEC/11-dashboard-views-spec.md`
- `docs_to_parse/VISION_SPEC/12-documentation-authority-map.md`

High-authority addenda (non-conflicting details absorbed):

- `docs_to_parse/VISION_SPEC/chat_generated_addenda/01-merged-vision-spec-top5-authority.md`
- `docs_to_parse/VISION_SPEC/chat_generated_addenda/02-final-voice-ai-vision-spec-clarifications.md`
- `docs_to_parse/VISION_SPEC/chat_generated_addenda/03-raspberry-pi-autonomy-runtime-failure-qa.md`
- `docs_to_parse/VISION_SPEC/chat_generated_addenda/04-post-slice3-qa-decisions-summary.md`
- `docs_to_parse/vision_and_implementation/VIEW_A_AUTH_PREFLIGHT_BUTTONS.md` (strict button semantics)

## Authority notes

1. Active tiering from the authority map is the default control plane for this category.
2. Root `README.md` still elevates `VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md` as top-level behavior authority; this is retained as foundation context, but active tiering and newer specific specs control conflicting active execution details unless explicitly re-promoted by user decision.
3. Newer strict button-level auth spec rules override older dashboard-overview phrasing when they conflict.
4. Scheduler/runtime execution rules prefer `09-scheduler-and-runtime-recovery-spec.md` and aligned addenda where April 2026 merged wording implies fixed destructive cron install behavior.

## Conflict / reduction notes

- `VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md` vs active scheduler spec: keep scheduler install/check semantics platform-bound and capability-reported, not globally forced destructive install semantics.
- Root README authority statement vs active authority-map tiering: keep both recorded; use active tiering for day-to-day implementation contracts and treat April 2026 merged doc as foundational reference.
- Older `vision_and_implementation/*` and `OLD_DOCS/*` content is reduced to archive/mirror reference unless it contains missing implementation-affecting detail not present in active numbered specs.

## Migration status

| Source | Status | Destination / handling |
|---|---|---|
| `VISION_SPEC/05-project-vision.md` | ABSORBED | `product_vision_and_authority.md` |
| `VISION_SPEC/06-target-architecture-spec.md` | ABSORBED | `architecture_runtime_and_recovery_spec.md` |
| `VISION_SPEC/08-pipeline-and-workers-spec.md` | ABSORBED | `architecture_runtime_and_recovery_spec.md`, `dashboard_auth_pipeline_spec.md` |
| `VISION_SPEC/09-scheduler-and-runtime-recovery-spec.md` | ABSORBED | `architecture_runtime_and_recovery_spec.md` |
| `VISION_SPEC/10-auth-and-2fa-spec.md` | ABSORBED | `dashboard_auth_pipeline_spec.md`, `product_vision_and_authority.md` |
| `VISION_SPEC/11-dashboard-views-spec.md` | ABSORBED | `dashboard_auth_pipeline_spec.md` |
| `VISION_SPEC/12-documentation-authority-map.md` | ABSORBED | `product_vision_and_authority.md`, this index |
| `VISION_SPEC/chat_generated_addenda/01..04` | ABSORBED (selective) | Added non-conflicting runtime/auth/safety clarifications |
| `vision_and_implementation/VIEW_A_AUTH_PREFLIGHT_BUTTONS.md` | ABSORBED (specific) | `dashboard_auth_pipeline_spec.md` |
| `vision_and_implementation/*` (other files) | REDUCED_TO_REFERENCE | Archive/mirror set; no direct canonical ownership |
| `OLD_DOCS/*` | REDUCED_TO_REFERENCE | Historical/reference only |
| Reconciliation and workflow reports (`VISION_SPEC/15..19`, addenda comparison docs) | DROPPED_FROM_CANON | Audit/reference only, not normative contract text |

