// Reads the real-demo playback selected-item status from DEMO scheduler output.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { join } from 'node:path';
import type { DemoRuntimePaths } from '../config/runtimeTypes.js';
import type { DemoPlaybackStatusReadResult, DemoPlaybackStatusRepository } from './DemoPlaybackStatusRepository.js';
import { mapPlaybackStatusJson } from './mapSelectedPlaybackItem.js';
import { readPlaybackStatusSafe } from './readPlaybackStatusSafe.js';

export class RealDemoPlaybackStatusRepository implements DemoPlaybackStatusRepository {
  constructor(private readonly paths: Pick<DemoRuntimePaths, 'schedulerDir'>) {}

  readPlaybackStatus(): DemoPlaybackStatusReadResult {
    const sourcePath = join(this.paths.schedulerDir, 'playback-worker-status.json');
    const read = readPlaybackStatusSafe(sourcePath);
    const mapped = read.found && read.data !== null
      ? mapPlaybackStatusJson(read.data, sourcePath)
      : { selectedItem: null, status: 'waiting' as const, messages: ['Playback status reader waiting for playback-worker status output.'], sourcePath };
    return {
      selectedItem: mapped.selectedItem,
      status: mapped.status,
      sourcePath,
      messages: [...read.messages, ...mapped.messages]
    };
  }
}
