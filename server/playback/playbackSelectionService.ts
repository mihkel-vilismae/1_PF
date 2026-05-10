/*
 * Provides backend-owned playback selection logic shared by HTTP routes and workers.
 * The service keeps Stage 6 selection separate from rendering and scheduler wiring.
 * It preserves route response shaping by returning a neutral selection result.
 */
import type { DatabaseService } from '../database/databaseService.ts';

type JsonObject = Record<string, unknown>;

export interface PlaybackSelectionContext {
  envValues: Record<string, string | undefined>;
}

export type PlaybackSelectionOutcome = 'selected' | 'no_ready_row' | 'no_playable_ready_row';

export interface PlaybackSelectionResult {
  outcome: PlaybackSelectionOutcome;
  status: 'ok' | 'warning' | 'skipped';
  messages: string[];
  stage: 'stage6_run_playback';
  playback: JsonObject;
  database: unknown;
  schemaVersion: 1;
  executedAt: string;
  selectedItemSummary: unknown | null;
  skippedReason: string | null;
}

export interface PlaybackSelectionServiceOptions {
  context: PlaybackSelectionContext;
  databaseService: Pick<DatabaseService, 'runStage6SelectCurrent'>;
}

// Runs Stage 6 current-item selection and normalizes selected/skipped outcomes.
export async function selectCurrentPlayableItem({
  context,
  databaseService,
}: PlaybackSelectionServiceOptions): Promise<PlaybackSelectionResult> {
  const { database, executedAt, playback } = await databaseService.runStage6SelectCurrent(context);
  const playbackPayload = normalizeJsonObject(playback);
  const outcome = normalizePlaybackOutcome(playbackPayload.outcome);
  const selectedItemSummary = playbackPayload.selected ?? null;

  if (outcome === 'no_ready_row') {
    return {
      outcome,
      status: 'skipped',
      messages: ['No READY slideshow rows exist for playback selection.'],
      stage: 'stage6_run_playback',
      playback: playbackPayload,
      database,
      schemaVersion: 1,
      executedAt,
      selectedItemSummary,
      skippedReason: 'no_ready_row',
    };
  }

  if (outcome === 'no_playable_ready_row') {
    return {
      outcome,
      status: 'skipped',
      messages: ['READY slideshow rows exist but none are currently playable.'],
      stage: 'stage6_run_playback',
      playback: playbackPayload,
      database,
      schemaVersion: 1,
      executedAt,
      selectedItemSummary,
      skippedReason: 'no_playable_ready_row',
    };
  }

  const failedCandidateCount = readNumber(playbackPayload.failedCandidateCount);
  const selectedAssetId = normalizeJsonObject(selectedItemSummary).mediaAssetId ?? null;
  return {
    outcome: 'selected',
    status: failedCandidateCount ? 'warning' : 'ok',
    messages: failedCandidateCount
      ? [`Selected media asset ${selectedAssetId} after failing ${failedCandidateCount} invalid READY candidate(s).`]
      : [`Selected media asset ${selectedAssetId} as the current playback item.`],
    stage: 'stage6_run_playback',
    playback: playbackPayload,
    database,
    schemaVersion: 1,
    executedAt,
    selectedItemSummary,
    skippedReason: null,
  };
}

// Converts unknown Python bridge payloads into safe JSON-object access.
function normalizeJsonObject(value: unknown): JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as JsonObject : {};
}

// Preserves the known Stage 6 outcome set while defaulting successful payloads to selected.
function normalizePlaybackOutcome(value: unknown): PlaybackSelectionOutcome {
  return value === 'no_ready_row' || value === 'no_playable_ready_row' ? value : 'selected';
}

// Reads numeric bridge fields without trusting loose JSON types.
function readNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
