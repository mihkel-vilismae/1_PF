# Known Gaps and Unresolved Questions

## Purpose

This file consolidates documented gaps, contradictions, and unresolved questions from status documentation.  
All entries are documentation-derived and are not new product requirements.

## Absorbed source docs

Primary:

- `docs_to_parse/VISION_SPEC/07-current-implementation-spec.md`
- `docs_to_parse/AI_AUTHENTICATION_2FA_HANDOFF.md`
- `docs_to_parse/AUTH_ICLOUDPD_MANUAL_VERIFICATION.md`
- `docs_to_parse/AUTH_ICLOUDPD_SESSION_VERIFICATION.md`
- `docs_to_parse/button_verification_results/INDEX.md`
- `docs_to_parse/button_verification_results/AUTHORITATIVE_MISSING_FUNCTIONALITY.md`

Secondary/older contradiction sources:

- `docs_to_parse/IMPLEMENTATION_STATUS_AUDIT.md`
- `docs_to_parse/buttons_and_implementation_overview.md`
- `docs_to_parse/OLD_DOCS/15_CURRENT_IMPLEMENTATION_STATUS.md`
- `docs_to_parse/OLD_DOCS/issues_errors_discrepancies.md`
- `README.md`
- `CHANGELOG.md`

## Documentation-derived status

### Documented current major gaps (from active current-state docs)

1. View C remains documented as planned/mock-only rather than a real recovery view (`VISION_SPEC/07-current-implementation-spec.md`).
2. View D remains documented as planned/frontend simulation rather than a live runtime monitor (`VISION_SPEC/07-current-implementation-spec.md`).
3. Stage 1 download remains documented as partial and not normal real-provider download semantics in current route behavior (`VISION_SPEC/07-current-implementation-spec.md`).
4. Geocode stage remains documented as deterministic placeholder-backed semantics (`VISION_SPEC/07-current-implementation-spec.md` and button B3.4 status docs).
5. Auth/2FA remains documented as partially implemented with manual user-owned real-world validation still required (`AI_AUTHENTICATION_2FA_HANDOFF.md`, `AUTH_ICLOUDPD_*`).
6. Worker/lock/scheduler/recovery semantics are documented as still needing further target-spec closure (`VISION_SPEC/07-current-implementation-spec.md` major gaps list).

### Documented unresolved questions/decision areas

1. Backend-driven non-interactive 2FA completion boundary: docs describe current conservative behavior and a still-limited completion path, with manual verification required.
2. Scheduler behavior standardization across platforms: docs describe current partial platform-aware behavior and remaining target-spec work.
3. Runtime truth ownership split: docs describe a current bridge role for runtime-truth JSON and unfinished final runtime truth model.

### Documented implementation-debt notes (documentation perspective)

1. Duplicate status narratives remain across audit, overview, and old status docs.
2. Some documentation streams use different status framing (`Works/Partial/Mock-only` vs `IMPLEMENTED/PARTIAL/PLANNED`), increasing interpretation overhead.
3. Button status index and missing-functionality ledger can present different "resolved vs partial" views without a single reconciliation note in-source.

## Conflict / reduction notes

Conflicts recorded and reduced in this category:

- Conflict A: `IMPLEMENTATION_STATUS_AUDIT.md` includes older claims that differ from `VISION_SPEC/07-current-implementation-spec.md` on current state in several areas (including auth and stage semantics).  
  Reduction rule applied: prefer `07-current-implementation-spec.md` as active current-state authority; keep audit as older evidence.

- Conflict B: `OLD_DOCS/15_CURRENT_IMPLEMENTATION_STATUS.md` describes an older view model including View E and broader mock-only framing that is not aligned with the active current-state spec corpus used here.  
  Reduction rule applied: archive/reference only.

- Conflict C: `AUTHORITATIVE_MISSING_FUNCTIONALITY.md` resolution rows and `button_verification_results/INDEX.md` partial labels can diverge in presentation.  
  Reduction rule applied: use `INDEX.md` as the per-control classification table; keep ledger as context.

## Migration status

| Gap/contradiction source | Migration status |
|---|---|
| `VISION_SPEC/07` major gap list | Absorbed as primary documented gap baseline. |
| Auth handoff/manual/session docs | Absorbed into auth/2FA unresolved-boundary notes. |
| Button index + ledger | Absorbed into verification-gap and contradiction notes. |
| Audit/overview/OLD_DOCS | Reduced to conflict/reference evidence only. |
