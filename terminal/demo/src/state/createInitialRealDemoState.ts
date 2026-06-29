// Defines terminal Demo Mode state and initial state factories.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ActionItemState, DemoTerminalState, MediaRow, StagePanelRow, WorkerPanelRow, SupportedBatchSize, PlaybackQueueRow } from './DemoTerminalState.js';
import type { RuntimeBoundaryState } from '../config/runtimeTypes.js';
import type { DemoTruthReadResult } from '../truth/DemoTruthRepository.js';

const realDemoActions: ActionItemState[] = [
  {
    key: 'Q',
    label: 'Run selected demo batch',
    enabled: true,
    info: 'Runs selected real-demo batch through guarded manual worker path; no cron.',
    active: false,
    done: false
  },
  {
    key: 'W',
    label: 'Toggle batch size',
    enabled: true,
    info: 'Toggles selected batch size 1 <-> 5; does not run workers.',
    active: false,
    done: false
  },
  {
    key: 'P',
    label: 'Run Playback',
    enabled: false,
    info: 'Enabled when DEMO_QUEUE_OUTPUT_PATH has queued items.',
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
  dryRunPlanLines: string[] = [],
  selectedBatchSize: SupportedBatchSize = 1,
  playbackQueueRows: PlaybackQueueRow[] = [],
  queueMessages: string[] = []
): DemoTerminalState {
  const version = readVersion();
  const statusText = boundary.readinessStatus.toUpperCase();
  const selectedCount = mediaRows.length;
  const validCount = mediaRows.filter((row) => row.gps === 'valid').length;
  const problemCount = mediaRows.filter((row) => row.gps === 'missing' || row.gps === 'invalid' || row.gps === 'not parsed').length;
  const queueCount = playbackQueueRows.length;

  return {
    version,
    runtimeMode: 'demo',
    dataMode: 'real_demo_truth',
    runtimeBoundary: boundary,
    banner: `PHOTOFRAME REAL DEMO TERMINAL v${version}`,
    warning: `Group 5A real queue reader + guarded Q/W orchestration: boundary is ${statusText}; W toggles batch size and Q uses the selected value.`,
    selectedBatchSize,
    mediaRows,
    playbackQueueRows: playbackQueueRows.map((row) => ({ ...row })),
    actions: realDemoActions.map((action) => action.key === 'P' ? {
      ...action,
      enabled: queueCount > 0,
      info: queueCount > 0 ? `Ready: ${queueCount} real demo queue item${queueCount === 1 ? '' : 's'} available.` : 'Disabled: DEMO queue is empty or missing.'
    } : { ...action }),
    currentRun: {
      title: 'CURRENT RUN',
      lines: [
        'Real-demo beeline Group 5A is installed.',
        'This screen resolves DEMO paths, reads generated demo media/truth/queue, and can run guarded manual Q orchestration.',
        'W toggles selected batch size. Q uses the selected batch size. No cron is used.',
        '',
        `Adapter: ${boundary.adapterMode}`,
        `Runtime mode: ${boundary.runtimeMode}`,
        `Readiness: ${boundary.readinessStatus}`,
        `Selected batch_size: ${selectedBatchSize}`,
        `Media rows selected: ${selectedCount} (${validCount} valid, ${problemCount} problem/invalid)`,
        `Real demo playback queue rows: ${queueCount}`,
        ...dryRunPlanLines.map((line) => `Command plan: ${line}`),
        ...mediaRows.map((row) => `Selected row #${row.rowNumber}: ${row.relativePath ?? row.fileName} gps=${row.gps}`),
        ...mediaMessages.map((message) => `Media discovery: ${message}`),
        ...truth.messages.map((message) => `Truth read: ${message}`),
        ...queueMessages.map((message) => `Queue read: ${message}`),
        ...boundary.pathMessages.map((message) => `Path check: ${message}`)
      ]
    },
    rpiStages: truth.stages.map((stage) => ({ ...stage })),
    rpiWorkers: truth.workers.map((worker) => ({ ...worker })),
    playback: {
      runPlaybackEnabled: queueCount > 0,
      info: queueCount > 0 ? `Ready: ${queueCount} real demo queue item${queueCount === 1 ? '' : 's'} available.` : 'At least one real demo queue item is required before playback can run.',
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
