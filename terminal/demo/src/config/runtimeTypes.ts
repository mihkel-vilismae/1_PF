// Resolves terminal Demo Mode runtime configuration and path boundaries.
// Keep this file focused so future slices can stay below the 300 LOC target.

export type RuntimeMode = 'real' | 'test' | 'demo';
export type TerminalAdapterMode = 'mock-demo' | 'real-demo';
export type RuntimeReadinessStatus = 'mock' | 'ready' | 'blocked';

export interface DemoRuntimePaths {
  repoRoot: string;
  dbPath: string;
  downloadDir: string;
  workerTruthDir: string;
  schedulerDir: string;
  logDir: string;
  runtimeOutputDir: string;
  queueOutputPath: string;
}

export interface RuntimeBoundaryState {
  adapterMode: TerminalAdapterMode;
  runtimeMode: RuntimeMode;
  readinessStatus: RuntimeReadinessStatus;
  repoRoot: string;
  dbPath: string;
  downloadDir: string;
  workerTruthDir: string;
  schedulerDir: string;
  logDir: string;
  runtimeOutputDir: string;
  queueOutputPath: string;
  pathMessages: string[];
  sourceSummary: string;
}
