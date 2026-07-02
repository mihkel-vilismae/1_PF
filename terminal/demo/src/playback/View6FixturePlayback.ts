// Implements real View 6 fixture-backed playback artifact generation.
// This stays fixture-only: no queue execution, DB writes, cron, auth, or workers.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { RuntimeBoundaryState } from '../config/runtimeTypes.js';
import { writeTerminalActionLog } from '../run/TerminalActionLogWriter.js';
import {
  view6FixturePlaybackButtons,
  view6PlaybackFixtures,
  type View6PlaybackButtonContract,
  type View6PlaybackMode
} from './View6PlaybackContract.js';

export type View6FixtureButtonKey = '1' | '2' | '3' | '4' | '5' | '6';
export const VIEW6_FIXTURE_PLAYBACK_READY = 'VIEW6_FIXTURE_PLAYBACK_READY';
export const VIEW6_FIXTURE_PLAYBACK_DISPLAYED = 'VIEW6_FIXTURE_PLAYBACK_DISPLAYED';
export const VIEW6_FIXTURE_PLAYBACK_BLOCKED = 'VIEW6_FIXTURE_PLAYBACK_BLOCKED';

export interface View6FixturePlaybackResult {
  status: 'rendered' | 'displayed' | 'blocked';
  result: typeof VIEW6_FIXTURE_PLAYBACK_READY | typeof VIEW6_FIXTURE_PLAYBACK_DISPLAYED | typeof VIEW6_FIXTURE_PLAYBACK_BLOCKED;
  button: View6PlaybackButtonContract;
  fixturePath: string;
  viewerPath: string;
  logPath: string;
  logStatus: 'written' | 'skipped';
  lines: string[];
}

interface ViewerOpenResult {
  ok: boolean;
  attempts: string[];
  messages: string[];
}

// Checks whether a key maps to one of the six View 6 fixture playback buttons.
export function isView6FixtureButtonKey(key: string): key is View6FixtureButtonKey {
  return /^[1-6]$/.test(key);
}

// Runs fixture-backed playback by writing a browser-renderable HTML viewer artifact.
export function runView6FixturePlayback(input: {
  boundary: RuntimeBoundaryState;
  key: View6FixtureButtonKey;
}): View6FixturePlaybackResult {
  const startedAt = new Date().toISOString();
  const button = view6FixturePlaybackButtons[Number(input.key) - 1];
  if (!button) throw new Error(`unknown View 6 fixture button key: ${input.key}`);
  const fixture = view6PlaybackFixtures.find((candidate) => candidate.role === button.mediaType);
  const fixturePath = fixture ? join(input.boundary.repoRoot, fixture.fixturePath) : '';

  if (!fixture || !existsSync(fixturePath)) {
    return finish(input, button, fixturePath || 'missing fixture contract', '', 'blocked', [
      'VIEW 6 FIXTURE PLAYBACK BLOCKED',
      `Button ${input.key}: ${button.label}`,
      `Fixture media type: ${button.mediaType}`,
      `Playback mode: ${button.playbackMode}`,
      `BLOCKED: fixture file missing: ${fixturePath || 'missing fixture contract'}`,
      'No queue, DB, cron, auth, worker, or hardware behavior ran.'
    ], startedAt);
  }

  const viewerPath = writeFixtureViewer({ boundary: input.boundary, key: input.key, button, fixturePath });
  const openResult = openViewerIfAllowed(viewerPath);
  const status = openResult.ok ? 'displayed' : 'rendered';
  const modeLine = describeMode(button.playbackMode);
  return finish(input, button, fixturePath, viewerPath, status, [
    'VIEW 6 REAL FIXTURE PLAYBACK',
    `Button ${input.key}: ${button.label}`,
    `Fixture media type: ${button.mediaType}`,
    `Playback mode: ${button.playbackMode}`,
    `Playback mode detail: ${modeLine}`,
    `Fixture path: ${fixturePath}`,
    `Viewer artifact: ${viewerPath}`,
    `Viewer artifact status: ${status}`,
    ...openResult.messages,
    'Queue-backed playback remains disabled; this uses hard-coded fixture files only.',
    'No DB writes, cron, auth, worker execution, or queue execution ran.'
  ], startedAt);
}

function finish(
  input: { boundary: RuntimeBoundaryState; key: View6FixtureButtonKey },
  button: View6PlaybackButtonContract,
  fixturePath: string,
  viewerPath: string,
  status: 'rendered' | 'displayed' | 'blocked',
  lines: string[],
  startedAt: string
): View6FixturePlaybackResult {
  const result = status === 'displayed'
    ? VIEW6_FIXTURE_PLAYBACK_DISPLAYED
    : status === 'rendered'
      ? VIEW6_FIXTURE_PLAYBACK_READY
      : VIEW6_FIXTURE_PLAYBACK_BLOCKED;
  const log = writeTerminalActionLog({
    boundary: input.boundary,
    event: {
      source: 'terminal-demo',
      view: '6',
      action: 'view6_fixture_playback_real',
      branchFeature: 'view6_fixture_playback',
      button: button.label,
      buttonKey: input.key,
      status,
      mediaType: button.mediaType,
      playbackMode: button.playbackMode,
      fixturePath,
      viewerPath,
      noCron: true,
      launchesPlayback: status === 'displayed',
      viewerWritten: Boolean(viewerPath),
      queueBacked: false,
      dbWrites: false,
      workers: false,
      auth: false,
      startedAt,
      result,
      messages: lines
    }
  });
  return {
    status,
    result,
    button,
    fixturePath,
    viewerPath,
    logPath: log.logPath,
    logStatus: log.status,
    lines: [...lines, `Action log: ${log.status} ${log.logPath}`]
  };
}

function writeFixtureViewer(input: {
  boundary: RuntimeBoundaryState;
  key: View6FixtureButtonKey;
  button: View6PlaybackButtonContract;
  fixturePath: string;
}): string {
  const viewerPath = join(input.boundary.runtimeOutputDir, 'view6-fixture-playback', `button-${input.key}-${input.button.mediaType}-${input.button.playbackMode}.html`);
  mkdirSync(dirname(viewerPath), { recursive: true });
  writeFileSync(viewerPath, buildViewerHtml(input), 'utf8');
  return viewerPath;
}

function buildViewerHtml(input: {
  button: View6PlaybackButtonContract;
  fixturePath: string;
}): string {
  const mediaUrl = pathToFileURL(resolve(input.fixturePath)).href;
  const title = `View 6 Fixture Playback - ${input.button.label}`;
  const overlay = input.button.playbackMode === 'address_overlay' ? buildAddressOverlay() : '';
  const media = input.button.mediaType === 'image'
    ? `<img class="media" src="${mediaUrl}" alt="View 6 fixture image playback">`
    : `<video class="media" src="${mediaUrl}" controls autoplay muted loop playsinline></video>`;
  const fullscreenScript = input.button.playbackMode === 'fullscreen_no_overlay'
    ? '<script>document.addEventListener("click",()=>document.documentElement.requestFullscreen?.().catch(()=>{}),{once:true});</script>'
    : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  body{margin:0;background:#050505;color:#f6f6f6;font-family:system-ui,Segoe UI,Arial,sans-serif;overflow:hidden}
  .stage{width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;background:#050505}
  .media{max-width:100vw;max-height:100vh;object-fit:contain;display:block}
  .badge{position:fixed;top:16px;left:16px;background:rgba(0,0,0,.72);padding:8px 12px;border-radius:8px;font-size:13px;letter-spacing:.02em}
  .overlay{position:fixed;left:24px;right:24px;bottom:24px;padding:16px 20px;border-radius:12px;background:rgba(0,0,0,.7);font-size:24px;line-height:1.3;box-shadow:0 8px 32px rgba(0,0,0,.35)}
</style>
</head>
<body data-view="6" data-source="fixture" data-playback-mode="${input.button.playbackMode}" data-media-type="${input.button.mediaType}">
<div class="stage">${media}</div>
<div class="badge">View 6 fixture playback / ${escapeHtml(input.button.mediaType)} / ${escapeHtml(input.button.playbackMode)}</div>
${overlay}
${fullscreenScript}
</body>
</html>`;
}

function buildAddressOverlay(): string {
  return '<div class="overlay"><strong>Fixture address overlay:</strong> GPS-valid Tartu demo fixture. Queue/address pipeline is not used in this slice.</div>';
}

function openViewerIfAllowed(viewerPath: string): ViewerOpenResult {
  if (process.env.TERMINAL_DEMO_VIEW6_FORCE_WINDOWS_OPEN === '1') return openViewerOnWindows(viewerPath);
  if (process.platform !== 'win32') return { ok: false, attempts: [], messages: ['Viewer open skipped outside Windows; HTML playback artifact was written.'] };
  if (process.env.TERMINAL_DEMO_VIEW6_PLAYBACK_PROOF === '1') return { ok: false, attempts: [], messages: ['Viewer open skipped in proof mode; HTML playback artifact was written.'] };
  return openViewerOnWindows(viewerPath);
}

function openViewerOnWindows(viewerPath: string): ViewerOpenResult {
  if (!existsSync(viewerPath)) return { ok: false, attempts: ['viewer-file-exists'], messages: [`viewer file missing: ${viewerPath}`] };
  const fileUrl = pathToFileURL(viewerPath).href;
  const attempts = [
    { label: 'rundll32 FileProtocolHandler', command: 'rundll32.exe', args: ['url.dll,FileProtocolHandler', fileUrl] },
    { label: 'explorer.exe', command: 'explorer.exe', args: [viewerPath] }
  ];
  const messages: string[] = [];
  for (const attempt of attempts) {
    const result = spawnSync(attempt.command, attempt.args, { encoding: 'utf8', timeout: 10000 });
    if (result.status === 0) return { ok: true, attempts: [attempt.label], messages: [`Windows viewer launch: ${attempt.label} succeeded.`] };
    messages.push(formatSpawnFailure(attempt.label, result.status, result.stdout, result.stderr, result.error));
  }
  return { ok: false, attempts: attempts.map((attempt) => attempt.label), messages };
}

function formatSpawnFailure(label: string, status: number | null, stdout: string, stderr: string, error?: Error): string {
  const detail = stderr.trim() || stdout.trim() || error?.message || `exit ${status ?? 'unknown'}`;
  return `Windows viewer launch skipped/failed: ${label}: ${detail}`;
}

function describeMode(mode: View6PlaybackMode): string {
  if (mode === 'html_browser') return 'browser-renderable HTML viewer artifact';
  if (mode === 'fullscreen_no_overlay') return 'fullscreen-capable HTML viewer artifact without address overlay';
  return 'browser-renderable HTML viewer artifact with fixture address overlay';
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] ?? char));
}
