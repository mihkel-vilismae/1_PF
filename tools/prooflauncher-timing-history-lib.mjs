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

export function buildTimingHistorySummary(observations = []) {
  const byCommand = new Map();
  const byCategory = new Map();
  const byPlatform = new Map();
  const global = [];
  for (const entry of observations) {
    const duration = Number(entry.duration_seconds ?? entry.durationSeconds ?? entry.duration ?? NaN);
    if (!Number.isFinite(duration) || duration < 0) continue;
    const command = String(entry.command ?? entry.name ?? '').trim();
    const category = String(entry.category ?? classifyProofCommand(command));
    const platform = String(entry.platform ?? 'unknown');
    if (command) byCommand.set(command, [...(byCommand.get(command) ?? []), duration]);
    byCategory.set(category, [...(byCategory.get(category) ?? []), duration]);
    byPlatform.set(platform, [...(byPlatform.get(platform) ?? []), duration]);
    global.push(duration);
  }
  return {
    commands: Object.fromEntries([...byCommand].map(([key, values]) => [key, { average_seconds: average(values), sample_count: values.length }])),
    categories: Object.fromEntries([...byCategory].map(([key, values]) => [key, { average_seconds: average(values), sample_count: values.length }])),
    platforms: Object.fromEntries([...byPlatform].map(([key, values]) => [key, { average_seconds: average(values), sample_count: values.length }])),
    global_average_seconds: average(global),
    global_sample_count: global.length,
  };
}

export function estimateProofDuration({ commandName, platform = 'unknown', historySummary = {}, fallbackSeconds = 30 }) {
  const category = classifyProofCommand(commandName);
  const commandAverage = historySummary.commands?.[commandName]?.average_seconds;
  if (Number.isFinite(commandAverage)) return { estimate_seconds: commandAverage, estimate_source: 'command_history', category };
  const categoryAverage = historySummary.categories?.[category]?.average_seconds;
  if (Number.isFinite(categoryAverage)) return { estimate_seconds: categoryAverage, estimate_source: 'category_history', category };
  const platformAverage = historySummary.platforms?.[platform]?.average_seconds;
  if (Number.isFinite(platformAverage)) return { estimate_seconds: platformAverage, estimate_source: 'platform_average', category };
  const globalAverage = historySummary.global_average_seconds;
  if (Number.isFinite(globalAverage)) return { estimate_seconds: globalAverage, estimate_source: 'global_average', category };
  return { estimate_seconds: fallbackSeconds, estimate_source: 'fallback_default', category };
}

export function buildTimingObservation({ commandName, status, exitCode, startedAt, endedAt, durationSeconds, platform = 'unknown' }) {
  return {
    command: commandName,
    category: classifyProofCommand(commandName),
    platform,
    status,
    exit_code: exitCode,
    started_at: startedAt,
    ended_at: endedAt,
    duration_seconds: Number(durationSeconds),
  };
}
