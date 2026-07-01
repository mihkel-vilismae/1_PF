// Reusable display-only terminal status row primitive.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { color } from '../ansi.js';
import { renderStatusRing, type StatusRingTone } from './StatusRing.js';

export interface StatusRowInput {
  label: string;
  value: string;
  tone: StatusRingTone;
  detail?: string;
}

export function renderStatusRow(input: StatusRowInput): string {
  const detail = input.detail ? ` — ${color.muted(input.detail)}` : '';
  return `${renderStatusRing(input.tone)} ${color.cyan(input.label)}: ${input.value}${detail}`;
}
