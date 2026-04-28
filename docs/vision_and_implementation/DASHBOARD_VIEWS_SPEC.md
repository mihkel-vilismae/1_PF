# Dashboard Views Specification

Status: Slice 2 current dashboard views spec.
Created: 2026-04-26 19:59 EEST.
Scope: current View A, View B, View C, View D, and related View E/database viewer reality.

## Dashboard-wide rule

Surface wording, badges, and visual styling must not be treated as sufficient proof of implementation status. Current truth should be determined by combining:

1. rendered view code;
2. action wiring in frontend services and runtime-truth behavior;
3. inspect metadata;
4. backend route existence and behavior;
5. tests or targeted manual verification.

## View A — Init

| Aspect | Status | Current specification |
|---|---|---|
| Purpose | IMPLEMENTED / PARTIAL | View A is the setup and preflight view. It owns environment verification, database setup/inspection, scheduler controls, and auth preflight. |
| Environment verification | IMPLEMENTED | `1A Verify .env` calls `POST /api/init/verify-env`. |
| Database controls | IMPLEMENTED / PARTIAL | DB check, inspect, delete, and recreate controls call backend init database endpoints. Destructive behavior requires careful user/operator awareness. |
| Scheduler controls | PARTIAL | Scheduler controls call legacy-compatible `/api/init/cron/*` routes through a platform-aware capability model. Full target scheduler behavior is not complete. |
| Auth preflight | IMPLEMENTED / PARTIAL | `1A-AUTH` contains backend-owned icloudpd verification/login/status/logout/2FA-related controls with per-button status indicators, metadata-backed help text, and semantic success rules. Real provider/2FA behavior remains provider-dependent. |
| Skill evidence | USED | `view-a-init-reconciliation` skill was used as supporting evidence to avoid stale View A claims. |

### View A notes

- View A is the strongest backend-backed view.
- Auth belongs here, not in View B.
- Old B1 action/status keys that remain in code are compatibility adapters for the visible `1A-AUTH` card.
- Scheduler wording must remain careful because Windows/Fedora/Raspberry Pi expectations are not fully unified yet.

## View B — Test

| Aspect | Status | Current specification |
|---|---|---|
| Purpose | PARTIAL | View B is a hybrid test view for exercising pipeline slices and preview behavior. |
| B1 authentication | DEPRECATED IN VIEW B | The login preflight moved to View A. View B should not contain an auth step. |
| B2 download test action | PARTIAL | Calls `POST /api/runtime/download/run`, but current behavior is mock/generated-data copy, not real iCloud download. |
| B3 pipeline stages | PARTIAL | B3.1 through B3.5 call backend runtime stage routes. B3.4 geocode remains deterministic placeholder-backed. |
| B3 run all stages | PARTIAL / NEEDS_VERIFICATION | Frontend auto-run behavior exists; backend orchestration endpoints also exist. Their final relationship needs clarification. |
| B4 playback selection | IMPLEMENTED / PARTIAL | Calls `POST /api/runtime/playback/select-current` and shows selected backend item. It is not a full playback worker. |
| B5 screen on/off simulation | PLANNED / MOCK | Frontend-only placeholder simulation. |
| Real vs mock clarity | PARTIAL | Many action-level classifications are accurate, but section-level and value-level wording can still be mixed. |

### View B notes

- View B is not a pure mock view anymore.
- Real backend calls do not automatically mean production-real behavior. Download and geocode are the clearest examples.
- Test environment separation remains a core intended requirement.

## View C — Last Run Info

| Aspect | Status | Current specification |
|---|---|---|
| Purpose | PLANNED | Intended future recovery/last-run inspection view. |
| Current implementation | MOCK | The view explicitly says no real `/api/runtime/*` restore or last-run endpoint exists for it yet. |
| Restore action | PLACEHOLDER | Resume from saved state is visible as a placeholder. |
| Data source | MOCK | Uses local/demo state rather than real backend recovery state. |

### View C target direction

View C should eventually display the same durable recovery data used by runtime workers and scheduler restart logic. Slice 3 must define whether that source is DB state, runtime files, lock files, logs, or a combined model.

## View D — Running Process

| Aspect | Status | Current specification |
|---|---|---|
| Purpose | PLANNED | Intended future live runtime monitor. |
| Current implementation | MOCK | The view explicitly describes itself as a frontend-only runtime preview. |
| Pipeline worker panel | MOCK | Shows intended worker layout and simulated stage rows. |
| Playback worker panel | MOCK | Shows simulated playback worker state. |
| Screen on-off worker panel | MOCK | Shows simulated screen watchdog state. |
| Preview log | MOCK | Frontend-only simulated log. |

### View D target direction

View D should eventually become the live monitor for the regular stage worker, playback worker, and screen on/off worker. The final target spec must preserve a hard boundary between simulated previews and live worker state.

## View E — Database Viewer

| Aspect | Status | Current specification |
|---|---|---|
| Purpose | IMPLEMENTED / PARTIAL | Provides backend-mediated database verification, table catalog, row inspection, and bounded DB activity logging. |
| Verification/connect | IMPLEMENTED / PARTIAL | Verify checks DB existence and required-table baseline. Connect is a logical gate, not a durable SQL session. |
| Table catalog | IMPLEMENTED | Reads current catalog through backend helper. |
| Row viewer | IMPLEMENTED / PARTIAL | Requests bounded backend pages. |
| DB activity logging | PARTIAL | Captures app-observed backend-mediated DB activity during active logging session, not a complete SQL trace. |

## Inspect modes

| Inspect mode | Status | Current specification |
|---|---|---|
| Show real vs mock | PARTIAL | Useful for action-level truth; not all section-level summaries are equally reliable. |
| Show backend status | PARTIAL | Useful for backend wiring visibility; some status surfaces still need reconciliation. |
| Explain values | PARTIAL | Strong for many controls and result surfaces; weaker where generic fallback metadata is used. |

## Dashboard risks

| Risk | Status | Required handling |
|---|---|---|
| Real route mistaken for production-complete feature | ACTIVE | Mark mock-copy, placeholder geocoder, and partial runtime behavior explicitly. |
| Mock preview mistaken for live runtime | ACTIVE | Keep View C and View D marked as mock until real backend recovery/worker monitor APIs exist. |
| Section badge conflicts with action truth | ACTIVE | Trust selector/action-level evidence over broad card marketing copy. |
| Auth status overclaiming | ACTIVE | Keep provider-readiness, session-validity, login attempt, and 2FA state separate. |
| Old docs overriding current spec | ACTIVE | Use `DOCUMENTATION_AUTHORITY_MAP.md` and this folder as the active reading path after Slice 3. |
