/** Local pre-pass design model for screen worker non-blocking proof. */

export const SCREEN_WORKER_NONBLOCKING_CRITERIA = Object.freeze([
  'screen_worker_status_read_does_not_start_process',
  'screen_worker_mock_lane_is_non_blocking',
  'regular_worker_lane_remains_available',
  'playback_worker_lane_remains_available',
  'real_physical_power_control_not_claimed',
]);

export function buildScreenWorkerNonBlockingDesign({ schedulerHostStatus }) {
  const lanes = schedulerHostStatus?.lanes ?? [];
  const laneByKey = Object.fromEntries(lanes.map((lane) => [lane.key, lane]));
  return {
    criteria: SCREEN_WORKER_NONBLOCKING_CRITERIA,
    satisfied: {
      screen_worker_status_read_does_not_start_process: laneByKey['screen-on-off-worker']?.processSpawned === false,
      screen_worker_mock_lane_is_non_blocking: laneByKey['screen-on-off-worker']?.nonBlocking === true,
      regular_worker_lane_remains_available: laneByKey['regular-stage-worker']?.nonBlocking === true,
      playback_worker_lane_remains_available: laneByKey['playback-worker']?.nonBlocking === true,
      real_physical_power_control_not_claimed: String(schedulerHostStatus?.nonClaim ?? '').includes('Raspberry proof') || String(schedulerHostStatus?.nonClaim ?? '').includes('no scheduler process'),
    },
    nonClaim: 'Local design pre-pass only: no real screen worker process, physical monitor control, crontab mutation, or Raspberry proof is claimed.',
  };
}

export function evaluateScreenWorkerNonBlockingDesign(design) {
  const missing = Object.entries(design.satisfied).filter(([, passed]) => passed !== true).map(([key]) => key);
  return { passed: missing.length === 0, missing };
}
