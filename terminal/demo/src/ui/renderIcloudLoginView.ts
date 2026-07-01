// Renders View I: NEW AUTH iCloudPD login shell only.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { DemoTerminalState } from '../state/DemoTerminalState.js';
import { color } from './ansi.js';
import { blank, stackBlocks } from './terminalBox.js';
import { renderSectionFrame } from './components/SectionFrame.js';
import { renderStatusRow } from './components/StatusRow.js';

const newAuthButtons = [
  'Verify iCloudPD install',
  'Verify with iCloudPD',
  'Login using .env values',
  'Check login',
  'Log out and remove existing session',
  'Show auth/session paths and files',
  'Generate auth evidence pack',
  'List auth evidence packs'
] as const;

export function renderIcloudLoginView(_state: DemoTerminalState, width?: number): string {
  return stackBlocks([
    renderSectionFrame({
      title: color.magenta('VIEW I — ICLOUDPD LOGIN VIEW'),
      lines: [
        renderStatusRow({
          label: 'Auth implementation',
          value: 'NEW AUTH shell only',
          tone: 'planned',
          detail: 'Buttons below are visible placeholders and do not execute iCloudPD yet.'
        }),
        renderStatusRow({
          label: 'Legacy compatibility buttons',
          value: 'forbidden here',
          tone: 'disabled',
          detail: 'Only the newer NEW AUTH button set is listed.'
        })
      ],
      width
    }),
    blank(),
    renderSectionFrame({
      title: color.magenta('NEW AUTH BUTTON SHELLS'),
      lines: newAuthButtons.map((label, index) => `${color.brightCyan(`[${index + 1}]`)} ${label} — ${color.muted('placeholder only; no auth action runs')}`),
      width
    }),
    blank(),
    renderSectionFrame({
      title: color.magenta('AUTH SHELL SAFETY'),
      lines: [
        'No iCloudPD process is started from View I in this slice.',
        'No session files are read, written, deleted, listed, or packaged from this shell.',
        'Press D to return to the default operator view.'
      ],
      width
    })
  ]);
}
