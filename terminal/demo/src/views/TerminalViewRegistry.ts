// Defines the terminal Demo Mode view registry.
// Keep this file focused so future slices can stay below the 300 LOC target.

export type TerminalViewKey = '0' | 'D' | 'L' | 'I' | '1' | '2' | '3' | '4' | '5' | '6';

export interface TerminalViewDefinition {
  key: TerminalViewKey;
  label: string;
  purpose: string;
  shellStatus: 'empty_shell' | 'implemented_terminal_slice';
}

export const terminalViewRegistry: readonly TerminalViewDefinition[] = [
  {
    key: '0',
    label: 'Table of Contents and Debug',
    purpose: 'Map page with main view links and safe test-page routing.',
    shellStatus: 'implemented_terminal_slice'
  },
  {
    key: 'D',
    label: 'Default operator view',
    purpose: 'Main three-pane real-demo operator screen.',
    shellStatus: 'empty_shell'
  },
  {
    key: 'L',
    label: 'Logs view',
    purpose: 'Future full-screen runtime log and status inspection view.',
    shellStatus: 'empty_shell'
  },
  {
    key: 'I',
    label: 'iCloudPD login view',
    purpose: 'Future NEW AUTH login and authorization controls view.',
    shellStatus: 'empty_shell'
  },
  {
    key: '1',
    label: 'Download stage view',
    purpose: 'Future download/manual generated-test-media import stage view.',
    shellStatus: 'empty_shell'
  },
  {
    key: '2',
    label: 'Indexing stage view',
    purpose: 'Future indexing stage view.',
    shellStatus: 'empty_shell'
  },
  {
    key: '3',
    label: 'GPS Parser stage view',
    purpose: 'Future GPS metadata parsing stage view.',
    shellStatus: 'empty_shell'
  },
  {
    key: '4',
    label: 'Geocode stage view',
    purpose: 'Future geocode/address resolution stage view.',
    shellStatus: 'empty_shell'
  },
  {
    key: '5',
    label: 'Enqueue view',
    purpose: 'Future playback enqueue/preparation stage view.',
    shellStatus: 'empty_shell'
  },
  {
    key: '6',
    label: 'Playback view',
    purpose: 'Fixture-backed playback contract with Codex placeholder controls.',
    shellStatus: 'implemented_terminal_slice'
  }
] as const;

const terminalViewKeys = new Set<string>(terminalViewRegistry.map((view) => view.key));

export function isTerminalViewKey(key: string): key is TerminalViewKey {
  return terminalViewKeys.has(key);
}

export function getTerminalViewDefinition(key: TerminalViewKey): TerminalViewDefinition {
  return terminalViewRegistry.find((view) => view.key === key) ?? terminalViewRegistry[0];
}
