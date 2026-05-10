/*
 * Defines shared scheduler worker command strings for Raspberry cron and Windows CronEmulator.
 * The constants keep UI defaults, backend crontab generation, and tests aligned.
 */

export const SCHEDULER_WORKER_NAMES = Object.freeze({
  regularStage: 'regular-stage-worker',
  playback: 'playback-worker',
  screenOnOff: 'screen-on-off-worker',
} as const);

export type SchedulerWorkerName = typeof SCHEDULER_WORKER_NAMES[keyof typeof SCHEDULER_WORKER_NAMES];

export const PLAYBACK_WORKER_NPM_COMMAND = `npm run api -- --scheduler ${SCHEDULER_WORKER_NAMES.playback}`;

export const RASPBERRY_PLAYBACK_WORKER_CRON_ROW = `* * * * * cd "$HOME/1_PF" && ${PLAYBACK_WORKER_NPM_COMMAND}`;

export const WINDOWS_CRON_EMULATOR_PLAYBACK_WORKER_CRON_ROW = `* * * * * cd ..\\.. && ${PLAYBACK_WORKER_NPM_COMMAND}`;

export type SchedulerCommandClassification = 'real' | 'partial' | 'mock' | 'placeholder' | 'broken';

export interface SchedulerCommandEvidence {
  classification: SchedulerCommandClassification;
  reachesPlaybackWorker: boolean;
  command: string;
  reason: string;
}

// Classifies whether a cron row visibly reaches the Slice 3 playback-worker entrypoint.
export function classifyPlaybackWorkerCronRow(row: string): SchedulerCommandEvidence {
  const command = row.trim();
  const reachesPlaybackWorker = command.includes(PLAYBACK_WORKER_NPM_COMMAND);

  if (command.includes('/path/to/playback_worker')) {
    return {
      classification: 'placeholder',
      reachesPlaybackWorker: false,
      command,
      reason: 'The row still points at the placeholder /path/to/playback_worker command.',
    };
  }

  if (!reachesPlaybackWorker) {
    return {
      classification: 'broken',
      reachesPlaybackWorker: false,
      command,
      reason: 'The row does not call npm run api -- --scheduler playback-worker.',
    };
  }

  if (command.includes('cd ..\\..')) {
    return {
      classification: 'partial',
      reachesPlaybackWorker: true,
      command,
      reason: 'Windows CronEmulator reaches playback-worker when launched from tools/CronEmulator, which is the backend-owned process cwd.',
    };
  }

  return {
    classification: 'real',
    reachesPlaybackWorker: true,
    command,
    reason: 'The row calls the backend playback-worker scheduler entrypoint directly.',
  };
}
