// Renders the View 6 fixture playback page.
// Queue-backed playback is visible but disabled.
// Fixture buttons write real browser-renderable playback artifacts.

import type { DemoTerminalState } from '../state/DemoTerminalState.js';
import {
  VIEW6_QUEUE_DISABLED_NOTICE,
  view6FixturePlaybackButtons,
  view6PlaybackFixtures,
  view6QueuePlaybackButtons,
  type View6PlaybackButtonContract
} from '../playback/View6PlaybackContract.js';
import { VIEW6_FIXTURE_PLAYBACK_READY, VIEW6_FIXTURE_PLAYBACK_DISPLAYED } from '../playback/View6FixturePlayback.js';
import { color } from './ansi.js';
import { panel, stackBlocks } from './terminalBox.js';

// Renders View 6 with disabled queue controls and enabled fixture placeholders.
export function renderViewSixPlayback(state: DemoTerminalState, width?: number): string {
  const safeWidth = Math.max(100, width ?? 120);
  const playbackModal = renderFixturePlaybackModal(state, safeWidth);
  return stackBlocks([
    ...(playbackModal ? [playbackModal] : []),
    panel(color.magenta('VIEW 6 - PLAYBACK'), [
      'Current slice: real fixture-backed playback implementation.',
      'Goal: render image/video fixtures without using playback queue execution yet.',
      `Active view key: ${state.activeViewKey}`,
      'Queue-backed playback remains disabled until fixture playback is stable.'
    ], safeWidth),
    renderQueueSection(safeWidth),
    renderFixtureSection(safeWidth)
  ]);
}

// Renders the future queue-backed controls as disabled contract placeholders.
function renderQueueSection(width: number): string {
  return panel(color.yellow('QUEUE-BACKED PLAYBACK - FUTURE DISABLED'), [
    VIEW6_QUEUE_DISABLED_NOTICE,
    'These buttons preserve the future queue-backed contract but do not execute in this slice.',
    '',
    ...formatButtons(view6QueuePlaybackButtons),
    '',
    'Source: future playback queue table / slideshow_queue switch, intentionally deferred.'
  ], width);
}

// Renders the enabled fixture-backed controls and their fixture provenance.
function renderFixtureSection(width: number): string {
  return panel(color.brightGreen('FIXTURE-BACKED PLAYBACK - CURRENT ENABLED'), [
    'These buttons use terminal-demo-owned fixture copies copied from generated_test_data.',
    'They now write browser-renderable HTML viewer artifacts for image/video display.',
    '',
    ...formatButtons(view6FixturePlaybackButtons),
    '',
    'Fixture files:',
    ...view6PlaybackFixtures.map((fixture) => `  ${fixture.role}: ${fixture.fixturePath}`),
    '',
    'Source files:',
    ...view6PlaybackFixtures.map((fixture) => `  ${fixture.role}: ${fixture.sourcePath}`)
  ], width);
}

// Formats the visible View 6 control list with stable labels for proofs.
function formatButtons(buttons: readonly View6PlaybackButtonContract[]): string[] {
  return buttons.map((button, index) => {
    const status = button.enabled ? color.brightGreen('enabled') : color.yellow('disabled');
    return `${index + 1}. [${status}] ${button.label} :: ${button.mediaType}/${button.playbackMode}`;
  });
}

// Shows the real fixture playback result after a fixture button is selected.
function renderFixturePlaybackModal(state: DemoTerminalState, width: number): string | null {
  const hasPlaybackResult = state.currentRun.lines.some((line) => line.includes(VIEW6_FIXTURE_PLAYBACK_READY) || line.includes(VIEW6_FIXTURE_PLAYBACK_DISPLAYED) || line.includes('VIEW 6 REAL FIXTURE PLAYBACK'));
  if (!hasPlaybackResult) return null;
  return panel(color.brightGreen('VIEW 6 REAL FIXTURE PLAYBACK'), [
    color.brightGreen('fixture playback artifact generated'),
    '',
    ...state.currentRun.lines
  ], width);
}
