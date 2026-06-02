/*
 * Owns backend-side OS-native playback process control.
 * The controller keeps browser playback separate from native player launches.
 * Native playback is disabled by default and uses safe spawn argument arrays.
 */
import { spawn, spawnSync } from 'node:child_process';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { DatabaseService } from '../database/databaseService.ts';
import { buildPlaybackContract, resolvePlaybackAssetMediaPath, type PlaybackContractItem, type PlaybackMediaPathPayload } from '../playback/playbackContractService.ts';

const NATIVE_PLAYBACK_STATUS_KEY = 'native_playback_status';
const NATIVE_PLAYBACK_SCHEMA_VERSION = 1;
const DEFAULT_IMAGE_DURATION_SECONDS = 12;

type JsonObject = Record<string, unknown>;
type NativePlaybackPlatform = 'windows' | 'raspberry';
type NativePlaybackPlayer = 'mpv' | 'vlc' | 'mock';
type NativePlaybackRuntimeStatus = 'idle' | 'starting' | 'running' | 'stopped' | 'failed';

type NativePlaybackContext = {
  envValues: Record<string, string | undefined>;
  runtimeMode?: 'real' | 'test';
  platform: NodeJS.Platform;
  repoRoot?: string;
};

type NativePlaybackDatabase = Pick<DatabaseService, 'buildDatabaseStatus' | 'runPythonJson' | 'getRuntimeState' | 'setRuntimeState'>;

export type NativePlaybackConfig = {
  enabled: boolean;
  autoStartOnWorker: boolean;
  platform: NativePlaybackPlatform;
  player: NativePlaybackPlayer;
  playerPath: string;
  fullscreen: boolean;
  replaceExisting: boolean;
  imageDurationSeconds: number;
};

export type NativePlaybackStatus = {
  enabled: boolean;
  autoStartOnWorker: boolean;
  platform: NativePlaybackPlatform;
  player: NativePlaybackPlayer;
  playerPath: string;
  status: NativePlaybackRuntimeStatus;
  pid: number | null;
  currentMediaAssetId: string | null;
  currentDisplayName: string | null;
  currentMediaType: string | null;
  currentPathPreview: string | null;
  startedAt: string | null;
  stoppedAt: string | null;
  lastExitCode: number | null;
  lastError: string | null;
  lastCommandSummary: string | null;
  messages: string[];
  schemaVersion: 1;
};

export type NativePlaybackPayload = {
  status: 'ok' | 'started' | 'stopped' | 'detected';
  config: NativePlaybackConfig;
  nativePlayback: NativePlaybackStatus;
  detection?: NativePlaybackDetection;
  schemaVersion: 1;
};

export type NativePlaybackDetection = {
  available: boolean;
  player: NativePlaybackPlayer;
  executable: string;
  checkedAt: string;
  message: string;
  stdoutPreview: string | null;
  stderrPreview: string | null;
};

export class NativePlaybackError extends Error {
  statusCode: number;
  code: string;
  details: unknown;

  // Creates an HTTP-friendly native playback error without exposing command internals.
  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'NativePlaybackError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

let activeProcess: ChildProcessWithoutNullStreams | null = null;

// Returns persisted native playback status merged with the current runtime config.
export async function getNativePlaybackStatus({
  context,
  databaseService,
}: {
  context: NativePlaybackContext;
  databaseService: NativePlaybackDatabase;
}): Promise<NativePlaybackPayload> {
  const config = buildNativePlaybackConfig(context);
  const saved = await readNativePlaybackStatus(context, databaseService);
  const status = mergeNativePlaybackStatus(config, saved);
  return { status: 'ok', config, nativePlayback: status, schemaVersion: NATIVE_PLAYBACK_SCHEMA_VERSION };
}

// Checks whether the configured native playback executable is available without launching media.
export async function detectNativePlayback({
  context,
  databaseService,
}: {
  context: NativePlaybackContext;
  databaseService: NativePlaybackDatabase;
}): Promise<NativePlaybackPayload> {
  const config = buildNativePlaybackConfig(context);
  const detection = detectNativePlaybackExecutable(config);
  const saved = mergeNativePlaybackStatus(config, await readNativePlaybackStatus(context, databaseService));
  const status: NativePlaybackStatus = {
    ...saved,
    messages: [detection.message, ...saved.messages].slice(0, 8),
  };
  await persistNativePlaybackStatus(context, databaseService, status);
  return { status: 'detected', config, nativePlayback: status, detection, schemaVersion: NATIVE_PLAYBACK_SCHEMA_VERSION };
}

// Starts the native player for the current or next backend playback item.
export async function startCurrentNativePlayback({
  context,
  databaseService,
  repoRoot,
}: {
  context: NativePlaybackContext;
  databaseService: NativePlaybackDatabase;
  repoRoot: string;
}): Promise<NativePlaybackPayload> {
  const contract = await buildPlaybackContract({ context, databaseService, repoRoot, limit: 50 });
  const item = contract.playback.currentItem ?? contract.playback.nextItem;
  if (!item) {
    throw new NativePlaybackError(404, 'native_playback_no_current_item', 'No current or next playback item is available for native playback.');
  }

  return startNativePlaybackForPlaybackItem({ context, databaseService, repoRoot, item });
}

// Starts the native player for the exact playback item supplied by a worker.
export async function startNativePlaybackForPlaybackItem({
  context,
  databaseService,
  repoRoot,
  item,
}: {
  context: NativePlaybackContext;
  databaseService: NativePlaybackDatabase;
  repoRoot: string;
  item: PlaybackContractItem;
}): Promise<NativePlaybackPayload> {
  const config = buildNativePlaybackConfig({ ...context, repoRoot });
  if (!config.enabled) {
    throw new NativePlaybackError(409, 'native_playback_disabled', 'Native playback is disabled by NATIVE_PLAYBACK_ENABLED.', {
      enabled: config.enabled,
    });
  }

  const resolvedMedia = await resolvePlaybackAssetMediaPath({
    context,
    databaseService,
    repoRoot,
    mediaAssetId: String(item.mediaAssetId),
  });
  if (!resolvedMedia.media.found || !resolvedMedia.media.resolvedPath) {
    throw new NativePlaybackError(404, 'native_playback_media_missing', 'The selected playback item cannot be resolved to a local media file.', {
      mediaAssetId: item.mediaAssetId,
    });
  }

  const playbackItem = completePlaybackItemForNativePlayback(item, resolvedMedia.media);
  const mediaPath = path.resolve(resolvedMedia.media.resolvedPath);
  if (config.replaceExisting) {
    await stopOwnedNativeProcess(context, databaseService, 'replace-existing');
  }

  const status = await launchNativePlayer({ context, databaseService, config, item: playbackItem, mediaPath });
  return { status: 'started', config, nativePlayback: status, schemaVersion: NATIVE_PLAYBACK_SCHEMA_VERSION };
}

// Starts native playback for a selected media asset without re-reading next/current queue state.
export async function startNativePlaybackForSelectedAsset({
  context,
  databaseService,
  repoRoot,
  selectedItemSummary,
}: {
  context: NativePlaybackContext;
  databaseService: NativePlaybackDatabase;
  repoRoot: string;
  selectedItemSummary: unknown;
}): Promise<NativePlaybackPayload> {
  const item = buildPlaybackItemFromSelectedSummary(selectedItemSummary);
  return startNativePlaybackForPlaybackItem({ context, databaseService, repoRoot, item });
}

// Stops the owned native playback process if this backend instance started one.
export async function stopNativePlayback({
  context,
  databaseService,
}: {
  context: NativePlaybackContext;
  databaseService: NativePlaybackDatabase;
}): Promise<NativePlaybackPayload> {
  const config = buildNativePlaybackConfig(context);
  const status = await stopOwnedNativeProcess(context, databaseService, 'manual-stop');
  return { status: 'stopped', config, nativePlayback: mergeNativePlaybackStatus(config, status), schemaVersion: NATIVE_PLAYBACK_SCHEMA_VERSION };
}

// Returns true when worker auto-start is explicitly enabled for native playback.
export function shouldAutoStartNativePlaybackFromWorker(context: NativePlaybackContext): boolean {
  const config = buildNativePlaybackConfig(context);
  return config.enabled && config.autoStartOnWorker;
}

// Normalizes environment values into a small native playback config object.
export function buildNativePlaybackConfig(context: NativePlaybackContext): NativePlaybackConfig {
  const env = context.envValues ?? {};
  const player = normalizeNativePlaybackPlayer(env.NATIVE_PLAYBACK_PLAYER);
  return {
    enabled: readBoolean(env.NATIVE_PLAYBACK_ENABLED, false),
    autoStartOnWorker: readBoolean(env.NATIVE_PLAYBACK_AUTO_START_ON_WORKER, false),
    platform: normalizeNativePlaybackPlatform(env.NATIVE_PLAYBACK_PLATFORM, context.platform),
    player,
    playerPath: resolveNativePlaybackPlayerPath(env.NATIVE_PLAYBACK_PLAYER_PATH, player, context),
    fullscreen: readBoolean(env.NATIVE_PLAYBACK_FULLSCREEN, true),
    replaceExisting: readBoolean(env.NATIVE_PLAYBACK_REPLACE_EXISTING, true),
    imageDurationSeconds: readPositiveInteger(env.NATIVE_PLAYBACK_IMAGE_DURATION_SECONDS, DEFAULT_IMAGE_DURATION_SECONDS),
  };
}

// Converts a worker-selected item summary into a stable native playback item.
function buildPlaybackItemFromSelectedSummary(selectedItemSummary: unknown): PlaybackContractItem {
  const summary = normalizeJsonObject(selectedItemSummary);
  const mediaAssetId = readPositiveNumber(summary.mediaAssetId);
  if (!mediaAssetId) {
    throw new NativePlaybackError(500, 'native_playback_selected_item_missing_id', 'The playback worker selected item did not include a usable media asset id.');
  }

  const canonicalPath = readOptionalString(summary.resolvedCanonicalPath) ?? readOptionalString(summary.canonicalPath);
  const displayName = readOptionalString(summary.displayName) ?? (canonicalPath ? path.basename(canonicalPath) : `media-${mediaAssetId}`);
  const fileExtension = readFileExtension(displayName) ?? readFileExtension(canonicalPath);

  return {
    mediaAssetId,
    slideshowQueueId: readPositiveNumber(summary.slideshowQueueId) ?? 0,
    displayName,
    mediaType: inferMediaType(fileExtension),
    queueStatus: 'READY',
    resolvedAddress: readOptionalString(summary.addressText) ?? '',
    hasResolvedAddress: Boolean(readOptionalString(summary.addressText)),
    capturedAt: null,
    lastShownAt: null,
    viewCount: 0,
    fileExtension,
    gpsStatus: null,
    geocodeStatus: null,
    isCurrent: true,
    displayUrl: `/api/runtime/playback/media?assetId=${encodeURIComponent(String(mediaAssetId))}`,
  };
}

// Fills media type/extension from backend media-path lookup when available.
function completePlaybackItemForNativePlayback(item: PlaybackContractItem, media: PlaybackMediaPathPayload): PlaybackContractItem {
  const extension = item.fileExtension ?? media.fileExtension ?? readFileExtension(media.resolvedPath);
  return {
    ...item,
    mediaType: media.mediaType ?? item.mediaType ?? inferMediaType(extension),
    fileExtension: extension,
    displayName: item.displayName || (media.resolvedPath ? path.basename(media.resolvedPath) : `media-${item.mediaAssetId}`),
  };
}

// Returns a JSON object wrapper for untrusted bridge payloads.
function normalizeJsonObject(value: unknown): JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as JsonObject : {};
}

// Reads a positive integer-like value without trusting bridge types.
function readPositiveNumber(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : null;
}

// Reads optional bridge strings and treats empty strings as absent.
function readOptionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

// Extracts a lowercase file extension without the leading dot.
function readFileExtension(value: unknown): string | null {
  const text = readOptionalString(value);
  if (!text) {
    return null;
  }
  const extension = path.extname(text).replace(/^\./, '').toLowerCase();
  return extension || null;
}

// Infers media type conservatively for native player command construction.
function inferMediaType(fileExtension: string | null): string {
  return fileExtension && ['mp4', 'mov', 'm4v', 'avi', 'mkv', 'webm'].includes(fileExtension) ? 'video' : 'image';
}

// Launches a real or mock player and persists the resulting native playback status.
async function launchNativePlayer({
  context,
  databaseService,
  config,
  item,
  mediaPath,
}: {
  context: NativePlaybackContext;
  databaseService: NativePlaybackDatabase;
  config: NativePlaybackConfig;
  item: PlaybackContractItem;
  mediaPath: string;
}): Promise<NativePlaybackStatus> {
  const command = buildNativePlaybackCommand(config, mediaPath, item.mediaType);
  const startedAt = new Date().toISOString();
  const commandSummary = `${config.player} ${command.args.filter((arg) => arg !== mediaPath).join(' ')} ${path.basename(mediaPath)}`.trim();

  if (config.player === 'mock') {
    const mockStatus = buildRunningStatus(config, item, mediaPath, null, startedAt, commandSummary, 'Mock native playback started; no OS process was launched.');
    await persistNativePlaybackStatus(context, databaseService, mockStatus);
    return mockStatus;
  }

  const detection = detectNativePlaybackExecutable(config);
  if (!detection.available) {
    const failedStatus = buildFailedStatus(config, item, mediaPath, detection.message, commandSummary);
    await persistNativePlaybackStatus(context, databaseService, failedStatus);
    throw new NativePlaybackError(424, 'native_playback_player_unavailable', detection.message, detection);
  }

  try {
    activeProcess = spawn(command.executable, command.args, { stdio: ['ignore', 'pipe', 'pipe'], shell: false });
  } catch (error) {
    const failedStatus = buildFailedStatus(config, item, mediaPath, getErrorMessage(error), commandSummary);
    await persistNativePlaybackStatus(context, databaseService, failedStatus);
    throw new NativePlaybackError(500, 'native_playback_launch_failed', 'Native playback process could not be launched.', {
      error: getErrorMessage(error),
    });
  }

  const runningStatus = buildRunningStatus(config, item, mediaPath, activeProcess.pid ?? null, startedAt, commandSummary, 'Native playback process launched.');
  await persistNativePlaybackStatus(context, databaseService, runningStatus);

  activeProcess.once('exit', (code) => {
    const stoppedStatus: NativePlaybackStatus = {
      ...runningStatus,
      status: code === 0 || code === null ? 'stopped' : 'failed',
      pid: null,
      stoppedAt: new Date().toISOString(),
      lastExitCode: typeof code === 'number' ? code : null,
      lastError: code && code !== 0 ? `Native player exited with code ${code}.` : null,
      messages: [`Native player exited with code ${code ?? 'unknown'}.`, ...runningStatus.messages].slice(0, 8),
    };
    if (activeProcess?.pid === runningStatus.pid) {
      activeProcess = null;
    }
    void persistNativePlaybackStatus(context, databaseService, stoppedStatus);
  });

  return runningStatus;
}

// Stops only the process currently owned by this backend instance.
async function stopOwnedNativeProcess(
  context: NativePlaybackContext,
  databaseService: NativePlaybackDatabase,
  reason: string,
): Promise<NativePlaybackStatus> {
  const config = buildNativePlaybackConfig(context);
  const saved = mergeNativePlaybackStatus(config, await readNativePlaybackStatus(context, databaseService));
  if (activeProcess && !activeProcess.killed) {
    activeProcess.kill();
    activeProcess = null;
  }
  const status: NativePlaybackStatus = {
    ...saved,
    status: 'stopped',
    pid: null,
    stoppedAt: new Date().toISOString(),
    lastExitCode: saved.lastExitCode,
    messages: [`Native playback stop requested: ${reason}.`, ...saved.messages].slice(0, 8),
  };
  await persistNativePlaybackStatus(context, databaseService, status);
  return status;
}

// Builds player-specific spawn arguments without using a shell.
function buildNativePlaybackCommand(config: NativePlaybackConfig, mediaPath: string, mediaType: string | null): { executable: string; args: string[] } {
  if (config.player === 'vlc') {
    const args = [config.fullscreen ? '--fullscreen' : null, '--play-and-exit', mediaPath].filter((arg): arg is string => Boolean(arg));
    return { executable: config.playerPath, args };
  }

  const args = [
    config.fullscreen ? '--fs' : null,
    config.fullscreen ? '--no-border' : null,
    '--keep-open=yes',
    mediaType === 'image' ? `--image-display-duration=${config.imageDurationSeconds}` : null,
    mediaPath,
  ].filter((arg): arg is string => Boolean(arg));
  return { executable: config.playerPath, args };
}

// Detects whether the configured executable responds to a version command.
function detectNativePlaybackExecutable(config: NativePlaybackConfig): NativePlaybackDetection {
  const checkedAt = new Date().toISOString();
  if (config.player === 'mock') {
    return {
      available: true,
      player: config.player,
      executable: config.playerPath,
      checkedAt,
      message: 'Mock native playback player is available for tests; no OS player is required.',
      stdoutPreview: null,
      stderrPreview: null,
    };
  }

  const result = spawnSync(config.playerPath, ['--version'], { encoding: 'utf8', timeout: 3000, shell: false });
  const available = !result.error && typeof result.status === 'number' && result.status >= 0;
  return {
    available,
    player: config.player,
    executable: config.playerPath,
    checkedAt,
    message: available
      ? `Native playback player ${config.playerPath} responded to --version.`
      : `Native playback player ${config.playerPath} is not available or did not respond to --version.`,
    stdoutPreview: previewText(result.stdout),
    stderrPreview: previewText(result.stderr ?? (result.error ? result.error.message : '')),
  };
}

// Persists native playback status in runtime_state when a database is configured.
async function persistNativePlaybackStatus(context: NativePlaybackContext, databaseService: NativePlaybackDatabase, status: NativePlaybackStatus): Promise<void> {
  await databaseService.setRuntimeState(context, NATIVE_PLAYBACK_STATUS_KEY, status);
}

// Reads native playback status from runtime_state and ignores incompatible shapes.
async function readNativePlaybackStatus(context: NativePlaybackContext, databaseService: NativePlaybackDatabase): Promise<NativePlaybackStatus | null> {
  const saved = await databaseService.getRuntimeState<NativePlaybackStatus>(context, NATIVE_PLAYBACK_STATUS_KEY);
  return saved && saved.schemaVersion === NATIVE_PLAYBACK_SCHEMA_VERSION ? saved : null;
}

// Merges saved status with current config so stale env values are not displayed as current truth.
function mergeNativePlaybackStatus(config: NativePlaybackConfig, saved: NativePlaybackStatus | null): NativePlaybackStatus {
  return {
    enabled: config.enabled,
    autoStartOnWorker: config.autoStartOnWorker,
    platform: config.platform,
    player: config.player,
    playerPath: config.playerPath,
    status: saved?.status ?? 'idle',
    pid: saved?.pid ?? null,
    currentMediaAssetId: saved?.currentMediaAssetId ?? null,
    currentDisplayName: saved?.currentDisplayName ?? null,
    currentMediaType: saved?.currentMediaType ?? null,
    currentPathPreview: saved?.currentPathPreview ?? null,
    startedAt: saved?.startedAt ?? null,
    stoppedAt: saved?.stoppedAt ?? null,
    lastExitCode: saved?.lastExitCode ?? null,
    lastError: saved?.lastError ?? null,
    lastCommandSummary: saved?.lastCommandSummary ?? null,
    messages: saved?.messages ?? ['Native playback has not been started in this runtime database.'],
    schemaVersion: NATIVE_PLAYBACK_SCHEMA_VERSION,
  };
}

// Builds a running native playback status payload.
function buildRunningStatus(
  config: NativePlaybackConfig,
  item: PlaybackContractItem,
  mediaPath: string,
  pid: number | null,
  startedAt: string,
  commandSummary: string,
  message: string,
): NativePlaybackStatus {
  return {
    enabled: config.enabled,
    autoStartOnWorker: config.autoStartOnWorker,
    platform: config.platform,
    player: config.player,
    playerPath: config.playerPath,
    status: 'running',
    pid,
    currentMediaAssetId: String(item.mediaAssetId),
    currentDisplayName: item.displayName,
    currentMediaType: item.mediaType,
    currentPathPreview: path.basename(mediaPath),
    startedAt,
    stoppedAt: null,
    lastExitCode: null,
    lastError: null,
    lastCommandSummary: commandSummary,
    messages: [message],
    schemaVersion: NATIVE_PLAYBACK_SCHEMA_VERSION,
  };
}

// Builds a failed native playback status payload.
function buildFailedStatus(config: NativePlaybackConfig, item: PlaybackContractItem, mediaPath: string, error: string, commandSummary: string): NativePlaybackStatus {
  return {
    ...buildRunningStatus(config, item, mediaPath, null, new Date().toISOString(), commandSummary, 'Native playback failed before a stable process was started.'),
    status: 'failed',
    stoppedAt: new Date().toISOString(),
    lastError: error,
    messages: [error],
  };
}

// Normalizes platform config for Windows/Raspberry native player routes.
function normalizeNativePlaybackPlatform(value: unknown, nodePlatform: NodeJS.Platform): NativePlaybackPlatform {
  if (value === 'raspberry' || value === 'raspberry-os' || value === 'rpi') {
    return 'raspberry';
  }
  if (value === 'windows') {
    return 'windows';
  }
  return nodePlatform === 'win32' ? 'windows' : 'raspberry';
}

// Normalizes the configured player while keeping `mpv` as the production-friendly default.
function normalizeNativePlaybackPlayer(value: unknown): NativePlaybackPlayer {
  if (value === 'vlc' || value === 'mock') {
    return value;
  }
  return 'mpv';
}

// Resolves the configured player, preferring repo-local Windows mpv when available.
function resolveNativePlaybackPlayerPath(value: unknown, player: NativePlaybackPlayer, context: NativePlaybackContext): string {
  const configuredPath = readText(value, '');
  if (configuredPath) {
    return configuredPath;
  }
  if (player === 'mpv') {
    const localWindowsMpvPath = resolveLocalWindowsMpvPath(context);
    if (localWindowsMpvPath) {
      return localWindowsMpvPath;
    }
  }
  return player;
}

// Finds the repo-local portable mpv executable installed by tools/install-mpv-windows.ps1.
function resolveLocalWindowsMpvPath(context: NativePlaybackContext): string | null {
  if (context.platform !== 'win32') {
    return null;
  }
  const repoRoot = context.repoRoot ? path.resolve(context.repoRoot) : process.cwd();
  const candidate = path.join(repoRoot, 'tools', 'mpv', 'windows', 'mpv.exe');
  return existsSync(candidate) ? candidate : null;
}

// Reads common truthy/falsey environment values.
function readBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value !== 'string') {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }
  return fallback;
}

// Reads a non-empty environment text value with fallback.
function readText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

// Reads a positive integer environment value with fallback.
function readPositiveInteger(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
}

// Limits process output and errors before they enter API payloads or logs.
function previewText(value: unknown): string | null {
  const text = typeof value === 'string' ? value.trim() : '';
  return text ? text.slice(0, 300) : null;
}

// Produces a stable message from thrown values.
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
