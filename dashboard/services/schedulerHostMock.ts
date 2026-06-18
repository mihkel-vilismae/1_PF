/*
 * Mock-only scheduler host status surface for early non-blocking proof design.
 * It does not start worker processes, write crontab, or claim Raspberry proof.
 */

export type SchedulerHostMockStatus = {
  status: 'mock-ready';
  lanes: Array<{ key: string; label: string; nonBlocking: true; processSpawned: false }>;
  evidence: string;
  nonClaim: string;
};

export function buildSchedulerHostMockStatus(): SchedulerHostMockStatus {
  return {
    status: 'mock-ready',
    lanes: [
      { key: 'regular-stage-worker', label: 'Regular stage worker lane', nonBlocking: true, processSpawned: false },
      { key: 'playback-worker', label: 'Playback worker lane', nonBlocking: true, processSpawned: false },
      { key: 'screen-on-off-worker', label: 'Screen on/off worker lane', nonBlocking: true, processSpawned: false },
      { key: 'recovery-state', label: 'Recovery state lane', nonBlocking: true, processSpawned: false },
    ],
    evidence: 'scheduler-host-mock-status-only',
    nonClaim: 'Mock scheduler-host status only: no scheduler process, worker process, crontab write, or Raspberry proof is claimed.',
  };
}

export function assertSchedulerHostMockIsNonBlocking(status = buildSchedulerHostMockStatus()): boolean {
  return status.lanes.every((lane) => lane.nonBlocking === true && lane.processSpawned === false)
    && status.nonClaim.includes('no scheduler process');
}
