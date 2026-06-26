/*
 * Safe bridge helpers for the V2 browser-local playback drop queue.
 * The bridge never trusts browser file paths. It only asks the existing backend
 * queue-prepare endpoint to refresh durable queue rows for already-known media.
 */
import { RUNTIME_EXECUTION_ENDPOINTS } from './runtimeExecutionService.ts';

export type V2PlaybackDropQueueBridgeItem = {
  id: string;
  filename: string;
  mediaKind: 'video' | 'image' | 'other';
  durationLabel?: string;
  gpsCoordinates?: string;
  gpsStatus?: 'present' | 'missing';
  address?: string;
  addressStatus?: 'present' | 'missing';
  metadataSource?: string;
  metadataMessage?: string;
};

export type V2PlaybackDropQueueBridgeRequest =
  | {
      ok: true;
      endpoint: typeof RUNTIME_EXECUTION_ENDPOINTS.queuePrepare;
      message: string;
      body: {
        source: 'v2-playback-drop-queue';
        bridge: 'safe-backend-queue-prepare';
        browserLocalOnly: true;
        selected: {
          id: string;
          filename: string;
          mediaKind: 'video' | 'image';
          durationLabel: string;
          gpsCoordinates: string;
          gpsStatus: 'present' | 'missing';
          address: string;
          addressStatus: 'present' | 'missing';
          metadataSource: string;
          metadataMessage: string;
        };
        note: string;
      };
    }
  | {
      ok: false;
      endpoint: typeof RUNTIME_EXECUTION_ENDPOINTS.queuePrepare;
      message: string;
      reason: 'missing-item' | 'non-media';
      body: null;
    };

export const V2_PLAYBACK_DROP_QUEUE_BRIDGE_SOURCE = 'v2-playback-drop-queue' as const;

export function isV2PlaybackDropQueueBridgeable(item: V2PlaybackDropQueueBridgeItem | null | undefined): item is V2PlaybackDropQueueBridgeItem & { mediaKind: 'video' | 'image' } {
  return item?.mediaKind === 'video' || item?.mediaKind === 'image';
}

export function buildV2PlaybackDropQueueBridgeRequest(item: V2PlaybackDropQueueBridgeItem | null | undefined): V2PlaybackDropQueueBridgeRequest {
  const endpoint = RUNTIME_EXECUTION_ENDPOINTS.queuePrepare;
  if (!item) {
    return {
      ok: false,
      endpoint,
      reason: 'missing-item',
      message: 'The selected V2 playback queue row was not found; no backend request was sent.',
      body: null,
    };
  }

  if (!isV2PlaybackDropQueueBridgeable(item)) {
    return {
      ok: false,
      endpoint,
      reason: 'non-media',
      message: `${item.filename} is not image/video media; backend queue prepare was not requested.`,
      body: null,
    };
  }

  return {
    ok: true,
    endpoint,
    message: `${item.filename} is valid ${item.mediaKind} media; requesting backend queue preparation through ${endpoint.path}.`,
    body: {
      source: V2_PLAYBACK_DROP_QUEUE_BRIDGE_SOURCE,
      bridge: 'safe-backend-queue-prepare',
      browserLocalOnly: true,
      selected: {
        id: item.id,
        filename: item.filename,
        mediaKind: item.mediaKind,
        durationLabel: item.durationLabel ?? '',
        gpsCoordinates: item.gpsCoordinates ?? '',
        gpsStatus: item.gpsStatus ?? 'missing',
        address: item.address ?? '',
        addressStatus: item.addressStatus ?? 'missing',
        metadataSource: item.metadataSource ?? 'unknown',
        metadataMessage: item.metadataMessage ?? 'No metadata message supplied.',
      },
      note: 'Browser dropped files are not trusted as backend filesystem paths; this request only asks the existing backend queue-prepare stage to refresh durable queue rows for known media.',
    },
  };
}
