/*
 * Projects backend runtime orchestration payloads into dashboard last-run media data.
 * The helpers are pure so View B runtime action wiring can stay behavior-compatible.
 */

// Infers whether a selected playback path represents an image or video.
export function inferMediaTypeFromPath(candidatePath) {
  const normalized = String(candidatePath ?? '').toLowerCase();
  if (!normalized) {
    return 'Media';
  }
  if (/(\.mp4|\.mov|\.mkv|\.avi|\.webm)$/i.test(normalized)) {
    return 'Video';
  }
  return 'Image';
}

// Extracts a display filename from POSIX or Windows-style paths.
export function extractFileName(candidatePath) {
  const normalized = String(candidatePath ?? '').replaceAll('\\', '/');
  return normalized.split('/').filter(Boolean).pop() ?? candidatePath ?? 'Unknown media';
}

// Builds the backend media-serving URL used by browser preview/fullscreen rendering.
export function buildRuntimeMediaUrl(candidatePath) {
  const normalizedPath = String(candidatePath ?? '').trim();
  return normalizedPath ? `/api/runtime/playback/media?path=${encodeURIComponent(normalizedPath)}` : null;
}

// Checks for non-array records before reading backend payload fields.
export function isRuntimeRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

// Returns the empty last-run shape expected by the recovery dashboard view.
export function emptyLastRunData() {
  return { media: {}, playback: {}, stage: {}, screen: {} };
}

// Maps the backend orchestration summary into the existing last-run UI contract.
export function mapOrchestrationToLastRunData(payload) {
  const selected = isRuntimeRecord(payload?.selected_asset_summary) ? payload.selected_asset_summary : {};
  const canonicalPath = selected.canonicalPath ?? selected.canonical_path ?? null;
  const addressText = selected.addressText ?? selected.address_text ?? null;
  return {
    media: {
      file: canonicalPath ? extractFileName(canonicalPath) : 'No selected playback item recorded',
      type: canonicalPath ? inferMediaTypeFromPath(canonicalPath) : 'Unknown',
      queuePosition: 'Backend orchestration summary',
      checkpoint: payload?.finished_at ?? payload?.started_at ?? 'Unavailable',
    },
    playback: {
      status: payload?.status ?? 'Unknown',
      lastCheckpoint: payload?.finished_at ?? 'Unavailable',
      resumeMarker: canonicalPath ?? 'No playback selection recorded',
      crashState: payload?.failure_reason ? `Failed at ${payload.failed_stage ?? 'unknown stage'}: ${payload.failure_reason}` : 'No failure recorded',
    },
    stage: {
      active: payload?.current_stage ?? 'None',
      lastCompleted: payload?.last_successful_stage ?? 'None',
      previousStage: Array.isArray(payload?.stage_order_executed) ? payload.stage_order_executed.join(' -> ') : 'Unavailable',
      stageError: payload?.failure_reason ?? 'None',
    },
    screen: {
      state: 'Unknown',
      lastActivitySource: 'Not included in orchestration last-run payload',
      timeout: 'Not included',
      transition: addressText ?? 'No screen transition is represented by this endpoint',
    },
  };
}
