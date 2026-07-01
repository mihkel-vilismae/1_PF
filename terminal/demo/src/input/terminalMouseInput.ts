// Parses terminal mouse-tracking events and manages mouse-tracking escape codes.
// The helpers stay host-agnostic and let the terminal loop decide how to react.

export interface TerminalMouseEvent {
  button: 'left' | 'middle' | 'right' | 'unknown';
  kind: 'move' | 'press' | 'release';
  x: number;
  y: number;
}

const ENABLE_MOUSE_TRACKING = '\u001b[?1000h\u001b[?1003h\u001b[?1006h';
const DISABLE_MOUSE_TRACKING = '\u001b[?1006l\u001b[?1003l\u001b[?1000l';

// Enables terminal mouse tracking for hosts that understand xterm-compatible escape codes.
export function enableTerminalMouseTracking(stream: NodeJS.WriteStream = process.stdout): void {
  stream.write(ENABLE_MOUSE_TRACKING);
}

// Disables terminal mouse tracking before the terminal demo exits.
export function disableTerminalMouseTracking(stream: NodeJS.WriteStream = process.stdout): void {
  stream.write(DISABLE_MOUSE_TRACKING);
}

// Parses a single SGR mouse event from terminal raw input when present.
export function parseTerminalMouseEvent(chunk: string): TerminalMouseEvent | null {
  const match = chunk.match(/\u001b\[<(\d+);(\d+);(\d+)([Mm])/);
  if (!match) return null;

  const code = Number.parseInt(match[1] ?? '', 10);
  const x = Number.parseInt(match[2] ?? '', 10);
  const y = Number.parseInt(match[3] ?? '', 10);
  const suffix = match[4];

  if (!Number.isFinite(code) || !Number.isFinite(x) || !Number.isFinite(y)) return null;

  return {
    button: normalizeMouseButton(code),
    kind: (code & 32) === 32 ? 'move' : suffix === 'm' ? 'release' : 'press',
    x,
    y,
  };
}

// Maps the xterm button code to a stable terminal-demo button label.
function normalizeMouseButton(code: number): TerminalMouseEvent['button'] {
  const base = code & 3;
  if (base === 0) return 'left';
  if (base === 1) return 'middle';
  if (base === 2) return 'right';
  return 'unknown';
}
