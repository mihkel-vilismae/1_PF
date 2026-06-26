import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const readText = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('moved stop_all_win.cmd delegates to the PowerShell stop launcher', async () => {
  const content = await readText('start_scripts/windows/stop_all_win.cmd');

  assert.match(content, /STOP_ALL_WIN\.PS1/);
  assert.match(content, /powershell -NoProfile -ExecutionPolicy Bypass/);
  assert.match(content, /%\*/);
});

test('STOP_ALL_WIN.PS1 targets processes launched by start_win without broad arbitrary process killing', async () => {
  const content = await readText('start_scripts/windows/STOP_ALL_WIN.PS1');

  assert.match(content, /npm run api/);
  assert.match(content, /npm run dev/);
  assert.match(content, /start_component_status\.ps1/);
  assert.match(content, /backend_api\.cmd/);
  assert.match(content, /frontend_vite\.cmd/);
  assert.match(content, /status_monitor\.cmd/);
  assert.match(content, /Get-CimInstance Win32_Process/);
  assert.match(content, /ParentProcessId/);
  assert.match(content, /Get-NetTCPConnection/);
  assert.match(content, /4301/);
  assert.match(content, /5173/);
  assert.match(content, /Stop-Process -Id \$processId -Force/);
  assert.match(content, /DryRun/);
  assert.doesNotMatch(content, /taskkill\s+\/im\s+node/i);
  assert.doesNotMatch(content, /taskkill\s+\/f\s+\/im\s+cmd/i);
});

test('root full_windows_runner_status.cmd delegates to the moved terminal runner UI', async () => {
  const content = await readText('full_windows_runner_status.cmd');

  assert.match(content, /start_scripts\\windows\\FULL_WINDOWS_RUNNER_STATUS\.PS1/);
  assert.match(content, /PS_EXE/);
  assert.match(content, /where pwsh/);
  assert.match(content, /where powershell/);
  assert.match(content, /-NoProfile -ExecutionPolicy Bypass/);
  assert.match(content, /%\*/);
});

test('FULL_WINDOWS_RUNNER_STATUS.PS1 provides start, stop, refresh, status, and Estonia time UI', async () => {
  const content = await readText('start_scripts/windows/FULL_WINDOWS_RUNNER_STATUS.PS1');

  assert.match(content, /START ALL/);
  assert.match(content, /STOP ALL/);
  assert.match(content, /REFRESH STATUS/);
  assert.match(content, /Backend API/);
  assert.match(content, /Frontend Vite/);
  assert.match(content, /Status monitor/);
  assert.match(content, /Database file/);
  assert.match(content, /4301/);
  assert.match(content, /5173/);
  assert.match(content, /start_scripts\\windows\\START_WIN\.PS1|START_WIN\.PS1/);
  assert.match(content, /STOP_ALL_WIN\.PS1/);
  assert.match(content, /service terminals open as Windows Terminal tabs/);
  assert.match(content, /Last updated at/);
  assert.match(content, /Estonia time/);
  assert.match(content, /Format-HumanAge/);
  assert.match(content, /KeyAvailable/);
  assert.match(content, /RefreshSeconds/);
  assert.match(content, /VERSION/);
  assert.match(content, /RepoVersion/);
  assert.match(content, /Full Windows Runner \+ Status v\$RepoVersion/);
});


test('Windows runner PowerShell scripts stay ASCII-safe for Windows PowerShell parser compatibility', async () => {
  for (const script of [
    'start_scripts/windows/FULL_WINDOWS_RUNNER_STATUS.PS1',
    'start_scripts/windows/START_WIN.PS1',
    'start_scripts/windows/STOP_ALL_WIN.PS1',
  ]) {
    const content = await readText(script);
    const nonAscii = [...content].filter((character) => character.charCodeAt(0) > 127);

    assert.deepEqual(nonAscii, [], `${script} must stay ASCII-safe`);
    assert.doesNotMatch(content, /—|…/);
  }
});



test('START_WIN.PS1 opens API, frontend, and status monitor in Windows Terminal tabs when wt.exe is available', async () => {
  const content = await readText('start_scripts/windows/START_WIN.PS1');

  assert.match(content, /Get-Command "wt\.exe"/);
  assert.match(content, /"-w 0"/);
  assert.match(content, /new-tab/);
  assert.match(content, /PF Backend API/);
  assert.match(content, /PF Frontend Vite/);
  assert.match(content, /PF Status Monitor/);
  assert.match(content, /start_component_status\.ps1/);
  assert.match(content, /backend_api\.cmd/);
  assert.match(content, /frontend_vite\.cmd/);
  assert.match(content, /status_monitor\.cmd/);
  assert.match(content, /tab_commands/);
  assert.match(content, /Quote-WtArgument/);
  assert.match(content, /Start-CmdWindow/);
  assert.doesNotMatch(content, /Start-Process -FilePath "powershell\.exe"/);
});

test('start_win.cmd delegates to START_WIN.PS1 instead of duplicating stale startup logic', async () => {
  const content = await readText('start_scripts/windows/start_win.cmd');

  assert.match(content, /START_WIN\.PS1/);
  assert.match(content, /where pwsh/);
  assert.match(content, /where powershell/);
  assert.doesNotMatch(content, /start "12_PF API"/);
  assert.doesNotMatch(content, /start "12_PF Frontend"/);
});

test('STOP_ALL_WIN.PS1 avoids PowerShell colon interpolation parse errors and closes repo terminal hosts', async () => {
  const content = await readText('start_scripts/windows/STOP_ALL_WIN.PS1');

  assert.doesNotMatch(content, /\$port:/);
  assert.match(content, /\$\{port\}:/);
  assert.match(content, /RepoTerminalHostNames/);
  assert.match(content, /cmd\.exe/);
  assert.match(content, /pwsh\.exe/);
  assert.match(content, /Add-MatchingRepoTerminalAncestors/);
  assert.match(content, /wt\.exe/);
});

test('repo root keeps only the terminal GUI launcher among Windows/Raspberry scripts', async () => {
  const forbiddenRootScripts = [
    'start_win.cmd',
    'START_WIN.PS1',
    'start_win_full.cmd',
    'stop_all_win.cmd',
    'STOP_ALL_WIN.PS1',
    'FULL_WINDOWS_RUNNER_STATUS.PS1',
    'START_RASPBERRYOS.SH',
    'start_raspberry_full.sh',
    'TRANSFERABLE_REPO_PACKAGER.cmd',
    'UPDATE_LOCAL_REPO_FROM_ZIP.cmd',
  ];
  const { stat } = await import('node:fs/promises');
  for (const script of forbiddenRootScripts) {
    await assert.rejects(() => stat(new URL(`../${script}`, import.meta.url)));
  }
  const rootLauncher = await readText('full_windows_runner_status.cmd');
  assert.match(rootLauncher, /start_scripts\\windows\\FULL_WINDOWS_RUNNER_STATUS\.PS1/);
});


test('moved proof and packaging wrappers resolve repository root before delegating', async () => {
  const nativeProof = await readText('start_scripts/windows/proofs/start_live_windows_native_playback_proof.cmd');
  assert.match(nativeProof, /%~dp0\.\.\\.\.\\.\./);
  assert.match(nativeProof, /%REPO_ROOT%\\start_scripts\\run_live_windows_native_playback_proof\.ps1/);

  const fullStart = await readText('start_scripts/windows/start_win_full.cmd');
  assert.match(fullStart, /%REPO_ROOT%\\start_scripts\\start_win_full\.ps1/);

  const updateZip = await readText('start_scripts/packaging/UPDATE_LOCAL_REPO_FROM_ZIP.cmd');
  assert.match(updateZip, /%REPO_ROOT%\\tools\\update-local-repo-from-zip\.ps1/);
  assert.match(updateZip, /-RepoPath "%REPO_ROOT%"/);
});
