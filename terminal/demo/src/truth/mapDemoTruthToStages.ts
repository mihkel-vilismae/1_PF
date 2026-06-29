// Reads and maps real-demo worker truth/status data for terminal panels.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { StagePanelRow, StageStatus } from '../state/DemoTerminalState.js';
import type { DemoTruthEvent } from './DemoTruthRepository.js';

const stageNames = ['Download', 'Index', 'GPS parser', 'Geocode', 'Queue'] as const;

export function mapDemoTruthToStages(events: DemoTruthEvent[], truthDir: string): StagePanelRow[] {
  const regularEvents = events.filter((event) => event.worker === 'regular-worker');
  if (regularEvents.length === 0) {
    return stageNames.map((name) => ({ name, status: 'Idle', details: `No demo truth yet at ${truthDir}` }));
  }

  return stageNames.map((name) => {
    const latest = [...regularEvents].reverse().find((event) => normalizeStageName(event.stage) === name);
    return latest
      ? { name, status: mapStatus(latest.status), details: formatDetails(latest) }
      : { name, status: 'Idle', details: 'No event yet in demo truth.' };
  });
}

function normalizeStageName(value: string): StagePanelRow['name'] {
  const lower = value.toLowerCase();
  if (lower.includes('download')) return 'Download';
  if (lower.includes('gps')) return 'GPS parser';
  if (lower.includes('geocode')) return 'Geocode';
  if (lower.includes('queue')) return 'Queue';
  return 'Index';
}

function mapStatus(value: DemoTruthEvent['status']): StageStatus {
  if (value === 'finished' || value === 'state') return 'Finished';
  if (value === 'error' || value === 'interrupted') return 'Error';
  return 'Started';
}

function formatDetails(event: DemoTruthEvent): string {
  const counts = event.counts ? Object.entries(event.counts).map(([key, value]) => `${key}=${value}`).join(' ') : '';
  const message = event.error || event.message || '-';
  return [message, counts].filter(Boolean).join(' | ');
}
