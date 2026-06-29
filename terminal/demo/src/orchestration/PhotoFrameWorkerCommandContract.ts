// Builds dry-run command and manifest plans for future real-demo execution.
// Keep this file focused so future slices can stay below the 300 LOC target.

export type SchedulerWorkerName = 'regular-stage-worker' | 'playback-worker' | 'screen-on-off-worker';
export type DemoStageIntent = 'index' | 'gps' | 'geocode' | 'queue_prepare';

export interface WorkerCommandContract {
  workerName: SchedulerWorkerName;
  npmCommand: string;
  cronReference: string;
  demoModeUse: 'manual-dry-run-plan' | 'future-manual-execution';
  description: string;
}

export const workerCommandContracts: WorkerCommandContract[] = [
  {
    workerName: 'regular-stage-worker',
    npmCommand: 'npm run api -- --scheduler regular-stage-worker',
    cronReference: '*/10 * * * *',
    demoModeUse: 'manual-dry-run-plan',
    description: 'Runs the regular media pipeline worker lane: download/index/GPS/geocode/queue_prepare state machine.'
  },
  {
    workerName: 'playback-worker',
    npmCommand: 'npm run api -- --scheduler playback-worker',
    cronReference: '* * * * *',
    demoModeUse: 'future-manual-execution',
    description: 'Runs playback queue/current-item selection. Group 5 will plan/call this path.'
  },
  {
    workerName: 'screen-on-off-worker',
    npmCommand: 'npm run api -- --scheduler screen-on-off-worker',
    cronReference: '*/3 * * * *',
    demoModeUse: 'future-manual-execution',
    description: 'Runs screen on/off worker lane. It stays disabled for the terminal real-demo beeline.'
  }
];

export const regularStageIntents: DemoStageIntent[] = ['index', 'gps', 'geocode', 'queue_prepare'];

export function commandForWorker(workerName: SchedulerWorkerName): WorkerCommandContract {
  const contract = workerCommandContracts.find((item) => item.workerName === workerName);
  if (!contract) throw new Error(`Unknown scheduler worker: ${workerName}`);
  return contract;
}
