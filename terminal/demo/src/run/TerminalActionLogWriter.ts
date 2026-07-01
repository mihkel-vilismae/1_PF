// Writes shared terminal-demo action evidence.
// The JSONL sink is shared by View 0, View 6, and future terminal branches.
// Events remain demo-local and never imply cron, auth, DB, or hardware work.

import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { RuntimeBoundaryState } from '../config/runtimeTypes.js';

export interface TerminalActionLogResult {
  status: 'written' | 'skipped';
  logPath: string;
  message: string;
}

export type TerminalBranchFeature = 'default_operator' | 'view0_map_testing' | 'view6_fixture_playback';

export interface TerminalActionLogEvent {
  timestamp?: string;
  source: 'terminal-demo';
  view: string;
  action: string;
  branchFeature: TerminalBranchFeature;
  button?: string;
  inputSequence?: string[];
  targetView?: string;
  targetTestPage?: string;
  noCron: true;
  result: string;
  messages?: string[];
  [key: string]: unknown;
}

// Appends one redacted terminal action event to the shared JSONL log.
export function writeTerminalActionLog(input: {
  boundary: RuntimeBoundaryState;
  event: TerminalActionLogEvent;
}): TerminalActionLogResult {
  const logPath = join(input.boundary.logDir, 'terminal-button-actions.jsonl');
  try {
    mkdirSync(input.boundary.logDir, { recursive: true });
    appendFileSync(logPath, `${JSON.stringify({ timestamp: new Date().toISOString(), ...input.event })}\n`, 'utf8');
    return { status: 'written', logPath, message: `terminal action event written: ${logPath}` };
  } catch (error) {
    return { status: 'skipped', logPath, message: `terminal action event log skipped: ${String(error)}` };
  }
}
