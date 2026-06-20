import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const doc = readFileSync('docs/20_architecture_and_specs/openspec/real_icloud_filtered_download_manifest_openspec.md', 'utf8');

test('real iCloud filtered download OpenSpec defines the narrow proof chain', () => {
  assert.match(doc, /auth\/session usable -> normalized filters -> real filtered download -> safe manifest -> second batch -> no-loop\/no-overlap result/);
});

test('real iCloud filtered download OpenSpec keeps secret and non-claim boundaries', () => {
  assert.match(doc, /must not include Apple ID/);
  assert.match(doc, /does not claim live iCloud authentication/);
});
