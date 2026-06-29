// Defines terminal Demo Mode state and initial state factories.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mockMediaRows } from '../data/mockMediaRows.js';
import { resolveDemoRuntimePaths } from '../config/demoRuntimePaths.js';
import type { ActionItemState, DemoTerminalState, StagePanelRow, WorkerPanelRow } from './DemoTerminalState.js';

const initialActions: ActionItemState[] = [
  {
    key: 'Q',
    label: 'Run 5 files -> Queue eligible',
    enabled: true,
    info: 'Processes rows #1-#5 automatically.',
    active: false,
    done: false
  },
  {
    key: 'W',
    label: 'Run 1 file -> Queue for playback',
    enabled: true,
    info: 'Uses row #1 automatically. Not part of this mock beeline.',
    active: false,
    done: false
  },
  {
    key: 'P',
    label: 'Run Playback',
    enabled: false,
    info: 'Disabled: at least one file must be enqueued before playback can run.',
    active: false,
    done: false
  },
  {
    key: 'F',
    label: 'Start full screen playback',
    enabled: false,
    info: 'Disabled: not yet implemented.',
    active: false,
    done: false
  },
  {
    key: 'R',
    label: 'Refresh mock screen',
    enabled: true,
    info: 'Re-renders the current mock state.',
    active: false,
    done: false
  },
  {
    key: 'X',
    label: 'Exit',
    enabled: true,
    info: 'Exits the terminal mock.',
    active: false,
    done: false
  }
];

const initialStages: StagePanelRow[] = [
  { name: 'Download', status: 'Idle', details: 'Generated mock files already exist.' },
  { name: 'Index', status: 'Idle', details: '' },
  { name: 'GPS parser', status: 'Idle', details: '' },
  { name: 'Geocode', status: 'Idle', details: '' },
  { name: 'Queue', status: 'Idle', details: '' }
];

const initialWorkers: WorkerPanelRow[] = [
  { name: 'Regular state worker', status: 'Waiting', lastCalled: 'Never', lastEvent: 'No mock run yet.' },
  { name: 'Playback worker', status: 'Waiting', lastCalled: 'Never', lastEvent: 'No queued media.' },
  { name: 'On-off worker', status: 'Disabled', lastCalled: 'Never', lastEvent: 'Not yet implemented.' }
];

function readVersion(): string {
  const candidates = [
    join(process.cwd(), 'VERSION'),
    join(process.cwd(), '..', '..', 'VERSION')
  ];
  try {
    const versionPath = candidates.find((candidate) => existsSync(candidate));
    return versionPath ? readFileSync(versionPath, 'utf8').trim() || '0.0.0' : '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export function createInitialMockState(): DemoTerminalState {
  const version = readVersion();
  const demoPaths = resolveDemoRuntimePaths();
  return {
    version,
    runtimeMode: 'mock-demo',
    dataMode: 'mock_state',
    runtimeBoundary: {
      adapterMode: 'mock-demo',
      runtimeMode: 'demo',
      readinessStatus: 'mock',
      repoRoot: demoPaths.repoRoot,
      dbPath: demoPaths.dbPath,
      downloadDir: demoPaths.downloadDir,
      workerTruthDir: demoPaths.workerTruthDir,
      schedulerDir: demoPaths.schedulerDir,
      logDir: demoPaths.logDir,
      runtimeOutputDir: demoPaths.runtimeOutputDir,
      queueOutputPath: demoPaths.queueOutputPath,
      pathMessages: ['Mock adapter selected: no real demo paths are read or written.'],
      sourceSummary: 'mock-demo: scripted visual state only'
    },
    banner: `PHOTOFRAME MOCK DEMO MODE v${version}`,
    warning: 'Visual mock only: no real DB, no real workers, no real truth JSONL, no cron.',
    selectedBatchSize: 1,
    mediaRows: mockMediaRows.map((row) => ({ ...row })),
    playbackQueueRows: [],
    actions: initialActions.map((action) => ({ ...action })),
    currentRun: {
      title: 'CURRENT RUN',
      lines: ['No run active. Press Q to run the scripted mock: rows #1-#5 -> queue eligible files.']
    },
    realTimeLog: {
      title: 'REAL-TIME LOG',
      lines: ['Mock adapter selected: no real runtime diagnostics are read.'],
      collapsed: false,
      focused: false,
      scrollOffset: 0,
      visibleRows: 10,
      hitboxes: []
    },
    rpiStages: initialStages.map((stage) => ({ ...stage })),
    rpiWorkers: initialWorkers.map((worker) => ({ ...worker })),
    playback: {
      runPlaybackEnabled: false,
      info: 'At least one file must be enqueued before playback can run.',
      imageDurationSeconds: 5,
      selectedItem: null,
      selectedStatus: 'waiting',
      selectedSourcePath: '',
      selectedMessages: ['Mock playback has not selected an item yet.'],
      fullScreenEnabled: false,
      fullScreenInfo: 'Not yet implemented.'
    },
    screenOnOff: {
      keyboardEnabled: false,
      mouseEnabled: false,
      pirSensorEnabled: false,
      info: 'Not yet implemented.'
    }
  };
}
