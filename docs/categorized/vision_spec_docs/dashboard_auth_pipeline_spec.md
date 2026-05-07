# Dashboard, Auth, and Pipeline Spec

## Purpose

Define operator-facing dashboard contracts, authentication boundary rules, pipeline action rules, and permissions/safety semantics for View A-E behavior.

## Absorbed source docs

- `docs_to_parse/VISION_SPEC/10-auth-and-2fa-spec.md`
- `docs_to_parse/VISION_SPEC/11-dashboard-views-spec.md`
- `docs_to_parse/VISION_SPEC/08-pipeline-and-workers-spec.md`
- `docs_to_parse/VISION_SPEC/chat_generated_addenda/01-merged-vision-spec-top5-authority.md`
- `docs_to_parse/VISION_SPEC/chat_generated_addenda/04-post-slice3-qa-decisions-summary.md`
- `docs_to_parse/vision_and_implementation/VIEW_A_AUTH_PREFLIGHT_BUTTONS.md`
- `docs_to_parse/VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md` (foundation reference where non-conflicting)

## Canonical rules

### Dashboard-wide contract

1. UI labels/badges are not sufficient evidence of behavior truth.
2. Truth must come from endpoint wiring, backend response semantics, inspect metadata, and verified contract behavior.
3. Real routes can still be partial; docs must preserve partial/mock distinctions.

### View responsibilities

1. View A (Init): setup/preflight owner for env verification, DB controls, scheduler controls, and auth preflight.
2. View B (Test): isolated test pipeline runner; no auth ownership.
3. View C (Last Run Info): planned backend-owned recovery surface; currently may exist as preview/mock until fully wired.
4. View D (Running Process): planned backend-owned live runtime monitor; simulated previews must be clearly marked until backend-projected.
5. View E (Database Viewer): backend-mediated DB verification/catalog/row inspection with bounded activity logging semantics.

### Auth and 2FA contract

1. Auth is backend-owned and provider-evidenced.
2. Public states include: `logged_out`, `checking`/`verifying`, `logging_in`, `pending_2fa`, `requires_2fa`, `authenticated`, `provider_failed`, `unverified`, and `unknown`.
3. `authenticated` may only be projected after provider/session proof; HTTP success alone is not enough.
4. Secrets/tokens/raw 2FA codes must never be exposed in frontend payloads or normal logs.
5. Valid provider session reuse is allowed until failure/expiry; re-login is required only when evidence indicates it.

### NEW AUTH endpoint family

The NEW AUTH card/control family must use only `/api/auth/new/*` endpoints. The current closed Slice 1–10 family is:

- `GET /api/auth/new/status`
- `POST /api/auth/new/verify-icloudpd`
- `GET /api/auth/new/session-files`
- `POST /api/auth/new/login`
- `POST /api/auth/new/submit-2fa`
- `POST /api/auth/new/logout`
- `POST /api/auth/new/test-download`

Local session files are evidence only. They do not produce `authenticated` without provider proof or stronger test-download proof. 2FA-required states must remain actionable but not successful, and must make the operator-facing prompts visible.

### View A auth-preflight button semantics (strict)

1. `1A-AUTH` is the visible owner of auth preflight.
2. Legacy `b1` action IDs/state keys are compatibility adapters and must not be interpreted as View B ownership.
3. Status indicator semantics are per-button semantic outcomes, not transport outcomes.
4. `Submit 2FA` is green only when both authenticated state and `two_factor_status=complete` are proven by backend-safe projection.
5. Unsupported non-interactive 2FA paths remain blocked/pending, not success.
6. NEW AUTH `Check login` is a passive status read. It may observe an active login attempt, 2FA wait, local session evidence, or logged-out state, but it must not start a new login or provider-proof subprocess.

### Pipeline and test-environment contract

1. View B actions run in isolated test context and must not mutate real runtime DB/files.
2. Mock download is strictly test-only copy behavior and must remain separate from real iCloud/provider download flow.
3. Test database configuration uses `TEST_DB_PATH` when an explicit test SQLite location is needed; it must stay separate from runtime `DB_PATH`.
4. Stage actions after mock download must not force unexpected auth flow coupling.
5. Geocode and similar provider-dependent stages must preserve explicit partial/placeholder status when applicable.
6. Manual dashboard stage actions are not equivalent to autonomous worker runtime.

### Operator permissions and safety semantics

1. Destructive database actions in View A are explicit operator actions; docs must preserve caution and non-implicit behavior.
2. Scheduler install/check actions must report platform capability honestly.
3. Inspect modes should explain control meaning, value meaning, and real-vs-mock/backend status provenance for operator decisions.

## Conflict / reduction notes

- Strict auth button spec (`VIEW_A_AUTH_PREFLIGHT_BUTTONS.md`) overrides older broad dashboard framing for button outcomes and ownership wording.
- April 2026 merged guidance remains foundational, but active View A/View B ownership and strict isolation rules from newer specs control conflicts.
- Legacy naming (`b1` keys) is preserved as compatibility detail, not as ownership truth.

## Migration status

| Source | Status | Notes |
|---|---|---|
| `10-auth-and-2fa-spec.md` | ABSORBED | Auth states, secret-safety, 2FA and session rules |
| `11-dashboard-views-spec.md` | ABSORBED | View role boundaries and mock/partial constraints |
| `08-pipeline-and-workers-spec.md` | ABSORBED (relevant subset) | Dashboard relation to workers and stage action constraints |
| `VIEW_A_AUTH_PREFLIGHT_BUTTONS.md` | ABSORBED (strict precedence) | Canonical button semantics and compatibility naming |
| `chat_generated_addenda/01,04` | ABSORBED (selective) | Real/test isolation, auth/session and mock-download clarifications |
| Older button overviews in archive docs | REDUCED_TO_REFERENCE | Historical framing only, no canonical ownership |
