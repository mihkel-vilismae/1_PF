// Reads and maps real-demo worker truth/status data for terminal panels.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { existsSync, readFileSync } from 'node:fs';

export interface JsonlReadResult {
  path: string;
  exists: boolean;
  parsed: Array<{ value: Record<string, unknown>; line: number }>;
  malformed: Array<{ line: number; error: string }>;
}

export function readJsonlTail(filePath: string, maxLines = 200): JsonlReadResult {
  if (!existsSync(filePath)) {
    return { path: filePath, exists: false, parsed: [], malformed: [] };
  }

  const raw = readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).map((line, index) => ({ line, number: index + 1 })).filter((entry) => entry.line.trim());
  const tail = lines.slice(Math.max(0, lines.length - maxLines));
  const parsed: JsonlReadResult['parsed'] = [];
  const malformed: JsonlReadResult['malformed'] = [];

  for (const entry of tail) {
    try {
      const value = JSON.parse(entry.line) as unknown;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        parsed.push({ value: value as Record<string, unknown>, line: entry.number });
      } else {
        malformed.push({ line: entry.number, error: 'JSONL value is not an object' });
      }
    } catch (error) {
      malformed.push({ line: entry.number, error: error instanceof Error ? error.message : String(error) });
    }
  }

  return { path: filePath, exists: true, parsed, malformed };
}
