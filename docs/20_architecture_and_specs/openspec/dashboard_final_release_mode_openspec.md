# Dashboard Final Release Mode OpenSpec

Status: documentation-only OpenSpec for a planned third startup mode. No runtime implementation is included in this slice.

## Purpose

The dashboard currently starts behind a startup gate with two choices:

```text
Test Mode
Real Mode
```

This OpenSpec defines a planned third startup choice:

```text
Final Release
```

Final Release is an operator-facing release shell for the Raspberry/production flow. The first implementation must be intentionally minimal: add the third startup option, enter a Final Release dashboard shell, and render the Final Release sidebar menu. Main content panels start blank until their behavior is separately specified and approved.

## Startup gate contract

After implementation, the startup gate must offer exactly three operator choices:

```text
Test Mode
Real Mode
Final Release
```

Selecting Final Release must only change the dashboard visual/navigation shell. It must not start authentication, media download, database writes, crontab changes, schedulers, workers, playback, screen actions, or recovery actions.

## Final Release visual identity

The planned frontend visual mode value should be stable and explicit:

```text
final-release
```

The body marker should become:

```text
data-dashboard-visual-mode="final-release"
```

The top banner should show:

```text
Final Release
```

The implementation must not silently treat Final Release as Test Mode. It also must not silently treat Final Release as Real Mode unless the API/runtime header boundary is intentionally specified.

## Runtime header boundary

Existing frontend API calls use:

```text
X-Dashboard-Runtime-Mode: test
X-Dashboard-Runtime-Mode: real
```

Existing backend normalization treats unknown runtime modes as Real Mode. Therefore, the first Final Release implementation should avoid backend calls from the blank shell. A future `final-release` runtime header is out of scope until backend normalization, server action guards, tests, and docs explicitly support it.

## Sidebar contract

When the operator enters Final Release mode, the left sidebar navigation should be replaced by the Final Release release-menu rows rather than the existing Test/Real view list.

The first Final Release sidebar must render these rows in this order:

| Order | Visible label | Subtitle / scope | Initial behavior |
|---:|---|---|---|
| 01 | `setup.sh` | preflight only | blank content panel |
| 02 | `authentication.sh` | local iCloudPD login | blank content panel |
| 03 | `startup.sh` | env / DB / crontab | blank content panel |
| 04 | `workers` | status + controls | blank content panel |
| 05 | `troubleshooting` | logs + stale locks | blank content panel |
| 06 | `recovery` | recovery | blank content panel |

The first implementation must not execute scripts or backend actions when a row is selected.

## Blank content contract

Final Release content panels start empty by design.

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
credential input fields
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

Final Release must not remove, rename, reorder, or hide those views when Test Mode or Real Mode is selected.

## Relationship to V2 Operator Menu

The existing `V2 — V2 Operator Menu` remains a separate prototype surface. Final Release is not the same as V2. It may reuse lessons, styling, or mapping tables from V2 later, but the first implementation should avoid coupling Final Release to V2 runtime behavior unless a later spec approves the merge.

## Implementation prompt draft

Use this prompt only after explicit implementation approval:

```text
Implement only the first blank-shell Final Release mode from `dashboard_final_release_mode_openspec.md`.

Preserve the v0.10.20 baseline behavior for Test Mode and Real Mode. Do not wire backend actions, script execution, auth, crontab, workers, playback, recovery, or fake statuses.

Add a third startup gate button labeled `Final Release`. Selecting it should show a concise `Final Release` banner and a mode-specific left sidebar with exactly these rows: `01 setup.sh`, `02 authentication.sh`, `03 startup.sh`, `04 workers`, `05 troubleshooting`, `06 recovery`, with the subtitles specified in the OpenSpec. The main content area may be blank/placeholder-only per the blank content contract.

Update or add focused tests proving: the gate has three choices; Test/Real behavior is preserved; the Final Release sidebar rows render in order; no backend action buttons are introduced by the blank shell.
```

## Proof expectations for first implementation

Minimum implementation evidence should include focused dashboard gate/runtime tests. Add or update targeted tests as needed so the changed mode gate and Final Release blank sidebar are covered without requiring a full proof suite.

## Non-claims

This OpenSpec does not claim that Final Release operations are implemented. Setup, authentication, startup, worker controls, troubleshooting, recovery, Raspberry readiness, real iCloud login, real download, real playback, and real crontab installation require later implementation slices and target evidence.
