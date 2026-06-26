# Dashboard Startup Modes OpenSpec

Status: documentation-only OpenSpec for the existing startup mode gate and the shared Test Mode / Real Mode dashboard shell, with a documented planned V2 mode extension.

## Purpose

The dashboard starts behind a mode gate. The operator currently chooses **Test Mode** or **Real Mode** before interacting with the dashboard. These two modes share almost all view structure, but their safety boundaries differ. This OpenSpec documents those boundaries so future UI changes do not blur test-only, real-runtime, read-only, secret-sensitive behavior, or the separately planned **V2** shell.

## Source files

```text
dashboard/app.ts
dashboard/shared/constants.ts
dashboard/views/initView.ts
dashboard/views/testView.ts
dashboard/services/apiClient.ts
dashboard/services/runtimeTruth.ts
```

## Existing startup mode gate

The current startup mode gate is rendered by `renderModeSelectionGate()` in `dashboard/app.ts`.

Current implemented choices:

```text
Test Mode
Real Mode
```

Planned documented choice, not implemented by this OpenSpec update:

```text
V2
```

Selecting a mode must not itself trigger auth, downloads, database mutation, scheduler mutation, playback mutation, worker execution, or recovery behavior. The selection is a frontend mode boundary used to tag backend calls and control visibility/disabled states. V2 has its own OpenSpec in `dashboard_v2_mode_openspec.md` and starts as a blank release shell with a mode-specific sidebar.

## Shared dashboard shell

After a mode is chosen, both modes use the same dashboard shell and view navigation order from `VIEW_ORDER` in `dashboard/shared/constants.ts`:

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

This OpenSpec covers the existing Test/Real mode behavior for View A and View B. Other views may have their own page-level OpenSpecs later.

## Visual mode banner

After selection, the default lengthy mode banner is replaced with a concise operator-facing banner:

```text
Test Mode
Real Mode
```

The body also receives the frontend visual-mode marker:

```text
data-dashboard-visual-mode="test"
data-dashboard-visual-mode="real"
```

The planned V2 extension should use:

```text
data-dashboard-visual-mode="v2"
```

The marker is a frontend display and behavior boundary. It does not prove runtime readiness, real-provider success, or release readiness.

## Test Mode boundary

Test Mode is the safe default for isolated and mock/simulation work.

Test Mode requirements:

- runtime/database/log/download actions should route to isolated test storage where the backend supports it;
- Test Mode may expose mock/generated download controls;
- Test Mode may expose the whole-logic fast emulator controls in View A;
- Test Mode must disable NEW AUTH provider login controls;
- Test Mode must not submit iCloudPD login, password, 2FA, cookies, or session-secret actions through the NEW AUTH card;
- Test Mode may still show status/readiness copy where safe, but it must not imply real iCloud authentication or real media download success.

## Real Mode boundary

Real Mode uses configured real runtime storage and may expose real-provider and real-download controls.

Real Mode requirements:

- real storage/runtime paths may be used by existing backend endpoints;
- NEW AUTH controls may be enabled, subject to backend/session safety and local operator input;
- the authenticated real-download card may be visible in View B;
- destructive or secret-sensitive actions must remain explicit operator actions and must not run from mode selection alone;
- Real Mode UI must not print Apple ID, password, 2FA code, raw cookies, raw session secrets, or secret file contents.

## Mode-specific View A requirements

View A receives the selected dashboard visual mode through:

```text
renderInitView(state, dashboardVisualMode)
```

Mode-specific View A behavior:

| Card / block | Test Mode | Real Mode |
|---|---|---|
| `1A-TEST-WHOLE-LOGIC` | visible | hidden |
| `1A — Verify .env` | visible | visible |
| `1A-AUTH — Verify icloudpd` | visible as existing marked-for-removal/hybrid card | visible as existing marked-for-removal/hybrid card |
| `1A-STASH-OFF — NEW AUTH` | visible but disabled | visible and available for real auth controls |
| `2A — Database controls` | visible | visible |
| `3A — Scheduler controls` | visible | visible |

The NEW AUTH card must show the Test Mode disabled warning in Test Mode:

```text
NEW AUTH login is disabled in Test Mode. Switch to Real Mode to use iCloudPD login controls.
```

## Mode-specific View B requirements

View B receives the selected dashboard visual mode through:

```text
renderTestView(state, dashboardVisualMode)
```

Mode-specific View B behavior:

| Card / block | Test Mode | Real Mode |
|---|---|---|
| `B2 — Download test action` | visible | hidden |
| `B2-REAL_DOWNLOAD — Authenticated real download` | hidden | visible |
| `B3 — Pipeline stages` | visible | visible |
| `B3.1` through `B3.5` | visible | visible |
| `B4 — Playback selection` | visible | visible |
| `B5 — Screen on-off simulation` | visible | visible |

If a mode is not selected yet, rendering helpers may behave as mixed/default because the shell is inert behind the startup gate.


## Planned V2 boundary

V2 is documented separately in:

```text
docs/20_architecture_and_specs/openspec/dashboard_v2_mode_openspec.md
```

The first implementation must be a blank shell only. It should add the third startup option and render a V2 sidebar with:

```text
01 setup.sh — preflight only
02 authentication.sh — local iCloudPD login
03 startup.sh — env / DB / crontab
04 workers — status + controls
05 troubleshooting — logs + stale locks
06 recovery — recovery
```

It must not wire real setup, authentication, startup, worker, troubleshooting, or recovery actions until those behaviors have their own approved OpenSpec/proof contracts.

## Read-only, mutating, and sensitive action classification

Every action surfaced in Test/Real mode should be classified by the page-level OpenSpec that owns it:

```text
read-only/status
mock/test-only
real-runtime mutating
secret-sensitive
destructive
visual-only
```

Mode selection itself is not a mutating action.

## Safety and non-claims

This OpenSpec does not prove:

- real iCloud authentication;
- real iCloud media download;
- real Raspberry crontab installation;
- real playback on target hardware;
- database safety beyond the called endpoint contracts;
- recovery readiness.

Those claims require separate tests/proofs and target evidence.
