import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const readme = readFileSync('README.md', 'utf8');

test('root README is a project landing page, not a release log', () => {
  assert.match(readme, /^# PF_login \/ PhotoFrame/m);
  assert.match(readme, /## What this repo does/);
  assert.match(readme, /## Current UI state/);
  assert.match(readme, /## Run locally/);
  assert.match(readme, /## Documentation entry points/);
  assert.match(readme, /Release history lives in \[`CHANGELOG\.md`\]/);
  assert.doesNotMatch(readme, /^## v\d+\.\d+\.\d+/m);
});

test('root README documents the implemented V2 startup and nine-sidebar state', () => {
  const expectedRows = [
    '| `01` | `setup.sh` | `setup` |',
    '| `02` | `authentication.sh` | `authentication` |',
    '| `03` | `startup.sh` | `startup` |',
    '| `04` | `workers` | `workers` |',
    '| `05` | `troubleshooting` | `troubleshooting` |',
    '| `06` | `recovery` | `recovery` |',
    '| `07` | `PIR` | `pir` |',
    '| `08` | `PLAYBACK` | `playback` |',
    '| `09` | `REAL PLAYBACK` | `real-playback` |',
  ];

  for (const row of expectedRows) {
    assert.ok(readme.includes(row), `missing V2 sidebar row: ${row}`);
  }

  assert.match(readme, /V2 center panel renders typed visual blocks and shell\/explanation pages/);
});
