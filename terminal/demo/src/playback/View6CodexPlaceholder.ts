// Handles View 6 fixture button selections without launching playback.
// The result is a placeholder modal and shared JSONL evidence only.
// Real browser/fullscreen/address-overlay playback remains deferred to Codex.

import type { RuntimeBoundaryState } from '../config/runtimeTypes.js';
import { writeTerminalActionLog } from '../run/TerminalActionLogWriter.js';
import {
  view6FixturePlaybackButtons,
  view6PlaybackFixtures,
  type View6PlaybackButtonContract
} from './View6PlaybackContract.js';

export type View6FixtureButtonKey = '1' | '2' | '3' | '4' | '5' | '6';
export const VIEW6_CODEX_PLACEHOLDER_MESSAGE = 'this will be done by Codex';
export const VIEW6_CODEX_PLACEHOLDER_RESULT = 'CODEX_DEFERRED';

export interface View6CodexPlaceholderResult {
  button: View6PlaybackButtonContract;
  fixturePath: string;
  logPath: string;
  logStatus: 'written' | 'skipped';
  lines: string[];
}

// Checks whether a key maps to one of the six View 6 fixture buttons.
export function isView6FixtureButtonKey(key: string): key is View6FixtureButtonKey {
  return /^[1-6]$/.test(key);
}

// Builds the View 6 placeholder result and writes no-playback evidence.
export function runView6CodexPlaceholder(input: {
  boundary: RuntimeBoundaryState;
  key: View6FixtureButtonKey;
}): View6CodexPlaceholderResult {
  const button = view6FixturePlaybackButtons[Number(input.key) - 1];
  const fixture = view6PlaybackFixtures.find((candidate) => candidate.role === button.mediaType);
  const fixturePath = fixture?.fixturePath ?? 'missing fixture contract';
  const log = writeView6CodexPlaceholderLog({ ...input, button, fixturePath });
  return {
    button,
    fixturePath,
    logPath: log.logPath,
    logStatus: log.status,
    lines: [
      'VIEW 6 PLAYBACK BUTTON SELECTED',
      `Button ${input.key}: ${button.label}`,
      `Fixture media type: ${button.mediaType}`,
      `Intended playback mode: ${button.playbackMode}`,
      `Fixture path: ${fixturePath}`,
      VIEW6_CODEX_PLACEHOLDER_MESSAGE,
      'Real playback launch: not implemented in this ChatGPT slice.',
      'Codex owns browser/fullscreen/address-overlay execution.',
      `Action log: ${log.status} ${log.logPath}`
    ]
  };
}

// Writes View 6 placeholder evidence into the shared terminal action log schema.
function writeView6CodexPlaceholderLog(input: {
  boundary: RuntimeBoundaryState;
  key: View6FixtureButtonKey;
  button: View6PlaybackButtonContract;
  fixturePath: string;
}): { status: 'written' | 'skipped'; logPath: string } {
  const log = writeTerminalActionLog({
    boundary: input.boundary,
    event: {
      source: 'terminal-demo',
      view: '6',
      action: 'view6_fixture_playback_codex_placeholder',
      branchFeature: 'view6_fixture_playback',
      button: input.button.label,
      buttonKey: input.key,
      status: VIEW6_CODEX_PLACEHOLDER_RESULT,
      mediaType: input.button.mediaType,
      playbackMode: input.button.playbackMode,
      fixturePath: input.fixturePath,
      noCron: true,
      launchesPlayback: false,
      message: VIEW6_CODEX_PLACEHOLDER_MESSAGE,
      result: VIEW6_CODEX_PLACEHOLDER_RESULT,
      messages: [VIEW6_CODEX_PLACEHOLDER_MESSAGE]
    }
  });
  return { status: log.status, logPath: log.logPath };
}
