/*
 * Verifies the Windows mpv auto-install launcher contract.
 * These tests are static and do not download mpv or require internet access.
 * They protect the thin .cmd launcher boundary and repo-local mpv target path.
 * Live native playback proof remains opt-in and separate from installer checks.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const START_CMD = new URL('../start_win_full.cmd', import.meta.url);
const START_PS1 = new URL('../start_scripts/start_win_full.ps1', import.meta.url);
const INSTALLER = new URL('../scripts/install_mpv_windows.ps1', import.meta.url);
const GITIGNORE = new URL('../.gitignore', import.meta.url);
const HOW_TO_RUN = new URL('../HOW_TO_RUN.md', import.meta.url);
const LIVE_PROOF_DOC = new URL('../docs/proofs/live_windows_native_playback_proof.md', import.meta.url);
const MPV_README = new URL('../tools/mpv/windows/README.md', import.meta.url);

test('full Windows cmd remains thin and delegates startup to PowerShell', () => {
  const startCmd = fs.readFileSync(START_CMD, 'utf8');
  assert.match(startCmd, /start_scripts\\start_win_full\.ps1/);
  assert.doesNotMatch(startCmd, /Invoke-WebRequest/i);
  assert.doesNotMatch(startCmd, /browser_download_url/i);
  assert.doesNotMatch(startCmd, /Expand-Archive/i);
  assert.match(startCmd, /repo-local mpv setup/i);
});

test('full Windows PowerShell launcher delegates mpv setup to installer script', () => {
  const startPs1 = fs.readFileSync(START_PS1, 'utf8');
  assert.match(startPs1, /function Install-NativePlaybackPlayer/);
  assert.match(startPs1, /scripts\\install_mpv_windows\.ps1/);
  assert.match(startPs1, /Install-Dependencies\s+Install-NativePlaybackPlayer\s+Invoke-ProjectTests/s);
  assert.match(startPs1, /Continuing normal dashboard launch/);
});

test('mpv installer targets repo-local mpv path and writes sanitized evidence', () => {
  const installer = fs.readFileSync(INSTALLER, 'utf8');
  assert.match(installer, /tools\\mpv\\windows/);
  assert.match(installer, /mpv\.exe/);
  assert.match(installer, /shinchiro\/mpv-winbuild-cmake/);
  assert.match(installer, /mpv_windows_install_\$timestamp\.json/);
  assert.match(installer, /--version/);
  assert.match(installer, /Start-Process/);
  assert.match(installer, /RedirectStandardOutput/);
  assert.match(installer, /RedirectStandardError/);
  assert.match(installer, /exit_code = \$process\.ExitCode/);
  assert.match(installer, /ok = \(\$process\.ExitCode -eq 0\)/);
  assert.match(installer, /function ConvertTo-InstallSafeText/);
  assert.match(installer, /\[regex\]::Escape\(\$RepoRoot\)/);
  assert.doesNotMatch(installer, /-replace \$RepoRoot/);
  assert.doesNotMatch(installer, /--fs/);
});

test('runtime-installed mpv binaries are ignored while directory docs remain tracked', () => {
  const gitignore = fs.readFileSync(GITIGNORE, 'utf8');
  assert.match(gitignore, /tools\/mpv\/windows\/\*/);
  assert.match(gitignore, /!tools\/mpv\/windows\/\.gitkeep/);
  assert.match(gitignore, /!tools\/mpv\/windows\/README\.md/);
  assert.ok(fs.existsSync(MPV_README));
});

test('operator docs explain auto-install and proof boundary', () => {
  const howToRun = fs.readFileSync(HOW_TO_RUN, 'utf8');
  const proofDoc = fs.readFileSync(LIVE_PROOF_DOC, 'utf8');
  assert.match(howToRun, /scripts\\install_mpv_windows\.ps1/);
  assert.match(howToRun, /tools\/mpv\/windows\/mpv\.exe/);
  assert.match(howToRun, /runtime-installed and ignored by Git/);
  assert.match(proofDoc, /## mpv availability/);
  assert.match(proofDoc, /start_win_full\.cmd/);
  assert.match(proofDoc, /should remain `BLOCKED`/);
});


test('mpv installer treats normal version stdout as evidence rather than failure text', () => {
  const installer = fs.readFileSync(INSTALLER, 'utf8');
  assert.match(installer, /normal mpv stdout\/stderr is evidence, not a PowerShell exception/);
  assert.match(installer, /summaryLines = \$combinedOutput -split/);
  assert.match(installer, /Select-Object -First 3/);
});
