/*
 * Defines shared dashboard view IDs, navigation labels, and status labels.
 * Views import this file to keep navigation order and badge wording consistent.
 */
export type DashboardViewId = 'A' | 'B' | 'C' | 'D' | 'E' | 'WIN' | 'RPI' | 'V2' | 'DEBUG';

export type DashboardViewDefinition = {
  id: DashboardViewId;
  name: string;
  subtitle: string;
};

export type StatusLabelKey = 'idle' | 'running' | 'success' | 'error' | 'disabled' | 'info';

export const VIEW_ORDER: readonly DashboardViewDefinition[] = [
  { id: 'A', name: 'Init', subtitle: 'Setup, validation, and readiness controls.' },
  { id: 'B', name: 'Test', subtitle: 'Simulation and validation flow only.' },
  { id: 'C', name: 'Last Run Info', subtitle: 'Recovery-facing summary of the last known run.' },
  { id: 'D', name: 'Running Process', subtitle: 'Live view of the real runtime only.' },
  { id: 'E', name: 'Database Viewer', subtitle: 'Backend-backed SQLite inspection with honest session logging.' },
  { id: 'WIN', name: 'Windows Playback', subtitle: 'Windows-only preview/fullscreen playback surface.' },
  { id: 'RPI', name: 'Raspberry Playback', subtitle: 'Raspberry OS deployment playback surface.' },
  { id: 'V2', name: 'V2 Operator Menu', subtitle: 'Visual-only Structure V1 menu prototype.' },
  { id: 'DEBUG', name: 'Debug', subtitle: 'Debug Menu for proof-safe operator diagnostics.' },
];

export const STATUS_LABELS: Record<StatusLabelKey, string> = {
  idle: 'Idle',
  running: 'Running',
  success: 'Success',
  error: 'Error',
  disabled: 'Disabled',
  info: 'Info',
};
