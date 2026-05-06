# Documented Current System State

## Purpose

This file consolidates the current system state as **documentation-derived status only**.  
It is not a code-audit report and does not convert doc statements into verified runtime truth.

## Absorbed source docs

Primary:

- `docs_to_parse/VISION_SPEC/07-current-implementation-spec.md`
- `docs_to_parse/AI_AUTHENTICATION_2FA_HANDOFF.md`
- `docs_to_parse/AUTH_ICLOUDPD_MANUAL_VERIFICATION.md`
- `docs_to_parse/AUTH_ICLOUDPD_SESSION_VERIFICATION.md`
- `README.md`
- `CHANGELOG.md`

Secondary/older comparison:

- `docs_to_parse/IMPLEMENTATION_STATUS_AUDIT.md`
- `docs_to_parse/buttons_and_implementation_overview.md`
- `docs_to_parse/OLD_DOCS/15_CURRENT_IMPLEMENTATION_STATUS.md`

## Documentation-derived status

All rows below are documentation-derived from the listed sources.

### Repository-level areas

| Area | Documentation-derived status | Source basis | Confidence |
|---|---|---|---|
| Frontend dashboard shell | `IMPLEMENTED` (as documented) | `VISION_SPEC/07-current-implementation-spec.md` | High |
| Backend HTTP server route surface | `IMPLEMENTED` / `PARTIAL` (as documented) | `VISION_SPEC/07-current-implementation-spec.md` | High |
| SQLite schema baseline | `IMPLEMENTED` (as documented) | `VISION_SPEC/07-current-implementation-spec.md` | High |
| Runtime truth bridge | `IMPLEMENTED` / `PARTIAL` (as documented) | `VISION_SPEC/07-current-implementation-spec.md` | High |
| Scheduler API | `PARTIAL` (as documented; current code now exposes selected Windows CronEmulator vs Raspberry crontab targets behind legacy `/api/init/cron/*` routes) | `VISION_SPEC/07-current-implementation-spec.md` plus current 3A target split | High |
| View C recovery view | `PLANNED` (doc wording indicates mock/frontend-only) | `VISION_SPEC/07-current-implementation-spec.md`, `README.md` | High |
| View D runtime monitor | `PLANNED` (doc wording indicates frontend simulation preview) | `VISION_SPEC/07-current-implementation-spec.md`, `README.md` | High |

### Pipeline/runtime stages

| Stage | Documentation-derived status | Source basis | Confidence |
|---|---|---|---|
| Stage 1 download | `PARTIAL` (documented as mock/generated-data copy in current runtime route semantics) | `VISION_SPEC/07-current-implementation-spec.md` | High |
| Stage 2 index | `IMPLEMENTED` / `PARTIAL` | `VISION_SPEC/07-current-implementation-spec.md` | High |
| Stage 3 parse GPS | `IMPLEMENTED` / `PARTIAL` | `VISION_SPEC/07-current-implementation-spec.md` | High |
| Stage 4 geocode | `PARTIAL` (placeholder geocoder documented) | `VISION_SPEC/07-current-implementation-spec.md` | High |
| Stage 5 prepare queue | `IMPLEMENTED` / `PARTIAL` | `VISION_SPEC/07-current-implementation-spec.md` | High |
| Stage 6 select-current | `IMPLEMENTED` / `PARTIAL` | `VISION_SPEC/07-current-implementation-spec.md` | High |
| Run-all orchestration | `PARTIAL` / `NEEDS_VERIFICATION` | `VISION_SPEC/07-current-implementation-spec.md` | High |

### Authentication and 2FA

| Area | Documentation-derived status | Source basis | Confidence |
|---|---|---|---|
| Auth ownership boundary | Backend-owned public auth projection is documented | `AI_AUTHENTICATION_2FA_HANDOFF.md`, `AUTH_ICLOUDPD_SESSION_VERIFICATION.md` | High |
| Provider boundary | `icloudpd` provider adapter documented as implemented boundary | `AI_AUTHENTICATION_2FA_HANDOFF.md`, `AUTH_ICLOUDPD_MANUAL_VERIFICATION.md` | High |
| 2FA submit path | Documented as present but conservative/limited for non-interactive completion | `AI_AUTHENTICATION_2FA_HANDOFF.md`, `AUTH_ICLOUDPD_MANUAL_VERIFICATION.md`, `AUTH_ICLOUDPD_SESSION_VERIFICATION.md` | High |
| Session resume verification | Documented backend route `/api/auth/resume` verifies provider session before authenticated state | `AUTH_ICLOUDPD_SESSION_VERIFICATION.md` | High |
| Real-world Apple login proof | Documented as manual, user-owned validation step | Auth docs above | High |

### Recent documentation evidence updates

- `CHANGELOG.md` entries dated **2026-04-28** document additional auth button-status and 2FA-status-hardening updates (`v0.3.29`, `v0.3.30`, `v0.3.31`) as documentation evidence.

## Conflict / reduction notes

- `IMPLEMENTATION_STATUS_AUDIT.md` contains older claims that conflict with newer current-state docs (example: older sections describing missing auth layer or different stage semantics). For this category, those are treated as older evidence.
- `buttons_and_implementation_overview.md` remains useful for inspect/button context but is broader and partly stale compared to targeted button verification results and the current implementation spec.
- `OLD_DOCS/15_CURRENT_IMPLEMENTATION_STATUS.md` is treated as archival context rather than active current-state authority.

## Migration status

| Consolidation target | Migration status |
|---|---|
| Repository/system state summary | Completed in this file from primary current-state docs. |
| Auth/session/2FA status summary | Completed in this file from auth-specific active docs. |
| Route/stage summary duplication | Reduced; canonicalized here with source tagging. |
| Older summary docs | Kept as reference only; not promoted to active authority. |


## 2026-05-06 NEW AUTH closure status

NEW AUTH Slices 1–10 are complete for the dashboard/auth track. The implemented endpoint family is:

- `GET /api/auth/new/status`
- `POST /api/auth/new/verify-icloudpd`
- `GET /api/auth/new/session-files`
- `POST /api/auth/new/login`
- `POST /api/auth/new/submit-2fa`
- `POST /api/auth/new/logout`
- `POST /api/auth/new/test-download`

The important behavioral rule is unchanged and now documented as implemented: local session files are not authentication by themselves. The dashboard may show local session evidence, but `authenticated` requires provider proof or stronger test-download proof.

2FA-required states are actionable but not success. The UI/event history should make the next action visible with prompts such as `ENTER 6-DIGIT CODE` and `ENTER DEVICE INDEX (A)`.
