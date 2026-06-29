// Plans or runs guarded PhotoFrame playback-worker calls for terminal Demo Mode.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { spawnSync } from 'node:child_process';
import type { RuntimeBoundaryState } from '../config/runtimeTypes.js';

export interface PlaybackExecutionResult {
  status: 'planned' | 'passed' | 'failed' | 'blocked';
  command: string;
  exitCode: number | null;
  messages: string[];
}

const playbackWorkerCommand = 'npm run api -- --scheduler playback-worker';

export function runOrPlanPlaybackWorker(boundary: RuntimeBoundaryState): PlaybackExecutionResult {
  const guard = verifyNoCronCommand(playbackWorkerCommand);
  if (!guard.safe) return { status: 'blocked', command: playbackWorkerCommand, exitCode: null, messages: [guard.reason] };

  const baseMessages = [
    'no cron is used; this is a manual terminal-triggered playback command plan',
    `scheduler_dir=${boundary.schedulerDir}`,
    `queue=${boundary.queueOutputPath}`,
    'native fullscreen remains disabled unless backend/native config explicitly enables it'
  ];

  if (process.env.PHOTOFRAME_TERMINAL_DEMO_EXECUTE !== '1') {
    return {
      status: 'planned',
      command: playbackWorkerCommand,
      exitCode: null,
      messages: ['playback worker execution is guarded by PHOTOFRAME_TERMINAL_DEMO_EXECUTE=1', ...baseMessages]
    };
  }

  if (process.env.PHOTOFRAME_TERMINAL_DEMO_ACK_WORKER_DEMO_SCHEDULER_SAFE !== '1') {
    return {
      status: 'blocked',
      command: playbackWorkerCommand,
      exitCode: null,
      messages: [
        'blocked: playback-worker execution requires the demo scheduler/status isolation acknowledgement',
        'set PHOTOFRAME_TERMINAL_DEMO_ACK_WORKER_DEMO_SCHEDULER_SAFE=1 only after path-isolation proof is accepted',
        ...baseMessages
      ]
    };
  }

  const result = spawnSync('npm', ['run', 'api', '--', '--scheduler', 'playback-worker'], {
    cwd: boundary.repoRoot,
    env: buildDemoPlaybackEnv(boundary),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  return {
    status: result.status === 0 ? 'passed' : 'failed',
    command: playbackWorkerCommand,
    exitCode: result.status,
    messages: [
      `manual real-demo playback worker exit_code=${result.status ?? 'null'}`,
      ...baseMessages,
      ...String(result.stdout ?? '').split(/\r?\n/).filter(Boolean).slice(-4),
      ...String(result.stderr ?? '').split(/\r?\n/).filter(Boolean).slice(-4)
    ]
  };
}

function buildDemoPlaybackEnv(boundary: RuntimeBoundaryState): NodeJS.ProcessEnv {
  return {
    ...process.env,
    PF_RUNTIME_MODE: 'demo',
    RUNTIME_MODE: 'demo',
    DEMO_DB_PATH: boundary.dbPath,
    DEMO_DOWNLOAD_DIR: boundary.downloadDir,
    DEMO_V2_WORKER_TRUTH_DIR: boundary.workerTruthDir,
    DEMO_SCHEDULER_DIR: boundary.schedulerDir,
    DEMO_LOG_DIR: boundary.logDir,
    LOG_DIR: boundary.logDir,
    DEMO_RUNTIME_OUTPUT_DIR: boundary.runtimeOutputDir,
    DEMO_QUEUE_OUTPUT_PATH: boundary.queueOutputPath,
    PHOTOFRAME_TERMINAL_DEMO_NO_CRON: '1',
    PHOTOFRAME_TERMINAL_DEMO_PATH_SAFETY_PASSED: boundary.readinessStatus === 'ready' ? '1' : '0'
  };
}

function verifyNoCronCommand(command: string): { safe: boolean; reason: string } {
  if (/\b(cron|crontab)\b/i.test(command)) return { safe: false, reason: `blocked cron-like command: ${command}` };
  return { safe: true, reason: 'command is manual/no-cron' };
}
