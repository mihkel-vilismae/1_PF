/*
 * Verifies the dedicated Windows live native playback proof launcher contract.
 * These tests are static and never start mpv, API servers, or browser windows.
 * They protect the proof-only env-file boundary and normal launcher defaults.
 * Live OS playback remains an operator-run proof outside normal automated tests.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const PROOF_CMD = new URL('../start_live_windows_native_playback_proof.cmd', import.meta.url);
const PROOF_PS1 = new URL('../start_scripts/run_live_windows_native_playback_proof.ps1', import.meta.url);
const START_PS1 = new URL('../start_scripts/start_win_full.ps1', import.meta.url);
const INSTALLER = new URL('../scripts/install_mpv_windows.ps1', import.meta.url);
const PACKAGE_JSON = new URL('../package.json', import.meta.url);
const HOW_TO_RUN = new URL('../HOW_TO_RUN.md', import.meta.url);
const LIVE_PROOF_DOC = new URL('../docs/proofs/live_windows_native_playback_proof.md', import.meta.url);

test('live Windows native playback proof cmd is thin and delegates to PowerShell', () => {
  const cmd = fs.readFileSync(PROOF_CMD, 'utf8');
  assert.match(cmd, /run_live_windows_native_playback_proof\.ps1/);
  assert.doesNotMatch(cmd, /NATIVE_PLAYBACK_ENABLED=true/);
  assert.doesNotMatch(cmd, /node --import tsx server\/index\.ts/);
  assert.doesNotMatch(cmd, /Invoke-WebRequest/i);
});

test('proof PowerShell runner creates a proof-only env file and starts owned API', () => {
  const ps1 = fs.readFileSync(PROOF_PS1, 'utf8');
  assert.match(ps1, /live_windows_native_playback_proof\.env/);
  assert.match(ps1, /NATIVE_PLAYBACK_ENABLED=true/);
  assert.match(ps1, /NATIVE_PLAYBACK_AUTO_START_ON_WORKER=true/);
  assert.match(ps1, /INIT_ENV_FILE\s*=\s*\$GeneratedEnvPath/);
  assert.match(ps1, /Start-Process -FilePath "node"/);
  assert.match(ps1, /Wait-ForNativeProofApi/);
  assert.match(ps1, /Stop-ProofApiProcess/);
  assert.match(ps1, /Export-EvidenceZip/);
});

test('proof runner targets the actual API port and sets proof env for npm proof command', () => {
  const ps1 = fs.readFileSync(PROOF_PS1, 'utf8');
  assert.match(ps1, /\[int\] \$ApiPort = 4301/);
  assert.match(ps1, /PF_API_BASE_URL\s*=\s*\$ApiBaseUrl/);
  assert.match(ps1, /PF_LIVE_WINDOWS_NATIVE_PLAYBACK_PROOF\s*=\s*"1"/);
  assert.match(ps1, /INIT_ENV_FILE\s*=\s*\$GeneratedEnvPath/);
  assert.match(ps1, /npm" -Arguments @\("run", "proof:live-windows-native-playback"\)/);
});

test('normal full launcher remains explicit and does not enable native playback by default', () => {
  const startPs1 = fs.readFileSync(START_PS1, 'utf8');
  assert.match(startPs1, /scripts\\install_mpv_windows\.ps1/);
  assert.match(startPs1, /-RepoRoot \$RepoRoot/);
  assert.doesNotMatch(startPs1, /NATIVE_PLAYBACK_ENABLED\s*=\s*"true"/);
  assert.doesNotMatch(startPs1, /live_windows_native_playback_proof\.env/);
});

test('mpv installer resolves repo root and escapes Windows paths before regex redaction', () => {
  const installer = fs.readFileSync(INSTALLER, 'utf8');
  assert.match(installer, /\[string\]\$RepoRoot = ""/);
  assert.match(installer, /\$PSCommandPath/);
  assert.match(installer, /Resolve-Path \(Join-Path \$scriptRoot "\.\."\)/);
  assert.match(installer, /function ConvertTo-InstallSafeText/);
  assert.match(installer, /\[regex\]::Escape\(\$RepoRoot\)/);
  assert.doesNotMatch(installer, /-replace \$RepoRoot/);
});

test('package and docs expose the dedicated proof launcher', () => {
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
  assert.equal(packageJson.scripts['proof:live-windows-native-playback:windows'], 'powershell -NoProfile -ExecutionPolicy Bypass -File start_scripts/run_live_windows_native_playback_proof.ps1');
  const howToRun = fs.readFileSync(HOW_TO_RUN, 'utf8');
  const proofDoc = fs.readFileSync(LIVE_PROOF_DOC, 'utf8');
  assert.match(howToRun, /start_live_windows_native_playback_proof\.cmd/);
  assert.match(howToRun, /proof-only env file/);
  assert.match(proofDoc, /start_live_windows_native_playback_proof\.cmd/);
  assert.match(proofDoc, /normal `start_win_full\.cmd` does not enable native playback by default/);
});
