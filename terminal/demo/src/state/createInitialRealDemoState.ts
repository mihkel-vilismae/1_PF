// Defines terminal Demo Mode state and initial state factories.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ActionItemState, DemoTerminalState, MediaRow, StagePanelRow, WorkerPanelRow, SupportedBatchSize, PlaybackQueueRow, TerminalMouseHitbox } from './DemoTerminalState.js';
import { createStartStageModalState, type StartStageModalState } from '../startStageModal/StartStageModalState.js';
import type { RuntimeBoundaryState } from '../config/runtimeTypes.js';
import type { DemoTruthReadResult } from '../truth/DemoTruthRepository.js';
import type { DemoPlaybackStatusReadResult } from '../playback/DemoPlaybackStatusRepository.js';

const realDemoActions: ActionItemState[] = [
  {
    key: 'S',
    label: 'Open start_stage_modal',
    enabled: true,
    info: 'Shows manual stage rows with independent batch sizes. Download is disabled for now.',
    active: false,
    done: false
  },
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
    label: 'Run DB image playback',
    enabled: false,
    info: 'Enabled when DEMO_DB_PATH has READY slideshow_queue image rows.',
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
  queueMessages: string[] = [],
  playbackStatus: DemoPlaybackStatusReadResult = { selectedItem: null, status: 'waiting', messages: [], sourcePath: '' },
  logOptions: { collapsed?: boolean; focused?: boolean; scrollOffset?: number; extraLogLines?: string[] } = {},
  screenOptions: { idleSeconds?: number; powerState?: 'guarded' | 'on' | 'off' | 'unknown'; latestStatus?: string; actionGuard?: string } = {},
  startStageModal: StartStageModalState = createStartStageModalState(false)
): DemoTerminalState {
  const version = readVersion();
  const statusText = boundary.readinessStatus.toUpperCase();
  const selectedCount = mediaRows.length;
  const validCount = mediaRows.filter((row) => row.gps === 'valid').length;
  const problemCount = mediaRows.filter((row) => row.gps === 'missing' || row.gps === 'invalid' || row.gps === 'not parsed').length;
  const queueCount = playbackQueueRows.length;
  const qCompleted = dryRunPlanLines.some((line) => /Q finished|Q-created DEMO DB queue status|Q action event written/i.test(line));
  const qActive = dryRunPlanLines.some((line) => /Ready to run real-demo Q|Q route:|Stage snapshot:/i.test(line)) && !qCompleted;
  const partitioned = partitionCurrentAndLogLines([
    `Real Demo Mode v${version} operator path is installed.`,
    'This screen resolves DEMO paths, reads generated demo media/truth, and P uses DEMO_DB_PATH real playback tables.',
    'W toggles selected batch size. Q uses the selected batch size. P selects a READY slideshow_queue row and renders windowed image playback.',
    'No cron is used.',
    '',
    `Adapter: ${boundary.adapterMode}`,
    `Runtime mode: ${boundary.runtimeMode}`,
    `Readiness: ${boundary.readinessStatus}`,
    `Selected batch_size: ${selectedBatchSize}`,
    `Media rows selected: ${selectedCount} (${validCount} valid, ${problemCount} problem/invalid)`,
    `Real demo playback queue rows: ${queueCount}`,
    `Playback selected status: ${playbackStatus.status}`,
    `Playback selected item: ${playbackStatus.selectedItem?.fileName ?? 'none'}`,
    `Playback status source: ${playbackStatus.sourcePath || 'not configured'}`,
    ...dryRunPlanLines.map((line) => `Command plan: ${line}`),
    ...mediaRows.map((row) => `Selected row #${row.rowNumber}: ${row.relativePath ?? row.fileName} gps=${row.gps}`),
    ...mediaMessages.map((message) => `Media discovery: ${message}`),
    ...truth.messages.map((message) => `Truth read: ${message}`),
    ...queueMessages.map((message) => `Queue read: ${message}`),
    ...playbackStatus.messages.map((message) => `Playback status read: ${message}`),
    ...boundary.pathMessages.map((message) => `Path check: ${message}`),
    ...(logOptions.extraLogLines ?? [])
  ]);

  return {
    version,
    runtimeMode: 'demo',
    dataMode: 'real_demo_truth',
    runtimeBoundary: boundary,
    banner: `PHOTOFRAME REAL DEMO TERMINAL v${version}`,
    warning: `Real Demo Mode v${version} operator guard pack: boundary is ${statusText}; DB playback button reads DEMO_DB_PATH real tables.`,
    selectedBatchSize,
    startStageModal,
    mediaRows,
    playbackQueueRows: playbackQueueRows.map((row) => ({ ...row })),
    actions: realDemoActions.map((action) => {
      if (action.key === 'P') return {
        ...action,
        enabled: queueCount > 0,
        info: queueCount > 0 ? `Ready: ${queueCount} real demo queue item${queueCount === 1 ? '' : 's'} available.` : 'Disabled: DEMO queue is empty or missing.'
      };
      if (action.key === 'Q') return { ...action, active: qActive, done: qCompleted };
      return { ...action };
    }),
    currentRun: {
      title: 'CURRENT RUN',
      lines: partitioned.currentLines
    },
    realTimeLog: {
      title: 'AREA A REAL-TIME LOG',
      lines: partitioned.logLines,
      collapsed: logOptions.collapsed ?? false,
      focused: logOptions.focused ?? false,
      scrollOffset: logOptions.scrollOffset ?? 0,
      visibleRows: 14,
      hitboxes: buildRealDemoHitboxes()
    },
    rpiStages: truth.stages.map((stage) => ({ ...stage })),
    rpiWorkers: truth.workers.map((worker) => ({ ...worker })),
    playback: {
      runPlaybackEnabled: queueCount > 0,
      info: queueCount > 0 ? `Ready: ${queueCount} real demo queue item${queueCount === 1 ? '' : 's'} available.` : 'At least one real demo queue item is required before playback can run.',
      imageDurationSeconds: playbackStatus.selectedItem?.durationSeconds === 1 || playbackStatus.selectedItem?.durationSeconds === 10 ? playbackStatus.selectedItem.durationSeconds : 5,
      selectedItem: playbackStatus.selectedItem ? { ...playbackStatus.selectedItem } : null,
      selectedStatus: playbackStatus.status,
      selectedSourcePath: playbackStatus.sourcePath,
      selectedMessages: [...playbackStatus.messages],
      fullScreenEnabled: false,
      fullScreenInfo: 'Not yet implemented.'
    },
    screenOnOff: {
      keyboardEnabled: true,
      mouseEnabled: true,
      pirSensorEnabled: false,
      idleSeconds: screenOptions.idleSeconds ?? 0,
      powerState: screenOptions.powerState ?? 'guarded',
      latestStatus: screenOptions.latestStatus ?? 'waiting for keyboard/mouse activity',
      actionGuard: screenOptions.actionGuard ?? 'screen power command guarded; no real screen-off call by default',
      info: 'Keyboard/mouse inactivity timer is active in DEMO panel; platform power action is guarded.'
    }
  };
}


function partitionCurrentAndLogLines(lines: string[]): { currentLines: string[]; logLines: string[] } {
  const currentLines: string[] = [];
  const logLines: string[] = [];
  for (const line of lines) {
    if (isDiagnosticLogLine(line)) {
      logLines.push(line);
    } else {
      currentLines.push(line);
    }
  }
  return { currentLines, logLines };
}

function isDiagnosticLogLine(line: string): boolean {
  return /^(Media discovery|Truth read|Queue read|Playback status read|Path check|Mouse hitbox|Mouse wheel|Log panel|Q DB queue|Q truth\/status):/i.test(line)
    || /^Selected row #/i.test(line)
    || /^DB image playback: (playback_contract|stage6_select_current|playback_asset_media_path|P pressed:|playback status source|Wrote windowed viewer)/i.test(line);
}

function buildRealDemoHitboxes(): TerminalMouseHitbox[] {
  return [
    { id: 'area-a-collapse-toggle', label: 'Area A [-] collapse/expand toggle', x1: 135, y1: 18, x2: 155, y2: 19 },
    { id: 'area-a-log-panel', label: 'Area A realtime log panel body', x1: 135, y1: 18, x2: 220, y2: 44 },
    { id: 'area-b-command-plan', label: 'Area B command/action plan panel', x1: 70, y1: 1, x2: 134, y2: 44 },
    { id: 'area-c-preview', label: 'Area C preview/playback panel', x1: 1, y1: 18, x2: 69, y2: 44 }
  ];
}
