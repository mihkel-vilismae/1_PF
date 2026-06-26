import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(path, 'utf8');

test('root HOW_TO_RUN stays short and points to the runner/status quickstart', () => {
  const howToRun = read('HOW_TO_RUN.md');
  const nonEmptyLines = howToRun.split(/\r?\n/).filter((line) => line.trim()).length;

  assert.ok(nonEmptyLines <= 80, `HOW_TO_RUN.md should stay short; found ${nonEmptyLines} non-empty lines`);
  assert.match(howToRun, /\.\\full_windows_runner_status\.cmd/);
  assert.match(howToRun, /full_windows_runner_status\.cmd/);
  assert.match(howToRun, /start_scripts\/windows\/START_WIN\.PS1/);
  assert.match(howToRun, /start_scripts\/raspberry\/START_RASPBERRYOS\.SH/);
  assert.match(howToRun, /database\/schema\.sql/);
  assert.match(howToRun, /docs\/10_runbooks\/how_to_run_full_reference\.md/);
});

test('expanded run instructions live outside root HOW_TO_RUN', () => {
  assert.equal(existsSync('docs/10_runbooks/how_to_run_full_reference.md'), true);
  const fullReference = read('docs/10_runbooks/how_to_run_full_reference.md');

  assert.match(fullReference, /This file preserves the expanded operator\/runbook content/);
  assert.match(fullReference, /start_live_windows_native_playback_proof\.cmd/);
  assert.match(fullReference, /proof-only env file/);
});

test('default project settings require short HOW_TO_RUN and root runner-status helper', () => {
  const defaults = read('docs/20_architecture_and_specs/reference/default_project_settings_and_elements_checklist.md');

  assert.match(defaults, /HOW_TO_RUN file must stay short and quickstart-oriented/);
  assert.match(defaults, /full_windows_runner_status\.cmd/);
  assert.match(defaults, /\.\\full_windows_runner_status\.cmd/);
  assert.match(defaults, /runner\/status helper/);
  assert.match(defaults, /start_scripts\/windows/);
  assert.match(defaults, /start_scripts\/raspberry/);
});

test('changelog uses paired date and version headings for the latest entry', () => {
  const changelog = read('CHANGELOG.md');
  assert.match(changelog, /^# Changelog\n\n## 2026-06-26 03:24 EEST\n## v0\.10\.20 - Windows runner Start\/Stop terminal tabs hotfix/m);
  assert.match(changelog, /## 2026-06-26 03:05 EEST\n## v0\.10\.20 - Windows runner status parser hotfix/);
  assert.match(changelog, /## 2026-06-26 02:44 EEST\n## v0\.10\.20 - Changelog and quickstart documentation cleanup/);
  assert.match(changelog, /## 2026-06-22 14:57 EEST\n## v0\.10\.20 - Regular worker B3 stage-state-machine product path/);
});
