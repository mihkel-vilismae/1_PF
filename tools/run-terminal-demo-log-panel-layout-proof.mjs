#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { buildLiveImageFixture } from './terminal-demo-live-image-fixture-lib.mjs';

const repoRoot = process.cwd();
const proof = 'terminal-demo-log-panel-layout';
const setup = buildLiveImageFixture({ repoRoot });
const renderRun = runNpm(['run', 'demo:terminal:real', '--', '--real-demo-smoke']);
const stateRun = runNpm(['run', 'demo:terminal:real', '--', '--real-demo-state-json-smoke']);
const mouseRun = runNpm(['run', 'demo:terminal:real', '--', '--mouse-hitbox-state-json-smoke']);
const wRun = runNpm(['run', 'demo:terminal:real', '--', '--w-toggle-smoke']);
const renderOutput = `${renderRun.stdout}\n${renderRun.stderr}`;
const state = parseJsonFromOutput(stateRun.stdout);
const mouseState = parseJsonFromOutput(mouseRun.stdout);
const currentLines = state?.currentRun?.lines ?? [];
const logLines = state?.realTimeLog?.lines ?? [];
const mouseLogLines = mouseState?.realTimeLog?.lines ?? [];
const hitboxIds = new Set((state?.realTimeLog?.hitboxes ?? []).map((hitbox) => hitbox.id));
const renderCurrentRunText = readText('terminal/demo/src/ui/renderCurrentRun.ts');
const mainText = readText('terminal/demo/src/main.ts');
const mouseText = readText('terminal/demo/src/ui/terminalMouse.ts');
const diagnosticPrefixes = [/^Truth read:/, /^Queue read:/, /^Playback status read:/, /^Path check:/, /^Media discovery:/, /^Selected row #/];

const assertions = {
  fixture_setup_passed: setup.status === 'PASSED',
  real_smoke_exited_zero: renderRun.status === 0,
  state_json_exited_zero: stateRun.status === 0 && Boolean(state),
  mouse_json_exited_zero: mouseRun.status === 0 && Boolean(mouseState),
  log_panel_title_visible: renderOutput.includes('REAL-TIME LOG [-]'),
  log_panel_state_present: state?.realTimeLog?.title === 'REAL-TIME LOG' && state?.realTimeLog?.visibleRows >= 1,
  area_a_contains_truth_read: logLines.some((line) => line.startsWith('Truth read:')),
  area_a_contains_queue_read: logLines.some((line) => line.startsWith('Queue read:')),
  area_a_contains_table_verification: logLines.some((line) => line.includes('Real table verified: slideshow_queue')),
  area_a_contains_path_check: logLines.some((line) => line.startsWith('Path check:')),
  area_b_excludes_low_level_diagnostics: currentLines.every((line) => !diagnosticPrefixes.some((pattern) => pattern.test(line))),
  area_b_keeps_command_plan: currentLines.some((line) => line.startsWith('Command plan:')),
  area_b_error_warning_renderer_is_red: renderCurrentRunText.includes('color.danger') && /warning\|failed\|blocked/.test(renderCurrentRunText),
  area_a_hitbox_exists: hitboxIds.has('area-a-log-panel'),
  area_a_collapse_hitbox_exists: hitboxIds.has('area-a-collapse-toggle'),
  area_b_hitbox_exists: hitboxIds.has('area-b-command-plan'),
  area_c_hitbox_exists: hitboxIds.has('area-c-preview'),
  mouse_tracking_enabled_in_interactive_main: mainText.includes('mouseTrackingEnableSequence') && mainText.includes('parseSgrMouseEvent'),
  sgr_mouse_parser_exists: mouseText.includes('parseSgrMouseEvent') && mouseText.includes('1006'),
  proof_click_logs_area_a: mouseLogLines.some((line) => line.includes('Mouse hitbox: area-a-log-panel clicked')),
  proof_click_logs_collapse: mouseLogLines.some((line) => line.includes('area-a-collapse-toggle clicked; log_panel=collapsed')) && mouseLogLines.some((line) => line.includes('area-a-collapse-toggle clicked; log_panel=expanded')),
  proof_wheel_scrolls_area_a: mouseState?.realTimeLog?.scrollOffset >= 1 && mouseLogLines.some((line) => line.includes('Mouse wheel: wheel-up over Area A')),
  mouse_focuses_log_panel: mouseState?.realTimeLog?.focused === true,
  keyboard_w_shortcut_preserved: wRun.status === 0 && `${wRun.stdout}\n${wRun.stderr}`.includes('W pressed: selected batch_size=5')
};
const passed = Object.values(assertions).every(Boolean);
const payload = {
  proof,
  status: passed ? 'PASSED' : 'BLOCKED',
  checkedAt: new Date().toISOString(),
  decision: passed ? 'REAL_DEMO_LOG_PANEL_LAYOUT_READY' : 'REAL_DEMO_LOG_PANEL_LAYOUT_BLOCKED',
  setupDecision: setup.status,
  renderExitCode: renderRun.status,
  stateExitCode: stateRun.status,
  mouseExitCode: mouseRun.status,
  areaBLineCount: currentLines.length,
  areaALogLineCount: logLines.length,
  mouseLogExcerpt: mouseLogLines.filter((line) => /Mouse hitbox|Mouse wheel|Log panel/.test(line)).slice(-10),
  assertions
};
console.log(JSON.stringify(payload, null, 2));
process.exit(passed ? 0 : 1);

function runNpm(args) {
  return spawnSync('npm', args, {
    cwd: repoRoot,
    env: { ...process.env, NO_COLOR: '1', TERMINAL_DEMO_COLUMNS: process.env.TERMINAL_DEMO_COLUMNS ?? '220' },
    encoding: 'utf8',
    timeout: 180000,
    shell: process.platform === 'win32',
    maxBuffer: 12 * 1024 * 1024
  });
}

function parseJsonFromOutput(output) {
  const start = output.indexOf('{');
  const end = output.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try { return JSON.parse(output.slice(start, end + 1)); } catch { return null; }
}

function readText(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';
}
