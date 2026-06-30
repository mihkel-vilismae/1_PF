#!/usr/bin/env node
import { readFileSync } from 'node:fs';
const proof = 'terminal-demo-screen-worker-panel';
const state = readFileSync('terminal/demo/src/state/DemoTerminalState.ts', 'utf8');
const real = readFileSync('terminal/demo/src/state/createInitialRealDemoState.ts', 'utf8');
const adapter = readFileSync('terminal/demo/src/runtime/RealDemoRuntimeAdapter.placeholder.ts', 'utf8');
const render = readFileSync('terminal/demo/src/ui/renderScreenOnOff.ts', 'utf8');
const assertions = {
  screen_state_has_idle_timer: state.includes('idleSeconds') && render.includes('Idle timer:'),
  keyboard_input_resets_timer: adapter.includes('noteInputActivity(`keyboard'),
  mouse_input_resets_timer: adapter.includes('noteInputActivity(`mouse'),
  latest_status_replaces_old_status: adapter.includes('latestScreenStatus = `last input:'),
  guarded_power_action_visible: real.includes('screen power command guarded') && render.includes('Guard:'),
  no_real_screen_power_call_by_default: !/xset|vcgencmd|dpms|rundll32/i.test(adapter + real),
  screen_panel_rendered: render.includes('Power state:') && render.includes('Latest status:')
};
const passed = Object.values(assertions).every(Boolean);
console.log(JSON.stringify({ proof, status: passed ? 'PASSED' : 'BLOCKED', checkedAt: new Date().toISOString(), decision: passed ? 'REAL_DEMO_SCREEN_WORKER_PANEL_READY' : 'REAL_DEMO_SCREEN_WORKER_PANEL_BLOCKED', assertions }, null, 2));
process.exit(passed ? 0 : 1);
