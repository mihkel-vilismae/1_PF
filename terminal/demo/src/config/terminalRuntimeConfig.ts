// Resolves terminal Demo Mode runtime configuration and path boundaries.
// Keep this file focused so future slices can stay below the 300 LOC target.

import type { RuntimeBoundaryState, TerminalAdapterMode } from './runtimeTypes.js';
import { resolveDemoRuntimePaths } from './demoRuntimePaths.js';
import { verifyDemoRuntimePaths } from './demoPathSafety.js';

export interface TerminalRuntimeConfig {
  adapterMode: TerminalAdapterMode;
  boundary: RuntimeBoundaryState;
}

export function readTerminalRuntimeConfig(args = process.argv.slice(2), env: NodeJS.ProcessEnv = process.env): TerminalRuntimeConfig {
  const adapterMode = parseAdapterMode(args, env);
  const demoPaths = resolveDemoRuntimePaths(env);
  const safety = adapterMode === 'real-demo'
    ? verifyDemoRuntimePaths(demoPaths, env)
    : { status: 'mock' as const, messages: ['Mock adapter selected: no real demo paths are read or written.'] };

  return {
    adapterMode,
    boundary: {
      adapterMode,
      runtimeMode: 'demo',
      readinessStatus: safety.status,
      repoRoot: demoPaths.repoRoot,
      dbPath: demoPaths.dbPath,
      downloadDir: demoPaths.downloadDir,
      workerTruthDir: demoPaths.workerTruthDir,
      schedulerDir: demoPaths.schedulerDir,
      logDir: demoPaths.logDir,
      runtimeOutputDir: demoPaths.runtimeOutputDir,
      queueOutputPath: demoPaths.queueOutputPath,
      pathMessages: safety.messages,
      sourceSummary: adapterMode === 'real-demo'
        ? 'real-demo v0.11.0: DEMO media/truth/queue/playback-status plus guarded Q/P plan'
        : 'mock-demo: scripted visual state only'
    }
  };
}

function parseAdapterMode(args: string[], env: NodeJS.ProcessEnv): TerminalAdapterMode {
  const explicit = args.find((arg) => arg.startsWith('--adapter='))?.split('=')[1]?.trim().toLowerCase();
  const value = explicit || env.PHOTOFRAME_TERMINAL_ADAPTER?.trim().toLowerCase() || env.TERMINAL_DEMO_ADAPTER?.trim().toLowerCase();
  if (args.includes('--real-demo') || value === 'real-demo') return 'real-demo';
  return 'mock-demo';
}
