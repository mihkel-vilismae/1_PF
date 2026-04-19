export const VIEW_ORDER = [
  { id: 'A', name: 'Init', subtitle: 'Setup, validation, and readiness controls.' },
  { id: 'B', name: 'Test', subtitle: 'Simulation and validation flow only.' },
  { id: 'C', name: 'Last Run Info', subtitle: 'Recovery-facing summary of the last known run.' },
  { id: 'D', name: 'Running Process', subtitle: 'Live view of the real runtime only.' },
];

export const STATUS_LABELS = {
  idle: 'Idle',
  running: 'Running',
  success: 'Success',
  error: 'Error',
  disabled: 'Disabled',
  info: 'Info',
};

export const PIPELINE_STAGE_LABELS = [
  'Download',
  'Index',
  'Get GPS',
  'Geocode',
  'Queue Slideshow',
];
