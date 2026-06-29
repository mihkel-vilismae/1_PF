// Defines real-demo playback selected-item repository contracts.
// Keep this file focused so future slices can stay below the 300 LOC target.

export interface DemoPlaybackSelectedItem {
  id: string;
  fileName: string;
  relativePath: string;
  type: 'image' | 'video' | 'unknown';
  address: string;
  status: string;
  durationSeconds: number | null;
  source: string;
}

export interface DemoPlaybackStatusReadResult {
  selectedItem: DemoPlaybackSelectedItem | null;
  status: 'waiting' | 'selected' | 'skipped' | 'failed' | 'unknown';
  messages: string[];
  sourcePath: string;
}

export interface DemoPlaybackStatusRepository {
  readPlaybackStatus(): DemoPlaybackStatusReadResult;
}
