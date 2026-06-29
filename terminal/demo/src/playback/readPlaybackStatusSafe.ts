// Safely reads playback-worker status JSON without throwing into the terminal UI.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { existsSync, readFileSync } from 'node:fs';

export interface SafePlaybackStatusJsonRead {
  found: boolean;
  data: unknown;
  messages: string[];
}

export function readPlaybackStatusSafe(statusPath: string): SafePlaybackStatusJsonRead {
  if (!existsSync(statusPath)) {
    return { found: false, data: null, messages: [`Playback status file missing: ${statusPath}`] };
  }

  try {
    const raw = readFileSync(statusPath, 'utf8').trim();
    if (!raw) return { found: true, data: null, messages: [`Playback status file is empty: ${statusPath}`] };
    return { found: true, data: JSON.parse(raw), messages: [`Playback status file parsed: ${statusPath}`] };
  } catch (error) {
    return {
      found: true,
      data: null,
      messages: [`Playback status file malformed: ${error instanceof Error ? error.message : String(error)}`]
    };
  }
}
