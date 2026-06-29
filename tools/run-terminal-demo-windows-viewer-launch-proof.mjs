#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const proof = 'terminal-demo-windows-viewer-launch';
const sourcePath = path.join(repoRoot, 'terminal/demo/src/playback/DbImagePlaybackButton.ts');
const packageJson = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
const source = existsSync(sourcePath) ? readFileSync(sourcePath, 'utf8') : '';

const assertions = {
  db_playback_source_exists: Boolean(source),
  uses_start_process_file_path_not_literal_path: source.includes('Start-Process -FilePath $viewerPath') && !source.includes('Start-Process -LiteralPath'),
  passes_viewer_path_as_argument: source.includes("'-Command', psScript, viewerPath"),
  verifies_viewer_file_exists_before_open: source.includes('existsSync(viewerPath)') && source.includes('viewer file missing'),
  has_cmd_start_fallback: source.includes('openWindowedViewerWithCmdStart') && source.includes('cmd.exe') && source.includes('start ""'),
  reports_fallback_details: source.includes('Windows viewer launch fallback: cmd.exe start succeeded') && source.includes('Windows viewer launch failed'),
  keeps_non_windows_proof_guard: source.includes("process.platform !== 'win32'") && source.includes("TERMINAL_DEMO_DB_PLAYBACK_PROOF === '1'"),
  package_script_registered: packageJson.scripts?.['proof:terminal-demo-windows-viewer-launch'] === 'node tools/run-terminal-demo-windows-viewer-launch-proof.mjs'
};

const passed = Object.values(assertions).every(Boolean);
const payload = {
  proof,
  status: passed ? 'PASSED' : 'BLOCKED',
  checkedAt: new Date().toISOString(),
  decision: passed ? 'TERMINAL_DEMO_WINDOWS_VIEWER_LAUNCH_READY' : 'TERMINAL_DEMO_WINDOWS_VIEWER_LAUNCH_BLOCKED',
  source: 'terminal/demo/src/playback/DbImagePlaybackButton.ts',
  assertions
};

console.log(JSON.stringify(payload, null, 2));
process.exit(passed ? 0 : 1);
