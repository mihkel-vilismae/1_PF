#!/usr/bin/env node
import { readFileSync } from 'node:fs';
const proof = 'terminal-demo-operator-layout-status';
const state = readFileSync('terminal/demo/src/state/createInitialRealDemoState.ts', 'utf8');
const screen = readFileSync('terminal/demo/src/ui/renderScreen.ts', 'utf8');
const current = readFileSync('terminal/demo/src/ui/renderCurrentRun.ts', 'utf8');
const log = readFileSync('terminal/demo/src/ui/renderRealTimeLog.ts', 'utf8');
const assertions = {
  area_a_log_label_present: state.includes('AREA A REAL-TIME LOG'),
  q_diagnostics_routed_to_log: state.includes('Q DB queue') && state.includes('Q truth\\/status'),
  area_b_command_plan_label_present: screen.includes('AREA B COMMAND PLAN'),
  area_c_playback_preview_label_present: screen.includes('AREA C PLAYBACK / PREVIEW'),
  operator_help_documents_areas: screen.includes('Area A=logs') && screen.includes('Area B=command plan') && screen.includes('Area C=playback/status'),
  errors_are_colored_red_in_area_b: current.includes('color.danger(line)') && current.includes('blocked'),
  log_errors_are_dim_red: log.includes('color.dangerDim(line)'),
  hitboxes_still_present: state.includes('area-a-log-panel') && state.includes('area-b-command-plan') && state.includes('area-c-preview')
};
const passed = Object.values(assertions).every(Boolean);
console.log(JSON.stringify({ proof, status: passed ? 'PASSED' : 'BLOCKED', checkedAt: new Date().toISOString(), decision: passed ? 'REAL_DEMO_OPERATOR_LAYOUT_STATUS_READY' : 'REAL_DEMO_OPERATOR_LAYOUT_STATUS_BLOCKED', assertions }, null, 2));
process.exit(passed ? 0 : 1);
