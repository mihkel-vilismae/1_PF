import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const readText = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('start_win.cmd launches API, frontend, and component status monitor', async () => {
  const content = await readText('start_scripts/windows/start_win.cmd');

  assert.match(content, /START_WIN\.PS1/);
  assert.match(content, /where pwsh/);
  assert.match(content, /where powershell/);
});

test('full Windows launcher opens API, frontend, and status tabs or windows', async () => {
  const content = await readText('start_scripts/start_win_full.ps1');

  assert.match(content, /PF API/);
  assert.match(content, /PF Frontend/);
  assert.match(content, /PF Status/);
  assert.match(content, /start_component_status\.ps1/);
});

test('component status monitor displays API and Dashboard versions and statuses', async () => {
  const content = await readText('start_scripts/start_component_status.ps1');

  assert.match(content, /function Get-BackendVersion/);
  assert.match(content, /function Get-DashboardVersion/);
  assert.match(content, /function Test-HttpEndpoint/);
  assert.match(content, /Write-ComponentRow -Name "API"/);
  assert.match(content, /Write-ComponentRow -Name "Dashboard"/);
  assert.doesNotMatch(content, /icloudpd_raw_stdio/i);
});
