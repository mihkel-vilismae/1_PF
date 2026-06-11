/**
 * Verifies the Raspberry OS OpenSpec documentation slice.
 * This is documentation-only: Raspberry runtime behavior must remain unclaimed.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const openSpecPath = 'docs/20_architecture_and_specs/openspec/raspberry_os_missing_features_openspec.md';

function read(path) {
  return readFileSync(path, 'utf8');
}

test('Raspberry OS OpenSpec documentation exists and is linked from docs', () => {
  assert.equal(existsSync('docs/20_architecture_and_specs/openspec/README.md'), true);
  assert.equal(existsSync(openSpecPath), true);
  const linkedDocs = [
    read('README.md'),
    read('HOW_TO_RUN.md'),
    read('CHANGELOG.md'),
    read('docs/table_of_contents.md'),
    read('docs/proofs/README.md'),
    read('docs/20_architecture_and_specs/README.md'),
  ].join('\n');
  assert.match(linkedDocs, /raspberry_os_missing_features_openspec\.md/);
});

test('Raspberry OpenSpec covers all missing feature contracts', () => {
  const text = read(openSpecPath);
  for (const required of [
    'Raspberry OS runtime launcher',
    'Raspberry local tool checker/installer',
    'Raspberry native fullscreen image playback',
    'Raspberry native fullscreen video playback',
    'Raspberry address/location overlay strategy',
    'Raspberry path/env/runtime-data portability',
    'Raspberry project-owned scheduler loop',
    'Raspberry worker autostart after boot',
    'Raspberry screen on/off worker behavior',
    'Raspberry generated fixture validation proof',
    'Raspberry controlled process recovery proof',
    'Raspberry manual reboot recovery proof',
    'Raspberry power-loss recovery proof',
    'Raspberry evidence bundle export',
    'Raspberry HOW_TO_RUN/operator guide',
  ]) {
    assert.ok(text.includes(required), `missing Raspberry contract: ${required}`);
  }
});

test('Raspberry OpenSpec marks features unimplemented or not run, not proven', () => {
  const text = read(openSpecPath);
  assert.match(text, /Status: OpenSpec \/ documentation-only contract/);
  assert.match(text, /Runtime behavior changed by this document: none/);
  assert.match(text, /NOT_IMPLEMENTED/);
  assert.match(text, /NOT_RUN/);
  assert.match(text, /BLOCKED unless explicit hardware evidence/);
  assert.match(text, /This OpenSpec does not prove:[\s\S]*Raspberry playback/);
  assert.match(text, /This OpenSpec does not prove:[\s\S]*Raspberry power-loss recovery/);
});

test('Raspberry OpenSpec preserves Windows proof milestone claims and non-claims', () => {
  const text = read(openSpecPath);
  for (const preserved of [
    'Native Windows image playback',
    'Native Windows worker-autostart image playback',
    'Native Windows video playback',
    'Controlled Windows native recovery',
    'Proof-owned live Windows scheduler loop',
    'Windows reboot/restart recovery preflight',
  ]) {
    assert.ok(text.includes(preserved), `missing preserved Windows proof context: ${preserved}`);
  }
  assert.match(text, /Those Windows results do not prove Raspberry OS behavior/);
});

test('Raspberry OpenSpec keeps Windows Task Scheduler out of scope', () => {
  const text = read(openSpecPath);
  assert.match(text, /Windows Task Scheduler is not part of PF_login project scope/);
  assert.doesNotMatch(text, /schtasks\.exe/i);
  assert.doesNotMatch(text, /Windows Task Scheduler service/i);
});

test('Raspberry OpenSpec preserves local-only media tool boundaries', () => {
  const text = read(openSpecPath);
  assert.match(text, /Do not vendor Raspberry `mpv`, `ffmpeg`, or `ffprobe` binaries into Git/);
  assert.match(text, /Do not re-track local `tools\/mpv\/` or `tools\/ffmpeg\/` bundles/);
  assert.match(text, /tools\/mpv\//);
  assert.match(text, /tools\/ffmpeg\//);
});
