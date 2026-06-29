// Provides the mock storyboard frames for terminal Demo Mode visual testing.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { createInitialMockState } from '../state/createInitialMockState.js';
import type { DemoTerminalState, MediaRow, StagePanelRow, WorkerPanelRow } from '../state/DemoTerminalState.js';

export type QStoryboardStepId =
  | 'q_pressed'
  | 'run_batch_pressed'
  | 'queue_target_pressed'
  | 'row1_index_running'
  | 'row1_gps_running'
  | 'row1_geocode_running'
  | 'row1_queue_running'
  | 'row2_index_running'
  | 'row2_gps_missing'
  | 'row2_not_eligible'
  | 'row3_index_running'
  | 'row3_gps_running'
  | 'row3_geocode_running'
  | 'row3_queue_running'
  | 'row4_index_running'
  | 'row4_gps_invalid'
  | 'row4_not_eligible'
  | 'row5_index_running'
  | 'row5_gps_running'
  | 'row5_geocode_running'
  | 'row5_queue_running'
  | 'finished';

export const qStoryboardStepIds: QStoryboardStepId[] = [
  'q_pressed',
  'run_batch_pressed',
  'queue_target_pressed',
  'row1_index_running',
  'row1_gps_running',
  'row1_geocode_running',
  'row1_queue_running',
  'row2_index_running',
  'row2_gps_missing',
  'row2_not_eligible',
  'row3_index_running',
  'row3_gps_running',
  'row3_geocode_running',
  'row3_queue_running',
  'row4_index_running',
  'row4_gps_invalid',
  'row4_not_eligible',
  'row5_index_running',
  'row5_gps_running',
  'row5_geocode_running',
  'row5_queue_running',
  'finished'
];

interface MockOutcome {
  rowNumber: number;
  gps: MediaRow['gps'];
  geocode: MediaRow['geocode'];
  queue: MediaRow['queue'];
  address: string;
  reason: string;
}

const outcomes: Record<number, MockOutcome> = {
  1: {
    rowNumber: 1,
    gps: 'valid',
    geocode: 'resolved',
    queue: 'enqueued',
    address: 'Demo Address, Tartu, Estonia',
    reason: 'valid GPS and address resolved'
  },
  2: {
    rowNumber: 2,
    gps: 'missing',
    geocode: 'skipped',
    queue: 'not eligible',
    address: '',
    reason: 'missing GPS; no address string; not eligible for playback'
  },
  3: {
    rowNumber: 3,
    gps: 'valid',
    geocode: 'resolved',
    queue: 'enqueued',
    address: 'Demo Address, Parnu, Estonia',
    reason: 'valid GPS and address resolved'
  },
  4: {
    rowNumber: 4,
    gps: 'invalid',
    geocode: 'skipped',
    queue: 'not eligible',
    address: '',
    reason: 'invalid GPS; no address string; not eligible for playback'
  },
  5: {
    rowNumber: 5,
    gps: 'valid',
    geocode: 'resolved',
    queue: 'enqueued',
    address: 'Demo Address, Voru Forest, Estonia',
    reason: 'valid GPS and address resolved'
  }
};

export function buildQStoryboardFrame(stepIndex: number, manualMode = false): DemoTerminalState {
  const boundedIndex = Math.max(0, Math.min(stepIndex, qStoryboardStepIds.length - 1));
  let state = createInitialMockState();
  for (let index = 0; index <= boundedIndex; index += 1) {
    state = applyQStoryboardStep(state, qStoryboardStepIds[index]!);
  }
  if (manualMode) {
    state.currentRun = {
      ...state.currentRun,
      lines: [
        `Manual storyboard mode: step ${boundedIndex + 1}/${qStoryboardStepIds.length}. Use RIGHT to advance, LEFT to go back, Q to auto-run.`,
        '',
        ...state.currentRun.lines
      ]
    };
  }
  return state;
}

export function buildQStoryboardFrames(): DemoTerminalState[] {
  return qStoryboardStepIds.map((_, index) => buildQStoryboardFrame(index, false));
}

export function applyQStoryboardStep(input: DemoTerminalState, stepId: QStoryboardStepId): DemoTerminalState {
  const state = cloneState(input);
  resetActiveMarkers(state);

  switch (stepId) {
    case 'q_pressed':
      markAction(state, 'Q', 'active');
      state.currentRun.lines = [
        'Action: Q — Run 5 files -> Queue eligible media',
        'File batch: rows #1-#5',
        'Policy: enqueue only files with valid GPS and resolved address.',
        'Internal next mock press: Run 5 files'
      ];
      state.rpiWorkers = updateWorker(state.rpiWorkers, 'Regular state worker', {
        status: 'Waiting',
        lastCalled: 'Never',
        lastEvent: 'Q pressed; waiting for mock run-batch press.'
      });
      updatePlaybackAvailability(state);
      return state;

    case 'run_batch_pressed':
      markAction(state, 'Q', 'done');
      state.currentRun.lines = [
        'Action: Q — Run 5 files -> Queue eligible media',
        'File batch: rows #1-#5',
        '',
        '-> [Run 5 files] [ACTIVE]',
        '   Target stage: Queue eligible files pending',
        '',
        'Stage chain preview per file:',
        '   Index -> GPS parser -> Geocode if valid -> Queue if address exists'
      ];
      state.rpiWorkers = updateWorker(state.rpiWorkers, 'Regular state worker', {
        status: 'Waiting',
        lastCalled: 'Never',
        lastEvent: 'run-five-files requested'
      });
      updatePlaybackAvailability(state);
      return state;

    case 'queue_target_pressed':
      markAction(state, 'Q', 'done');
      state.currentRun.lines = [
        'Action: Q — Run 5 files -> Queue eligible media',
        'File batch: rows #1-#5',
        '',
        '**[Run 5 files] [DONE]**',
        '-> [Target stage: Queue eligible files] [ACTIVE]',
        '',
        'Expanded stage chain:',
        '   Index       waiting',
        '   GPS parser  waiting',
        '   Geocode     waits for valid GPS',
        '   Queue       waits for resolved address'
      ];
      state.rpiWorkers = updateWorker(state.rpiWorkers, 'Regular state worker', {
        status: 'Waiting',
        lastCalled: 'Never',
        lastEvent: 'target stage selected: queue eligible files'
      });
      updatePlaybackAvailability(state);
      return state;

    case 'row1_index_running':
      return applyIndexRunning(state, 1);
    case 'row1_gps_running':
      return applyGpsRunning(state, 1);
    case 'row1_geocode_running':
      return applyGeocodeRunning(state, 1);
    case 'row1_queue_running':
      return applyQueueRunning(state, 1);

    case 'row2_index_running':
      return applyIndexRunning(state, 2);
    case 'row2_gps_missing':
      return applyGpsProblem(state, 2, 'missing GPS detected');
    case 'row2_not_eligible':
      return applyNotEligible(state, 2);

    case 'row3_index_running':
      return applyIndexRunning(state, 3);
    case 'row3_gps_running':
      return applyGpsRunning(state, 3);
    case 'row3_geocode_running':
      return applyGeocodeRunning(state, 3);
    case 'row3_queue_running':
      return applyQueueRunning(state, 3);

    case 'row4_index_running':
      return applyIndexRunning(state, 4);
    case 'row4_gps_invalid':
      return applyGpsProblem(state, 4, 'invalid GPS detected');
    case 'row4_not_eligible':
      return applyNotEligible(state, 4);

    case 'row5_index_running':
      return applyIndexRunning(state, 5);
    case 'row5_gps_running':
      return applyGpsRunning(state, 5);
    case 'row5_geocode_running':
      return applyGeocodeRunning(state, 5);
    case 'row5_queue_running':
      return applyQueueRunning(state, 5);

    case 'finished':
      markAction(state, 'Q', 'done');
      state.currentRun.lines = [
        'Action: Q — Run 5 files -> Queue eligible media',
        'Result: Finished',
        'File batch: rows #1-#5',
        '',
        '**[Run 5 files] [DONE]**',
        '**[Target stage: Queue eligible files] [DONE]**',
        '',
        'Batch result:',
        '**Rows #1, #3, #5 [DONE] enqueued for playback**',
        '**Row #2 [DONE] skipped — missing GPS**',
        '**Row #4 [DONE] skipped — invalid GPS**',
        '',
        'Playback queue: 3 files ready',
        'Errors: row #2 missing GPS; row #4 invalid GPS'
      ];
      state.rpiStages = updateStage(state.rpiStages, 'Index', {
        status: 'Finished',
        details: 'processed=5'
      });
      state.rpiStages = updateStage(state.rpiStages, 'GPS parser', {
        status: 'Finished',
        details: 'gps_valid=3 gps_missing=1 gps_invalid=1'
      });
      state.rpiStages = updateStage(state.rpiStages, 'Geocode', {
        status: 'Finished',
        details: 'resolved=3 skipped=2 failed=0'
      });
      state.rpiStages = updateStage(state.rpiStages, 'Queue', {
        status: 'Finished',
        details: 'enqueued=3 not_eligible=2'
      });
      state.rpiWorkers = updateWorker(state.rpiWorkers, 'Regular state worker', {
        status: 'Finished',
        lastCalled: 'mock-now',
        lastEvent: 'mock batch finished; queued=3 skipped=2'
      });
      state.rpiWorkers = updateWorker(state.rpiWorkers, 'Playback worker', {
        status: 'Waiting',
        lastCalled: 'Never',
        lastEvent: '3 queued media ready; playback not started.'
      });
      state.rpiWorkers = updateWorker(state.rpiWorkers, 'On-off worker', {
        status: 'Disabled',
        lastCalled: 'Never',
        lastEvent: 'Not yet implemented.'
      });
      updatePlaybackAvailability(state);
      return state;
  }
}

function applyIndexRunning(state: DemoTerminalState, rowNumber: number): DemoTerminalState {
  markAction(state, 'Q', 'done');
  const media = getMedia(state, rowNumber);
  state.currentRun.lines = [
    'Action: Q — Run 5 files -> Queue eligible media',
    `Processing row #${rowNumber} ${media.fileName}`,
    '',
    '**[Run 5 files] [DONE]**',
    '**[Target stage: Queue eligible files] [DONE]**',
    '',
    'Stage chain:',
    '-> Index       [ACTIVE] running',
    '   GPS parser  waiting',
    '   Geocode     waiting for GPS result',
    '   Queue       waiting for address'
  ];
  state.mediaRows = updateMedia(state.mediaRows, rowNumber, { indexed: 'yes' });
  state.rpiStages = updateStage(state.rpiStages, 'Index', {
    status: 'Started',
    details: `processing row #${rowNumber}`
  });
  state.rpiWorkers = updateWorker(state.rpiWorkers, 'Regular state worker', {
    status: 'Started',
    lastCalled: 'mock-now',
    lastEvent: `index started for row #${rowNumber}`
  });
  updatePlaybackAvailability(state);
  return state;
}

function applyGpsRunning(state: DemoTerminalState, rowNumber: number): DemoTerminalState {
  markAction(state, 'Q', 'done');
  const media = getMedia(state, rowNumber);
  const outcome = getOutcome(rowNumber);
  state.currentRun.lines = [
    'Action: Q — Run 5 files -> Queue eligible media',
    `Processing row #${rowNumber} ${media.fileName}`,
    '',
    '**Index       [DONE] finished**',
    '-> GPS parser  [ACTIVE] running',
    '   Geocode     waiting',
    '   Queue       waiting'
  ];
  state.mediaRows = updateMedia(state.mediaRows, rowNumber, { indexed: 'yes', gps: outcome.gps });
  state.rpiStages = updateStage(state.rpiStages, 'Index', {
    status: 'Finished',
    details: `processed through row #${rowNumber}`
  });
  state.rpiStages = updateStage(state.rpiStages, 'GPS parser', {
    status: 'Started',
    details: `parsing row #${rowNumber}`
  });
  state.rpiWorkers = updateWorker(state.rpiWorkers, 'Regular state worker', {
    status: 'Started',
    lastCalled: 'mock-now',
    lastEvent: `GPS parser started for row #${rowNumber}`
  });
  updatePlaybackAvailability(state);
  return state;
}

function applyGpsProblem(state: DemoTerminalState, rowNumber: number, problem: string): DemoTerminalState {
  markAction(state, 'Q', 'done');
  const media = getMedia(state, rowNumber);
  const outcome = getOutcome(rowNumber);
  state.currentRun.lines = [
    'Action: Q — Run 5 files -> Queue eligible media',
    `Processing row #${rowNumber} ${media.fileName}`,
    '',
    '**Index       [DONE] finished**',
    `-> GPS parser  [ACTIVE] ${problem}`,
    '   Geocode     skipped — no usable GPS/address',
    '   Queue       not eligible',
    '',
    `Error: row #${rowNumber} ${outcome.reason}`
  ];
  state.mediaRows = updateMedia(state.mediaRows, rowNumber, {
    indexed: 'yes',
    gps: outcome.gps,
    geocode: 'skipped',
    queue: 'not eligible',
    address: ''
  });
  state.rpiStages = updateStage(state.rpiStages, 'GPS parser', {
    status: 'Error',
    details: `row #${rowNumber}: ${problem}`
  });
  state.rpiStages = updateStage(state.rpiStages, 'Geocode', {
    status: 'Finished',
    details: `row #${rowNumber} skipped`
  });
  state.rpiStages = updateStage(state.rpiStages, 'Queue', {
    status: 'Finished',
    details: `row #${rowNumber} not eligible`
  });
  state.rpiWorkers = updateWorker(state.rpiWorkers, 'Regular state worker', {
    status: 'Error',
    lastCalled: 'mock-now',
    lastEvent: `ERROR row #${rowNumber}: ${outcome.reason}`
  });
  updatePlaybackAvailability(state);
  return state;
}

function applyNotEligible(state: DemoTerminalState, rowNumber: number): DemoTerminalState {
  markAction(state, 'Q', 'done');
  const media = getMedia(state, rowNumber);
  const outcome = getOutcome(rowNumber);
  state.currentRun.lines = [
    'Action: Q — Run 5 files -> Queue eligible media',
    `Result for row #${rowNumber}: Not eligible`,
    `File: ${media.fileName}`,
    '',
    '**Index       [DONE] finished**',
    `**GPS parser  [DONE] ${outcome.gps} GPS**`,
    '**Geocode     [DONE] skipped — no address**',
    '**Queue       [DONE] not eligible**',
    '',
    `Error logged: ${outcome.reason}`
  ];
  state.mediaRows = updateMedia(state.mediaRows, rowNumber, {
    indexed: 'yes',
    gps: outcome.gps,
    geocode: 'skipped',
    queue: 'not eligible',
    address: ''
  });
  state.rpiStages = updateStage(state.rpiStages, 'Queue', {
    status: 'Finished',
    details: `row #${rowNumber} not eligible`
  });
  state.rpiWorkers = updateWorker(state.rpiWorkers, 'Regular state worker', {
    status: 'Finished',
    lastCalled: 'mock-now',
    lastEvent: `row #${rowNumber} skipped; ${outcome.gps} GPS`
  });
  updatePlaybackAvailability(state);
  return state;
}

function applyGeocodeRunning(state: DemoTerminalState, rowNumber: number): DemoTerminalState {
  markAction(state, 'Q', 'done');
  const media = getMedia(state, rowNumber);
  const outcome = getOutcome(rowNumber);
  state.currentRun.lines = [
    'Action: Q — Run 5 files -> Queue eligible media',
    `Processing row #${rowNumber} ${media.fileName}`,
    '',
    '**Index       [DONE] finished**',
    '**GPS parser  [DONE] valid GPS found**',
    '-> Geocode     [ACTIVE] running',
    '   Queue       waiting for resolved address'
  ];
  state.mediaRows = updateMedia(state.mediaRows, rowNumber, {
    indexed: 'yes',
    gps: outcome.gps,
    geocode: 'resolved',
    address: outcome.address
  });
  state.rpiStages = updateStage(state.rpiStages, 'GPS parser', {
    status: 'Finished',
    details: `row #${rowNumber} valid GPS`
  });
  state.rpiStages = updateStage(state.rpiStages, 'Geocode', {
    status: 'Started',
    details: `resolving row #${rowNumber}`
  });
  state.rpiWorkers = updateWorker(state.rpiWorkers, 'Regular state worker', {
    status: 'Started',
    lastCalled: 'mock-now',
    lastEvent: `geocode started for row #${rowNumber}`
  });
  updatePlaybackAvailability(state);
  return state;
}

function applyQueueRunning(state: DemoTerminalState, rowNumber: number): DemoTerminalState {
  markAction(state, 'Q', 'done');
  const media = getMedia(state, rowNumber);
  const outcome = getOutcome(rowNumber);
  state.currentRun.lines = [
    'Action: Q — Run 5 files -> Queue eligible media',
    `Processing row #${rowNumber} ${media.fileName}`,
    '',
    '**Index       [DONE] finished**',
    '**GPS parser  [DONE] valid GPS found**',
    '**Geocode     [DONE] address resolved**',
    '-> Queue       [ACTIVE] enqueueing for playback',
    '',
    `Address: ${outcome.address}`
  ];
  state.mediaRows = updateMedia(state.mediaRows, rowNumber, {
    indexed: 'yes',
    gps: 'valid',
    geocode: 'resolved',
    queue: 'enqueued',
    address: outcome.address
  });
  state.rpiStages = updateStage(state.rpiStages, 'Geocode', {
    status: 'Finished',
    details: `row #${rowNumber} resolved`
  });
  state.rpiStages = updateStage(state.rpiStages, 'Queue', {
    status: 'Started',
    details: `enqueueing row #${rowNumber}`
  });
  state.rpiWorkers = updateWorker(state.rpiWorkers, 'Regular state worker', {
    status: 'Started',
    lastCalled: 'mock-now',
    lastEvent: `queue prepare started for row #${rowNumber}`
  });
  updatePlaybackAvailability(state);
  return state;
}

function getOutcome(rowNumber: number): MockOutcome {
  const outcome = outcomes[rowNumber];
  if (!outcome) throw new Error(`Unknown mock outcome row #${rowNumber}`);
  return outcome;
}

function getMedia(state: DemoTerminalState, rowNumber: number): MediaRow {
  const media = state.mediaRows.find((row) => row.rowNumber === rowNumber);
  if (!media) throw new Error(`Unknown mock media row #${rowNumber}`);
  return media;
}

function updatePlaybackAvailability(state: DemoTerminalState): void {
  const queuedCount = state.mediaRows.filter((row) => row.queue === 'enqueued').length;
  const enabled = queuedCount > 0;
  state.playback = {
    ...state.playback,
    runPlaybackEnabled: enabled,
    info: enabled
      ? `Ready: ${queuedCount} demo queue item${queuedCount === 1 ? '' : 's'} available.`
      : 'At least one file must be enqueued before playback can run.'
  };
  state.actions = state.actions.map((action) =>
    action.key === 'P'
      ? {
          ...action,
          enabled,
          info: enabled
            ? `Ready: ${queuedCount} demo queue item${queuedCount === 1 ? '' : 's'} available.`
            : 'Disabled: at least one file must be enqueued before playback can run.'
        }
      : action
  );
}

function updateMedia(rows: MediaRow[], rowNumber: number, update: Partial<MediaRow>): MediaRow[] {
  return rows.map((row) => (row.rowNumber === rowNumber ? { ...row, ...update } : row));
}

function cloneState(state: DemoTerminalState): DemoTerminalState {
  return {
    ...state,
    runtimeBoundary: { ...state.runtimeBoundary, pathMessages: [...state.runtimeBoundary.pathMessages] },
    mediaRows: state.mediaRows.map((row) => ({ ...row })),
    actions: state.actions.map((action) => ({ ...action })),
    currentRun: { ...state.currentRun, lines: [...state.currentRun.lines] },
    rpiStages: state.rpiStages.map((stage) => ({ ...stage })),
    rpiWorkers: state.rpiWorkers.map((worker) => ({ ...worker })),
    playback: { ...state.playback },
    screenOnOff: { ...state.screenOnOff }
  };
}

function resetActiveMarkers(state: DemoTerminalState): void {
  state.actions = state.actions.map((action) => ({ ...action, active: false }));
}

function markAction(state: DemoTerminalState, key: string, marker: 'active' | 'done'): void {
  state.actions = state.actions.map((action) => {
    if (action.key !== key) return action;
    return {
      ...action,
      active: marker === 'active',
      done: marker === 'done' ? true : action.done
    };
  });
}

function updateStage(
  rows: StagePanelRow[],
  name: StagePanelRow['name'],
  update: Pick<StagePanelRow, 'status' | 'details'>
): StagePanelRow[] {
  return rows.map((row) => (row.name === name ? { ...row, ...update } : row));
}

function updateWorker(
  rows: WorkerPanelRow[],
  name: WorkerPanelRow['name'],
  update: Pick<WorkerPanelRow, 'status' | 'lastCalled' | 'lastEvent'>
): WorkerPanelRow[] {
  return rows.map((row) => (row.name === name ? { ...row, ...update } : row));
}
