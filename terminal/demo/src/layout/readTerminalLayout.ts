// Supports the terminal Demo Mode entrypoint.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface TerminalLayoutSection {
  id: string;
  title: string;
  kind: string;
}

export interface TerminalLayout {
  screenId: string;
  category: string;
  visualLayer: string;
  dataMode: string;
  futureRuntimeMode: string;
  sections: TerminalLayoutSection[];
}

export function readTerminalLayout(): TerminalLayout {
  const layoutPath = resolveLayoutPath();
  const raw = readFileSync(layoutPath, 'utf8');
  return JSON.parse(raw) as TerminalLayout;
}

export function titleFor(layout: TerminalLayout, sectionId: string, fallback: string): string {
  return layout.sections.find((section) => section.id === sectionId)?.title ?? fallback;
}

function resolveLayoutPath(): string {
  const candidates = [
    join(process.cwd(), 'terminal', 'demo', 'layout', 'terminal-demo-layout.json'),
    join(process.cwd(), 'layout', 'terminal-demo-layout.json')
  ];
  const match = candidates.find((candidate) => existsSync(candidate));
  if (!match) {
    throw new Error(`terminal demo layout not found. Checked: ${candidates.join(', ')}`);
  }
  return match;
}
