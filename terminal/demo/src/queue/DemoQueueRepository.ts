// Defines real-demo playback queue repository contracts.
// Keep this file focused so future slices can stay below the 300 LOC target.

export interface DemoQueueRecord {
  queueId: string;
  rowNumber: number | null;
  fileName: string;
  relativePath: string;
  type: 'image' | 'video';
  address: string;
  status: string;
  source: string;
}

export interface DemoQueueReadResult {
  rows: DemoQueueRecord[];
  messages: string[];
  sourcePath: string;
}

export interface DemoQueueRepository {
  readDemoQueue(): DemoQueueReadResult;
}
