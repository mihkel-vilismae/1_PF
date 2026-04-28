# Product Vision and Authority

## Purpose

Define product intent and the documentation authority model that governs vision/spec decisions for this repository category.

## Absorbed source docs

- `docs_to_parse/VISION_SPEC/05-project-vision.md`
- `docs_to_parse/VISION_SPEC/12-documentation-authority-map.md`
- `docs_to_parse/VISION_SPEC/VISION_SPEC_readme.md`
- `docs_to_parse/VISION_SPEC/chat_generated_addenda/01-merged-vision-spec-top5-authority.md`
- `docs_to_parse/VISION_SPEC/chat_generated_addenda/02-final-voice-ai-vision-spec-clarifications.md`
- `docs_to_parse/VISION_SPEC/chat_generated_addenda/04-post-slice3-qa-decisions-summary.md`
- `README.md`
- `docs_to_parse/VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md` (foundation reference)

## Canonical rules

### Product purpose and scope

1. The product is a dashboard-observable photo-frame runtime: staged media pipeline plus autonomous playback/runtime behavior.
2. Raspberry Pi runtime remains the final production target; Windows/Fedora are development/validation targets.
3. The dashboard is an operator/control and evidence surface, not the source of truth for runtime state.
4. Current implementation status and target intent must remain explicitly separated in documentation.

### Non-negotiable vision/spec rules

1. Evidence over labels: UI wording or badges cannot override backend/runtime evidence.
2. Real and test environments must remain strictly isolated (paths, DBs, and actions).
3. Authentication is backend-owned and provider-evidenced; no optimistic frontend success claims.
4. Runtime safety over convenience: lock-based single-instance behavior, durable state, explicit recovery semantics.
5. Historical docs can be mined for detail but cannot overrule active authority without explicit promotion.

### Authority model

1. Active numbered `VISION_SPEC` docs and explicit authority-map tiering define current category authority.
2. High-authority addenda are binding where they do not conflict with higher-priority active contracts and where they sharpen missing operational rules.
3. `VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md` remains foundational but not automatically dominant over newer more-specific active execution contracts.
4. Archive sets (`vision_and_implementation/*`, `OLD_DOCS/*`) are reference-only unless missing critical detail is intentionally harvested.

### Open/decision-controlled areas (do not overstate finality)

1. Long-term role of `conf/runtime-truth.json` remains decision-bound.
2. Exact worker schedules and some scheduler ownership/platform details remain configurable or unresolved.
3. Some auth/provider behaviors (especially 2FA interaction model and diagnostic endpoint placement) remain verification- or decision-bound.

## Conflict / reduction notes

- Root README elevates April 2026 merged spec globally; active authority-map tiering and newer specific specs are used for day-to-day canonical behavior in this category.
- Addenda include stronger autonomy and runtime-failure direction; these are absorbed as target rules without claiming full implementation.
- Older naming (`vision_and_implementation`) is treated as mirror/archive to avoid dual-active canon.

## Migration status

| Source | Status | Notes |
|---|---|---|
| `05-project-vision.md` | ABSORBED | Product identity, intent, outcomes, principles |
| `12-documentation-authority-map.md` | ABSORBED | Tiered authority and contradiction handling model |
| `VISION_SPEC_readme.md` | REDUCED_TO_REFERENCE | Reading-order metadata only |
| `chat_generated_addenda/01,02,04` | ABSORBED (selective) | Non-conflicting clarifications and carry-forward decisions |
| `README.md` + April 2026 merged spec statement | REDUCED_WITH_CONFLICT_NOTE | Retained as foundation context with active-tier override rules |
| `vision_and_implementation/*` and `OLD_DOCS/*` | REDUCED_TO_REFERENCE | Not canonical authority in this category |

