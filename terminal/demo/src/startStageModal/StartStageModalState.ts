// Defines the terminal start-stage modal model.
// Keep this file focused so future slices can stay below the 300 LOC target.

export type ManualStageKey = '1' | '2' | '3' | '4' | '5';
export type ManualStageBatchSize = 1 | 3;
export type ManualStageId = 'download' | 'index' | 'gps_parser' | 'geocode' | 'enqueue_playback';
export type ManualStageRowStatus = 'disabled' | 'ready' | 'selected' | 'planned' | 'blocked' | 'passed' | 'failed';

export interface StartStageModalRow {
  key: ManualStageKey;
  stageId: ManualStageId;
  label: string;
  enabled: boolean;
  batchSize: ManualStageBatchSize;
  status: ManualStageRowStatus;
  action: string;
}

export interface StartStageModalState {
  elementId: 'start_stage_modal';
  isOpen: boolean;
  rows: StartStageModalRow[];
  lastMessage: string;
}

export const manualStageBatchSizes: readonly ManualStageBatchSize[] = [1, 3];

export function createStartStageModalState(isOpen = false): StartStageModalState {
  return {
    elementId: 'start_stage_modal',
    isOpen,
    rows: [
      buildRow('1', 'download', 'Download', false, 'Disabled for now; does not start downloads.'),
      buildRow('2', 'index', 'Index', true, 'Start the Index stage manually through the shared worker path.'),
      buildRow('3', 'gps_parser', 'GPS Parser', true, 'Start the GPS Parser stage manually through the shared worker path.'),
      buildRow('4', 'geocode', 'Geocode', true, 'Start the Geocode stage manually through the shared worker path.'),
      buildRow('5', 'enqueue_playback', 'Enqueue for Playback', true, 'Start enqueue-for-playback through the shared worker path.')
    ],
    lastMessage: isOpen ? 'start_stage_modal is open; choose 1-5.' : 'Press S to open start_stage_modal.'
  };
}

export function cloneStartStageModalState(state: StartStageModalState): StartStageModalState {
  return { ...state, rows: state.rows.map((row) => ({ ...row })) };
}

export function openStartStageModal(state: StartStageModalState): StartStageModalState {
  return { ...cloneStartStageModalState(state), isOpen: true, lastMessage: 'start_stage_modal opened. Key 1 is disabled; keys 2-5 are staged for worker-path wiring.' };
}

export function handleStartStageModalKey(state: StartStageModalState, key: ManualStageKey): { state: StartStageModalState; messages: string[] } {
  const next = cloneStartStageModalState(state);
  const row = next.rows.find((candidate) => candidate.key === key);
  if (!next.isOpen || !row) return { state: next, messages: [] };

  next.rows = next.rows.map((candidate) => ({ ...candidate, status: candidate.enabled ? candidate.status : 'disabled' }));
  const selected = next.rows.find((candidate) => candidate.key === key);
  if (!selected?.enabled) {
    next.lastMessage = 'Download manual start is visible but disabled for now.';
    return { state: next, messages: [`start_stage_modal: key ${key} Download disabled; no worker path called.`] };
  }

  selected.status = 'selected';
  next.lastMessage = `${selected.label} selected with batch_size=${selected.batchSize}; preparing shared worker-path plan.`;
  return { state: next, messages: [`start_stage_modal: key ${key} selected ${selected.label}; batch_size=${selected.batchSize}; shared worker-path plan requested.`] };
}

export function toggleStartStageRowBatchSize(state: StartStageModalState, key: ManualStageKey): StartStageModalState {
  const next = cloneStartStageModalState(state);
  next.rows = next.rows.map((row) => row.key === key ? { ...row, batchSize: row.batchSize === 1 ? 3 : 1 } : { ...row });
  const row = next.rows.find((candidate) => candidate.key === key);
  next.lastMessage = row ? `${row.label} batch_size=${row.batchSize}` : next.lastMessage;
  return next;
}


export function markStartStageModalRowStatus(
  state: StartStageModalState,
  key: ManualStageKey,
  status: ManualStageRowStatus,
  message: string
): StartStageModalState {
  const next = cloneStartStageModalState(state);
  next.rows = next.rows.map((row) => row.key === key ? { ...row, status } : row);
  next.lastMessage = message;
  return next;
}

function buildRow(key: ManualStageKey, stageId: ManualStageId, label: string, enabled: boolean, action: string): StartStageModalRow {
  return { key, stageId, label, enabled, batchSize: 1, status: enabled ? 'ready' : 'disabled', action };
}
