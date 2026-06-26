# Dashboard V2 Mode OpenSpec

Status: documentation-only OpenSpec for a planned third startup mode. No runtime implementation is included in this slice.

## Purpose

The dashboard currently starts behind a mode gate with two choices:

```text
Test Mode
Real Mode
```

This OpenSpec defines a planned third startup choice:

```text
V2
```

V2 is an operator-facing release shell for the Raspberry/production flow. The first implementation must be intentionally minimal: add the third startup option, enter a V2 dashboard shell, and render the V2 sidebar menu. Main content panels start blank until their behavior is separately specified and approved.

## Baseline source files to inspect before implementation

```text
dashboard/app.ts
dashboard/shared/constants.ts
dashboard/services/apiClient.ts
dashboard/services/runtimeTruth.ts
dashboard/views/v2OperatorMenuView.ts
dashboard/services/v2OperatorMenuBackendContract.ts
server/runtimeModeEnv.ts
server/index.ts
tests/dashboardVisualModeGate.test.js
tests/dashboardRuntimeModeHeader.test.js
```

## Startup gate contract

The startup gate must offer exactly three operator choices after this mode is implemented:

```text
Test Mode
Real Mode
V2
```

Selecting V2 must not itself trigger:

```text
authentication
icloudpd login
2FA submission
media download
database mutation
crontab install/edit
scheduler start/stop
worker run
playback selection
screen on/off action
recovery/restore action
file deletion
```

Mode selection remains a frontend navigation/runtime boundary. Any real action behind the V2 menu must be introduced later behind an explicit operator button and its own proof/safety contract.

## V2 visual/runtime identity

The planned frontend visual mode value should be stable and explicit:

```text
v2
```

The body marker should become:

```text
data-dashboard-visual-mode="v2"
```

The top banner should show:

```text
V2
```

The implementation must not silently treat V2 as Test Mode. It also must not silently treat V2 as Real Mode unless the API/runtime header boundary is intentionally specified.

## Runtime header boundary

Existing frontend API calls use:

```text
X-Dashboard-Runtime-Mode: test
X-Dashboard-Runtime-Mode: real
```

Existing backend normalization treats unknown runtime modes as Real Mode. Therefore, the first V2 implementation must choose one of these safe strategies and document the choice in code comments/tests:

| Strategy | Requirement |
|---|---|
| no runtime header for blank shell | Preferred for the first blank-shell implementation if the V2 page performs no backend calls. |
| explicit `real` header | Allowed only if V2 intentionally reuses Real Mode storage for real release actions. |
| new `v2` header | Not allowed until backend normalization, server action guards, tests, and docs explicitly support it. |

The first blank-shell implementation should avoid backend calls from the V2 content area.

## Sidebar contract

When the operator enters V2 mode, the left sidebar navigation should be replaced by the V2 release-menu rows rather than the existing Test/Real view list.

The first V2 sidebar must render these rows in this order:

| Order | Visible label | Subtitle / scope | Initial behavior |
|---:|---|---|---|
| 01 | `setup.sh` | preflight only | blank content panel |
| 02 | `authentication.sh` | local iCloudPD login | blank content panel |
| 03 | `startup.sh` | env / DB / crontab | blank content panel |
| 04 | `workers` | status + controls | blank content panel |
| 05 | `troubleshooting` | logs + stale locks | blank content panel |
| 06 | `recovery` | recovery | blank content panel |

The sidebar labels intentionally look like operator scripts/menu sections. The first implementation must not execute scripts or backend actions when a row is selected.

## Blank content contract

V2 content panels start empty by design.

Allowed initial content:

```text
section title
short placeholder sentence
selected menu item identity
```

Not allowed in the first implementation:

```text
fake status
randomized status
mock logs presented as real
placeholder buttons that look executable
real backend calls
script execution
secret input fields
recovery buttons
worker controls
```

A blank shell is considered correct if it proves mode/navigation structure without pretending that release operations are implemented.

## Relationship to existing Test/Real views

The existing Test/Real dashboard view order remains preserved:

```text
A — Init
B — Test
C — Last Run Info
D — Running Process
E — Database Viewer
WIN — Windows Playback
RPI — Raspberry Playback
V2 — V2 Operator Menu
DEBUG — Debug
```

V2 must not remove, rename, reorder, or hide those views when Test Mode or Real Mode is selected.

V2 may use separate view IDs/internal state for its six menu rows, but those IDs must not collide with the existing `DashboardViewId` values unless the architecture is explicitly changed and tested.

## Relationship to V2 Operator Menu

The existing `V2 — V2 Operator Menu` remains a separate prototype surface.

The V2 startup mode replaces the earlier Final Release working name. It may reuse lessons, styling, or mapping tables from the legacy V2 Operator Menu prototype, but the first implementation should avoid coupling the new V2 startup shell to legacy prototype runtime behavior unless a later spec approves the merge.

## Action classification for later slices

Future V2 menu actions must be classified before wiring:

```text
read-only/status
preflight-only
secret-sensitive local auth
real-runtime mutating
scheduler/crontab mutating
worker control
log inspection
stale-lock handling
recovery/restore
destructive
visual-only
```

Every non-visual action needs an explicit backend endpoint contract, proof command, and secret/safety boundary.

## Implementation prompt draft

Use this prompt only after explicit implementation approval:

```text
Implement only the first blank-shell V2 mode from `dashboard_v2_mode_openspec.md`.

Preserve the v0.10.20 baseline behavior for Test Mode and Real Mode. Do not wire backend actions, script execution, auth, crontab, workers, playback, recovery, or fake statuses.

Add a third startup gate button labeled `V2`. Selecting it should show a concise `V2` banner and a mode-specific left sidebar with exactly these rows: `01 setup.sh`, `02 authentication.sh`, `03 startup.sh`, `04 workers`, `05 troubleshooting`, `06 recovery`, with the subtitles specified in the OpenSpec. The main content area may be blank/placeholder-only per the blank content contract.

Update or add focused tests proving: the gate has three choices; Test/Real behavior is preserved; V2 selection does not send a test/real runtime header unless intentionally documented; the V2 sidebar rows render in order; no backend action buttons are introduced by the blank shell.
```

## Proof expectations for first implementation

Minimum implementation evidence should include:

```text
npm test -- tests/dashboardVisualModeGate.test.js
npm test -- tests/dashboardRuntimeModeHeader.test.js
```

Add or update focused tests as needed so the changed mode gate and V2 blank sidebar are covered without requiring a full proof suite.

## Non-claims

This OpenSpec does not claim that V2 operations are implemented.

It does not prove:

```text
setup.sh behavior
authentication.sh behavior
startup.sh behavior
worker controls
troubleshooting controls
recovery controls
Raspberry readiness
real iCloud login
real download
real playback
real crontab installation
```

Those require later implementation slices and target evidence.
