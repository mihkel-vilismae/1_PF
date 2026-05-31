# PF_login Button Verification Evidence Map

Use this file to find the smallest set of repo files needed for a button audit.

## Canonical Workflow

- `../SKILL.md`
- `references/report-template.md`
- `references/agent-patterns.md` when delegation is requested

## View A Init

- Rendered controls: `dashboard/views/initView.ts`
- Shared click binding: `dashboard/app.ts`
- Action dispatch: `dashboard/services/runtimeTruth/runtimeTruthBehavior.ts`
- Init request contracts: `dashboard/services/initService.ts`
- Init response handling: `dashboard/services/runtimeTruth/runtimeTruthDatabaseActions.ts`
- Result and log rendering: `dashboard/services/renderers.ts`
- Backend routes and handlers: `server/index.ts`
- Current button/status docs: `docs/CARD_BUTTON_IMPLEMENTATION_STATUS.md`
- User-observed status snapshot: `docs/30_status_snapshots/2026-05-26/USER_OBSERVED_CARD_STATUS_AND_ISSUES_20260526_1457_EEST.md`
- Placeholder status context: `docs/50_audits_and_migrations/placeholder_implementations.md`

## Inspect System

- Control and truth metadata: `dashboard/inspect/guideCopy.ts` and `dashboard/inspect/guideCopy/*`
- Control metadata helpers: `dashboard/inspect/controlMetadata.ts`
- Backend-status metadata helpers: `dashboard/inspect/backendStatusMetadata.ts` and `dashboard/inspect/backendStatusMetadata/*`
- Reality metadata helpers: `dashboard/inspect/realityMetadata.ts`

## Existing Tests Worth Checking First

- Init endpoint contract: `tests/initApi.step1.test.js`
- Inspect metadata stability: `tests/inspectMetadata.test.js`
- Runtime truth helper coverage: `tests/runtimeTruthHelpers.test.js`

## Audit Shortcuts

1. Find the visible button in `dashboard/views/*.ts`.
2. Find the `data-action` binding in `dashboard/app.ts`.
3. Find the action mapping in `runtimeTruthBehavior.ts`.
4. Find the service module that defines method and endpoint.
5. Find the backend route in `server/index.ts`.
6. Find the frontend result-surface state updates in the runtime-truth action layer.
7. Check inspect metadata and tests before declaring the button real, mock, or broken.
