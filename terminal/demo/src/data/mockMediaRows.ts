// Provides terminal Demo Mode media rows from mock or real-demo sources.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { MediaRow } from '../state/DemoTerminalState.js';

export const mockMediaRows: MediaRow[] = [
  {
    rowNumber: 1,
    fileName: 'demo_sunset_tartu_001.jpg',
    type: 'image',
    indexed: 'no',
    gps: 'not parsed',
    geocode: 'not run',
    queue: 'not queued',
    address: ''
  },
  {
    rowNumber: 2,
    fileName: 'demo_old_bridge_002.jpg',
    type: 'image',
    indexed: 'no',
    gps: 'missing',
    geocode: 'not run',
    queue: 'not queued',
    address: ''
  },
  {
    rowNumber: 3,
    fileName: 'demo_family_clip_003.mp4',
    type: 'video',
    indexed: 'no',
    gps: 'not parsed',
    geocode: 'not run',
    queue: 'not queued',
    address: ''
  },
  {
    rowNumber: 4,
    fileName: 'demo_invalid_gps_004.jpg',
    type: 'image',
    indexed: 'no',
    gps: 'invalid',
    geocode: 'not run',
    queue: 'not queued',
    address: ''
  },
  {
    rowNumber: 5,
    fileName: 'demo_forest_walk_005.jpg',
    type: 'image',
    indexed: 'no',
    gps: 'not parsed',
    geocode: 'not run',
    queue: 'not queued',
    address: ''
  }
];
