// Resolves terminal Demo Mode runtime configuration and path boundaries.
// Keep this file focused so future slices can stay below the 300 LOC target.

import { existsSync } from 'node:fs';
import path from 'node:path';
import type { DemoRuntimePaths, RuntimeReadinessStatus } from './runtimeTypes.js';
import { pathsOverlap, readEnvPath, resolveAgainstRepoRoot } from './pathUtils.js';

interface ComparedPath {
  label: string;
  path: string;
}

export interface DemoPathSafetyResult {
  status: RuntimeReadinessStatus;
  messages: string[];
}

export function verifyDemoRuntimePaths(paths: DemoRuntimePaths, env: NodeJS.ProcessEnv = process.env): DemoPathSafetyResult {
  const messages: string[] = [];
  const realAndTestPaths = collectRealAndTestPaths(paths.repoRoot, env);
  const demoPaths: ComparedPath[] = [
    { label: 'DEMO_DB_PATH', path: paths.dbPath },
    { label: 'DEMO_DOWNLOAD_DIR', path: paths.downloadDir },
    { label: 'DEMO_V2_WORKER_TRUTH_DIR', path: paths.workerTruthDir },
    { label: 'DEMO_SCHEDULER_DIR', path: paths.schedulerDir },
    { label: 'DEMO_LOG_DIR', path: paths.logDir },
    { label: 'DEMO_RUNTIME_OUTPUT_DIR', path: paths.runtimeOutputDir },
    { label: 'DEMO_QUEUE_OUTPUT_PATH', path: paths.queueOutputPath }
  ];

  for (const demoPath of demoPaths) {
    for (const otherPath of realAndTestPaths) {
      if (pathsOverlap(demoPath.path, otherPath.path)) {
        messages.push(`${demoPath.label} overlaps ${otherPath.label}: ${demoPath.path}`);
      }
    }
  }

  if (!existsSync(paths.downloadDir)) {
    messages.push(`DEMO_DOWNLOAD_DIR does not exist yet: ${paths.downloadDir}`);
  }
  if (!existsSync(path.dirname(paths.dbPath))) {
    messages.push(`DEMO_DB_PATH parent does not exist yet: ${path.dirname(paths.dbPath)}`);
  }
  if (!existsSync(path.dirname(paths.queueOutputPath))) {
    messages.push(`DEMO_QUEUE_OUTPUT_PATH parent does not exist yet: ${path.dirname(paths.queueOutputPath)}`);
  }

  const blockingOverlap = messages.some((message) => message.includes('overlaps'));
  const status: RuntimeReadinessStatus = blockingOverlap ? 'blocked' : messages.length ? 'blocked' : 'ready';
  return { status, messages: messages.length ? messages : ['Demo runtime paths are isolated and present.'] };
}

function collectRealAndTestPaths(repoRoot: string, env: NodeJS.ProcessEnv): ComparedPath[] {
  const keyLabels = [
    'DB_PATH',
    'TEST_DB_PATH',
    'DOWNLOAD_DIR',
    'TEST_DOWNLOAD_DIR',
    'V2_WORKER_TRUTH_DIR',
    'TEST_V2_WORKER_TRUTH_DIR',
    'LOG_DIR',
    'TEST_LOG_DIR',
    'FULL_LOG',
    'TEST_FULL_LOG'
  ];
  return keyLabels.flatMap((key) => {
    const value = readEnvPath(env, key);
    if (!value) return [];
    return [{ label: key, path: resolveAgainstRepoRoot(repoRoot, value) }];
  });
}
