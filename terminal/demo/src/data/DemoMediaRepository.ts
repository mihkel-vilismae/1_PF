// Provides terminal Demo Mode media rows from mock or real-demo sources.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { MediaRow } from '../state/DemoTerminalState.js';

export interface DemoMediaDiscoveryResult {
  rows: MediaRow[];
  messages: string[];
  sourceDir: string;
}

export interface DemoMediaRepository {
  listDemoMediaRows(): DemoMediaDiscoveryResult;
}
