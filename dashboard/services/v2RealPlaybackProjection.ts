/*
 * Builds the read-only status projection for 09 REAL PLAYBACK.
 * The projection summarizes existing V2 state; it does not start workers,
 * upload dropped browser files, or claim recovery/PIR hardware proof.
 */
import { normalizePlaybackRenderingState } from './playbackRenderer.ts';

export type V2RealPlaybackQueueProjectionItem = {
  mediaKind?: string;
  backendQueueStatus?: string;
  gpsStatus?: string;
  addressStatus?: string;
};

export type V2RealPlaybackProjectionRow = {
  id: string;
  label: string;
  status: string;
  message: string;
};

export type V2RealPlaybackProjection = {
  readiness: 'blocked' | 'partial' | 'ready';
  summary: string;
  rows: V2RealPlaybackProjectionRow[];
};

const WORKER_STAGE_KEYS = ['B3.1', 'B3.2', 'B3.3', 'B3.4', 'B3.5'] as const;

export function buildV2RealPlaybackProjection(runtimeState: Record<string, any> = {}, queueItems: readonly V2RealPlaybackQueueProjectionItem[] = []): V2RealPlaybackProjection {
  const statusByKey = runtimeState.statusByKey ?? {};
  const mediaRows = queueItems.filter((item) => item.mediaKind === 'image' || item.mediaKind === 'video');
  const nonMediaRows = queueItems.filter((item) => item.mediaKind === 'other');
  const queuePreparedRows = mediaRows.filter((item) => ['requested', 'prepared', 'queued', 'success'].includes(String(item.backendQueueStatus ?? '').toLowerCase()));
  const missingGpsRows = mediaRows.filter((item) => item.gpsStatus !== 'present').length;
  const missingAddressRows = mediaRows.filter((item) => item.addressStatus !== 'present').length;
  const successfulWorkerStages = WORKER_STAGE_KEYS.filter((key) => statusByKey[key] === 'success').length;
  const renderingState = normalizePlaybackRenderingState(runtimeState.playbackRendering);
  const playbackReady = Boolean(runtimeState.truth?.playbackActive || statusByKey.B4 === 'success' || queuePreparedRows.length > 0);
  const schedulerStatus = String(statusByKey['3A'] ?? 'idle');
  const queueStatus = queuePreparedRows.length > 0 ? 'queue bridge requested' : mediaRows.length > 0 ? 'media waiting' : 'empty';
  const readiness: V2RealPlaybackProjection['readiness'] = queuePreparedRows.length > 0 && playbackReady
    ? 'ready'
    : mediaRows.length > 0 || successfulWorkerStages > 0
      ? 'partial'
      : 'blocked';

  return {
    readiness,
    summary: readiness === 'ready'
      ? 'At least one media row has requested backend queue preparation. Continue with rendering proof; recovery is still gated.'
      : readiness === 'partial'
        ? 'Some prerequisite state exists, but final playback readiness is incomplete.'
        : 'No media has been prepared for real playback yet.',
    rows: [
      {
        id: 'scheduler',
        label: '1. Raspberry scheduler/crontab',
        status: schedulerStatus,
        message: schedulerStatus === 'success' ? 'Scheduler control reported success.' : 'Run/check Raspberry scheduler controls before claiming autonomous startup.',
      },
      {
        id: 'pipeline',
        label: '2. Media pipeline workers',
        status: `${successfulWorkerStages}/${WORKER_STAGE_KEYS.length} stages success`,
        message: `Stage statuses: ${WORKER_STAGE_KEYS.map((key) => `${key}=${statusByKey[key] ?? 'idle'}`).join(', ')}`,
      },
      {
        id: 'queue',
        label: '3. Playback queue bridge',
        status: queueStatus,
        message: `${mediaRows.length} media row(s), ${queuePreparedRows.length} backend queue request(s), ${nonMediaRows.length} non-media row(s) blocked locally.`,
      },
      {
        id: 'metadata',
        label: '4. GPS/address metadata',
        status: missingGpsRows === 0 && missingAddressRows === 0 && mediaRows.length > 0 ? 'present for media rows' : 'missing allowed but explicit',
        message: `${missingGpsRows} media row(s) missing GPS, ${missingAddressRows} media row(s) missing address. No fake address is generated.`,
      },
      {
        id: 'rendering',
        label: '5. Rendering target/mode',
        status: playbackReady ? 'unlocked by queue/playback state' : 'locked until playback ready',
        message: `Target=${renderingState.platform}; mode=${renderingState.mode}. Raspberry OS rendering remains disabled until hardware proof.`,
      },
      {
        id: 'recovery',
        label: '6. Recovery gate',
        status: runtimeState.v2Recovery?.latestAutosave || runtimeState.v2Recovery?.restartCheck ? 'autosave/restart watch active' : 'manual save/load available',
        message: runtimeState.v2Recovery?.latestAutosave || runtimeState.v2Recovery?.restartCheck
          ? 'B11.3 autosave/restart check state is available; live power-loss proof remains B12.'
          : 'B11.2 manual save/load endpoints exist; B11.3 autosave/restart watch activates when V2 runs or queue state changes.',
      },
    ],
  };
}
