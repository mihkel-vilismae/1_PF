# 1_PF Button Verification Evidence Map

Use this file to find the smallest set of repo files needed for a button audit.

## Canonical Workflow

- `docs/button_verification_workflow/BUTTON_VERIFICATION_WORKFLOW.md`
- `docs/button_verification_workflow/BUTTON_VERIFICATION_ACCELERATION_LAYER.md`

## View A Init

- Rendered controls: `dashboard/views/initView.js`
- Shared click binding: `dashboard/app.js`
- Action dispatch: `dashboard/services/runtimeTruth/runtimeTruthBehavior.js`
- Init request contracts: `dashboard/services/initService.js`
- Init response handling: `dashboard/services/runtimeTruth/runtimeTruthDatabaseActions.js`
- Result and log rendering: `dashboard/services/renderers.js`
- Backend routes and handlers: `server/index.js`
- Current-truth docs: `docs/OLD_DOCS/VIEW_A_INIT.md`
- Backend contract docs: `docs/OLD_DOCS/13_FRONTEND_BACKEND_CONTRACT.md`
- Placeholder status context: `placeholder_implementations.md`

## Inspect System

- Control and truth metadata: `dashboard/inspect/guideCopy.ts` and `dashboard/inspect/guideCopy/*`
- Control metadata helpers: `dashboard/inspect/controlMetadata.js`
- Backend-status metadata helpers: `dashboard/inspect/backendStatusMetadata.ts` and `dashboard/inspect/backendStatusMetadata/*`
- Reality metadata helpers: `dashboard/inspect/realityMetadata.js`

## Existing Tests Worth Checking First

- Init endpoint contract: `tests/initApi.step1.test.js`
- Inspect metadata stability: `tests/inspectMetadata.test.js`
- Runtime truth helper coverage: `tests/runtimeTruthHelpers.test.js`

## Audit Shortcuts

1. Find the visible button in `dashboard/views/*.js`.
2. Find the `data-action` binding in `dashboard/app.js`.
3. Find the action mapping in `runtimeTruthBehavior.js`.
4. Find the service module that defines method and endpoint.
5. Find the backend route in `server/index.js`.
6. Find the frontend result-surface state updates in the runtime-truth action layer.
7. Check inspect metadata and tests before declaring the button real, mock, or broken.
