/** Raspberry screen-worker non-blocking proof helper. */
import { createProofEnvelope, getProofEnvironment, sanitizeEvidence } from './proof-utils.mjs';
import { buildSchedulerHostMockStatus } from '../dashboard/services/schedulerHostMock.ts';
import { buildScreenWorkerNonBlockingDesign, evaluateScreenWorkerNonBlockingDesign } from './screen-worker-nonblocking-design-lib.mjs';

export function buildRaspberryScreenWorkerNonBlockingEvidence() {
  const schedulerHostStatus = buildSchedulerHostMockStatus();
  const design = buildScreenWorkerNonBlockingDesign({ schedulerHostStatus });
  const evaluation = evaluateScreenWorkerNonBlockingDesign(design);
  const screenLane = schedulerHostStatus.lanes.find((lane) => lane.key === 'screen-on-off-worker');
  const checks = [
    { name: 'screen_lane_declared', passed: Boolean(screenLane) },
    { name: 'screen_lane_non_blocking', passed: screenLane?.nonBlocking === true },
    { name: 'screen_lane_does_not_spawn_process', passed: screenLane?.processSpawned === false },
    { name: 'regular_lane_available', passed: schedulerHostStatus.lanes.some((lane) => lane.key === 'regular-stage-worker' && lane.nonBlocking === true) },
    { name: 'playback_lane_available', passed: schedulerHostStatus.lanes.some((lane) => lane.key === 'playback-worker' && lane.nonBlocking === true) },
    { name: 'design_criteria_pass', passed: evaluation.passed === true },
  ];
  return { schedulerHostStatus, design, evaluation, checks, passed: checks.every((check) => check.passed), non_claims: ['does not prove physical monitor power control', 'does not spawn real worker processes', 'does not mutate crontab', 'does not replace cron app-running proof'] };
}

export function buildRaspberryScreenWorkerNonBlockingProof({ metadata }) {
  const evidence = buildRaspberryScreenWorkerNonBlockingEvidence();
  return createProofEnvelope({
    proofKind: 'raspberry_screen_worker_non_blocking',
    baselineVersion: metadata.version,
    gitCommit: metadata.gitCommit,
    proofStatus: evidence.passed ? 'PASSED' : 'FAILED',
    runtimeMode: 'raspberry_screen_worker_non_blocking_design_prepass',
    evidence: sanitizeEvidence({ environment: getProofEnvironment(), ...evidence }),
    knownLimitations: evidence.passed
      ? ['This proves the screen-worker lane is non-blocking in the scheduler-host design surface; physical monitor power control is not claimed.']
      : ['One or more screen-worker non-blocking checks failed.'],
  });
}
