// Safely reads the real-demo queue JSON file without throwing into the terminal UI.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { existsSync, readFileSync } from 'node:fs';

export interface SafeQueueJsonRead {
  found: boolean;
  data: unknown;
  messages: string[];
}

export function readQueueFileSafe(queuePath: string): SafeQueueJsonRead {
  if (!existsSync(queuePath)) {
    return { found: false, data: null, messages: [`Queue file missing: ${queuePath}`] };
  }

  try {
    const raw = readFileSync(queuePath, 'utf8').trim();
    if (!raw) {
      return { found: true, data: null, messages: [`Queue file is empty: ${queuePath}`] };
    }
    return { found: true, data: JSON.parse(raw), messages: [`Queue file parsed: ${queuePath}`] };
  } catch (error) {
    return {
      found: true,
      data: null,
      messages: [`Queue file malformed: ${error instanceof Error ? error.message : String(error)}`]
    };
  }
}
