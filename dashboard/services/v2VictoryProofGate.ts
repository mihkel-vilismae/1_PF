/*
 * B12 final gate evaluator for autonomous playback + recovery proof.
 * It is intentionally conservative: mocked/UI state can make prerequisites visible,
 * but a passed gate requires explicit live evidence flags.
 */
export type V2VictoryProofQueueItem = {
  mediaKind?: string;
  backendQueueStatus?: string;
  gpsStatus?: string;
  addressStatus?: string;
};

export type V2VictoryProofEvidence = {
  autonomousPlaybackLiveProofPassed?: boolean;
  autonomousRecoveryLiveProofPassed?: boolean;
  targetMachine?: string | null;
  evidencePackPath?: string | null;
};

export type V2VictoryProofRequirement = {
  id: string;
  label: string;
  passed: boolean;
  message: string;
};

export type V2VictoryProofGate = {
  status: 'blocked' | 'ready-for-live-proof' | 'passed';
  summary: string;
  requirements: V2VictoryProofRequirement[];
};

const PIPELINE_STAGE_KEYS = ['B3.1', 'B3.2', 'B3.3', 'B3.4', 'B3.5'];

export function evaluateV2VictoryProofGate(
  runtimeState: Record<string, any> = {},
  queueItems: readonly V2VictoryProofQueueItem[] = [],
  evidence: V2VictoryProofEvidence = {},
): V2VictoryProofGate {
  const statusByKey = runtimeState.statusByKey ?? {};
  const mediaRows = queueItems.filter((item) => item.mediaKind === 'image' || item.mediaKind === 'video');
  const preparedRows = mediaRows.filter((item) => ['requested', 'prepared', 'queued', 'success'].includes(String(item.backendQueueStatus ?? '').toLowerCase()));
  const pipelineStagesPassed = PIPELINE_STAGE_KEYS.every((key) => statusByKey[key] === 'success');
  const schedulerPassed = statusByKey['3A'] === 'success';
  const playbackQueueReady = preparedRows.length > 0;
  const metadataHonest = mediaRows.every((item) => item.addressStatus === 'present' || item.addressStatus === 'missing' || item.addressStatus === undefined);
  const recoverySnapshotAvailable = Boolean(runtimeState.v2Recovery?.latestLoad?.snapshot || runtimeState.v2Recovery?.latestAutosave?.snapshot || runtimeState.v2Recovery?.restartCheck?.snapshot);
  const playbackLiveProof = evidence.autonomousPlaybackLiveProofPassed === true;
  const recoveryLiveProof = evidence.autonomousRecoveryLiveProofPassed === true;

  const requirements: V2VictoryProofRequirement[] = [
    {
      id: 'scheduler',
      label: 'Raspberry scheduler/crontab proof',
      passed: schedulerPassed,
      message: schedulerPassed ? 'Scheduler status is success.' : 'Scheduler/crontab status must be proven successful on target machine.',
    },
    {
      id: 'pipeline',
      label: 'Download → Index → GPS → Geocode → Queue proof',
      passed: pipelineStagesPassed,
      message: pipelineStagesPassed ? 'All B3 worker stage statuses are success.' : 'Every worker stage B3.1-B3.5 must reach success.',
    },
    {
      id: 'queue',
      label: 'Playable media queued',
      passed: playbackQueueReady,
      message: playbackQueueReady ? `${preparedRows.length} media row(s) requested backend queue preparation.` : 'At least one image/video row must be prepared by the backend queue bridge.',
    },
    {
      id: 'metadata',
      label: 'GPS/address metadata is honest',
      passed: metadataHonest,
      message: metadataHonest ? 'Address may be present or explicitly missing; no fake address is allowed.' : 'Metadata rows must never fabricate GPS/address values.',
    },
    {
      id: 'recovery-state',
      label: 'Recovery snapshot available',
      passed: recoverySnapshotAvailable,
      message: recoverySnapshotAvailable ? 'A V2 recovery snapshot exists.' : 'Manual/autosave/restart recovery snapshot must exist before recovery proof.',
    },
    {
      id: 'live-autonomous-playback-proof',
      label: 'Live autonomous playback proof artifact',
      passed: playbackLiveProof,
      message: playbackLiveProof ? 'Explicit live autonomous playback proof flag is present.' : 'A live target-machine playback evidence pack is still required.',
    },
    {
      id: 'live-autonomous-recovery-proof',
      label: 'Live autonomous recovery proof artifact',
      passed: recoveryLiveProof,
      message: recoveryLiveProof ? 'Explicit live autonomous recovery proof flag is present.' : 'A live abrupt-stop/restart recovery evidence pack is still required.',
    },
  ];

  const prerequisiteReady = requirements.slice(0, 5).every((requirement) => requirement.passed);
  const allPassed = requirements.every((requirement) => requirement.passed);
  return {
    status: allPassed ? 'passed' : prerequisiteReady ? 'ready-for-live-proof' : 'blocked',
    summary: allPassed
      ? `B12 victory proof passed${evidence.targetMachine ? ` on ${evidence.targetMachine}` : ''}.`
      : prerequisiteReady
        ? 'Prerequisites are ready, but live autonomous playback and recovery proof artifacts are still required.'
        : 'B12 victory proof is blocked by missing prerequisites and/or live proof artifacts.',
    requirements,
  };
}
