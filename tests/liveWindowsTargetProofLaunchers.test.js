/*
 * Verifies the dedicated Windows target proof launcher contracts.
 * These tests are static and never start mpv, API servers, browser windows, or schedulers.
 * They protect proof-only launcher boundaries for video, recovery, and scheduler proofs.
 * Live Windows behavior remains operator-run outside normal automated tests.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const PACKAGE_JSON = new URL('../package.json', import.meta.url);
const VIDEO_CMD = new URL('../start_live_windows_native_video_playback_proof.cmd', import.meta.url);
const VIDEO_PS1 = new URL('../start_scripts/run_live_windows_native_video_playback_proof.ps1', import.meta.url);
const RECOVERY_CMD = new URL('../start_live_windows_native_recovery_proof.cmd', import.meta.url);
const RECOVERY_PS1 = new URL('../start_scripts/run_live_windows_native_recovery_proof.ps1', import.meta.url);
const SCHEDULER_CMD = new URL('../start_live_windows_scheduler_proof.cmd', import.meta.url);
const SCHEDULER_PS1 = new URL('../start_scripts/run_live_windows_scheduler_proof.ps1', import.meta.url);
const START_PS1 = new URL('../start_scripts/start_win_full.ps1', import.meta.url);

test('video and recovery proof cmd wrappers are thin PowerShell delegates', () => {
  for (const [cmdUrl, scriptName] of [
    [VIDEO_CMD, 'run_live_windows_native_video_playback_proof.ps1'],
    [RECOVERY_CMD, 'run_live_windows_native_recovery_proof.ps1'],
  ]) {
    const cmd = fs.readFileSync(cmdUrl, 'utf8');
    assert.match(cmd, new RegExp(scriptName.replace('.', '\\.')));
    assert.doesNotMatch(cmd, /NATIVE_PLAYBACK_ENABLED=true/);
    assert.doesNotMatch(cmd, /node --import tsx server\/index\.ts/);
  }
});

test('video and recovery launchers start proof-owned API with proof-only env', () => {
  const cases = [
    [VIDEO_PS1, 'live_windows_native_video_playback_proof.env', 'PF_LIVE_WINDOWS_NATIVE_VIDEO_PLAYBACK_PROOF', 'proof:live-windows-native-video-playback'],
    [RECOVERY_PS1, 'live_windows_native_recovery_proof.env', 'PF_LIVE_WINDOWS_NATIVE_RECOVERY_PROOF', 'proof:live-windows-native-recovery'],
  ];
  for (const [psUrl, envName, flagName, proofScript] of cases) {
    const ps1 = fs.readFileSync(psUrl, 'utf8');
    assert.match(ps1, new RegExp(envName));
    assert.match(ps1, /NATIVE_PLAYBACK_ENABLED=true/);
    assert.match(ps1, /Start-Process -FilePath "node"/);
    assert.match(ps1, /Wait-ForNativeProofApi/);
    assert.match(ps1, /Stop-ProofApiProcess/);
    assert.match(ps1, /Export-EvidenceZip/);
    assert.match(ps1, new RegExp(`${flagName}\\s*=\\s*"1"`));
    assert.match(ps1, new RegExp(proofScript.replace(/[-:]/g, (m) => `\\${m}`)));
  }
});

test('scheduler proof launcher is proof-owned and does not start native API', () => {
  const cmd = fs.readFileSync(SCHEDULER_CMD, 'utf8');
  const ps1 = fs.readFileSync(SCHEDULER_PS1, 'utf8');
  assert.match(cmd, /run_live_windows_scheduler_proof\.ps1/);
  assert.match(ps1, /PF_LIVE_WINDOWS_SCHEDULER_PROOF\s*=\s*"1"/);
  assert.match(ps1, /proof:live-windows-scheduler/);
  assert.match(ps1, /Export-EvidenceZip/);
  assert.doesNotMatch(ps1, /Start-ProofApiProcess/);
  assert.doesNotMatch(ps1, /NATIVE_PLAYBACK_ENABLED=true/);
  assert.match(ps1, /does not claim Raspberry cron/);
});

test('package exposes Windows launcher scripts without changing normal launcher defaults', () => {
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
  assert.equal(packageJson.scripts['proof:live-windows-native-video-playback:windows'], 'powershell -NoProfile -ExecutionPolicy Bypass -File start_scripts/run_live_windows_native_video_playback_proof.ps1');
  assert.equal(packageJson.scripts['proof:live-windows-native-recovery:windows'], 'powershell -NoProfile -ExecutionPolicy Bypass -File start_scripts/run_live_windows_native_recovery_proof.ps1');
  assert.equal(packageJson.scripts['proof:live-windows-scheduler:windows'], 'powershell -NoProfile -ExecutionPolicy Bypass -File start_scripts/run_live_windows_scheduler_proof.ps1');
  const startPs1 = fs.readFileSync(START_PS1, 'utf8');
  assert.doesNotMatch(startPs1, /NATIVE_PLAYBACK_ENABLED\s*=\s*"true"/);
  assert.doesNotMatch(startPs1, /live_windows_native_video_playback_proof\.env/);
  assert.doesNotMatch(startPs1, /live_windows_native_recovery_proof\.env/);
});
