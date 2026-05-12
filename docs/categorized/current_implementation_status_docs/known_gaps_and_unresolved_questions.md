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

1. View C remains documented as planned/mock-only at the dashboard surface rather than a real recovery view (`VISION_SPEC/07-current-implementation-spec.md`). Code-verified status adds an authority boundary: backend orchestration `current`/`last` endpoints exist, but the View C UI does not consume them and no restore workflow is wired.
2. View D remains documented as planned/frontend simulation rather than a live runtime monitor (`VISION_SPEC/07-current-implementation-spec.md`).
3. Stage 1 download remains documented as partial and not normal real-provider download semantics in current route behavior (`VISION_SPEC/07-current-implementation-spec.md`); current backend wiring should not be described as production provider-backed download.
4. Geocode stage remains documented as deterministic placeholder-backed semantics (`VISION_SPEC/07-current-implementation-spec.md` and button B3.4 status docs); current backend wiring should not be described as production geocoding.
5. Auth/2FA remains documented as partially implemented with manual user-owned real-world validation still required (`AI_AUTHENTICATION_2FA_HANDOFF.md`, `AUTH_ICLOUDPD_*`).
6. Worker/lock/scheduler/recovery semantics are documented as still needing further target-spec closure (`VISION_SPEC/07-current-implementation-spec.md` major gaps list).

### Documented unresolved questions/decision areas

1. Backend-driven non-interactive 2FA completion boundary: docs describe current conservative behavior and a still-limited completion path, with manual verification required.
2. Scheduler behavior standardization across platforms: docs describe current partial platform-aware behavior and remaining target-spec work.
3. Runtime truth ownership split: docs describe a current bridge role for runtime-truth JSON and unfinished final runtime truth model.
4. View B orchestration boundary: current dashboard auto-run uses frontend sequential calls, while backend orchestration endpoints exist separately; docs should distinguish "backend endpoint exists" from "dashboard control consumes it."

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


## 2026-05-06 resolved NEW AUTH gaps

The earlier NEW AUTH gap where local session files could be treated as authenticated before provider proof is resolved. NEW AUTH now requires provider proof or stronger test-download proof before `authenticated` is projected.

The remaining auth-related risks are operational rather than missing slice work:

- real iCloudPD behavior depends on the local machine, Apple account state, and provider response;
- 2FA submission must never expose entered codes;
- test-download proof must remain separate from the normal Stage 2–6 pipeline;
- secrets and session file contents must remain redacted in responses and event history.

Remaining non-auth gaps stay active: production provider download, production geocoder, real scheduler worker services, View C restore/resume contract, View D live runtime monitor, and live environment-isolation verification before destructive smoke tests.


## 2026-05-12 resolved NEW AUTH UX gap

The passive skipped-provider-proof UX gap is resolved. When passive status returns `NEW_AUTH_PROVIDER_PROOF_SKIPPED`, the UI no longer leaves the operator in a vague pending state. It shows `Session files found, provider verification not run yet.` and provides a distinct `Verify with iCloudPD` action.

This resolution does not change the backend auth truth model. Passive status remains passive, `Verify with iCloudPD` performs active provider proof through `GET /api/auth/new/status`, and local session files are still evidence only.

Remaining auth-related risks are operational and regression-prevention risks:

- future auth UI work must not route active provider proof through passive mode;
- future frontend backend calls must continue using the shared request/logging path;
- provider output and raw communication fields must remain sanitized before reaching UI state, logs, or history;
- real iCloudPD success still depends on the local provider environment and Apple account state.
