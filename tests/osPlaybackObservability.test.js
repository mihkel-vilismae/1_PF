/*
 * Guards Goal 1 Slice 4 playback observability wiring.
 * These tests verify scheduler/log/worker panels consume backend evidence
 * without replacing the read-only playback queue contract or A-E behavior.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { createInitialState } from '../dashboard/services/runtimeTruth/runtimeTruthState.ts';
import { buildOsPlaybackViewModel, OS_PLAYBACK_PLATFORMS } from '../dashboard/services/osPlaybackViewModel.ts';
import { renderOsPlaybackView } from '../dashboard/views/osPlaybackView.ts';

const appSource = readFileSync('dashboard/app.ts', 'utf8');
const serverSource = readFileSync('server/index.ts', 'utf8');
const docsSource = readFileSync('docs/OS_PLAYBACK_VIEWS_SLICE_4.md', 'utf8');

function buildObservedState() {
  const state = createInitialState();
  state.osPlaybackObservability = {
    windows: {
      status: 'ready',
      loadedAt: '2026-05-28T04:25:00.000Z',
      payload: {
        status: 'ok',
        platform: 'windows',
        workers: [
          {
            key: 'regular-state-worker',
            label: 'Regular state worker',
            status: 'Observed',
            lastCalled: '07:22:00',
            sinceLastCall: '2m ago',
            summary: 'Regular worker latest evidence: regular-stage-worker executed.',
          },
          {
            key: 'playback-worker',
            label: 'Playback worker',
            status: 'Recent',
            lastCalled: '07:23:45',
            sinceLastCall: '3s ago',
            summary: 'Playback worker latest evidence: playback-worker executed.',
          },
          {
            key: 'on-off-worker',
            label: 'On-off worker',
            status: 'Waiting',
            lastCalled: 'Never',
            sinceLastCall: 'No worker call observed yet',
            summary: 'Waiting for screen-on-off-worker evidence.',
          },
        ],
        scheduler: {
          entries: [
            { at: '07:23:45', type: 'cron-run-success', message: 'playback-worker executed: success rc=0.' },
          ],
        },
        logs: {
          error: {
            entries: [
              { at: '07:24:00', type: 'error', message: 'Playback media file missing.' },
            ],
          },
          main: {
            entries: [
              { at: '07:23:50', type: 'info', message: 'Playback observability refreshed from full_log.log.' },
            ],
          },
        },
      },
    },
  };
  return state;
}

test('playback view model uses backend observability for workers and logs', () => {
  const viewModel = buildOsPlaybackViewModel(buildObservedState(), OS_PLAYBACK_PLATFORMS.windows);

  assert.equal(viewModel.workers[0].status, 'Observed');
  assert.equal(viewModel.workers[1].status, 'Recent');
  assert.equal(viewModel.workers[2].lastCalled, 'Never');
  assert.match(viewModel.schedulerLog[0].message, /playback-worker executed/);
  assert.equal(viewModel.schedulerLog[0].type, 'success');
  assert.match(viewModel.errorLog[0].message, /Playback media file missing/);
  assert.equal(viewModel.errorLog[0].type, 'error');
  assert.match(viewModel.mainLog[0].message, /full_log\.log/);
});

test('playback terminal controls are active and scoped by platform and kind', () => {
  const markup = renderOsPlaybackView(buildObservedState(), OS_PLAYBACK_PLATFORMS.windows);

  assert.match(markup, /data-os-terminal-copy-all-platform="windows"/);
  assert.match(markup, /data-os-terminal-copy-all-kind="scheduler"/);
  assert.match(markup, /data-os-terminal-clear-kind="error"/);
  assert.match(markup, /data-os-terminal-row-expand-platform="windows"/);
  assert.match(markup, /data-os-terminal-row-expand-kind="main"/);
  assert.doesNotMatch(markup, /data-os-terminal-copy-all-platform="windows"[^>]*disabled/);
  assert.doesNotMatch(markup, /data-os-terminal-row-expand-platform="windows"[^>]*disabled/);
});

test('frontend loads and polls OS playback observability without backend mutation shortcuts', () => {
  const observabilityRequest = appSource.match(
    /requestJson<Record<string, unknown>>\(`\/api\/runtime\/playback\/observability\?platform=\$\{platform\}&limit=40`,\s*\{[\s\S]*?operation: `Load \$\{platform\} playback observability`,[\s\S]*?\n\s*\}\);/,
  );

  assert.ok(observabilityRequest, 'Expected a dedicated read-only playback observability request.');
  assert.match(appSource, /startOsPlaybackObservabilityPolling/);
  assert.match(appSource, /OS_PLAYBACK_OBSERVABILITY_POLL_MS = 5000/);
  assert.match(appSource, /copyOsPlaybackTerminalToClipboard/);
  assert.match(appSource, /clearOsPlaybackTerminal/);
  assert.match(appSource, /openOsPlaybackTerminalRow/);
  assert.doesNotMatch(observabilityRequest[0], /method:\s*'POST'/);
});

test('backend exposes read-only playback observability from scheduler and mode-specific logs', () => {
  assert.match(serverSource, /'GET \/api\/runtime\/playback\/observability': runtimePlaybackObservabilityHandler/);
  assert.match(serverSource, /buildWindowsCronRunLog\(\)/);
  assert.match(serverSource, /buildRaspberryCronRunLog\(context\)/);
  assert.match(serverSource, /context\.envValues\.LOG_DIR \|\| DEFAULT_LOG_DIR/);
  assert.match(serverSource, /error\.log/);
  assert.match(serverSource, /full_log\.log/);
  assert.doesNotMatch(serverSource, /POST \/api\/runtime\/playback\/observability/);
});

test('slice documentation records observability boundaries and deferred real screen detection reuse', () => {
  assert.match(docsSource, /read-only observability contract/);
  assert.match(docsSource, /runtime_data\/logs/);
  assert.match(docsSource, /test_runtime_data\/logs/);
  assert.match(docsSource, /PIR\/mouse\/keyboard detection reuse remains outside this slice/);
});
