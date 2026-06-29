// Parses terminal mouse escape events and describes proof-mode hitbox actions.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { LogPanelHitboxId, TerminalMouseHitbox } from '../state/DemoTerminalState.js';

export type TerminalMouseEventKind = 'click' | 'wheel-up' | 'wheel-down' | 'release';

export interface TerminalMouseEvent {
  kind: TerminalMouseEventKind;
  x: number;
  y: number;
  button: number;
}

export interface TerminalMouseHitResult {
  hitboxId: LogPanelHitboxId | 'none';
  label: string;
}

const SGR_MOUSE_RE = /^\u001b\[<(\d+);(\d+);(\d+)([Mm])$/;

export function parseSgrMouseEvent(value: string): TerminalMouseEvent | null {
  const match = value.match(SGR_MOUSE_RE);
  if (!match) return null;
  const button = Number.parseInt(match[1] ?? '', 10);
  const x = Number.parseInt(match[2] ?? '', 10);
  const y = Number.parseInt(match[3] ?? '', 10);
  const suffix = match[4];
  if (!Number.isFinite(button) || !Number.isFinite(x) || !Number.isFinite(y)) return null;
  if (suffix === 'm') return { kind: 'release', x, y, button };
  if (button === 64) return { kind: 'wheel-up', x, y, button };
  if (button === 65) return { kind: 'wheel-down', x, y, button };
  return { kind: 'click', x, y, button };
}

export function findHitbox(hitboxes: TerminalMouseHitbox[], event: TerminalMouseEvent): TerminalMouseHitResult {
  const found = hitboxes.find((hitbox) => event.x >= hitbox.x1 && event.x <= hitbox.x2 && event.y >= hitbox.y1 && event.y <= hitbox.y2);
  return found ? { hitboxId: found.id, label: found.label } : { hitboxId: 'none', label: 'No terminal hitbox matched' };
}

export function mouseTrackingEnableSequence(): string {
  return '\u001b[?1000h\u001b[?1006h';
}

export function mouseTrackingDisableSequence(): string {
  return '\u001b[?1000l\u001b[?1006l';
}
