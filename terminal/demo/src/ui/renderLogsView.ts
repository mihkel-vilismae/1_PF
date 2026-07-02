// Renders View L as a real read-only logs/status/truth snapshot inspector.
// The renderer consumes state snapshots only; file reads are owned by the reader.

import type { DemoTerminalState } from '../state/DemoTerminalState.js';
import type { TerminalLogSnapshot } from '../logs/TerminalLogsSnapshotReader.js';
import { color } from './ansi.js';
import { blank, row, stackBlocks } from './terminalBox.js';
import { renderSectionFrame } from './components/SectionFrame.js';
import { renderStatusRow } from './components/StatusRow.js';

export function renderLogsView(state: DemoTerminalState, width?: number): string {
  const snapshots = state.logsView.snapshots;
  const selected = snapshots.find((snapshot) => snapshot.entry.id === state.logsView.selectedLogId) ?? snapshots[0] ?? null;
  return stackBlocks([
    renderSectionFrame({
      title: color.magenta('VIEW L — LOGS VIEW'),
      lines: [
        renderStatusRow({
          label: 'Logs implementation',
          value: 'read-only snapshot inspector',
          tone: 'ready',
          detail: 'Reads seven allowlisted runtime files when View L is active.'
        }),
        renderStatusRow({
          label: 'Runtime side effects',
          value: 'none',
          tone: 'disabled',
          detail: 'No writes, DB, worker, playback, auth, file-copy, or cron behavior runs.'
        })
      ],
      width
    }),
    blank(),
    renderOverview(snapshots, selected, width),
    blank(),
    renderDetail(selected, width)
  ]);
}

function renderOverview(snapshots: readonly TerminalLogSnapshot[], selected: TerminalLogSnapshot | null, width?: number): string {
  const lines = [
    row([
      { value: '#', width: 3 },
      { value: 'status', width: 15 },
      { value: 'kind', width: 6 },
      { value: 'size', width: 9 },
      { value: 'lines', width: 7 },
      { value: 'label / path', width: 120 }
    ]),
    ...snapshots.map((snapshot, index) => row([
      { value: selected?.entry.id === snapshot.entry.id ? color.active(`[${index + 1}]`) : `[${index + 1}]`, width: 3 },
      { value: colorForStatus(snapshot.status), width: 15 },
      { value: snapshot.entry.kind, width: 6 },
      { value: String(snapshot.sizeBytes), width: 9 },
      { value: String(snapshot.lineCount), width: 7 },
      { value: `${snapshot.entry.label} — ${color.muted(snapshot.entry.relativePath)}`, width: 120 }
    ]))
  ];
  return renderSectionFrame({ title: color.magenta('CORE LOG / STATUS SNAPSHOTS'), lines, width });
}

function renderDetail(snapshot: TerminalLogSnapshot | null, width?: number): string {
  if (!snapshot) {
    return renderSectionFrame({ title: color.magenta('SELECTED LOG DETAIL'), lines: ['No log snapshot is selected.'], width });
  }
  const content = detailLines(snapshot);
  return renderSectionFrame({
    title: color.magenta(`SELECTED LOG DETAIL — ${snapshot.entry.label}`),
    lines: content.length > 0 ? content : ['No preview content available.'],
    width
  });
}

function detailLines(snapshot: TerminalLogSnapshot): string[] {
  const header = [
    `Path: ${snapshot.entry.relativePath}`,
    `Role: ${snapshot.entry.role} | Kind: ${snapshot.entry.kind} | Status: ${snapshot.status}`,
    `Size: ${snapshot.sizeBytes} bytes | Lines: ${snapshot.lineCount} | Modified: ${snapshot.modifiedAtIso ?? 'n/a'}`,
    `Purpose: ${snapshot.entry.purpose}`,
    `Message: ${snapshot.message}`
  ];
  if (snapshot.status !== 'ready') return header;

  const body = snapshot.entry.kind === 'json'
    ? prettyJsonPreview(snapshot.tailLines.join('\n'))
    : snapshot.tailLines.map((line, index) => `${String(index + 1).padStart(2, '0')}: ${line}`);
  return [...header, '--- tail / preview ---', ...body];
}

function prettyJsonPreview(value: string): string[] {
  try {
    return JSON.stringify(JSON.parse(value), null, 2).split('\n').slice(0, 18);
  } catch {
    return value.split(/\r?\n/).slice(0, 18);
  }
}

function colorForStatus(status: TerminalLogSnapshot['status']): string {
  if (status === 'ready') return color.green(status);
  if (status === 'empty') return color.yellow(status);
  if (status === 'missing') return color.muted(status);
  if (status === 'too_large') return color.yellow(status);
  return color.red(status);
}
