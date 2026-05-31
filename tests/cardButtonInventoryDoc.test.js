/*
 * Guards the documented View A/B/D card-button inventory against silent drift.
 * The test compares key rendered buttons and documented rows without changing UI behavior.
 * It intentionally treats the audit as a static baseline snapshot, not live runtime proof.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';
import { renderInitView } from '../dashboard/views/initView.ts';
import { renderRunningProcessView } from '../dashboard/views/runningProcessView.ts';
import { renderTestView } from '../dashboard/views/testView.ts';

const AUDIT_DOC_PATH = new URL('../docs/CARD_BUTTON_IMPLEMENTATION_STATUS.md', import.meta.url);
const INIT_VIEW_SOURCE_PATH = new URL('../dashboard/views/initView.ts', import.meta.url);

const EXPECTED_RENDERED_BUTTONS = Object.freeze([
  { view: 'A', cardCode: '1A', heading: 'Verify .env', label: 'Run', attribute: 'data-action="verify-env"' },
  { view: 'A', cardCode: '1A-STASH-OFF', heading: 'NEW AUTH', label: 'Verify iCloudPD install', attribute: 'data-action="new-auth-verify-icloudpd"' },
  { view: 'A', cardCode: '1A-STASH-OFF', heading: 'NEW AUTH', label: 'Verify with iCloudPD', attribute: 'data-action="new-auth-verify-provider-session"' },
  { view: 'A', cardCode: '1A-STASH-OFF', heading: 'NEW AUTH', label: 'Login using .env values', attribute: 'data-action="new-auth-login-using-env"' },
  { view: 'A', cardCode: '1A-STASH-OFF', heading: 'NEW AUTH', label: 'Check login', attribute: 'data-action="new-auth-check-login"' },
  { view: 'A', cardCode: '1A-STASH-OFF', heading: 'NEW AUTH', label: 'Log out and remove existing session', attribute: 'data-action="new-auth-logout-session"' },
  { view: 'A', cardCode: '1A-STASH-OFF', heading: 'NEW AUTH', label: 'Show auth/session paths and files', attribute: 'data-action="new-auth-session-files"' },
  { view: 'A', cardCode: '1A-STASH-OFF', heading: 'NEW AUTH', label: 'Generate auth evidence pack', attribute: 'data-action="new-auth-generate-artifact-pack"' },
  { view: 'A', cardCode: '1A-STASH-OFF', heading: 'NEW AUTH', label: 'List auth evidence packs', attribute: 'data-action="new-auth-list-artifact-packs"' },
  { view: 'A', cardCode: '2A', heading: 'Database controls', label: 'Check DB', attribute: 'data-action="check-db"' },
  { view: 'A', cardCode: '2A', heading: 'Database controls', label: 'Inspect DB', attribute: 'data-action="inspect-db"' },
  { view: 'A', cardCode: '2A', heading: 'Database controls', label: 'Delete DB', attribute: 'data-action="delete-db"' },
  { view: 'A', cardCode: '2A', heading: 'Database controls', label: 'Recreate DB', attribute: 'data-action="recreate-db"' },
  { view: 'A', cardCode: '3A', heading: 'Scheduler controls', label: 'WINDOWS (crontab emulator)', attribute: 'data-action="select-scheduler-target-windows"' },
  { view: 'A', cardCode: '3A', heading: 'Scheduler controls', label: 'RASPBERRY (real crontab)', attribute: 'data-action="select-scheduler-target-raspberry"' },
  { view: 'A', cardCode: '3A', heading: 'Scheduler controls', label: 'copy all', attribute: 'data-scheduler-endpoint-copy-all' },
  { view: 'A', cardCode: '3A', heading: 'Scheduler controls', label: 'clear', attribute: 'data-scheduler-endpoint-clear-all' },
  { view: 'A', cardCode: '3A', heading: 'Scheduler controls', label: 'Check emulator scheduler', attribute: 'data-action="check-emulator-scheduler"' },
  { view: 'A', cardCode: '3A', heading: 'Scheduler controls', label: 'Run emulator', attribute: 'data-action="run-emulator"' },
  { view: 'A', cardCode: '3A', heading: 'Scheduler controls', label: 'Stop emulator', attribute: 'data-action="stop-emulator"' },
  { view: 'A', cardCode: '3A', heading: 'Scheduler controls', label: 'Install crontab', attribute: 'data-action="install-crontab"' },
  { view: 'A', cardCode: '3A', heading: 'Scheduler controls', label: 'Get active crontab', attribute: 'data-action="get-active-crontab"' },
  { view: 'A', cardCode: '3A', heading: 'Scheduler controls', label: 'Install scheduler', attribute: 'data-action="install-cron"' },
  { view: 'A', cardCode: '3A', heading: 'Scheduler controls', label: 'Check scheduler', attribute: 'data-action="check-cron"' },
  { view: 'A', cardCode: '3A', heading: 'Scheduler controls', label: 'Print scheduler', attribute: 'data-action="print-cron"' },
  { view: 'B', cardCode: 'B2', heading: 'Download test action', label: 'Run', attribute: 'data-action="run-b2"' },
  { view: 'B', cardCode: 'B2-REAL_DOWNLOAD', heading: 'Authenticated real download', label: 'Run real download', attribute: 'data-action="run-b2-real-download"' },
  { view: 'B', cardCode: 'B3', heading: 'Pipeline stages', label: 'Run all stages', attribute: 'data-action="run-b3-auto"' },
  { view: 'B', cardCode: 'B3', heading: 'Pipeline stages', label: 'Detect issues in pipeline', attribute: 'data-action="detect-pipeline-issues"' },
  { view: 'B', cardCode: 'B3', heading: 'Pipeline stages', label: 'Clear stale locks', attribute: 'data-action="clear-stale-pipeline-locks"' },
  { view: 'B', cardCode: 'B3', heading: 'Pipeline stages', label: 'Run', attribute: 'data-action="run-b3-1"' },
  { view: 'B', cardCode: 'B3', heading: 'Pipeline stages', label: 'Run', attribute: 'data-action="run-b3-2"' },
  { view: 'B', cardCode: 'B3', heading: 'Pipeline stages', label: 'Run', attribute: 'data-action="run-b3-3"' },
  { view: 'B', cardCode: 'B3', heading: 'Pipeline stages', label: 'Run', attribute: 'data-action="run-b3-4"' },
  { view: 'B', cardCode: 'B3', heading: 'Pipeline stages', label: 'Run', attribute: 'data-action="run-b3-5"' },
  { view: 'B', cardCode: 'B4', heading: 'Playback selection', label: 'Windows', attribute: 'data-playback-rendering-platform="windows"' },
  { view: 'B', cardCode: 'B4', heading: 'Playback selection', label: 'Raspberry OS (disabled)', attribute: 'data-playback-rendering-platform="raspberry-os"' },
  { view: 'B', cardCode: 'B4', heading: 'Playback selection', label: 'Playback without rendering', attribute: 'data-playback-rendering-mode="playback-without-rendering"' },
  { view: 'B', cardCode: 'B4', heading: 'Playback selection', label: 'Show real rendering in preview window', attribute: 'data-playback-rendering-mode="show-real-rendering-in-preview-window"' },
  { view: 'B', cardCode: 'B4', heading: 'Playback selection', label: 'Switch to fullscreen', attribute: 'data-playback-rendering-mode="switch-to-fullscreen"' },
  { view: 'B', cardCode: 'B4', heading: 'Playback selection', label: 'Run', attribute: 'data-action="run-b4"' },
]);

const EXPECTED_EMPTY_BUTTON_CARDS = Object.freeze([
  { view: 'B', cardCode: 'B5', heading: 'Screen on-off simulation' },
  { view: 'D', cardCode: 'D1', heading: 'Pipeline worker' },
  { view: 'D', cardCode: 'D2', heading: 'Playback worker' },
  { view: 'D', cardCode: 'D3', heading: 'Screen on-off worker' },
  { view: 'D', cardCode: 'D4', heading: 'Monitor log / Preview log' },
]);

test('card button implementation audit tracks rendered View A and B button controls', () => {
  const state = createInitialState();
  const renderedHtml = [renderInitView(state), renderTestView(state)].join('\n');
  const auditDoc = fs.readFileSync(AUDIT_DOC_PATH, 'utf8');

  for (const expectedButton of EXPECTED_RENDERED_BUTTONS) {
    assertDocumentedHeading(auditDoc, expectedButton.cardCode, expectedButton.heading);
    assertRenderedControl(renderedHtml, expectedButton);
    assertDocumentedControl(auditDoc, expectedButton);
  }
});

test('card button implementation audit records cards with no card-local buttons', () => {
  const state = createInitialState();
  const renderedDHtml = renderRunningProcessView(state);
  const auditDoc = fs.readFileSync(AUDIT_DOC_PATH, 'utf8');

  for (const expectedCard of EXPECTED_EMPTY_BUTTON_CARDS) {
    assertDocumentedHeading(auditDoc, expectedCard.cardCode, expectedCard.heading);
    assertDocumentedNoButtonRow(auditDoc, expectedCard);
  }

  assert.match(renderedDHtml, /data-action="start-real-run"/);
  assert.ok(renderedDHtml.indexOf('data-action="start-real-run"') < renderedDHtml.indexOf('<article class="card'));
});

test('scheduler endpoint row expansion remains represented in source and audit docs', () => {
  const initViewSource = fs.readFileSync(INIT_VIEW_SOURCE_PATH, 'utf8');
  const auditDoc = fs.readFileSync(AUDIT_DOC_PATH, 'utf8');

  assert.match(initViewSource, /data-scheduler-endpoint-row-expand=/);
  assert.match(initViewSource, />expand row<\/button>/);
  assert.match(auditDoc, /data-scheduler-endpoint-row-expand="<rowId>"/);
  assert.match(auditDoc, /\| A \| 3A \| Scheduler controls \|[^\n]+\| expand row \|/);
});

/**
 * Checks that the audit document has the expected card section heading.
 * This keeps the documentation split one section per .card.
 */
function assertDocumentedHeading(auditDoc, cardCode, heading) {
  assert.ok(auditDoc.includes(`### .card code and Heading: ${cardCode} — ${heading}`));
}

/**
 * Checks that a rendered View A/B control still exposes the expected attribute and label.
 * The match is intentionally local to one button element to avoid false positives.
 */
function assertRenderedControl(renderedHtml, expectedButton) {
  const buttonPattern = new RegExp(`<button[^>]*${escapeRegExp(expectedButton.attribute)}[^>]*>${escapeRegExp(expectedButton.label)}<\\/button>`);
  assert.match(renderedHtml, buttonPattern);
}

/**
 * Checks that the audit row still lists the expected button label and action or attribute.
 * The doc row is the human-readable inventory used by future audit passes.
 */
function assertDocumentedControl(auditDoc, expectedButton) {
  const rowPrefix = `| ${expectedButton.view} | ${expectedButton.cardCode} | ${expectedButton.heading} |`;
  const actionCell = `| `.concat('`', expectedButton.attribute, '`');
  assert.ok(auditDoc.includes(rowPrefix));
  assert.ok(auditDoc.includes(`| ${expectedButton.label} ${actionCell}`));
}

/**
 * Checks that cards without card-local buttons are explicitly documented as empty.
 * This prevents accidental omission of D cards and B5 from the audit snapshot.
 */
function assertDocumentedNoButtonRow(auditDoc, expectedCard) {
  const rowPrefix = `| ${expectedCard.view} | ${expectedCard.cardCode} | ${expectedCard.heading} |`;
  assert.ok(auditDoc.includes(rowPrefix));
  assert.ok(auditDoc.includes('| No buttons inside this .card | — |'));
}

/**
 * Escapes dynamic strings before they are embedded in regular expressions.
 * This keeps the inventory assertions stable for labels that contain punctuation.
 */
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
