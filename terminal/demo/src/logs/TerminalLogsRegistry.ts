// Canonical allowlist for View L log/status/truth inspection.
// This slice defines allowed runtime file identities only; it does not read files.

export type TerminalLogFileKind = 'jsonl' | 'json';
export type TerminalLogFileRole = 'action_log' | 'truth_log' | 'status_snapshot';

export interface TerminalLogRegistryEntry {
  readonly id: string;
  readonly label: string;
  readonly relativePath: string;
  readonly kind: TerminalLogFileKind;
  readonly role: TerminalLogFileRole;
  readonly purpose: string;
}

export const terminalLogsRegistry = [
  {
    id: 'terminal_actions',
    label: 'terminal-button-actions.jsonl',
    relativePath: 'runtime_data/logs/demo/terminal-button-actions.jsonl',
    kind: 'jsonl',
    role: 'action_log',
    purpose: 'Terminal button/action evidence ledger.'
  },
  {
    id: 'regular_worker_truth',
    label: 'regular-worker.truth.jsonl',
    relativePath: 'runtime_data/v2_worker_truth/demo/regular-worker.truth.jsonl',
    kind: 'jsonl',
    role: 'truth_log',
    purpose: 'Regular worker/stage truth events.'
  },
  {
    id: 'playback_worker_truth',
    label: 'playback-worker.truth.jsonl',
    relativePath: 'runtime_data/v2_worker_truth/demo/playback-worker.truth.jsonl',
    kind: 'jsonl',
    role: 'truth_log',
    purpose: 'Playback worker truth events.'
  },
  {
    id: 'screen_worker_truth',
    label: 'screen-worker.truth.jsonl',
    relativePath: 'runtime_data/v2_worker_truth/demo/screen-worker.truth.jsonl',
    kind: 'jsonl',
    role: 'truth_log',
    purpose: 'Screen worker truth events.'
  },
  {
    id: 'regular_worker_status',
    label: 'regular-worker.status.json',
    relativePath: 'runtime_data/scheduler/demo/regular-worker.status.json',
    kind: 'json',
    role: 'status_snapshot',
    purpose: 'Latest regular worker scheduler/status snapshot.'
  },
  {
    id: 'playback_worker_status',
    label: 'playback-worker-status.json',
    relativePath: 'runtime_data/scheduler/demo/playback-worker-status.json',
    kind: 'json',
    role: 'status_snapshot',
    purpose: 'Latest playback worker scheduler/status snapshot.'
  },
  {
    id: 'screen_worker_status',
    label: 'screen-on-off-worker-status.json',
    relativePath: 'runtime_data/scheduler/demo/screen-on-off-worker-status.json',
    kind: 'json',
    role: 'status_snapshot',
    purpose: 'Latest screen on/off worker scheduler/status snapshot.'
  }
] as const satisfies readonly TerminalLogRegistryEntry[];
