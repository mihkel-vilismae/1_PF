/** Prooflauncher timing history helpers for generated 2proofrunner handoffs. */
export const TIMING_ESTIMATE_PRIORITY = Object.freeze(['command_history', 'category_history', 'platform_average', 'global_average']);

export function classifyProofCommand(commandName = '') {
  const name = String(commandName);
  if (name.includes('icloud') || name.includes('download') || name.includes('geocode') || name.includes('provider')) return 'provider';
  if (name.includes('windows') || name.includes('raspberry') || name.includes('linux')) return 'platform';
  if (name.includes('debug-page') || name.includes('dashboard') || name.includes('view-')) return 'ui';
  if (name.includes('docs') || name.includes('openspec') || name.includes('registry') || name.includes('task-docs')) return 'docs';
  if (name.includes('proof-runner') || name.includes('proofrunner') || name.includes('blocker') || name.includes('final-summary')) return 'proofrunner';
  return 'general';
}

function average(values) {
  const nums = values.map(Number).filter((value) => Number.isFinite(value) && value >= 0);
  return nums.length ? nums.reduce((sum, value) => sum + value, 0) / nums.length : null;
}

function durationToMilliseconds(entry = {}) {
  const ms = Number(entry.duration_milliseconds ?? entry.durationMilliseconds ?? NaN);
  if (Number.isFinite(ms) && ms >= 0) return ms;
  const seconds = Number(entry.duration_seconds ?? entry.durationSeconds ?? entry.duration ?? NaN);
  return Number.isFinite(seconds) && seconds >= 0 ? Math.round(seconds * 1000) : NaN;
}

function timingStats(values) {
  const avgMs = average(values);
  return { average_milliseconds: avgMs, average_seconds: Number.isFinite(avgMs) ? avgMs / 1000 : null, sample_count: values.length };
}

export function buildTimingHistorySummary(observations = []) {
  const byCommand = new Map();
  const byCategory = new Map();
  const byPlatform = new Map();
  const global = [];
  for (const entry of observations) {
    const durationMs = durationToMilliseconds(entry);
    if (!Number.isFinite(durationMs) || durationMs < 0) continue;
    const command = String(entry.command ?? entry.name ?? '').trim();
    const category = String(entry.category ?? classifyProofCommand(command));
    const platform = String(entry.platform ?? 'unknown');
    if (command) byCommand.set(command, [...(byCommand.get(command) ?? []), durationMs]);
    byCategory.set(category, [...(byCategory.get(category) ?? []), durationMs]);
    byPlatform.set(platform, [...(byPlatform.get(platform) ?? []), durationMs]);
    global.push(durationMs);
  }
  const globalAverageMs = average(global);
  return {
    commands: Object.fromEntries([...byCommand].map(([key, values]) => [key, timingStats(values)])),
    categories: Object.fromEntries([...byCategory].map(([key, values]) => [key, timingStats(values)])),
    platforms: Object.fromEntries([...byPlatform].map(([key, values]) => [key, timingStats(values)])),
    global_average_milliseconds: globalAverageMs,
    global_average_seconds: Number.isFinite(globalAverageMs) ? globalAverageMs / 1000 : null,
    global_sample_count: global.length,
  };
}

export function estimateProofDuration({ commandName, platform = 'unknown', historySummary = {}, fallbackMilliseconds = 30000, fallbackSeconds } = {}) {
  const category = classifyProofCommand(commandName);
  const fallbackMs = Number.isFinite(Number(fallbackMilliseconds)) ? Number(fallbackMilliseconds) : Math.round(Number(fallbackSeconds ?? 30) * 1000);
  const commandAverage = historySummary.commands?.[commandName]?.average_milliseconds;
  if (Number.isFinite(commandAverage)) return { estimate_milliseconds: commandAverage, estimate_seconds: commandAverage / 1000, estimate_source: 'command_history', category };
  const categoryAverage = historySummary.categories?.[category]?.average_milliseconds;
  if (Number.isFinite(categoryAverage)) return { estimate_milliseconds: categoryAverage, estimate_seconds: categoryAverage / 1000, estimate_source: 'category_history', category };
  const platformAverage = historySummary.platforms?.[platform]?.average_milliseconds;
  if (Number.isFinite(platformAverage)) return { estimate_milliseconds: platformAverage, estimate_seconds: platformAverage / 1000, estimate_source: 'platform_average', category };
  const globalAverage = historySummary.global_average_milliseconds;
  if (Number.isFinite(globalAverage)) return { estimate_milliseconds: globalAverage, estimate_seconds: globalAverage / 1000, estimate_source: 'global_average', category };
  return { estimate_milliseconds: fallbackMs, estimate_seconds: fallbackMs / 1000, estimate_source: 'fallback_default', category };
}

export function buildTimingObservation({ commandName, status, exitCode, startedAt, endedAt, durationMilliseconds, durationSeconds, platform = 'unknown' }) {
  const durationMs = Number.isFinite(Number(durationMilliseconds)) ? Number(durationMilliseconds) : Math.round(Number(durationSeconds ?? 0) * 1000);
  return {
    command: commandName,
    category: classifyProofCommand(commandName),
    platform,
    status,
    exit_code: exitCode,
    started_at: startedAt,
    ended_at: endedAt,
    duration_milliseconds: durationMs,
    duration_seconds: durationMs / 1000,
  };
}
