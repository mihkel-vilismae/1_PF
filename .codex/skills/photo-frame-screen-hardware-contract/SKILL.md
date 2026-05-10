---
name: photo-frame-screen-hardware-contract
description: Define or audit real screen hardware behavior in the 12_PF photo-frame repository. Use when replacing B5 screen simulation, adding display power control, PIR/mouse/keyboard hardware input, screen watchdog behavior, playback pause/resume on screen state, or hardware telemetry.
---

# Photo Frame Screen Hardware Contract

## Operating Rule

Use this skill before treating B5 as real hardware. Current B5 behavior is backend-owned simulation only unless a real hardware contract and implementation evidence say otherwise.

## Current Boundary

- B5 screen controls currently configure simulation state.
- `/api/runtime/screen-simulation/*` does not control or report real screen hardware.
- `screen_on_off_worker` may use B5 simulation today, but real display/PIR/input control requires a separate approved contract.

## Read First

- `docs/categorized/vision_spec_docs/architecture_runtime_and_recovery_spec.md`
- `docs/categorized/current_implementation_status_docs/code_verified_dashboard_implementation_status.md`
- `placeholder_implementations.md`
- `server/index.ts`
- `dashboard/views/testView.ts`
- `dashboard/services/runtimeExecutionService.ts`
- `dashboard/services/runtimeTruth/runtimeTruthDemoActions.ts`
- tests covering screen simulation, usually `tests/screenSimulationApi.test.js` and `tests/viewB.buttonWorkflow.test.js`

## Contract Questions

Resolve these before implementation:

- What hardware is controlled: monitor power, HDMI/DPMS, OS display sleep, brightness, or external relay?
- What inputs are authoritative: PIR, mouse, keyboard, OS idle time, GPIO, USB, ESP32, or another source?
- What platform owns the behavior: Windows dev PC, Raspberry Pi, browser, ESP32, or mixed?
- What is the durable state source: SQLite, runtime status file, worker heartbeat, or hardware poll?
- What should playback do when screen state changes?
- What failure states must be visible in dashboard/status docs?

## Implementation Guardrails

- Do not replace simulation with hardware behavior in the same change unless explicitly requested.
- Keep simulation and hardware labels visually and semantically distinct.
- Keep hardware control backend-owned; frontend should request and observe, not own device truth.
- Add status/log evidence for hardware command attempts and observed hardware state.
- Preserve a simulation/test path if existing tests depend on it.

## Verification

For contract-only work, verify docs and tests that assert simulation wording still pass. For hardware work, add a non-destructive dry-run or mocked hardware provider test before any live hardware smoke test.

Relevant checks:

```powershell
npx tsx --test tests/screenSimulationApi.test.js
npx tsx --test tests/viewB.buttonWorkflow.test.js
npm run typecheck
```
