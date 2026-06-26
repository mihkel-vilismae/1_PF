/*
 * Metadata bridge for V2 playback drag/drop rows.
 * Browser dropped files do not expose reliable EXIF/GPS data to this dashboard.
 * GPS/address values must therefore come from explicit pipeline/sidecar metadata;
 * missing metadata is labelled honestly and never replaced with fake addresses.
 */

export type V2PlaybackMetadataPresence = 'present' | 'missing';

export type V2PlaybackMetadataBridgeInput = {
  gpsCoordinates?: string | null;
  address?: string | null;
  source?: 'browser-local-file' | 'pipeline-metadata' | 'trusted-sidecar';
};

export type V2PlaybackMetadataBridgeResult = {
  gpsCoordinates: string;
  gpsStatus: V2PlaybackMetadataPresence;
  address: string;
  addressStatus: V2PlaybackMetadataPresence;
  metadataSource: 'browser-local-file' | 'pipeline-metadata' | 'trusted-sidecar';
  metadataMessage: string;
};

const MISSING_GPS_LABEL = 'GPS missing — no browser EXIF extraction';
const MISSING_ADDRESS_LABEL = 'Address missing — no fake address';

export function buildV2PlaybackMetadataBridge(input: V2PlaybackMetadataBridgeInput = {}): V2PlaybackMetadataBridgeResult {
  const metadataSource = input.source ?? 'browser-local-file';
  const gpsCoordinates = normalizeMetadataText(input.gpsCoordinates);
  const address = normalizeMetadataText(input.address);
  const gpsStatus: V2PlaybackMetadataPresence = gpsCoordinates ? 'present' : 'missing';
  const addressStatus: V2PlaybackMetadataPresence = address ? 'present' : 'missing';

  return {
    gpsCoordinates: gpsCoordinates || MISSING_GPS_LABEL,
    gpsStatus,
    address: address || MISSING_ADDRESS_LABEL,
    addressStatus,
    metadataSource,
    metadataMessage: buildMetadataMessage(gpsStatus, addressStatus, metadataSource),
  };
}

export function buildBrowserLocalV2PlaybackMetadata(): V2PlaybackMetadataBridgeResult {
  return buildV2PlaybackMetadataBridge({ source: 'browser-local-file' });
}

function normalizeMetadataText(value: string | null | undefined): string {
  return String(value ?? '').trim();
}

function buildMetadataMessage(gpsStatus: V2PlaybackMetadataPresence, addressStatus: V2PlaybackMetadataPresence, source: V2PlaybackMetadataBridgeResult['metadataSource']): string {
  const sourceLabel = source === 'browser-local-file'
    ? 'browser-local drop queue'
    : source === 'pipeline-metadata'
      ? 'pipeline metadata'
      : 'trusted sidecar metadata';
  const gpsLabel = gpsStatus === 'present' ? 'GPS present' : 'GPS missing';
  const addressLabel = addressStatus === 'present' ? 'address present' : 'address missing';
  return `${gpsLabel}; ${addressLabel}; source: ${sourceLabel}. No missing address is fabricated.`;
}
