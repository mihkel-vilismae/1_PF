// Runs existing PhotoFrame sqlite_admin playback helpers for terminal Demo Mode.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export interface HelperRunResult {
  status: 'ok' | 'failed';
  helper: string;
  output: unknown;
  messages: string[];
}

const PYTHON_CANDIDATES = Object.freeze([
  { command: 'python3', prefixArgs: [] as string[] },
  { command: 'py', prefixArgs: ['-3'] },
  { command: 'python', prefixArgs: [] as string[] }
]);

export function runSqlitePlaybackHelper(repoRoot: string, helper: string, args: string[]): HelperRunResult {
  const scriptPath = join(repoRoot, 'server', 'scripts', 'sqlite_admin.py');
  if (!existsSync(scriptPath)) {
    return { status: 'failed', helper, output: null, messages: [`sqlite_admin.py missing: ${scriptPath}`] };
  }

  const attempts: string[] = [];
  for (const candidate of PYTHON_CANDIDATES) {
    const commandArgs = [...candidate.prefixArgs, scriptPath, helper, ...args];
    const result = spawnSync(candidate.command, commandArgs, { cwd: repoRoot, encoding: 'utf8', timeout: 120000 });
    attempts.push(`${candidate.command} ${commandArgs.join(' ')} => exit ${result.status ?? 'null'}`);
    if ((result.error as NodeJS.ErrnoException | undefined)?.code === 'ENOENT') continue;
    if (result.status !== 0) {
      return { status: 'failed', helper, output: null, messages: [...attempts, result.stderr.trim() || result.stdout.trim()] };
    }
    try {
      return { status: 'ok', helper, output: JSON.parse(result.stdout), messages: [...attempts, `${helper} returned JSON.`] };
    } catch {
      return { status: 'failed', helper, output: null, messages: [...attempts, `${helper} returned non-JSON output.`] };
    }
  }

  return { status: 'failed', helper, output: null, messages: [...attempts, 'No Python command was available.'] };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
