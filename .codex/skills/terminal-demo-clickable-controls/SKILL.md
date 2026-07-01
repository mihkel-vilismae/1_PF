---
name: terminal-demo-clickable-controls
description: Implement or audit clickable controls and input handling in `terminal/demo/`. Use when Codex adds or changes terminal Demo Mode buttons, mouse tracking, keyboard/PIR input logging, rendered control hit testing, terminal-only screen-worker controls, or related smoke tests while preserving simulation-only honesty and avoiding duplicated layout math.
---

# Terminal Demo Clickable Controls

## Boundary

Use this skill for terminal-demo input surfaces only.

- Treat terminal mouse, keyboard, and PIR behavior as terminal-demo interaction, not proof of real hardware control.
- If the change would affect backend `/api/runtime/screen-simulation/*`, real screen hardware, GPIO, or playback-on-screen-state behavior, also use `photo-frame-screen-hardware-contract`.
- Keep the implementation local to `terminal/demo/` unless a separate backend contract is explicitly in scope.

## Read First

- `AGENTS.md`
- `docs/20_architecture_and_specs/openspec/terminal_demo_real_mode_openspec.md`
- `terminal/demo/src/main.ts`
- `terminal/demo/src/ui/renderScreen.ts`
- `terminal/demo/src/ui/renderScreenOnOff.ts`
- existing focused tests under `tests/` that cover the terminal demo surface being changed

## Workflow

1. Identify the owning surface.
   - Rendered control text belongs in the relevant `terminal/demo/src/ui/*` panel renderer.
   - Raw input parsing belongs in `terminal/demo/src/input/*`.
   - Shared state transitions belong in a focused state/helper module, not duplicated in `main.ts`.
2. Verify the current boundary.
   - Confirm whether the control is simulation-only, local-only, mock-demo-only, or real-demo-visible.
   - Keep operator-facing copy honest about those limits.
3. Add the control with one visible label source.
   - Export a stable label constant from the renderer when the control must be hit-tested.
   - Reuse that visible label for hit testing instead of duplicating magic strings elsewhere.
4. Prefer rendered-output hit testing.
   - Hit-test against the already-rendered terminal output.
   - Strip ANSI codes before column matching.
   - Do not hard-code duplicated panel coordinates or recalculate the whole layout in a second place.
5. Prefer host-compatible mouse parsing with keyboard fallback.
   - Use xterm/SGR-compatible mouse parsing when the terminal host supports it.
   - Keep a keyboard fallback so the feature remains usable without mouse support.
6. Keep the entrypoint thin.
   - `terminal/demo/src/main.ts` may route events, but parsing helpers and hit-testing helpers should live in focused modules.
7. Add the smallest honest verification.
   - Add or update focused tests for state transitions, parser behavior, and hit testing.
   - Add smoke flags only when they help verify the terminal surface without interactive manual setup.

## Implementation Guardrails

- Do not claim real hardware, OS idle, GPIO, or monitor power control from a terminal-only interaction slice.
- Do not create a second layout model just for mouse clicks.
- Do not wire real side effects directly from render-time code.
- Do not make mouse support mandatory when a keyboard fallback is possible.
- Do not move terminal-demo business logic into unrelated dashboard or backend modules.
- Keep simulation/demo labels explicit in panel copy, logs, and tests.

## Verification

Run the smallest relevant checks:

```powershell
npx tsx --test tests/terminalDemoScreenMonitorSliceA1.test.ts
npx tsx terminal/demo/src/main.ts --adapter=mock-demo --pir-smoke
npx tsx terminal/demo/src/main.ts --adapter=mock-demo --keyboard-activity-smoke
npx tsx terminal/demo/src/main.ts --adapter=mock-demo --mouse-activity-smoke
npm run typecheck
```

For real-demo-visible terminal changes, also verify the corresponding real-demo smoke path when one exists.

## Non-Claims

- This skill does not prove backend screen-simulation updates succeeded unless the backend route is separately exercised.
- This skill does not prove real screen wake/sleep behavior.
- This skill does not approve duplicating terminal layout math or spreading input parsing across unrelated files.
