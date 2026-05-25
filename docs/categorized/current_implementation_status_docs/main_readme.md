# Current Implementation Status Docs

## Documentation navigation notice

This category index is preserved for local and historical organization. For current cross-repository navigation, start with:

- [`docs/DOC_INDEX.md`](../../DOC_INDEX.md) — the current main map for documentation by purpose, kind, authority, and freshness.
- [`docs/DOC_FRESHNESS_MATRIX.md`](../../DOC_FRESHNESS_MATRIX.md) — the trust/freshness guide for current, stale, historical, and risky docs.
- [`docs/DOC_REORGANIZATION_PLAN.md`](../../DOC_REORGANIZATION_PLAN.md) — the required plan to check before moving documentation files.

Docs in this category may include snapshots, specs, backlog, or reference material. Do not treat them as current implementation truth unless code, tests, or generated evidence confirm the claim.
## Final reference/index handling decision

As of 2026-05-25 01:47 EEST, this category index remains in place as a compatibility pointer for older links and local status-snapshot orientation. The canonical moved status snapshots now live under [`../../30_status_snapshots/`](../../30_status_snapshots/).

Keep this file until a later old-index replacement slice performs a full link audit. Do not add new status snapshot content here; add new dated snapshots under `docs/30_status_snapshots/` and update `docs/DOC_INDEX.md`.

## Slice 18 link audit status

As of 2026-05-25 02:06 EEST, this current-status category compatibility index was retained in place after the full documentation link audit. Use [../../DOC_LINK_AUDIT.md](../../DOC_LINK_AUDIT.md) for the audit result and [../../OLD_INDEX_REPLACEMENT_DECISION.md](../../OLD_INDEX_REPLACEMENT_DECISION.md) for the old-index replacement decision.

This file remains compatibility navigation only. New canonical documentation should go to the numbered target folders documented in `DOC_INDEX.md` and `DOC_REORGANIZATION_PLAN.md`.

## Purpose

This category is the canonical consolidation for current implementation status reporting.
Most files in this category are documentation-only reductions of older status narratives; code-verified audit files are explicitly named as such and keep their own verification log.

- documentation-derived status claims, and
- code-verified implementation truth.

Authority limit: documentation-derived files in this folder do **not** claim direct code verification. Code-verified files must state the commands, files, and runtime checks used.

## Canonical files in this category

- `main_readme.md` (this file): scope, authority boundaries, migration map.
- `documented_current_system_state.md`: consolidated current-state summary from active docs.
- `button_and_view_verification_status.md`: consolidated button/view verification statuses from button verification docs.
- `known_gaps_and_unresolved_questions.md`: consolidated gaps, contradictions, and unresolved items from docs.
- `code_verified_dashboard_implementation_status.md`: code-verified dashboard implementation status audit from the 2026-05-04 local worktree, plus 2026-05-06 and 2026-05-12 NEW AUTH closure updates that record the completed `/api/auth/new/*` endpoint family, passive skipped-proof UX, active provider verification action, redaction coverage, and remaining non-auth gaps.

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


## 2026-05-06 closure note

The NEW AUTH implementation track is documented as closed through Slice 10. The current status docs must not describe local session files as authenticated by themselves. NEW AUTH truth is backend-owned and must require provider proof or stronger test-download proof.

## 2026-05-10 B4 playback boundary note

B3.5 owns playback queue preparation/building. B4 and `playback_worker` select the current playable item from already prepared queue/state only. Preview/fullscreen rendering are not real media display, Raspberry OS rendering remains disabled/planned, and Windows CronEmulator playback-worker command wiring is partial because it depends on the expected `tools/CronEmulator` launch context. See `b4_playback_flow_status.md` for the code-verified boundary.


## 2026-05-12 NEW AUTH provider-verification UX note

The NEW AUTH implementation status now includes the Slice 1-3 provider-verification UX reconciliation. Passive `Check login` remains `GET /api/auth/new/status?mode=passive` and must not start provider proof. When passive status returns `NEW_AUTH_PROVIDER_PROOF_SKIPPED`, the UI shows `Session files found, provider verification not run yet.` and offers the distinct `Verify with iCloudPD` action.

`Verify with iCloudPD` calls active `GET /api/auth/new/status` through the shared frontend request/logging path. `Verify iCloudPD install` remains `POST /api/auth/new/verify-icloudpd` and is only an executable/config readiness check. Local session files remain evidence only, not authenticated state.

See `docs/IMPLEMENTATION_STATUS_UPDATE_20260512_NEW_AUTH_PROVIDER_VERIFICATION.md` and `docs/NEW_AUTH_PROVIDER_VERIFICATION_FLOW.md`.
