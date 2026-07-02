// Compatibility view model for View L shell rendering.
// Canonical allowlist lives in ../logs/TerminalLogsRegistry.ts.

import { terminalLogsRegistry } from '../logs/TerminalLogsRegistry.js';

export interface TerminalLogsViewEntry {
  label: string;
  path: string;
  purpose: string;
}

export const terminalLogsViewEntries: readonly TerminalLogsViewEntry[] = terminalLogsRegistry.map((entry) => ({
  label: entry.label,
  path: entry.relativePath,
  purpose: entry.purpose
}));
