/*
 * Verifies the user-observed View A/B/D status snapshot remains discoverable.
 * This protects the manual audit notes and follow-up issue list from becoming
 * orphaned after documentation navigation changes.
 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { test } from 'node:test';

const SNAPSHOT_PATH = 'docs/30_status_snapshots/2026-05-26/USER_OBSERVED_CARD_STATUS_AND_ISSUES_20260526_1457_EEST.md';
const SNAPSHOT_FILE = 'USER_OBSERVED_CARD_STATUS_AND_ISSUES_20260526_1457_EEST.md';
const READ_FIRST_DOCS = [
  'AGENTS.md',
  'docs/DOC_INDEX.md',
  'docs/00_current_truth/README.md',
  'docs/30_status_snapshots/README.md',
];

/**
 * Reads a UTF-8 repository text file for assertions.
 */
function readText(path) {
  return readFileSync(path, 'utf8');
}

/**
 * Confirms a navigation/read-first document mentions the canonical snapshot.
 */
function assertDocumentPointer(path) {
  const text = readText(path);
  assert.ok(
    text.includes(SNAPSHOT_FILE) || text.includes(SNAPSHOT_PATH),
    `Missing pointer to ${SNAPSHOT_FILE}`,
  );
}

test('user-observed card status snapshot keeps cards, issues, and authority warning', () => {
  assert.ok(existsSync(SNAPSHOT_PATH), `Missing snapshot document: ${SNAPSHOT_PATH}`);
  const text = readText(SNAPSHOT_PATH);

  assert.match(text, /Your subjective assessment/);
  assert.match(text, /User-observed follow-up list|Things to look at \/ verify \/ implement/);
  assert.match(text, /B2-REAL_DOWNLOAD/);
  assert.match(text, /re-download the same files|re-downloads? the same files/i);
  assert.match(text, /less authoritative than code\/tests\/docs|less authoritative than source code, tests/i);
});

test('user-observed card status snapshot is discoverable from read-first docs', () => {
  for (const path of READ_FIRST_DOCS) {
    assertDocumentPointer(path);
  }
});
