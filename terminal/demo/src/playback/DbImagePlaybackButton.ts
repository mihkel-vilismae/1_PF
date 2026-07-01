// Implements the terminal DB image playback button using real SQLite helpers.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { RuntimeBoundaryState } from '../config/runtimeTypes.js';
import { normalizeForCompare } from '../config/pathUtils.js';
import { asNumber, asString, isRecord, runSqlitePlaybackHelper } from './DbPlaybackHelpers.js';

export interface DbImagePlaybackButtonResult {
  status: 'displayed' | 'rendered' | 'blocked';
  messages: string[];
  viewerPath: string;
  address: string;
  filePath: string;
}

interface ViewerOpenResult {
  ok: boolean;
  messages: string[];
  attempts: string[];
}

interface PartialPlaybackState {
  viewerPath?: string;
  address?: string;
  filePath?: string;
}

export function runDbImagePlaybackButton(boundary: RuntimeBoundaryState): DbImagePlaybackButtonResult {
  const startedAt = new Date().toISOString();
  const result = runDbImagePlaybackButtonInternal(boundary);
  writePButtonActionLog(boundary, result, startedAt);
  return result;
}

function runDbImagePlaybackButtonInternal(boundary: RuntimeBoundaryState): DbImagePlaybackButtonResult {
  const messages = ['P pressed: DB-backed windowed image playback button.'];
  if (!existsSync(boundary.dbPath)) return blocked(messages, `DEMO_DB_PATH missing: ${boundary.dbPath}`);

  const contract = runSqlitePlaybackHelper(boundary.repoRoot, 'playback_contract', [boundary.dbPath, boundary.repoRoot, '25']);
  messages.push(...contract.messages.map((message) => `playback_contract: ${message}`));
  if (contract.status !== 'ok' || !isRecord(contract.output)) return blocked(messages, 'playback_contract failed.');
  if (!isRecord(contract.output.nextItem)) return blocked(messages, 'No READY slideshow_queue row found.');

  const selected = runSqlitePlaybackHelper(boundary.repoRoot, 'stage6_select_current', [boundary.dbPath, new Date().toISOString(), boundary.repoRoot]);
  messages.push(...selected.messages.map((message) => `stage6_select_current: ${message}`));
  const selectedPayload = isRecord(selected.output) && isRecord(selected.output.selected) ? selected.output.selected : null;
  if (selected.status !== 'ok' || !selectedPayload) return blocked(messages, 'stage6_select_current did not select a playable row.');

  const mediaAssetId = asNumber(selectedPayload.mediaAssetId);
  if (mediaAssetId === null) return blocked(messages, 'Selected row did not contain numeric mediaAssetId.');
  const asset = runSqlitePlaybackHelper(boundary.repoRoot, 'playback_asset_media_path', [boundary.dbPath, String(mediaAssetId), boundary.repoRoot]);
  messages.push(...asset.messages.map((message) => `playback_asset_media_path: ${message}`));
  if (asset.status !== 'ok' || !isRecord(asset.output) || asset.output.found !== true) return blocked(messages, 'Selected media asset path was not resolvable.');

  const filePath = asString(asset.output.resolvedPath);
  const mediaType = asString(asset.output.mediaType);
  if (mediaType !== 'image') return blocked(messages, `Selected DB row is not an image: ${mediaType || 'unknown'}`);
  if (!existsSync(filePath)) return blocked(messages, `Selected image file missing: ${filePath}`);
  if (!isUnderDemoMediaRoot(filePath, boundary.downloadDir)) return blocked(messages, 'Selected image path is outside DEMO_DOWNLOAD_DIR.');

  const address = asString(selectedPayload.addressText) || 'Address pending until GPS/geocode stages produce a resolved address.';
  const viewerPath = writeWindowedViewer(boundary, filePath, address);
  messages.push(`Windowed playback viewer written: ${viewerPath}`);

  if (!shouldOpenViewerOnThisPlatform()) {
    return { status: 'rendered', messages: [...messages, 'Windowed playback open skipped outside Windows/proof mode.'], viewerPath, address, filePath };
  }

  const openResult = openWindowedViewerOnWindows(viewerPath);
  const openMessages = [...messages, ...openResult.messages];
  if (!openResult.ok) {
    return blocked(openMessages, `Windows viewer launch failed after ${openResult.attempts.join(' -> ')}`, { viewerPath, address, filePath });
  }
  return { status: 'displayed', messages: [...openMessages, 'Windowed playback opened on Windows.'], viewerPath, address, filePath };
}

function blocked(messages: string[], reason: string, partial: PartialPlaybackState = {}): DbImagePlaybackButtonResult {
  return {
    status: 'blocked',
    messages: [...messages, `BLOCKED: ${reason}`],
    viewerPath: partial.viewerPath ?? '',
    address: partial.address ?? '',
    filePath: partial.filePath ?? ''
  };
}

function shouldOpenViewerOnThisPlatform(): boolean {
  if (process.env.TERMINAL_DEMO_DB_PLAYBACK_FORCE_WINDOWS_OPEN === '1') return true;
  return process.platform === 'win32' && process.env.TERMINAL_DEMO_DB_PLAYBACK_PROOF !== '1';
}

function isUnderDemoMediaRoot(filePath: string, demoDownloadDir: string): boolean {
  const file = normalizeForCompare(filePath);
  const root = normalizeForCompare(demoDownloadDir);
  return file === root || file.startsWith(`${root}/`);
}

function writeWindowedViewer(boundary: RuntimeBoundaryState, filePath: string, address: string): string {
  const viewerPath = join(boundary.runtimeOutputDir, 'db-image-playback', 'windowed-playback.html');
  mkdirSync(dirname(viewerPath), { recursive: true });
  const imageUrl = pathToFileURL(filePath).href;
  writeFileSync(viewerPath, buildHtml(imageUrl, address), 'utf8');
  return viewerPath;
}

function openWindowedViewerOnWindows(viewerPath: string): ViewerOpenResult {
  if (!existsSync(viewerPath)) return { ok: false, messages: [`viewer file missing: ${viewerPath}`], attempts: ['viewer-file-exists'] };
  if (process.env.TERMINAL_DEMO_DB_PLAYBACK_FAKE_OPEN_FAILURE === '1') {
    return {
      ok: false,
      attempts: ['Invoke-Item -LiteralPath', 'rundll32 FileProtocolHandler', 'explorer.exe'],
      messages: [
        'Windows viewer launch attempt: Invoke-Item -LiteralPath simulated failure.',
        'Windows viewer launch attempt: rundll32 FileProtocolHandler simulated failure.',
        'Windows viewer launch attempt: explorer.exe simulated failure.'
      ]
    };
  }

  const attempts: string[] = [];
  const messages: string[] = [];
  const invokeItem = tryInvokeItemLaunch(viewerPath);
  attempts.push('Invoke-Item -LiteralPath');
  messages.push(...invokeItem.messages);
  if (invokeItem.ok) return { ok: true, attempts, messages };

  const fileUrl = pathToFileURL(viewerPath).href;
  const rundll = trySpawnLaunch('rundll32 FileProtocolHandler', 'rundll32.exe', ['url.dll,FileProtocolHandler', fileUrl]);
  attempts.push('rundll32 FileProtocolHandler');
  messages.push(...rundll.messages);
  if (rundll.ok) return { ok: true, attempts, messages };

  const explorer = trySpawnLaunch('explorer.exe', 'explorer.exe', [viewerPath]);
  attempts.push('explorer.exe');
  messages.push(...explorer.messages);
  return { ok: explorer.ok, attempts, messages };
}

function tryInvokeItemLaunch(viewerPath: string): ViewerOpenResult {
  const psScript = [
    "$ErrorActionPreference = 'Stop'",
    '$viewerPath = $args[0]',
    'if (-not (Test-Path -LiteralPath $viewerPath)) { throw "Viewer path missing: $viewerPath" }',
    'Invoke-Item -LiteralPath $viewerPath'
  ].join('; ');
  for (const command of ['powershell.exe', 'powershell']) {
    const result = spawnSync(command, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psScript, viewerPath], { encoding: 'utf8', timeout: 10000 });
    if (result.error && (result.error as NodeJS.ErrnoException).code === 'ENOENT') continue;
    if (result.status === 0) return { ok: true, attempts: ['Invoke-Item -LiteralPath'], messages: [`Windows viewer launch: ${command} Invoke-Item -LiteralPath succeeded.`] };
    return { ok: false, attempts: ['Invoke-Item -LiteralPath'], messages: [formatSpawnFailure(`${command} Invoke-Item -LiteralPath`, result.status, result.stdout, result.stderr, result.error)] };
  }
  return { ok: false, attempts: ['Invoke-Item -LiteralPath'], messages: ['Invoke-Item -LiteralPath failed: PowerShell executable not found.'] };
}

function trySpawnLaunch(label: string, command: string, args: string[]): ViewerOpenResult {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 10000 });
  if (result.status === 0) return { ok: true, attempts: [label], messages: [`Windows viewer launch: ${label} succeeded.`] };
  return { ok: false, attempts: [label], messages: [formatSpawnFailure(label, result.status, result.stdout, result.stderr, result.error)] };
}

function formatSpawnFailure(label: string, status: number | null, stdout: string, stderr: string, error?: Error): string {
  const detail = stderr.trim() || stdout.trim() || error?.message || `exit ${status ?? 'unknown'}`;
  return `${label} failed: ${detail}`;
}

function writePButtonActionLog(boundary: RuntimeBoundaryState, result: DbImagePlaybackButtonResult, startedAt: string): void {
  try {
    mkdirSync(boundary.logDir, { recursive: true });
    const event = {
      timestamp: new Date().toISOString(),
      startedAt,
      button: 'P',
      action: 'db_image_playback',
      status: result.status,
      viewerWritten: Boolean(result.viewerPath),
      viewerPath: result.viewerPath,
      selectedFile: result.filePath,
      address: result.address,
      attempts: result.messages.filter((message) => /Invoke-Item|rundll32|explorer\.exe|viewer launch/i.test(message)),
      reason: result.messages.find((message) => message.startsWith('BLOCKED:')) ?? '',
      messages: result.messages
    };
    appendFileSync(join(boundary.logDir, 'terminal-button-actions.jsonl'), `${JSON.stringify(event)}\n`, 'utf8');
  } catch {
    // A logging failure must not block or fake the playback result.
  }
}

function buildHtml(imageUrl: string, address: string): string {
  return `<!doctype html><meta charset="utf-8"><title>PhotoFrame Demo DB Playback</title><style>body{margin:0;background:#111;color:#fff;font-family:system-ui,Arial}img{max-width:100vw;max-height:100vh;display:block;margin:auto}.overlay{position:fixed;left:24px;right:24px;bottom:24px;padding:14px 18px;background:rgba(0,0,0,.68);font-size:24px;border-radius:10px}</style><img src="${imageUrl}" alt="PhotoFrame demo playback image"><div class="overlay">${escapeHtml(address)}</div>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char] ?? char));
}
