/**
 * Static guard for the Raspberry project-owned launcher skeleton.
 * These tests do not start the API, mpv, systemd, cron, or browser windows.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import process from 'node:process';

const rootWrapper = 'start_raspberry_full.sh';
const launcher = 'start_scripts/start_raspberry_full.sh';
const openSpec = 'docs/20_architecture_and_specs/openspec/raspberry_project_owned_launcher_openspec.md';
const runbook = 'docs/10_runbooks/raspberry_project_owned_launcher.md';

function read(path) {
  return readFileSync(path, 'utf8');
}

function gitIndexMarksExecutable(path) {
  const output = execFileSync('git', ['ls-files', '-s', path], { encoding: 'utf8' }).trim();
  return output.startsWith('100755 ');
}

function launcherExecutable(path) {
  if (process.platform === 'win32') return gitIndexMarksExecutable(path);
  return Boolean(statSync(path).mode & 0o111);
}

test('Raspberry launcher files and docs exist', () => {
  for (const path of [rootWrapper, launcher, openSpec, runbook]) assert.equal(existsSync(path), true, `${path} exists`);
  assert.equal(launcherExecutable(rootWrapper), true, 'root wrapper is executable');
  assert.equal(launcherExecutable(launcher), true, 'launcher script is executable');
});

test('root Raspberry launcher is a thin delegate', () => {
  const text = read(rootWrapper);
  assert.match(text, /exec "\$SCRIPT_DIR\/start_scripts\/start_raspberry_full\.sh" "\$@"/);
  assert.doesNotMatch(text, /npm run api/);
  assert.doesNotMatch(text, /mpv/);
});

test('Raspberry launcher skeleton preserves project-owned process boundary', () => {
  const text = read(launcher);
  assert.match(text, /runtime_data\/raspberry_launcher/);
  assert.match(text, /--start-api/);
  assert.match(text, /PF_RASPBERRY_PROJECT_OWNED_LAUNCHER="1"/);
  assert.match(text, /API_PID_FILE/);
  assert.match(text, /npm run api/);
  assert.match(text, /launch_plan_/);
  assert.doesNotMatch(text, /npm run dev/);
  assert.doesNotMatch(text, /NATIVE_PLAYBACK_ENABLED=true/);
  assert.doesNotMatch(text, /^\s*mpv\b/m);
  assert.doesNotMatch(text, /systemctl/);
  assert.doesNotMatch(text, /crontab/);
});

test('Raspberry launcher OpenSpec is linked and keeps non-claims explicit', () => {
  const linkedDocs = [read('CHANGELOG.md'), read('docs/table_of_contents.md'), read('docs/10_runbooks/README.md'), read('docs/20_architecture_and_specs/openspec/README.md')].join('\n');
  assert.match(linkedDocs, /raspberry_project_owned_launcher_openspec\.md/);
  assert.match(linkedDocs, /raspberry_project_owned_launcher\.md/);
  const spec = read(openSpec);
  assert.match(spec, /does not implement Raspberry native playback/);
  assert.match(spec, /systemd \/ cron \/ boot autostart/);
  assert.match(spec, /runtime_data\/raspberry_launcher/);
});
