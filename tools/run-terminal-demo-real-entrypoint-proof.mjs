import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = process.cwd();
const proof = 'terminal-demo-real-entrypoint';

const rootRealLauncher = join(repoRoot, 'RUN_TERMINAL_DEMO_REAL.CMD');
const terminalRealLauncher = join(repoRoot, 'terminal', 'demo', 'windows_runner_real.cmd');
const terminalMockLauncher = join(repoRoot, 'terminal', 'demo', 'windows_runner.cmd');
const runnerPs1 = join(repoRoot, 'terminal', 'demo', 'scripts', 'windows', 'run_terminal_demo.ps1');
const dbPlaybackProof = join(repoRoot, 'tools', 'run-terminal-demo-db-image-playback-button-proof.mjs');

const realSmoke = runNpm(['run', 'demo:terminal:real', '--', '--real-demo-smoke']);
const mockSmoke = runNpm(['run', 'demo:terminal:mock', '--', '--smoke']);
const realOutput = `${realSmoke.stdout}\n${realSmoke.stderr}`;
const mockOutput = `${mockSmoke.stdout}\n${mockSmoke.stderr}`;
const runnerText = readIfExists(runnerPs1);
const realLauncherText = readIfExists(terminalRealLauncher);
const mockLauncherText = readIfExists(terminalMockLauncher);
const dbProofText = readIfExists(dbPlaybackProof);

const assertions = {
  root_real_launcher_exists: existsSync(rootRealLauncher),
  terminal_real_launcher_exists: existsSync(terminalRealLauncher),
  real_launcher_passes_real_adapter_to_runner: realLauncherText.includes('-Adapter real-demo'),
  runner_accepts_adapter_parameter: runnerText.includes("ValidateSet('mock-demo', 'real-demo')"),
  runner_can_launch_real_script: runnerText.includes("demo:terminal:real"),
  mock_runner_default_preserved: mockLauncherText.includes('run_terminal_demo.ps1') && !mockLauncherText.includes('-Adapter real-demo'),
  real_smoke_exited_zero: realSmoke.status === 0,
  real_smoke_visible_real_mode: realOutput.includes('PHOTOFRAME REAL DEMO TERMINAL') && realOutput.includes('Adapter: real-demo'),
  real_smoke_not_mock_mode: !realOutput.includes('PHOTOFRAME MOCK DEMO MODE') && !realOutput.includes('Adapter: mock-demo') && !realOutput.includes('Visual mock only'),
  mock_smoke_exited_zero: mockSmoke.status === 0,
  mock_smoke_visible_mock_mode: mockOutput.includes('PHOTOFRAME MOCK DEMO MODE') && mockOutput.includes('Adapter: mock-demo'),
  mock_smoke_not_db_playback_claim: !mockOutput.includes('DB image playback status:'),
  db_playback_proof_uses_real_demo: dbProofText.includes("PHOTOFRAME_TERMINAL_ADAPTER: 'real-demo'") && dbProofText.includes("demo:terminal:real"),
};

const passed = Object.values(assertions).every(Boolean);
const payload = {
  proof,
  status: passed ? 'PASSED' : 'BLOCKED',
  checkedAt: new Date().toISOString(),
  decision: passed ? 'REAL_DEMO_ENTRYPOINT_READY' : 'REAL_DEMO_ENTRYPOINT_BLOCKED',
  assertions,
  launchers: {
    rootRealLauncher: 'RUN_TERMINAL_DEMO_REAL.CMD',
    terminalRealLauncher: 'terminal/demo/windows_runner_real.cmd',
    mockLauncher: 'terminal/demo/windows_runner.cmd'
  },
  realSmokeExitCode: realSmoke.status,
  mockSmokeExitCode: mockSmoke.status,
  realOutputExcerpt: lines(realOutput).slice(0, 20),
  mockOutputExcerpt: lines(mockOutput).slice(0, 20)
};

console.log(JSON.stringify(payload, null, 2));
process.exit(passed ? 0 : 1);

function runNpm(args) {
  return spawnSync('npm', args, {
    cwd: repoRoot,
    env: { ...process.env, NO_COLOR: '1' },
    encoding: 'utf8',
    timeout: 120000,
    shell: process.platform === 'win32'
  });
}

function readIfExists(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function lines(value) {
  return value.split('\n').map((line) => line.trim()).filter(Boolean);
}
