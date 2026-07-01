// Defines stable terminal section header IDs for operator screenshots/proofs.
// Keep this file focused so future slices can stay below the 300 LOC target.

export type PaneCode = 'L' | 'C' | 'R';
export type SectionHeaderId = `${PaneCode}-${number}`;

export const terminalSectionHeaderIds = {
  banner: 'L-1',
  media: 'L-2',
  actions: 'L-3',
  icloudAuthorization: 'L-4',
  startStageModal: 'L-5',
  currentRun: 'C-1',
  playback: 'C-2',
  screenOnOff: 'C-3',
  playbackQueue: 'C-4',
  rpiStages: 'R-1',
  rpiWorkers: 'R-2',
  inspector: 'R-3',
  realTimeLog: 'R-4'
} as const satisfies Record<string, SectionHeaderId>;

export type TerminalSectionKey = keyof typeof terminalSectionHeaderIds;

export function sectionTitle(enabled: boolean, key: TerminalSectionKey, title: string): string {
  return enabled ? `${terminalSectionHeaderIds[key]} ${title}` : title;
}
