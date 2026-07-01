// Renders View L as a shell-only logs/status/truth inspection page.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { DemoTerminalState } from '../state/DemoTerminalState.js';
import { terminalLogsViewEntries } from '../views/TerminalLogsViewRegistry.js';
import { color } from './ansi.js';
import { blank, stackBlocks } from './terminalBox.js';
import { renderSectionFrame } from './components/SectionFrame.js';
import { renderStatusRow } from './components/StatusRow.js';

export function renderLogsView(_state: DemoTerminalState, width?: number): string {
  return stackBlocks([
    renderSectionFrame({
      title: color.magenta('VIEW L — LOGS VIEW'),
      lines: [
        renderStatusRow({
          label: 'Logs implementation',
          value: 'shell placeholders only',
          tone: 'planned',
          detail: 'No files are tailed or read from this view slice.'
        }),
        renderStatusRow({
          label: 'Runtime side effects',
          value: 'none',
          tone: 'disabled',
          detail: 'No worker, DB, playback, auth, file-copy, or cron behavior runs.'
        })
      ],
      width
    }),
    blank(),
    renderSectionFrame({
      title: color.magenta('CORE LOG / STATUS SHELLS'),
      lines: terminalLogsViewEntries.map(
        (entry, index) => `${color.brightCyan(`[${index + 1}]`)} ${entry.label} — ${color.muted(entry.path)}`
      ),
      width
    }),
    blank(),
    renderSectionFrame({
      title: color.magenta('LOG PANEL PLACEHOLDERS'),
      lines: terminalLogsViewEntries.map(
        (entry) => `○ ${entry.label}: ${color.muted(entry.purpose)} ${color.muted('(placeholder only)')}`
      ),
      width
    })
  ]);
}
