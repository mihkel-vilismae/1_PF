# Inspect Controls Slice 1 Analysis

Timestamp: 2026-04-26 23:23:16 EEST

Status: Slice 1 complete. This slice is documentation/audit only and does not modify production UI behavior.

## 1. Prompt analysis, critique, and refined Slice 1 prompt

### Analysis

The requested work has two distinct concerns that should stay separated:

1. Restore or repair runtime UI behavior for the dashboard inspect controls.
2. Document the same behavior as a reusable cross-project pattern for future/default project setups.

The repository already contains an inspect-mode architecture, so the safe path is not to create a new parallel system. The correct Slice 1 task is to map existing files, identify the likely breakpoints, and constrain Slice 2 to the smallest repair.

### Critique

The raw prompt is strong but needs a few extra guardrails for Slice 1:

- The uploaded ZIP contains a non-clean working tree relative to the embedded Git index. Slice 1 must record this rather than silently normalizing the baseline.
- Existing metadata is already centralized under `dashboard/inspect/`. Slice 2 should repair coverage and wiring before introducing new abstractions.
- The topbar button labels already toggle in code, but tests currently cover metadata helpers more than rendered per-view interactions.
- The user wants A/B/C/D/E coverage. Existing docs and code are strongest for A/B/C/D and newer for E, so Slice 2 should explicitly verify View E.
- The phrase “make these buttons work again” could mean either event wiring, tooltip hover/focus behavior, CSS highlight behavior, or metadata coverage. Slice 1 therefore defines all four as separate verification targets.

### Refined Slice 1 prompt actually executed

```text
Inspect the uploaded 12_PF repository as the immutable baseline snapshot. Do not perform production behavior changes. Map the dashboard inspect controls architecture, including topbar buttons, state toggles, metadata helpers, tooltip binding, CSS inspect classes, and A/B/C/D/E page render paths. Create docs/active_workflow/INSPECT_CONTROLS_SLICE1_ANALYSIS.md with baseline version, current architecture, current behavior, per-view coverage, metadata source table, broken/missing wiring list, preserved behavior, minimal Slice 2 implementation plan, risks, and verification plan. Commit only this Slice 1 analysis document with message: docs: analyze dashboard inspect controls restoration.
```

## 2. Baseline repo/version summary

| Item | Observed value |
|---|---|
| Uploaded repository ZIP | `12_PF_20260426_231717_0.3.28.zip` |
| VERSION file | `0.3.28` |
| `package.json` version | `0.3.28` |
| Package name | `photo-frame-dashboard-frontend` |
| Current branch in embedded Git repo | `master` |
| Last visible commit before Slice 1 | `6487c73 Add vision/spec index link to README` |
| Existing relevant skill folders | `.codex/skills/button-workflow-verification/`, `.codex/skills/view-a-init-reconciliation/` |
| Existing active workflow docs folder | `docs/active_workflow_docs/` |

### Baseline Git status note

The ZIP extracts with a dirty working tree before Slice 1 changes:

```text
 M CHANGELOG.md
 D TRANSFERABLE_REPO_PACKAGER.cmd
 M package-lock.json
 M package.json
 D server/scripts/__pycache__/sqlite_admin.cpython-313.pyc
```

Slice 1 treats this as part of the uploaded baseline state and does not normalize, revert, or stage those unrelated baseline differences.

## 3. Existing inspect-control architecture

The existing architecture is already centralized and should be repaired/reused rather than replaced.

| Concern | Existing source | Notes |
|---|---|---|
| View list A/B/C/D/E | `dashboard/shared/constants.js` | Defines `VIEW_ORDER`, including E Database Viewer. |
| Topbar inspect buttons | `dashboard/app.js` | Renders four buttons in `.topbar__actions`. |
| Button event routing | `dashboard/app.js` | `bindEvents()` routes `data-action` values to runtime truth toggles. |
| Inspect mode state toggles | `dashboard/services/runtimeTruth.js` | Four mutually exclusive booleans: `inspectMode`, `valueInspectMode`, `realityInspectMode`, `backendStatusInspectMode`. |
| DOM binding | `dashboard/inspect/bindInspectModes.js` | Adds mode classes, datasets, focus support, and event listeners. |
| Control explanations | `dashboard/inspect/controlMetadata.js` and `dashboard/inspect/guideCopy.json` | Provides labels/descriptions for buttons, nav links, DB table buttons, simulation controls, logs, and history. |
| Value explanations | `dashboard/inspect/controlMetadata.js` | `describeValueElement()` explains visible values and state sources. |
| Real vs mock explanations | `dashboard/inspect/realityMetadata.js` | Classifies elements as `real`, `mock`, `mixed`, or `unknown`. |
| Backend status explanations | `dashboard/inspect/backendStatusMetadata.js` | Classifies elements as `real`, `mock`, `missing`, or `unknown`. |
| Tooltip display | `dashboard/inspect/tooltipController.js` | Displays hover/focus tooltip for all inspect modes. |
| Inspect-mode styling | `dashboard/styles.css` | Contains classes for `.inspect-mode`, `.value-inspect-mode`, `.reality-inspect-mode`, `.backend-status-inspect-mode`. |
| Existing metadata tests | `tests/inspectMetadata.test.js` | Tests helper metadata, but not complete rendered A/B/C/D/E interaction coverage. |
| Existing overview docs | `docs/buttons_and_implementation_overview.md` | Detailed but possibly stale button/metadata overview. |

## 4. Current behavior of the four buttons

| Button | Current code path | Current label behavior | Observed/likely gap |
|---|---|---|---|
| Explain controls | `data-action="toggle-inspect-mode"` -> `toggleInspectMode()` -> `bindInspectMode()` | Shows `Explain controls`; active label becomes `Hide control guide`. | Functional path exists. Label differs from requested generic Show/Hide naming but may be acceptable. Needs rendered per-view verification and fallback behavior review. |
| Explain values | `data-action="toggle-value-inspect-mode"` -> `toggleValueInspectMode()` -> `bindValueInspectMode()` | Shows `Explain values`; active label becomes `Hide value guide`. | Functional path exists. Needs coverage gaps checked for E and unknown values. |
| Show real vs mock | `data-action="toggle-reality-inspect-mode"` -> `toggleRealityInspectMode()` -> `bindRealityInspectMode()` | Shows `Show real vs mock`; active label becomes `Hide real vs mock`. | Functional path exists. Needs truth reconciliation where section-level and action-level claims differ. |
| Show/Hide backend status | `data-action="toggle-backend-status-inspect-mode"` -> `toggleBackendStatusInspectMode()` -> `bindBackendStatusInspectMode()` | Shows `Show backend status`; active label becomes `Hide backend status`. | Functional path exists and requested label behavior already matches. Needs verification that all A/B/C/D/E surfaces get metadata or honest fallback. |

## 5. Per-view coverage table

| View | Render source | Current implementation truth | Inspect-control coverage observed in code | Slice 2 target |
|---|---|---|---|---|
| A — Init | `dashboard/views/initView.js` | Mixed: real init/database/scheduler/auth endpoints plus missing/incomplete backend support areas. | Buttons, hero pills, status badges, result surfaces, logs/history, current truth side panel are covered by selectors and metadata helpers. Auth card uses extra actions that need metadata verification. | Preserve real endpoint claims only where endpoint/action mapping exists. Add/repair missing auth action metadata if needed. |
| B — Test | `dashboard/views/testView.js` | Mixed: some runtime stage actions are real; some simulation/placeholder parts remain. | B2/B3/B4/B5 buttons and result values are covered by selectors and action metadata. Known contradiction risk around stage-level mock vs action-level real. | Reconcile labels and docs so real/mixed/mock states are honest. |
| C — Last Run Info | `dashboard/views/lastRunView.js` | Mock/recovery preview. | C1-C5 definition rows, notice, mode buttons, history/logs covered by generic selectors. | Ensure all C cards show mock/missing honestly and no backend claims are invented. |
| D — Running Process | `dashboard/views/runningProcessView.js` | Mock/simulated runtime preview. | Worker rows, preview frame, indicators, start button, status badges covered by selectors. | Ensure D clearly remains preview/missing backend unless backend evidence exists. |
| E — Database Viewer | `dashboard/views/databaseViewerView.js` | Real backend-backed SQLite viewer with repo-local activity logging. | E1-E4 buttons, DB table buttons, page buttons, table shell, DB activity entries are included in selectors and backend metadata. | Add rendered interaction tests/manual matrix because existing metadata tests do not fully prove View E button behavior. |

## 6. Metadata source table

| Metadata type | Primary source | Supporting source | Current state |
|---|---|---|---|
| Controls metadata | `dashboard/inspect/controlMetadata.js` | `dashboard/inspect/guideCopy.json`, `dashboard/inspect/guideCopy.js` | Present and reusable. Topbar inspect controls have stable test coverage in `tests/inspectMetadata.test.js`. |
| Values metadata | `dashboard/inspect/controlMetadata.js` | `dashboard/inspect/guideUtils.js` | Present. Broad selectors exist, but fallback behavior for missing metadata should be improved/verified. |
| Real-vs-mock metadata | `dashboard/inspect/realityMetadata.js` | `dashboard/inspect/guideUtils.js`, view markup source badges | Present. Needs reconciliation for mixed sections and View E coverage. |
| Backend-status metadata | `dashboard/inspect/backendStatusMetadata.js` | `dashboard/inspect/guideCopy.json`, `dashboard/inspect/guideUtils.js` | Present. Topbar label behavior already implemented. Needs broader rendered coverage and honest fallback verification. |
| Tooltip copy/display | `dashboard/inspect/tooltipController.js` | `dashboard/inspect/guideCopy.js` | Present. Shared tooltip controller is already reusable across modes. |
| Styling | `dashboard/styles.css` | N/A | Present for all four inspect body classes. |
| Tests | `tests/inspectMetadata.test.js` | view button workflow tests | Metadata helper tests exist; rendered A-E toolbar interaction tests are missing or incomplete. |
| Docs | `docs/buttons_and_implementation_overview.md`, `docs/vision_and_implementation/DASHBOARD_VIEWS_SPEC.md` | `docs/button_verification_workflow/` | Existing docs mention the pattern but do not yet define it as a transferable default-project pattern. |

## 7. Broken or missing wiring list

This slice did not modify code, so these are implementation candidates for Slice 2 rather than confirmed fixed defects.

1. **Rendered end-to-end tests for the four topbar buttons are missing/incomplete.** Existing `tests/inspectMetadata.test.js` verifies helper copy and classifications, but does not prove that rendered A/B/C/D/E pages toggle classes/tooltips correctly.
2. **Fallback behavior is skip-based in binders.** `bindInspectMode()` and `bindFocusableInspectMode()` skip elements when metadata helpers return `null`. The requested behavior prefers explicit fallback messaging such as “No explanation metadata available yet.” Slice 2 should decide whether to add fallback metadata centrally.
3. **View E needs explicit verification.** E is included in view constants and selectors, but current tests are helper-focused. Slice 2 should add E coverage or a manual matrix.
4. **Some labels differ from the requested control names when active.** Existing active labels are `Hide control guide`, `Hide value guide`, `Hide real vs mock`, and `Hide backend status`. Only backend status exactly follows requested Show/Hide naming. Slice 2 should decide whether to preserve existing wording or standardize labels.
5. **Documentation does not yet define a portable “Dashboard Inspect Controls Pattern.”** Existing docs explain current repo behavior, but the requested transferable default-project pattern is not yet present as a dedicated reusable artifact.
6. **Known truth ambiguity remains in docs.** `docs/vision_and_implementation/DASHBOARD_VIEWS_SPEC.md` marks real-vs-mock and backend-status modes as partial, especially around section-level vs action-level truth. Slice 2 should not overclaim.
7. **Baseline repo status is dirty before changes.** Slice 2 must avoid staging unrelated baseline changes unless explicitly intended.

## 8. Preserved behavior list

Slice 2 should preserve the following existing behavior by default:

- A/B/C/D/E navigation and view labels from `VIEW_ORDER`.
- Current topbar location and basic button styling.
- Mutually exclusive inspect modes; enabling one mode disables the other inspect modes.
- Shared tooltip controller behavior for hover and focus.
- Existing source-badge language where it accurately reflects implementation truth.
- Existing backend endpoint/action mappings for View A, B runtime actions, and View E database viewer.
- Existing simulation-only behavior in C and D unless backend implementation evidence is added.
- Existing docs and old docs; no permanent deletion.
- Existing Git history and unrelated baseline dirty files.

## 9. Minimal Slice 2 implementation plan

1. **Add rendered toolbar/view tests where feasible.** Prefer testing `dashboard/app.js` rendering and state toggles if existing test infrastructure allows DOM-like testing. If no DOM environment is available, add focused tests around runtime toggle state and metadata helpers, plus a manual verification matrix.
2. **Repair fallback behavior centrally.** Prefer a shared fallback helper in existing metadata modules or binders so unknown controls/values/statuses receive honest fallback metadata instead of being silently skipped.
3. **Verify/repair View E metadata.** Ensure E1-E4 buttons, table catalog, row viewer, pagination controls, and DB activity logging all receive control/value/reality/backend-status coverage or explicit fallback.
4. **Reconcile label expectations.** Keep `Show backend status`/`Hide backend status` as-is. Decide whether to keep `Hide control guide` and `Hide value guide` for established UI copy or standardize to `Hide controls explanation`/`Hide values explanation` only if tests/docs are updated.
5. **Add reusable docs.** Create `docs/default_project_setup/DASHBOARD_INSPECT_CONTROLS_PATTERN.md` unless a better existing default-project setup doc is found. Cross-link from a suitable existing docs index if safe.
6. **Update changelog/version in Slice 2.** Use a patch bump from `0.3.28` unless repo policy indicates otherwise. Include Estonian timestamp with date and time.
7. **Run verification.** Run `npm test`; run `npm run build` after dependencies are available. Record failures honestly.
8. **Commit Slice 2 only after tests/docs are updated.** Use commit message `fix: restore dashboard inspect controls across views`.

## 10. Risks and tradeoffs

| Risk | Impact | Slice 2 mitigation |
|---|---|---|
| Dirty uploaded baseline | Accidental staging of unrelated changes | Stage only intentional files; report baseline dirty status. |
| Fallback metadata could make too many elements inspectable | UI clutter and noise | Apply fallbacks only to elements already selected for inspect modes, with concise copy. |
| Label standardization could break existing tests | Regression in copy tests | Preserve existing labels unless changing tests/docs is clearly justified. |
| Real/mock truth overclaiming | Misleading operator UI | Only mark `real` when route/action evidence exists; use `mixed`, `mock`, `missing`, or `unknown` otherwise. |
| View E backend status could imply live DB availability | False runtime claim | Separate “wired to endpoint” from “latest request succeeded.” |
| No browser DOM test setup | Limited automated proof | Add helper/state tests plus manual matrix if DOM testing is not practical. |

## 11. Verification plan for Slice 2

### Automated commands

```bash
npm test
npm run build
```

### Baseline command results from Slice 1 environment

```text
npm test
Result: timed out in this execution environment before completing.

npm run build
Result: failed because vite was not installed in node_modules in the extracted ZIP environment:
sh: 1: vite: not found
```

These results are environmental/baseline observations for Slice 1, not production behavior changes.

### Manual verification matrix required after Slice 2

| View | Explain controls | Explain values | Show real vs mock | Show/Hide backend status |
|---|---|---|---|---|
| A — Init | Verify highlights/tooltips for nav, buttons, cards, logs/history. | Verify values explain source state/result payloads. | Verify A is mixed/real where supported, not overclaimed. | Verify real/missing/unknown endpoint status is honest. |
| B — Test | Verify B buttons and simulation controls explain behavior. | Verify stage/result values explain state source. | Verify real actions vs mock sections are clear. | Verify backend status distinguishes wired actions from mock placeholders. |
| C — Last Run Info | Verify mode buttons and resume placeholder explain behavior. | Verify last-run values explain demo/recovery source. | Verify mock/recovery preview is not marked real. | Verify missing backend/runtime support is explicit. |
| D — Running Process | Verify simulated runtime controls explain behavior. | Verify worker values explain simulated runtime source. | Verify preview/mock status is clear. | Verify missing runtime backend support is explicit. |
| E — Database Viewer | Verify E buttons/table/page controls explain behavior. | Verify catalog/rows/log values explain backend state source. | Verify backend-backed DB viewer is marked real only for endpoint-backed surfaces. | Verify DB endpoint status distinguishes wired/success/error/missing. |

## 12. Slice 1 conclusion

The current repo already has a mostly complete inspect-controls architecture. The safest Slice 2 is a targeted repair and verification slice, not a rewrite. The highest-value fixes are rendered A/B/C/D/E coverage, centralized graceful fallback behavior, View E verification, and reusable default-project documentation for the Dashboard Inspect Controls Pattern.
