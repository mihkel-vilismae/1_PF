// Reads real-demo playback queue output from DEMO_QUEUE_OUTPUT_PATH.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { DemoRuntimePaths } from '../config/runtimeTypes.js';
import type { DemoQueueReadResult, DemoQueueRepository } from './DemoQueueRepository.js';
import { mapQueueJsonToRecords } from './mapQueueToPlaybackRows.js';
import { readQueueFileSafe } from './readQueueFileSafe.js';

export class RealDemoQueueRepository implements DemoQueueRepository {
  constructor(private readonly paths: Pick<DemoRuntimePaths, 'queueOutputPath'>) {}

  readDemoQueue(): DemoQueueReadResult {
    const read = readQueueFileSafe(this.paths.queueOutputPath);
    const mapped = read.found && read.data !== null
      ? mapQueueJsonToRecords(read.data)
      : { rows: [], messages: ['Queue reader waiting for DEMO queue output.'] };
    return {
      rows: mapped.rows,
      messages: [...read.messages, ...mapped.messages],
      sourcePath: this.paths.queueOutputPath
    };
  }
}
