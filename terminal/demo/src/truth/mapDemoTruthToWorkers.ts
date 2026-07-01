// Reads and maps real-demo worker truth/status data for terminal panels.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { WorkerPanelRow, WorkerStatus } from '../state/DemoTerminalState.js';
import type { DemoSchedulerStatus, DemoTruthEvent, DemoTruthWorkerId } from './DemoTruthRepository.js';

const workerMap: Array<{ id: DemoTruthWorkerId; name: WorkerPanelRow['name'] }> = [
  { id: 'regular-worker', name: 'Regular state worker' },
  { id: 'playback-worker', name: 'Playback worker' },
  { id: 'screen-worker', name: 'On-off worker' }
];

export function mapDemoTruthToWorkers(
  events: DemoTruthEvent[],
  statuses: DemoSchedulerStatus[],
  truthDir: string
): WorkerPanelRow[] {
  return workerMap.map(({ id, name }) => {
    const latestEvent = [...events].reverse().find((event) => event.worker === id);
    if (latestEvent) return fromEvent(name, latestEvent);
    const latestStatus = [...statuses].reverse().find((status) => status.workerHint === id);
    if (latestStatus) return fromStatus(name, latestStatus);
    return {
      name,
      status: id === 'screen-worker' ? 'Disabled' : 'Waiting',
      lastCalled: 'Never',
      lastEvent: `No demo truth yet at ${truthDir}`
    };
  });
}

function fromEvent(name: WorkerPanelRow['name'], event: DemoTruthEvent): WorkerPanelRow {
  return {
    name,
    status: mapStatus(event.status),
    lastCalled: event.timestamp,
    lastEvent: event.error || event.message || `${event.stage} ${event.status}`
  };
}

function fromStatus(name: WorkerPanelRow['name'], status: DemoSchedulerStatus): WorkerPanelRow {
  return {
    name,
    status: /error|fail/i.test(status.status) ? 'Error' : 'Waiting',
    lastCalled: status.timestamp,
    lastEvent: status.message
  };
}

function mapStatus(value: DemoTruthEvent['status']): WorkerStatus {
  if (value === 'finished' || value === 'state') return 'Finished';
  if (value === 'degraded' || value === 'interrupted') return 'Degraded';
  if (value === 'error') return 'Error';
  return 'Started';
}
