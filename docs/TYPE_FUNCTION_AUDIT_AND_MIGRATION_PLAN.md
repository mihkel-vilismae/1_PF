# Type Function Audit and Migration Plan

Generated: 2026-04-29 11:30 Europe/Tallinn

Scope: analysis only. No implementation code changes are included in this document. The uploaded ZIP is treated as the immutable snapshot for this audit.

## 1. Current Baseline

| Item | Finding |
|---|---|
| Repository package | `photo-frame-dashboard-frontend` |
| Version | `0.3.31` in both `package.json` and `VERSION` |
| Runtime/module style | Node/Vite project using ESM and TypeScript source files |
| Main source areas | `server/`, `dashboard/`, `shared/`, `tests/` |
| TypeScript version | `^6.0.3` declared in `devDependencies` |
| Test runner | `tsx --test` via `npm test` |
| Typecheck script | `tsc --noEmit` via `npm run typecheck` |
| Build script | `vite build` via `npm run build` |
| Current `tsconfig` posture | `allowJs: true`, `checkJs: false`, `strict: false`, `moduleResolution: Bundler`, `allowImportingTsExtensions: true` |
| Changelog policy observed | Entries use Estonian timestamps with date/time, e.g. `2026-04-28 17:55 EEST — v0.3.31` |
| Git state warning | The uploaded snapshot already contains many pre-existing uncommitted changes. This audit does not normalize, revert, or commit them. |

### Verification status

| Command | Status in this audit environment | Notes |
|---|---|---|
| `npm run typecheck` | Not completed | The command did not finish within the available tool timeout. Record as unresolved baseline evidence, not as pass/fail. |
| `npm test` | Not run | Skipped because dependencies are not installed in the extracted workspace and typecheck already failed to complete within timeout. |
| `npm run build` | Not run | Skipped for the same reason. |

Before implementation, run these checks locally in the real development environment and record exact output. Do not assume this audit proves the repo is currently green.

## 2. Typing Inventory Summary

This static audit found approximately 410 function-like declarations or exported arrow helpers across TypeScript/JavaScript source and tests. The scanner is intentionally conservative and may miss class methods or inline callbacks, so implementation should re-check each file directly before editing.

| Area | Function-like entries found | Entries with likely untyped parameters | Entries with implicit return types | Primary concern |
|---|---:|---:|---:|---|
| `shared/` | 7 | 0 | 0 | Already strongest typing area; preserve as source of contract patterns. |
| `server/` | 137 | 84 | 135 | Many route handlers and service helpers rely on `any` or implicit returns. |
| `dashboard/` | 178 | 120 | 171 | Service/view/runtime-truth helpers need return contracts before strictness. |
| `tests/` | 88 | 65 | 88 | JS fixtures and helpers remain intentionally outside `checkJs`; migrate last. |

## 3. File-Level Function Type Inventory

Legend: “Untyped params” and “Implicit returns” are static-audit counts. They indicate where explicit parameter and return types should be reviewed, not a guaranteed compiler error.

### shared/

| File | LOC | Functions to review | Untyped params | Implicit returns | Boundary | Risk | Recommended slice |
|---|---:|---|---:|---:|---|---|---|

### server/

| File | LOC | Functions to review | Untyped params | Implicit returns | Boundary | Risk | Recommended slice |
|---|---:|---|---:|---:|---|---|---|
| `server/auth/authLogSanitizer.ts` | 50 | sanitizeAuthValue, sanitizeUnknown, isSensitiveKey | 3 | 3 | Auth provider/session/runtime boundary | High | Slice 3 |
| `server/auth/authPersistence.ts` | 73 | normalizePersistedAuthState | 1 | 1 | Auth provider/session/runtime boundary | High | Slice 3 |
| `server/auth/authRoutes.ts` | 158 | createAuthRoutes, summarizeSingleFileTest, statusCodeForAuthState, responseStatusForAuthState | 0 | 4 | HTTP API request/response boundary | High | Slice 3 |
| `server/auth/authService.ts` | 673 | getRawAuthState, getPublicAuthState, loadPersistedAuthState, persistCurrentAuthState, mapProviderOutcomeToAuthState, createConcurrentAuthState, withAuthOperationLock, withTimeout … | 0 | 13 | Auth provider/session/runtime boundary | High | Slice 3 |
| `server/auth/authSessionService.ts` | 112 | shouldVerifyPersistedSession | 0 | 1 | Auth provider/session/runtime boundary | High | Slice 3 |
| `server/auth/providers/icloudpdProcessRunner.ts` | 161 | createIcloudpdProcessRunner, buildAuthOnlyArgs, buildVerifySessionArgs, buildSingleFileDownloadArgs, runIcloudpdCommand, redactIcloudpdArgs | 0 | 6 | Auth provider/session/runtime boundary | High | Slice 4 |
| `server/auth/providers/icloudpdProvider.ts` | 279 | validateIcloudpdConfig, validateIcloudpdSessionConfig, mapIcloudpdResultToOutcome, missingConfigOutcome, providerUnavailableOutcome, indicatesTwoFactorRequired, inferTwoFactorMethod, indicatesInvalidCredentials … | 7 | 9 | Auth provider/session/runtime boundary | High | Slice 4 |
| `server/auth/providers/icloudpdSanitizer.ts` | 40 | sanitizeIcloudpdText, redactedEmail | 0 | 2 | Auth provider/session/runtime boundary | High | Slice 4 |
| `server/auth/providers/mockDisabledProvider.ts` | 15 | createMockDisabledProvider | 1 | 1 | Auth provider/session/runtime boundary | High | Slice 4 |
| `server/auth/providers/providerRegistry.ts` | 52 | createProviderRegistry, normalizeProviderOutcome | 2 | 2 | Auth provider/session/runtime boundary | High | Slice 4 |
| `server/database/databaseService.ts` | 421 | createDatabaseService | 0 | 1 | SQLite/admin-service boundary | High | Slice 4 |
| `server/index.ts` | 1878 | verifyEnvHandler, databaseStatusHandler, inspectDatabaseHandler, deleteDatabaseHandler, recreateEmptyDatabaseHandler, installCronHandler, cronStatusHandler, printCronHandler … | 57 | 75 | HTTP API request/response boundary | High | Slice 4 |
| `server/logging/projectLogger.ts` | 157 | writeEntry, touchFile, normalizeLevel, stringifyMessage, normalizeDetails, serializeError, formatLogFileDate | 7 | 7 | Private helper boundary | Medium | Slice 4 |
| `server/scheduler_host.ts` | 219 | recordTick, appendSummary, writeStatus, appendLog, acquireLock, releaseLock, processExists, readJsonFile … | 6 | 10 | Scheduler/platform boundary | High | Slice 4 |

### dashboard/

| File | LOC | Functions to review | Untyped params | Implicit returns | Boundary | Risk | Recommended slice |
|---|---:|---|---:|---:|---|---|---|
| `dashboard/app.ts` | 457 | render, bindEvents, openLogModal, openHistoryModal, escapeHtml | 3 | 5 | Private helper boundary | Medium | Slice 5 |
| `dashboard/data/authButtonStatusCopy.ts` | 248 | normalizeAuthButtonStatusForCopy, getAuthButtonCopy, getAuthButtonStatusHelp, getAuthButtonStatusLabel, getAuthButtonInspectCopy, getAuthButtonRealityCopy, getAuthButtonBackendStatusCopy | 7 | 7 | Auth provider/session/runtime boundary | High | Slice 5 |
| `dashboard/inspect/backendStatusMetadata.ts` | 401 | createBackendStatusMetadataHelpers | 1 | 1 | UI rendering/inspect metadata boundary | Medium | Slice 5 |
| `dashboard/inspect/bindInspectModes.ts` | 235 | bindInspectMode, bindValueInspectMode, bindRealityInspectMode, bindBackendStatusInspectMode, bindFocusableInspectMode, isNaturallyFocusable | 6 | 6 | UI rendering/inspect metadata boundary | Medium | Slice 5 |
| `dashboard/inspect/controlMetadata.ts` | 312 | describeInspectableElement, describeValueElement, describeSimulationControl, describeDefinitionValue, fallbackInspectCopy | 5 | 5 | UI rendering/inspect metadata boundary | Medium | Slice 5 |
| `dashboard/inspect/realityMetadata.ts` | 301 | createRealityMetadataHelpers | 1 | 1 | UI rendering/inspect metadata boundary | Medium | Slice 5 |
| `dashboard/inspect/tooltipController.ts` | 156 | createGuideTooltipController | 1 | 1 | UI rendering/inspect metadata boundary | Medium | Slice 5 |
| `dashboard/services/apiClient.ts` | 221 | subscribeTransit, emitTransit, requestJson, readResponsePayload, extractMessage, normalizeHeaders | 6 | 6 | Dashboard service/runtime-truth boundary | Medium | Slice 2 |
| `dashboard/services/authPreflightService.ts` | 54 | fetchAuthStatus, verifyIcloudpdPreflight, checkAuthLogin, runAuthPreflight, testLoginByDownloadingSingleFile, resetAuthPreflight, submitAuthTwoFactor, logoutAuthPreflight … | 2 | 9 | Auth provider/session/runtime boundary | High | Slice 2 |
| `dashboard/services/databaseViewerService.ts` | 50 | verifyDatabase, connectDatabase, listDatabaseTables, fetchDatabaseRows, startDatabaseLogging, stopDatabaseLogging, callDatabaseViewerEndpoint | 2 | 7 | SQLite/admin-service boundary | Medium | Slice 2 |
| `dashboard/services/initService.ts` | 76 | verifyEnv, checkDatabaseStatus, inspectDatabase, deleteDatabase, recreateEmptyDatabase, installCron, checkCronStatus, printCron … | 4 | 10 | Dashboard service/runtime-truth boundary | Medium | Slice 2 |
| `dashboard/services/renderers.ts` | 326 | statusBadge, renderLogEntries, renderSourceBadge, renderDefinitionList, renderResultSurface, renderHistory, renderModal, renderStepList … | 12 | 16 | UI rendering/inspect metadata boundary | Medium | Slice 5 |
| `dashboard/services/runtimeExecutionService.ts` | 44 | runRuntimeDownload, runRuntimeIndex, runRuntimeGps, runRuntimeGeocode, runRuntimeQueuePrepare, runRuntimePlaybackSelectCurrent, callRuntimeEndpoint | 1 | 7 | Dashboard service/runtime-truth boundary | Medium | Slice 2 |
| `dashboard/services/runtimeTruth.ts` | 282 | getState, subscribe, emit, patchState, setActiveView, toggleInspectMode, toggleValueInspectMode, toggleRealityInspectMode … | 12 | 23 | Dashboard service/runtime-truth boundary | High | Slice 5 |
| `dashboard/services/runtimeTruth/runtimeTruthActionUtils.ts` | 149 | buildRequestHeaders, normalizeActionResult, buildTimelineDetails, buildInitLogDetails, mapPayloadStatusToUiStatus, extractSchedulerCapability, summarizeInitPayload, summarizeRuntimePayload … | 8 | 9 | Dashboard service/runtime-truth boundary | High | Slice 5 |
| `dashboard/services/runtimeTruth/runtimeTruthAuthActions.ts` | 216 | createRuntimeTruthAuthActions, sanitizeAuthPayload, mapAuthStatusToUiStatus, buildAuthButtonState, classifyAuthButtonStatus, summarizeAuthResult, formatAuthError, buildAuthResult … | 10 | 11 | Dashboard service/runtime-truth boundary | High | Slice 5 |
| `dashboard/services/runtimeTruth/runtimeTruthBehavior.ts` | 161 | createRuntimeTruthBehavior | 1 | 1 | Dashboard service/runtime-truth boundary | High | Slice 5 |
| `dashboard/services/runtimeTruth/runtimeTruthDatabaseActions.ts` | 425 | createRuntimeTruthDatabaseActions | 1 | 1 | Dashboard service/runtime-truth boundary | High | Slice 5 |
| `dashboard/services/runtimeTruth/runtimeTruthDemoActions.ts` | 477 | inferMediaTypeFromPath, extractFileName, createRuntimeTruthDemoActions | 3 | 3 | Dashboard service/runtime-truth boundary | High | Slice 5 |
| `dashboard/services/runtimeTruth/runtimeTruthGuards.ts` | 119 | createRuntimeTruthGuards | 1 | 1 | Dashboard service/runtime-truth boundary | High | Slice 5 |
| `dashboard/services/runtimeTruth/runtimeTruthPersistence.ts` | 113 | createRuntimeTruthPersistence, normalizeTruthSnapshot, getTruthSignature, warnRuntimeTruthPersistence | 4 | 4 | Dashboard service/runtime-truth boundary | High | Slice 5 |
| `dashboard/services/runtimeTruth/runtimeTruthState.ts` | 238 | buildInitialSchedulerCapability, getSchedulerSupportForAction, supportsSchedulerAction, buildSchedulerReadyMessage, buildInitialTruthState, buildInitialAuthButtonStates, buildInitialDatabaseViewerState, createHistoryId … | 3 | 9 | Dashboard service/runtime-truth boundary | High | Slice 5 |
| `dashboard/services/runtimeTruthPersistenceService.ts` | 24 | loadPersistedRuntimeTruth, savePersistedRuntimeTruth | 1 | 2 | Dashboard service/runtime-truth boundary | High | Slice 5 |
| `dashboard/services/transitTerminal.ts` | 74 | createTransitTerminal, formatTransitRecord | 1 | 2 | Private helper boundary | Medium | Slice 5 |
| `dashboard/views/databaseViewerView.ts` | 281 | renderDatabaseViewerView, renderVerificationPanel, renderTablesPanel, renderRowsPanel, renderRowsTable, renderLoggingPanel, formatCell, escapeHtml | 8 | 8 | SQLite/admin-service boundary | Medium | Slice 5 |
| `dashboard/views/initView.ts` | 203 | renderInitView, renderAuthCard, renderAuthOperatorControls, renderAuthActionButton, normalizeAuthButtonStatus, escapeHtml, escapeAttribute, renderAuthStateSummary … | 11 | 11 | UI rendering/inspect metadata boundary | Medium | Slice 5 |
| `dashboard/views/lastRunView.ts` | 41 | renderLastRunView | 1 | 1 | UI rendering/inspect metadata boundary | Medium | Slice 5 |
| `dashboard/views/runningProcessView.ts` | 76 | renderRunningProcessView | 1 | 1 | UI rendering/inspect metadata boundary | Medium | Slice 5 |
| `dashboard/views/testView.ts` | 155 | renderTestView, renderStageCard, renderToggle | 3 | 3 | UI rendering/inspect metadata boundary | Medium | Slice 5 |

### tests/

| File | LOC | Functions to review | Untyped params | Implicit returns | Boundary | Risk | Recommended slice |
|---|---:|---|---:|---:|---|---|---|
| `tests/authApi.step1.test.js` | 244 | withAuthServer, requestJson, reservePort, onceExit, buildEnvFile, expectedAuthKeys | 4 | 6 | Auth provider/session/runtime boundary | High | Slice 6 |
| `tests/authHardening.test.js` | 46 | check | 1 | 1 | Auth provider/session/runtime boundary | High | Slice 6 |
| `tests/authIcloudpdProvider.test.js` | 235 | runner | 1 | 1 | Auth provider/session/runtime boundary | High | Slice 6 |
| `tests/authLogout.test.js` | 52 | check | 1 | 1 | Auth provider/session/runtime boundary | High | Slice 6 |
| `tests/authPersistence.test.js` | 66 | withTempDir | 1 | 1 | Auth provider/session/runtime boundary | High | Slice 6 |
| `tests/authService.test.js` | 234 | check | 1 | 1 | Auth provider/session/runtime boundary | High | Slice 6 |
| `tests/authSessionService.test.js` | 276 | createMemoryPersistence, createPersistedVerificationRequiredState, createRegistryWithResume | 1 | 3 | Auth provider/session/runtime boundary | High | Slice 6 |
| `tests/initApi.step1.test.js` | 361 | withInitServer, requestJson, reservePort, onceExit, buildEnvFile, withCustomEnvServer | 5 | 6 | Test harness/fixture boundary | Low | Slice 6 |
| `tests/inspectMetadata.test.js` | 246 | fakeNode, fakeElement | 2 | 2 | UI rendering/inspect metadata boundary | Low | Slice 6 |
| `tests/playbackLoop.test.js` | 163 | createRuntimeTruthHarness, waitFor | 1 | 2 | Test harness/fixture boundary | Low | Slice 6 |
| `tests/transitGateway.test.js` | 106 | installFetchStub | 1 | 1 | Test harness/fixture boundary | Low | Slice 6 |
| `tests/viewA.2A.databaseButtons.buttonWorkflow.test.js` | 282 | createRuntimeTruthHarness, waitFor | 1 | 2 | SQLite/admin-service boundary | Low | Slice 6 |
| `tests/viewA.3A.schedulerButtons.buttonWorkflow.test.js` | 176 | createRuntimeTruthHarness, waitFor | 1 | 2 | Scheduler/platform boundary | Low | Slice 6 |
| `tests/viewA.verifyEnv.buttonWorkflow.test.js` | 117 | createRuntimeTruthHarness, waitFor | 1 | 2 | Test harness/fixture boundary | Low | Slice 6 |
| `tests/viewB.buttonWorkflow.test.js` | 552 | createRuntimeTruthHarness, waitFor | 1 | 2 | Test harness/fixture boundary | Low | Slice 6 |
| `tests/waveA.step2.test.js` | 504 | withWaveAServer, seedWaveADatabase, insertCanonicalAssetSql, insertVariantSql, sqlString, queryRows, execSql, getAssetId … | 12 | 16 | Test harness/fixture boundary | Medium | Slice 6 |
| `tests/waveB.step3.test.js` | 405 | withRuntimeServer, readIndexCounts, buildEnvFile, requestJson, reservePort, onceExit, execSqlFile, queryRows … | 7 | 10 | Test harness/fixture boundary | Medium | Slice 6 |
| `tests/waveC.step4.test.js` | 303 | withRuntimeServer, buildEnvFile, execSqlFile, insertIndexedAsset, createGpsExifImage, writePlainJpeg, queryRows, requestJson … | 9 | 10 | Test harness/fixture boundary | Medium | Slice 6 |
| `tests/waveD.e2e.test.js` | 613 | withWaveDServer, installMockDownloadSource, buildMockDownloadSourcePythonScript, buildEnvFile, assertDownloadedFixtures, assertQueuePrepareResponseContract, assertInsertedStage5AssetsArePlayable, logStage … | 11 | 15 | Test harness/fixture boundary | High | Slice 6 |
| `tests/waveE.step5.test.js` | 255 | reservePort, requestJson, buildEnvFile, withOrchestrationServer | 3 | 4 | Test harness/fixture boundary | High | Slice 6 |

## 4. Boundary Type Map

| Boundary | Current evidence | Needed type direction |
|---|---|---|
| Shared scheduler capability | `shared/schedulerPlatformCapabilities.ts` already defines `SchedulerCapabilityInput`, `SchedulerCapability`, `SchedulerSupportLevel`, and return types. | Use this as the style reference for future shared contracts. Keep it low-risk and stable. |
| Server HTTP handlers | `server/index.ts` has a large `routes: any` map and many handlers with destructured untyped context. | Introduce `HttpRouteHandler`, `HttpRouteResult`, `RequestContext`, `EnvValues`, and route payload/result types before typing each handler. |
| Auth API/provider boundary | `server/auth/*` currently mixes explicit state constants with `any` states and provider outcomes. | Define `AuthState`, `PublicAuthState`, `AuthReadinessCheck`, `AuthProviderOutcome`, `TwoFactorStatus`, and `AuthRoutePayload`. |
| Database service boundary | `server/database/databaseService.ts` exposes a service factory with many private helpers. | Add `DatabaseService`, `DatabaseStatus`, `DatabaseInspection`, `DatabaseViewerVerification`, `CreateHttpErrorFn`, and `RequestContext` dependencies. |
| Scheduler runtime boundary | `server/scheduler_host.ts` and `/api/init/cron/*` routes use runtime JSON state and platform capabilities. | Add `SchedulerHostStatus`, `SchedulerTickName`, `SchedulerLogEntry`, and reuse `SchedulerCapability`. |
| Dashboard API client | `dashboard/services/apiClient.ts` centralizes fetch/transit behavior. | Add generic `requestJson<TPayload>()`, `TransitRecord`, `ApiClientOptions`, and normalized error shapes. |
| Dashboard service wrappers | `authPreflightService`, `initService`, `databaseViewerService`, and `runtimeExecutionService` wrap backend endpoints. | Type each exported function as returning exact backend payload contracts or narrow service result unions. |
| Runtime truth frontend state | `dashboard/services/runtimeTruth*.ts` owns UI state, action results, modal/history, and auth button status. | Introduce `DashboardState`, `RuntimeTruthState`, `AuthButtonState`, `HistoryEntry`, `ModalState`, `ActionResult`, and update helpers with explicit returns. |
| Inspect metadata and renderers | `dashboard/inspect/*`, `dashboard/services/renderers.ts`, and `dashboard/views/*` generate UI strings. | Add `InspectableElementDescription`, `ValueDescription`, `RenderState`, `HtmlString` alias if useful, and view-specific prop/state types. |
| Tests and fixtures | `tests/*.js` use JS helpers and runtime assertions. | Migrate last. Either keep JS as black-box tests or add JSDoc typedefs after production source is typed. |

## 5. Risk Assessment

### High risk

| File/group | Why high risk | Safe approach |
|---|---|---|
| `server/index.ts` | Central API server, 1877 LOC, large route map, request parsing, env checks, runtime stages, orchestration, scheduler responses, DB actions. | Do not start here. First extract/define route context/result types, then type one route family per commit. |
| `server/auth/*` | Auth state, provider outcomes, 2FA semantics, session resume, safe public projection, and status codes are security-sensitive. | Type domain state and provider outcomes without changing status strings or payload shapes. Add tests before behavior changes. |
| `dashboard/services/runtimeTruth*.ts` | Central frontend state machine and action dispatcher; UI behavior depends on exact string keys and action names. | Add state/action/result types around existing keys. Do not rename keys. Snapshot UI strings before edits. |
| `server/database/databaseService.ts` | Backend DB bridge and schema/admin actions affect real files. | Type service interface first; avoid changing filesystem or Python bridge arguments. |
| `server/scheduler_host.ts` | Lock/status/log behavior affects future cron/runtime operation. | Add types for JSON status/log records only; no scheduling behavior changes. |

### Medium risk

| File/group | Why medium risk | Safe approach |
|---|---|---|
| `dashboard/views/*` and `dashboard/services/renderers.ts` | Rendering functions are pure-ish but string output is user-visible and heavily tested. | Add return type `string` and state input types only after state contracts exist. |
| `dashboard/inspect/*` | Inspect controls must preserve metadata wording and live/mock/backend explanations. | Type metadata records and helper results; do not alter copy. |
| `dashboard/services/*Service.ts` | Backend service wrappers are good type targets but depend on backend payload contracts. | Introduce response interfaces first, then type wrappers. |
| `tests/wave*.test.js` | E2E tests are critical but JS-based and contain many helper functions. | Leave until production contracts are typed; then add JSDoc or convert selectively. |

### Low risk

| File/group | Why low risk | Safe approach |
|---|---|---|
| `shared/schedulerPlatformCapabilities.ts` | Already typed and isolated. | Use as reference; only small refinements if compiler identifies gaps. |
| Small pure dashboard helpers | Examples: `guideUtils.ts`, `inspectModeSummary.ts`, simple formatting helpers. | Add explicit return types with snapshot tests. |
| Test helper typedefs | Tests are not checked by `checkJs`; can be typed last without affecting runtime. | Add JSDoc gradually after source contracts stabilize. |

## 6. Recommended Type Add Order

### Slice 1 — Shared and contract foundation

Goal: create or consolidate reusable type contracts without changing runtime behavior.

Recommended targets:
- `shared/schedulerPlatformCapabilities.ts` as style reference; avoid unnecessary edits if already clean.
- New shared/domain type files only if they reduce duplication, for example `shared/apiContracts.ts` or `shared/authContracts.ts`, but only after confirming import boundaries are acceptable.
- Low-risk exported pure helpers with obvious return types.

Expected commit message: `docs/types: add function typing audit and shared contract plan` if only documentation; `types: add shared function contracts` if implementing.

### Slice 2 — Dashboard API/service boundary types

Goal: type the frontend boundary that calls backend endpoints.

Recommended targets:
- `dashboard/services/apiClient.ts`
- `dashboard/services/authPreflightService.ts`
- `dashboard/services/initService.ts`
- `dashboard/services/databaseViewerService.ts`
- `dashboard/services/runtimeExecutionService.ts`

Rules: use generics and exact response types; do not change fetch URLs, HTTP methods, payload keys, or transit terminal behavior.

### Slice 3 — Auth domain/server types

Goal: type security-sensitive auth state and provider outcomes while preserving semantics.

Recommended targets:
- `server/auth/authState.ts`
- `server/auth/authService.ts`
- `server/auth/authRoutes.ts`
- `server/auth/authPersistence.ts`
- `server/auth/authSessionService.ts`
- `server/auth/providers/*`

Rules: no status string changes, no fake authenticated state, no 2FA overclaiming, no secret leakage.

### Slice 4 — Server route/database/scheduler types

Goal: type the central backend route layer after contracts exist.

Recommended targets:
- `server/index.ts` route context/result types
- `server/database/databaseService.ts`
- `server/logging/projectLogger.ts`
- `server/scheduler_host.ts`

Rules: consider splitting internal type aliases before editing handlers; do not split files unless explicitly approved because that is an architectural change.

### Slice 5 — Runtime truth, inspect, and views

Goal: type UI state and rendering functions after service payloads are typed.

Recommended targets:
- `dashboard/services/runtimeTruth.ts`
- `dashboard/services/runtimeTruth/*.ts`
- `dashboard/inspect/*.ts`
- `dashboard/services/renderers.ts`
- `dashboard/views/*.ts`
- `dashboard/app.ts`

Rules: no UI text/key/name changes; preserve action names and inspect metadata coverage.

### Slice 6 — Tests and strictness preparation

Goal: type test helpers or add JSDoc typedefs after production code contracts stabilize.

Recommended targets:
- `tests/*` helper functions
- only then consider incremental `tsconfig` tightening such as `noImplicitAny` on TS files, not full `strict` immediately.

## 7. Exact Implementation Rules

- Preserve all existing functionality and response shapes.
- Add explicit types; do not use broad `any` as the default fix.
- Use `unknown` plus narrowing for unsafe external values.
- Use named interfaces/types for repeated API/domain object shapes.
- Use discriminated unions for status/result state where existing strings already act that way.
- Add explicit return types first on exported functions and boundary helpers.
- Keep private helper typing local unless the type is genuinely shared.
- Do not enable `strict: true` globally in the first implementation pass.
- Do not rename endpoints, action names, state keys, data attributes, or UI labels while typing.
- Keep one logical commit per slice and record exact verification evidence.

## 8. Verification Plan

Run after every implementation slice:

```bash
npm run typecheck
npm test
npm run build
```

If a command hangs twice, stop re-running it in that slice, record the exact command, timeout duration, and last output, then continue only with static verification and smaller targeted tests. Do not mark the slice green without evidence.

For type-only slices, also inspect `git diff --stat` and confirm there are no changed string literals in endpoint paths, action names, status names, or UI copy unless explicitly intended.

## 9. Suggested First Implementation Slice

Because `shared/schedulerPlatformCapabilities.ts` is already typed, the safest first implementation slice should not churn it. Instead, Slice 1 should add documentation and type foundations only:

1. Keep this audit document as the first artifact.
2. Add a small shared contract file only if implementation begins and only if it is directly consumed by Slice 2 services.
3. Do not touch `server/index.ts` first.
4. Do not enable `strict` first.
5. Do not type tests before production contracts.

Recommended first implementation files after this audit:

| Priority | File | Why first | Expected change type |
|---:|---|---|---|
| 1 | `dashboard/services/apiClient.ts` | Centralizes fetch behavior; typing it improves every service wrapper. | Generic payload/result types, explicit returns. |
| 2 | `dashboard/services/authPreflightService.ts` | High-value API boundary for auth buttons, but frontend-only wrapper is safer than server auth internals. | Response interfaces matching existing backend payloads. |
| 3 | `dashboard/services/initService.ts` | Clear endpoint wrappers and scheduler/init payloads. | Explicit request/response contracts. |
| 4 | `dashboard/services/runtimeExecutionService.ts` | Runtime stage endpoints need clear result types before View B/D work. | Stage result interfaces/unions. |
| 5 | `dashboard/services/databaseViewerService.ts` | Helps View E while avoiding direct DB behavior changes. | Database viewer payload interfaces. |

Expected first implementation commit message:

```text
types: add dashboard API service function contracts
```

## 10. Stop Conditions

Stop and ask for explicit approval before:

- enabling global `strict`,
- converting JS tests to TS,
- splitting `server/index.ts`,
- changing API response payloads,
- replacing runtime behavior with mocks or placeholders,
- changing auth/2FA success criteria,
- changing database/scheduler side effects,
- removing files or moving architecture boundaries.

## 11. Audit Limitations

- Static scanner results are approximate and should be verified with TypeScript compiler output during implementation.
- Inline callbacks and class/object methods may be undercounted.
- Tests/build/typecheck were not proven green in this environment.
- The uploaded Git repository is already dirty, so implementation should begin by deciding whether to preserve that exact dirty snapshot or first create a clean baseline commit.
