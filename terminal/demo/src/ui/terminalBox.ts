// Renders one terminal Demo Mode UI section or layout helper.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { stripAnsi, visibleLength } from './ansi.js';

const DEFAULT_WIDTH = 100;

export function fit(value: string, width: number): string {
  const length = visibleLength(value);
  if (length === width) return value;
  if (length < width) return value + ' '.repeat(width - length);
  const plain = stripAnsi(value);
  if (width <= 1) return plain.slice(0, width);
  return `${plain.slice(0, width - 1)}…`;
}

export function panel(title: string, lines: string[], width = DEFAULT_WIDTH): string {
  const safeWidth = Math.max(12, width);
  const innerWidth = safeWidth - 2;
  const titleText = ` ${title} `;
  const remaining = Math.max(0, innerWidth - visibleLength(titleText));
  const top = `┌${titleText}${'─'.repeat(remaining)}┐`;
  const body = lines.map((line) => `│${fit(line, innerWidth)}│`);
  const bottom = `└${'─'.repeat(innerWidth)}┘`;
  return [top, ...body, bottom].join('\n');
}

export function row(columns: Array<{ value: string; width: number }>): string {
  return columns.map((column) => fit(column.value, column.width)).join(' ');
}

export function blank(): string {
  return '';
}

export function joinColumns(columns: Array<{ content: string; width: number }>, separator = '  '): string {
  const splitColumns = columns.map((column) => column.content.split('\n'));
  const height = Math.max(...splitColumns.map((lines) => lines.length));
  const output: string[] = [];

  for (let index = 0; index < height; index += 1) {
    output.push(
      splitColumns
        .map((lines, columnIndex) => fit(lines[index] ?? '', columns[columnIndex]?.width ?? DEFAULT_WIDTH))
        .join(separator)
    );
  }

  return output.join('\n');
}

export function stackBlocks(blocks: string[]): string {
  return blocks.filter((block) => block.length > 0).join('\n');
}
