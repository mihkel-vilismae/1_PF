// Canonical shell registry for View L log/status/truth labels.
// Keep this file focused so future slices can stay below the 300 LOC target.

export interface TerminalLogsViewEntry {
  label: string;
  path: string;
  purpose: string;
}

export const terminalLogsViewEntries: readonly TerminalLogsViewEntry[] = [
  {
    label: 'terminal-button-actions.jsonl',
    path: 'runtime_data/logs/demo/terminal-button-actions.jsonl',
    purpose: 'Terminal button/action evidence ledger.'
  },
  {
    label: 'regular-worker.truth.jsonl',
    path: 'runtime_data/v2_worker_truth/demo/regular-worker.truth.jsonl',
    purpose: 'Regular worker/stage truth events.'
  },
  {
    label: 'playback-worker.truth.jsonl',
    path: 'runtime_data/v2_worker_truth/demo/playback-worker.truth.jsonl',
    purpose: 'Playback worker truth events.'
  },
  {
    label: 'screen-worker.truth.jsonl',
    path: 'runtime_data/v2_worker_truth/demo/screen-worker.truth.jsonl',
    purpose: 'Screen worker truth events.'
  },
  {
    label: 'regular-worker.status.json',
    path: 'runtime_data/scheduler/demo/regular-worker.status.json',
    purpose: 'Latest regular worker scheduler/status snapshot.'
  },
  {
    label: 'playback-worker-status.json',
    path: 'runtime_data/scheduler/demo/playback-worker-status.json',
    purpose: 'Latest playback worker scheduler/status snapshot.'
  },
  {
    label: 'screen-on-off-worker-status.json',
    path: 'runtime_data/scheduler/demo/screen-on-off-worker-status.json',
    purpose: 'Latest screen on/off worker scheduler/status snapshot.'
  }
] as const;
