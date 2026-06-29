// Defines terminal Demo Mode state and initial state factories.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ActionItemState, DemoTerminalState, MediaRow, StagePanelRow, WorkerPanelRow } from './DemoTerminalState.js';
import type { RuntimeBoundaryState } from '../config/runtimeTypes.js';
import type { DemoTruthReadResult } from '../truth/DemoTruthRepository.js';

const realDemoActions: ActionItemState[] = [
  {
    key: 'Q',
    label: 'Run selected demo batch',
    enabled: false,
    info: 'Disabled in Group 3A: dry-run command plan only; real execution waits for PhotoFrame merge.',
    active: false,
    done: false
  },
  {
    key: 'W',
    label: 'Toggle batch size',
    enabled: false,
    info: 'Disabled in Group 3A: W toggle execution waits for Group 3B; dry-run plans show batch_size=1 and 5.',
    active: false,
    done: false
  },
  {
    key: 'P',
    label: 'Run Playback',
    enabled: false,
    info: 'Disabled: real demo queue reader is not wired yet.',
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
    label: 'Refresh real-demo media discovery',
    enabled: true,
    info: 'Re-checks demo runtime paths, generated demo media, and demo truth/status files.',
    active: false,
    done: false
  },
  {
    key: 'X',
    label: 'Exit',
    enabled: true,
    info: 'Exits the real-demo terminal scaffold.',
    active: false,
    done: false
  }
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

export function createInitialRealDemoState(
  boundary: RuntimeBoundaryState,
  mediaRows: MediaRow[] = [],
  mediaMessages: string[] = [],
  truth: DemoTruthReadResult = { stages: [], workers: [], messages: [] },
  dryRunPlanLines: string[] = []
): DemoTerminalState {
  const version = readVersion();
  const statusText = boundary.readinessStatus.toUpperCase();
  const selectedCount = mediaRows.length;
  const validCount = mediaRows.filter((row) => row.gps === 'valid').length;
  const problemCount = mediaRows.filter((row) => row.gps === 'missing' || row.gps === 'invalid' || row.gps === 'not parsed').length;

  return {
    version,
    runtimeMode: 'demo',
    dataMode: 'real_demo_truth',
    runtimeBoundary: boundary,
    banner: `PHOTOFRAME REAL DEMO TERMINAL v${version}`,
    warning: `Group 3A dry-run command planning: boundary is ${statusText}; no real workers/stages are called yet.`,
    mediaRows,
    actions: realDemoActions.map((action) => ({ ...action })),
    currentRun: {
      title: 'CURRENT RUN',
      lines: [
        'Real-demo beeline Group 3A is installed.',
        'This screen resolves DEMO paths, reads generated demo media/truth, and plans manual worker commands.',
        'Q/W/P real execution remains disabled; Group 3A is dry-run command planning only.',
        '',
        `Adapter: ${boundary.adapterMode}`,
        `Runtime mode: ${boundary.runtimeMode}`,
        `Readiness: ${boundary.readinessStatus}`,
        `Media rows selected: ${selectedCount} (${validCount} valid, ${problemCount} problem/invalid)`,
        ...dryRunPlanLines.map((line) => `Command plan: ${line}`),
        ...mediaRows.map((row) => `Selected row #${row.rowNumber}: ${row.relativePath ?? row.fileName} gps=${row.gps}`),
        ...mediaMessages.map((message) => `Media discovery: ${message}`),
        ...truth.messages.map((message) => `Truth read: ${message}`),
        ...boundary.pathMessages.map((message) => `Path check: ${message}`)
      ]
    },
    rpiStages: truth.stages.map((stage) => ({ ...stage })),
    rpiWorkers: truth.workers.map((worker) => ({ ...worker })),
    playback: {
      runPlaybackEnabled: false,
      info: 'Real demo queue reader is not wired yet; Group 3A only plans worker commands.',
      imageDurationSeconds: 5,
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
