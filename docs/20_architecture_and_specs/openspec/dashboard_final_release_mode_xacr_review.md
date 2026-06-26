# Dashboard Final Release Mode 3+2XACR and 3AXCR Review

Status: documentation-only review for `dashboard_final_release_mode_openspec.md`. No app code was changed in this slice.

## 3+2XACR pass set

### Pass 1 — Existing mode-gate inventory

Relevant baseline source files inspected:

```text
dashboard/app.ts
dashboard/shared/constants.ts
dashboard/services/apiClient.ts
server/runtimeModeEnv.ts
tests/dashboardVisualModeGate.test.js
tests/dashboardRuntimeModeHeader.test.js
```

Findings:

- `dashboard/app.ts` defines `DashboardVisualMode` as `test | real`.
- `renderModeSelectionGate()` renders only `Test Mode` and `Real Mode`.
- mode selection currently defaults any non-real data attribute to `test`, so a new button would be unsafe unless the selection logic is updated deliberately.
- `apiClient.ts` only sends runtime headers for `test` or `real`.
- backend runtime normalization treats unknown modes as `real`.
- existing focused tests encode the two-mode assumption and must be updated when implementation is approved.

### Pass 2 — Regression boundary

Existing behavior that must be preserved:

| Area | Preserve |
|---|---|
| Test Mode startup | Existing Test Mode choice, banner, disabled NEW AUTH behavior, isolated runtime header. |
| Real Mode startup | Existing Real Mode choice, banner, real runtime header, NEW AUTH availability. |
| Existing navigation | A/B/C/D/E/WIN/RPI/V2/DEBUG remain unchanged outside Final Release mode. |
| Backend safety | Choosing a mode never runs auth, download, DB mutation, scheduler mutation, playback, worker, or recovery actions. |
| Inspectability | Existing pause-live-updates / inspect controls remain available unless a later spec says otherwise. |

### Pass 3 — Final Release shell shape

The first approved implementation should be a blank shell only:

```text
Startup gate: Test Mode / Real Mode / Final Release
Final Release sidebar: 01 setup.sh, 02 authentication.sh, 03 startup.sh, 04 workers, 05 troubleshooting, 06 recovery
Main panel: blank or explicit placeholder-only content
```

The shell should not reuse the normal Test/Real `VIEW_ORDER` sidebar while Final Release is selected, because the requested release menu has different identity and order.

### Pass 4 — Runtime-mode risk analysis

Highest-risk area: runtime mode propagation.

The backend currently understands only `test` and `real`; unknown modes normalize to `real`. Therefore, the first implementation should not introduce a `final-release` backend header unless backend support is added in the same approved slice.

Preferred blank-shell behavior:

```text
Final Release mode renders without initiating backend calls from its content area.
```

If shared chrome still performs version/status polling, that must be treated as existing read-only chrome behavior, not Final Release action wiring.

### Pass 5 — Test and proof plan

Focused implementation tests should prove:

1. the gate renders three choices;
2. selecting Final Release does not fall through to Test Mode;
3. Test Mode and Real Mode remain unchanged;
4. the Final Release sidebar rows render exactly and in order;
5. blank shell content contains no executable action buttons for setup/auth/startup/workers/troubleshooting/recovery;
6. runtime header behavior is explicit and covered.

## 3AXCR refinement

### ACR A — Architecture-respecting refinement

Do not collapse Final Release into V2 Operator Menu. Keep V2 as the existing prototype surface and Final Release as a new release-mode shell. Reuse style primitives only when it does not create runtime coupling.

### ACR B — Copy/UX refinement

Use exact operator-facing labels for the sidebar:

```text
01 setup.sh — preflight only
02 authentication.sh — local iCloudPD login
03 startup.sh — env / DB / crontab
04 workers — status + controls
05 troubleshooting — logs + stale locks
06 recovery — recovery
```

Avoid adding explanatory noise to the sidebar labels; place any later help text inside the content panels.

### ACR C — Safety refinement

Final Release sounds production-like, so the blank shell must avoid misleading affordances. No row should look like it executes the named script until the backend action, confirmation, logging, and proof boundaries are specified.

## Final refined implementation prompt

Use this only after explicit implementation approval:

```text
Against the immutable v0.10.20 baseline, implement the documentation-approved blank-shell Final Release startup mode from `docs/20_architecture_and_specs/openspec/dashboard_final_release_mode_openspec.md`.

Preserve all existing Test Mode and Real Mode behavior. Add the third startup choice `Final Release` without treating it as Test Mode by default. Do not wire any real release actions yet.

When Final Release is selected, show a concise `Final Release` banner and replace the normal Test/Real sidebar navigation with the Final Release menu rows in this exact order:

01 setup.sh — preflight only
02 authentication.sh — local iCloudPD login
03 startup.sh — env / DB / crontab
04 workers — status + controls
05 troubleshooting — logs + stale locks
06 recovery — recovery

The main content area should stay blank or placeholder-only. Do not add executable buttons, fake status, random logs, backend action calls, auth inputs, worker controls, crontab controls, playback controls, or recovery controls.

Update focused tests for the three-choice gate, preserved Test/Real behavior, Final Release sidebar order, blank-shell non-actions, and runtime header behavior.
```

## Remaining decisions before code implementation

| Decision | Recommended default |
|---|---|
| Internal visual mode string | `final-release` |
| Backend runtime header from Final Release blank content | none / no new content calls |
| Sidebar implementation | mode-specific sidebar array, not mutation of existing `VIEW_ORDER` |
| Initial selected Final Release row | `01 setup.sh` selected visually, blank panel |
| Version bump | defer until implementation policy is chosen |

## Non-implementation statement

This review updates documentation only. It does not change frontend code, backend code, tests, package version, runtime data, auth behavior, crontab behavior, worker behavior, playback behavior, or recovery behavior.
