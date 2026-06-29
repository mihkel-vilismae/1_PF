#!/usr/bin/env node
/*
 * Static proof for terminal real-demo execution safety gates.
 * It intentionally does not run workers or mutate runtime data.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const checks = [];

function read(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function check(label, passed, detail) {
  checks.push({ label, passed, detail });
}

const truthService = read('server/v2WorkerTruthService.ts');
const runtimeModeEnv = read('server/runtimeModeEnv.ts');
const index = read('server/index.ts');
const schedulerResolver = read('server/workers/schedulerRuntimeDirectory.ts');
const regularWorker = read('server/workers/regularStageWorker.ts');
const playbackWorker = read('server/workers/playbackWorker.ts');
const instrumentedWorker = read('server/workers/instrumentedSchedulerWorker.ts');
const executionAdapter = read('terminal/demo/src/run/PhotoFrameStageExecutionAdapter.ts');

check(
  'v2 truth service supports demo mode',
  truthService.includes("'test' | 'real' | 'demo'") && truthService.includes("if (value === 'demo') return 'demo'"),
  'Demo truth events must not be normalized into test truth.'
);

check(
  'v2 truth service resolves DEMO truth dir',
  truthService.includes('DEMO_V2_WORKER_TRUTH_DIR') && truthService.includes("runtime_data', 'v2_worker_truth', mode"),
  'Demo mode must write/read runtime_data/v2_worker_truth/demo by default.'
);

check(
  'server appends truth with mode-applied env values',
  index.includes('createV2WorkerTruthService({ repoRoot, envValues: context.envValues })'),
  'Truth append must see demo env overrides, not only base env values.'
);

check(
  'demo runtime env sets isolated truth/scheduler/queue paths',
  runtimeModeEnv.includes('DEMO_V2_WORKER_TRUTH_DIR')
    && runtimeModeEnv.includes('DEMO_SCHEDULER_DIR')
    && runtimeModeEnv.includes('DEMO_QUEUE_OUTPUT_PATH'),
  'Demo mode must carry isolated runtime path defaults.'
);

check(
  'scheduler runtime resolver uses DEMO_SCHEDULER_DIR in demo mode',
  schedulerResolver.includes('DEMO_SCHEDULER_DIR')
    && schedulerResolver.includes("runtime_data', 'scheduler', 'demo")
    && schedulerResolver.includes('PF_RUNTIME_MODE'),
  'Worker status/lock/state output must be redirected for demo mode.'
);

for (const [label, source] of [
  ['regular worker', regularWorker],
  ['playback worker', playbackWorker],
  ['instrumented worker', instrumentedWorker],
]) {
  check(`${label} uses scheduler runtime resolver`, source.includes('resolveSchedulerRuntimeDirectory(repoRoot)'), `${label} must not hardcode the scheduler output directory.`);
  check(`${label} no longer hardcodes scheduler output`, !source.includes("path.join(repoRoot, 'runtime_data', 'scheduler')"), `${label} must not write directly to real scheduler output in demo mode.`);
}

check(
  'terminal execution adapter sends demo log/scheduler/truth paths',
  executionAdapter.includes('DEMO_SCHEDULER_DIR')
    && executionAdapter.includes('DEMO_V2_WORKER_TRUTH_DIR')
    && executionAdapter.includes('DEMO_LOG_DIR')
    && executionAdapter.includes('LOG_DIR'),
  'Manual worker env must steer logs, truth, and scheduler status to demo-owned paths.'
);

check(
  'terminal execution adapter keeps no-cron guard',
  executionAdapter.includes('PHOTOFRAME_TERMINAL_DEMO_NO_CRON')
    && executionAdapter.includes('verifyNoCronCommand')
    && !executionAdapter.includes('crontab -')
    && !executionAdapter.includes('cron install'),
  'Terminal real-demo execution must remain manual/no-cron.'
);

check(
  'terminal execution still requires explicit worker safety ack',
  executionAdapter.includes('PHOTOFRAME_TERMINAL_DEMO_ACK_WORKER_DEMO_SCHEDULER_SAFE'),
  'The proof must not silently remove the conservative execution gate.'
);

const failed = checks.filter((entry) => !entry.passed);
const result = {
  proof: 'terminal-demo-execution-safety',
  status: failed.length ? 'BLOCKED' : 'PASSED',
  checkedAt: new Date().toISOString(),
  checks,
};
console.log(JSON.stringify(result, null, 2));
if (failed.length) process.exitCode = 1;
