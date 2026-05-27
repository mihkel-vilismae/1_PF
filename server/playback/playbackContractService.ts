/*
 * Builds read-only playback API contracts for dashboard playback surfaces.
 * The service hides SQLite rows and local media paths behind stable objects.
 * It keeps media serving backend-owned and preserves Test/Real mode boundaries.
 */
import type { DatabaseService } from '../database/databaseService.ts';

type JsonObject = Record<string, unknown>;

export type PlaybackContractContext = {
  envValues: Record<string, string | undefined>;
  runtimeMode?: 'real' | 'test';
};

export type PlaybackContractItem = {
  mediaAssetId: number;
  slideshowQueueId: number;
  displayName: string;
  mediaType: string;
  queueStatus: string;
  resolvedAddress: string;
  hasResolvedAddress: boolean;
  capturedAt: string | null;
  lastShownAt: string | null;
  viewCount: number;
  fileExtension: string | null;
  gpsStatus: string | null;
  geocodeStatus: string | null;
  isCurrent: boolean;
  displayUrl: string;
};

export type PlaybackQueueSummary = {
  totalCount: number;
  readyCount: number;
  failedCount: number;
  returnedCount: number;
  limit: number;
};

export type PlaybackContractPayload = {
  currentMediaAssetId: string | null;
  currentItem: PlaybackContractItem | null;
  nextItem: PlaybackContractItem | null;
  items: PlaybackContractItem[];
  queue: PlaybackQueueSummary;
};

export type PlaybackContractEnvelope = {
  status: 'ok';
  messages: string[];
  playback: PlaybackContractPayload;
  database: unknown;
  runtimeMode: 'real' | 'test';
  schemaVersion: 1;
  mediaBasePath: '/api/runtime/playback/media';
};

export type PlaybackMediaPathPayload = {
  found: boolean;
  mediaAssetId: number;
  mediaType?: string | null;
  fileExtension?: string | null;
  resolvedPath?: string | null;
};

export type PlaybackContractServiceOptions = {
  context: PlaybackContractContext;
  databaseService: Pick<DatabaseService, 'buildDatabaseStatus' | 'runPythonJson'>;
  repoRoot: string;
  limit?: number;
};

export type PlaybackAssetMediaPathOptions = {
  context: PlaybackContractContext;
  databaseService: Pick<DatabaseService, 'buildDatabaseStatus' | 'runPythonJson'>;
  repoRoot: string;
  mediaAssetId: string;
};

// Returns the stable playback queue/current-item API contract without mutating queue state.
export async function buildPlaybackContract({
  context,
  databaseService,
  repoRoot,
  limit = 25,
}: PlaybackContractServiceOptions): Promise<PlaybackContractEnvelope> {
  const database = await databaseService.buildDatabaseStatus(context);
  const safeLimit = normalizePlaybackContractLimit(limit);
  const playback = database.exists
    ? await databaseService.runPythonJson<PlaybackContractPayload>([
      'playback_contract',
      String(database.absolutePath),
      repoRoot,
      String(safeLimit),
    ])
    : emptyPlaybackContract(safeLimit);

  return {
    status: 'ok',
    messages: buildPlaybackContractMessages(playback, database.exists),
    playback,
    database,
    runtimeMode: context.runtimeMode === 'test' ? 'test' : 'real',
    schemaVersion: 1,
    mediaBasePath: '/api/runtime/playback/media',
  };
}

// Resolves a media asset id to a local path on the backend for safe streaming.
export async function resolvePlaybackAssetMediaPath({
  context,
  databaseService,
  repoRoot,
  mediaAssetId,
}: PlaybackAssetMediaPathOptions): Promise<{ database: unknown; media: PlaybackMediaPathPayload }> {
  const database = await databaseService.buildDatabaseStatus(context);
  const media = database.exists
    ? await databaseService.runPythonJson<PlaybackMediaPathPayload>([
      'playback_asset_media_path',
      String(database.absolutePath),
      String(mediaAssetId),
      repoRoot,
    ])
    : { found: false, mediaAssetId: Number(mediaAssetId) || 0 };

  return { database, media };
}

// Limits queue payload size so the dashboard cannot request unbounded SQLite rows.
export function normalizePlaybackContractLimit(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 25;
  }
  return Math.max(1, Math.min(100, Math.trunc(parsed)));
}

// Builds an honest empty contract when the configured database is not created yet.
function emptyPlaybackContract(limit: number): PlaybackContractPayload {
  return {
    currentMediaAssetId: null,
    currentItem: null,
    nextItem: null,
    items: [],
    queue: {
      totalCount: 0,
      readyCount: 0,
      failedCount: 0,
      returnedCount: 0,
      limit,
    },
  };
}

// Converts contract state into concise operator-facing API messages.
function buildPlaybackContractMessages(playback: PlaybackContractPayload, databaseExists: boolean): string[] {
  if (!databaseExists) {
    return ['Playback database does not exist yet; no queue rows can be rendered.'];
  }
  if (playback.currentItem) {
    return [`Current playback item is ${playback.currentItem.displayName}.`];
  }
  if (playback.nextItem) {
    return [`No current item is selected yet; next READY item is ${playback.nextItem.displayName}.`];
  }
  return ['No READY playback queue item is available yet.'];
}
