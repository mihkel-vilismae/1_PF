# View A B1 Auth Preflight

## Scope

- View: `A - Init`
- Section: `B1`
- Control: `Run auth preflight`
- Primary action key: `data-action="run-b1"`
- Related action keys: `refresh-b1-auth-status`, `reset-b1-auth`, `submit-b1-2fa`, `logout-b1-auth`

## Authoritative Spec Callout

Merged spec states B1 auth belongs in View A as init/preflight and is not a View B stage action (`docs/VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md:168-185`, `:910-920`).

## Final Classification

`✅ Works`

## Current Contract

B1 is backend-auth-backed. The frontend calls the backend auth endpoint family through the dashboard auth service/action boundary:

- `GET /api/auth/status`
- `POST /api/auth/run`
- `POST /api/auth/reset`
- `POST /api/auth/2fa/submit`
- `POST /api/auth/logout`

The backend remains the source of auth truth. The frontend renders only the safe public auth projection and must not infer `authenticated=true` locally. Automated tests mock backend/provider responses only and do not use real Apple/iCloud credentials.

## Workflow Result

| Step | Result | Evidence | Notes |
| --- | --- | --- | --- |
| 1. UI Trigger | Pass | `dashboard/views/initView.js` renders the B1 auth preflight card and controls. | Control exists in View A. |
| 2. Frontend Wiring | Pass | `dashboard/app.js` dispatches B1 2FA input payloads; `dashboard/services/runtimeTruth/runtimeTruthBehavior.js` maps B1 actions to auth actions. | Click path is wired. |
| 3. Frontend -> Backend Call | Pass | `dashboard/services/authPreflightService.js`; `dashboard/services/runtimeTruth/runtimeTruthAuthActions.js`. | Calls `/api/auth/*` endpoints. |
| 4. Backend Endpoint Existence | Pass | Existing backend auth endpoint family is used by the auth service boundary. | No `run-b1` backend route is required; B1 maps to `/api/auth/*`. |
| 5. Backend Logic Execution | Pass with mocked tests | `tests/authFrontendControls.test.js` and `tests/viewB.buttonWorkflow.test.js`. | Tests mock backend/provider responses only. |
| 6. Response Handling (Frontend) | Pass | Auth public state updates `authPreflight.publicState`, `latestResult`, status, log, history, and B1 step projection. | Secrets are sanitized. |
| 7. Mock / Reality Validation | Pass | `dashboard/inspect/guideCopy.json` marks `run-b1` as real backend-backed. | Backend truth remains authoritative. |
| 8. Inspect System Alignment | Pass | Inspect metadata and button status docs now match current behavior. | No frontend-only auth claim remains. |
| 9. Test Coverage | Pass | `tests/authFrontendControls.test.js`; `tests/viewB.buttonWorkflow.test.js`. | Verifies endpoint calls and sanitization. |

## Registry Update

- `RUN_LOG.md` appended: yes
- `INDEX.md` updated to latest status: yes
