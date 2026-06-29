// Renders one terminal Demo Mode UI section or layout helper.
// Keep this file focused so future slices can stay below the 300 LOC target.

const ESC = '\u001b[';
const RESET = `${ESC}0m`;

function enabled(): boolean {
  return process.env.NO_COLOR !== '1' && process.env.NO_COLOR !== 'true';
}

function wrap(code: string, value: string): string {
  if (!enabled() || value.length === 0) return value;
  return `${ESC}${code}m${value}${RESET}`;
}

export const color = {
  reset: RESET,
  bold: (value: string) => wrap('1', value),
  dim: (value: string) => wrap('2', value),
  cyan: (value: string) => wrap('36', value),
  brightCyan: (value: string) => wrap('96;1', value),
  green: (value: string) => wrap('32', value),
  brightGreen: (value: string) => wrap('92;1', value),
  yellow: (value: string) => wrap('93', value),
  magenta: (value: string) => wrap('95;1', value),
  blue: (value: string) => wrap('94', value),
  red: (value: string) => wrap('91;1', value),
  danger: (value: string) => wrap('97;41;1', value),
  dangerDim: (value: string) => wrap('91', value),
  muted: (value: string) => wrap('90', value),
  white: (value: string) => wrap('97', value),
  active: (value: string) => wrap('30;106;1', value),
  done: (value: string) => wrap('30;102;1', value),
  doneProblem: (value: string) => wrap('97;41;1', value),
  activeProblem: (value: string) => wrap('97;101;1', value),
  arrow: (value: string) => wrap('93;1', value),
  stage: (value: string) => wrap('96;1', value),
  queue: (value: string) => wrap('95;1', value),
  dimPink: (value: string) => wrap('2;95', value)
};

export function dimNotYetImplemented(value: string): string {
  if (!/not yet implemented/i.test(value)) return value;
  return value.replace(/not yet implemented\.?/gi, (match) => color.dimPink(match));
}

export function stripAnsi(value: string): string {
  return value.replace(/\u001b\[[0-9;]*m/g, '');
}

export function visibleLength(value: string): number {
  return stripAnsi(value).length;
}
