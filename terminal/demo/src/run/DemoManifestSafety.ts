// Guards terminal Demo Mode manifest writes so they remain DEMO-owned.
// Keep this file focused so future slices can stay below the 300 LOC target.

import path from 'node:path';
import type { RuntimeBoundaryState } from '../config/runtimeTypes.js';

export interface ManifestSafetyResult {
  safe: boolean;
  reason: string;
}

export function verifyDemoManifestPath(boundary: RuntimeBoundaryState, manifestPath: string): ManifestSafetyResult {
  const resolvedManifest = path.resolve(manifestPath);
  const outputDir = path.resolve(boundary.runtimeOutputDir);
  const relative = path.relative(outputDir, resolvedManifest);
  const insideOutput = relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
  if (!insideOutput) {
    return { safe: false, reason: `manifest path escapes DEMO_RUNTIME_OUTPUT_DIR: ${resolvedManifest}` };
  }
  if (boundary.readinessStatus !== 'ready') {
    return { safe: false, reason: `demo runtime boundary is ${boundary.readinessStatus}` };
  }
  return { safe: true, reason: 'manifest path is inside DEMO_RUNTIME_OUTPUT_DIR' };
}
