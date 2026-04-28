# Current Implementation Status Docs

## Purpose

This category is the canonical, documentation-only consolidation for current implementation status reporting.  
It reduces overlapping status narratives into four files and keeps a strict boundary between:

- documentation-derived status claims, and
- code-verified implementation truth (not performed in this category pass).

Authority limit: this folder does **not** claim direct code verification.

## Canonical files in this category

- `main_readme.md` (this file): scope, authority boundaries, migration map.
- `documented_current_system_state.md`: consolidated current-state summary from active docs.
- `button_and_view_verification_status.md`: consolidated button/view verification statuses from button verification docs.
- `known_gaps_and_unresolved_questions.md`: consolidated gaps, contradictions, and unresolved items from docs.

## Absorbed source docs

Primary active sources used for this consolidation:

- `docs_to_parse/VISION_SPEC/07-current-implementation-spec.md`
- `docs_to_parse/AI_AUTHENTICATION_2FA_HANDOFF.md`
- `docs_to_parse/AUTH_ICLOUDPD_MANUAL_VERIFICATION.md`
- `docs_to_parse/AUTH_ICLOUDPD_SESSION_VERIFICATION.md`
- `docs_to_parse/button_verification_results/INDEX.md`
- `docs_to_parse/button_verification_results/*.md` (per-button reports)
- `README.md`
- `CHANGELOG.md`

Secondary/older evidence (kept as reference only):

- `docs_to_parse/IMPLEMENTATION_STATUS_AUDIT.md`
- `docs_to_parse/buttons_and_implementation_overview.md`
- `docs_to_parse/OLD_DOCS/15_CURRENT_IMPLEMENTATION_STATUS.md`
- `docs_to_parse/OLD_DOCS/issues_errors_discrepancies.md`

## Documentation-derived status

Documentation-derived authority order used in this category:

1. `docs_to_parse/VISION_SPEC/07-current-implementation-spec.md` for current-state status vocabulary and baseline.
2. Auth-specific current docs (`AI_AUTHENTICATION_2FA_HANDOFF.md`, `AUTH_ICLOUDPD_*`) for authentication/session/2FA boundaries.
3. `docs_to_parse/button_verification_results/*` for per-control verification status and dates.
4. Root `README.md` and `CHANGELOG.md` for project-level context and dated documentation evidence.
5. Audit/overview/OLD_DOCS materials as historical or potentially stale context only.

## Conflict / reduction notes

- If `IMPLEMENTATION_STATUS_AUDIT.md` and `07-current-implementation-spec.md` disagree, this category prefers `07-current-implementation-spec.md` and records audit claims as older evidence.
- Button status duplication is reduced to one canonical summary in `button_and_view_verification_status.md`; detailed per-button narratives remain in source docs.
- Legacy status narratives in `OLD_DOCS` are treated as archive/reference and not as active current-status authority.

## Migration status

| Source doc/group | Migration outcome in this category |
|---|---|
| `VISION_SPEC/07-current-implementation-spec.md` | Absorbed as primary current-state authority. |
| Auth handoff/session/manual docs | Absorbed into consolidated auth status and gaps sections. |
| `button_verification_results/*` | Absorbed into canonical button/view status table. |
| Root `README.md`, `CHANGELOG.md` | Reduced to contextual evidence only. |
| `IMPLEMENTATION_STATUS_AUDIT.md` | Reduced to older-reference evidence; conflicts logged. |
| `buttons_and_implementation_overview.md` | Reduced to older-reference evidence; conflicts/overlap logged. |
| `OLD_DOCS/15_CURRENT_IMPLEMENTATION_STATUS.md` | Reduced to archive/reference only. |
| `OLD_DOCS/issues_errors_discrepancies.md` | Reduced to archive/reference only. |
