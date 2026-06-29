// Implements the terminal DB image playback button using real SQLite helpers.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
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
}

export function runDbImagePlaybackButton(boundary: RuntimeBoundaryState): DbImagePlaybackButtonResult {
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

  if (process.platform !== 'win32' || process.env.TERMINAL_DEMO_DB_PLAYBACK_PROOF === '1') {
    return { status: 'rendered', messages: [...messages, 'Windowed playback open skipped outside Windows/proof mode.'], viewerPath, address, filePath };
  }

  const openResult = openWindowedViewerOnWindows(viewerPath);
  if (!openResult.ok) return blocked(messages, `Windows viewer launch failed: ${openResult.messages.join(' | ')}`);
  return { status: 'displayed', messages: [...messages, ...openResult.messages, 'Windowed playback opened on Windows.'], viewerPath, address, filePath };
}

function blocked(messages: string[], reason: string): DbImagePlaybackButtonResult {
  return { status: 'blocked', messages: [...messages, `BLOCKED: ${reason}`], viewerPath: '', address: '', filePath: '' };
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
  if (!existsSync(viewerPath)) return { ok: false, messages: [`viewer file missing: ${viewerPath}`] };

  const powershellCommands = ['powershell.exe', 'powershell'];
  const psScript = [
    "$ErrorActionPreference = 'Stop'",
    '$viewerPath = $args[0]',
    'if (-not (Test-Path -LiteralPath $viewerPath)) { throw "Viewer path missing: $viewerPath" }',
    'Start-Process -FilePath $viewerPath'
  ].join('; ');

  for (const command of powershellCommands) {
    const result = spawnSync(command, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psScript, viewerPath], {
      encoding: 'utf8',
      timeout: 10000
    });
    if (result.error && (result.error as NodeJS.ErrnoException).code === 'ENOENT') continue;
    if (result.status === 0) return { ok: true, messages: [`Windows viewer launch: ${command} Start-Process -FilePath succeeded.`] };
    const detail = formatSpawnFailure(`${command} Start-Process -FilePath`, result.status, result.stdout, result.stderr, result.error);
    const fallback = openWindowedViewerWithCmdStart(viewerPath, detail);
    if (fallback.ok) return fallback;
    return fallback;
  }

  return openWindowedViewerWithCmdStart(viewerPath, 'PowerShell executable not found.');
}

function openWindowedViewerWithCmdStart(viewerPath: string, previousFailure: string): ViewerOpenResult {
  const quotedViewerPath = viewerPath.replace(/"/g, '""');
  const result = spawnSync('cmd.exe', ['/d', '/s', '/c', `start "" "${quotedViewerPath}"`], {
    encoding: 'utf8',
    timeout: 10000
  });
  if (result.status === 0) {
    return {
      ok: true,
      messages: [previousFailure, 'Windows viewer launch fallback: cmd.exe start succeeded.']
    };
  }
  return {
    ok: false,
    messages: [previousFailure, formatSpawnFailure('cmd.exe start fallback', result.status, result.stdout, result.stderr, result.error)]
  };
}

function formatSpawnFailure(label: string, status: number | null, stdout: string, stderr: string, error?: Error): string {
  const detail = stderr.trim() || stdout.trim() || error?.message || `exit ${status ?? 'unknown'}`;
  return `${label} failed: ${detail}`;
}

function buildHtml(imageUrl: string, address: string): string {
  return `<!doctype html><meta charset="utf-8"><title>PhotoFrame Demo DB Playback</title><style>body{margin:0;background:#111;color:#fff;font-family:system-ui,Arial}img{max-width:100vw;max-height:100vh;display:block;margin:auto}.overlay{position:fixed;left:24px;right:24px;bottom:24px;padding:14px 18px;background:rgba(0,0,0,.68);font-size:24px;border-radius:10px}</style><img src="${imageUrl}" alt="PhotoFrame demo playback image"><div class="overlay">${escapeHtml(address)}</div>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char] ?? char));
}
