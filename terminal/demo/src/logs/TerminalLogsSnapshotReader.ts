// Read-only snapshot reader for View L log/status/truth inspection.
// It never creates, mutates, tails, watches, or deletes runtime files.

import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { terminalLogsRegistry, type TerminalLogRegistryEntry } from './TerminalLogsRegistry.js';

export type TerminalLogSnapshotStatus = 'missing' | 'empty' | 'ready' | 'invalid_json' | 'invalid_jsonl' | 'too_large';

export interface TerminalLogSnapshot {
  readonly entry: TerminalLogRegistryEntry;
  readonly absolutePath: string;
  readonly status: TerminalLogSnapshotStatus;
  readonly exists: boolean;
  readonly sizeBytes: number;
  readonly modifiedAtIso: string | null;
  readonly lineCount: number;
  readonly previewLines: readonly string[];
  readonly tailLines: readonly string[];
  readonly message: string;
}

export interface TerminalLogsSnapshotReaderOptions {
  readonly runtimeRoot: string;
  readonly maxBytes?: number;
  readonly previewLineLimit?: number;
  readonly tailLineLimit?: number;
}

const DEFAULT_MAX_BYTES = 128 * 1024;
const DEFAULT_PREVIEW_LINE_LIMIT = 6;
const DEFAULT_TAIL_LINE_LIMIT = 18;

export function readTerminalLogsSnapshots(options: TerminalLogsSnapshotReaderOptions): readonly TerminalLogSnapshot[] {
  return terminalLogsRegistry.map((entry) => readOneSnapshot(entry, options));
}

function readOneSnapshot(entry: TerminalLogRegistryEntry, options: TerminalLogsSnapshotReaderOptions): TerminalLogSnapshot {
  const absolutePath = path.resolve(options.runtimeRoot, entry.relativePath);
  if (!existsSync(absolutePath)) return missingSnapshot(entry, absolutePath);

  const stats = statSync(absolutePath);
  if (!stats.isFile()) return missingSnapshot(entry, absolutePath, 'Path exists but is not a regular file.');

  const base = {
    entry,
    absolutePath,
    exists: true,
    sizeBytes: stats.size,
    modifiedAtIso: stats.mtime.toISOString()
  };
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  if (stats.size === 0) return complete(base, 'empty', [], 'File exists but has no content.');
  if (stats.size > maxBytes) return complete(base, 'too_large', [], `File is larger than safe snapshot limit (${maxBytes} bytes).`);

  const lines = readFileSync(absolutePath, 'utf8').split(/\r?\n/).filter((line) => line.length > 0);
  const validation = validateSnapshotLines(entry, lines);
  const status = validation.ok ? 'ready' : entry.kind === 'json' ? 'invalid_json' : 'invalid_jsonl';
  return complete(base, status, lines, validation.message, options);
}

function validateSnapshotLines(entry: TerminalLogRegistryEntry, lines: readonly string[]): { ok: boolean; message: string } {
  if (entry.kind === 'json') {
    try {
      JSON.parse(lines.join('\n'));
      return { ok: true, message: 'JSON status snapshot is readable.' };
    } catch (error) {
      return { ok: false, message: `Invalid JSON status snapshot: ${formatError(error)}` };
    }
  }

  for (let index = 0; index < lines.length; index += 1) {
    try {
      JSON.parse(lines[index] ?? '');
    } catch (error) {
      return { ok: false, message: `Invalid JSONL at line ${index + 1}: ${formatError(error)}` };
    }
  }
  return { ok: true, message: 'JSONL log is readable.' };
}

function complete(
  base: Omit<TerminalLogSnapshot, 'status' | 'lineCount' | 'previewLines' | 'tailLines' | 'message'>,
  status: TerminalLogSnapshotStatus,
  lines: readonly string[],
  message: string,
  options: Pick<TerminalLogsSnapshotReaderOptions, 'previewLineLimit' | 'tailLineLimit'> = {}
): TerminalLogSnapshot {
  const previewLimit = options.previewLineLimit ?? DEFAULT_PREVIEW_LINE_LIMIT;
  const tailLimit = options.tailLineLimit ?? DEFAULT_TAIL_LINE_LIMIT;
  return {
    ...base,
    status,
    lineCount: lines.length,
    previewLines: lines.slice(0, previewLimit),
    tailLines: lines.slice(Math.max(0, lines.length - tailLimit)),
    message
  };
}

function missingSnapshot(entry: TerminalLogRegistryEntry, absolutePath: string, message = 'File is missing.'): TerminalLogSnapshot {
  return {
    entry,
    absolutePath,
    status: 'missing',
    exists: false,
    sizeBytes: 0,
    modifiedAtIso: null,
    lineCount: 0,
    previewLines: [],
    tailLines: [],
    message
  };
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
