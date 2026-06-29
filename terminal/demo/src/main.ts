// Supports the terminal Demo Mode entrypoint.
// Keep this file focused so future slices can stay below the 300 LOC target.

import process from 'node:process';
import { readTerminalRuntimeConfig } from './config/terminalRuntimeConfig.js';
import { readTerminalLayout } from './layout/readTerminalLayout.js';
import type { DemoRuntimeAdapter } from './runtime/DemoRuntimeAdapter.js';
import { MockDemoRuntimeAdapter } from './runtime/MockDemoRuntimeAdapter.js';
import { RealDemoRuntimeAdapterPlaceholder } from './runtime/RealDemoRuntimeAdapter.placeholder.js';
import { RealDemoMediaRepository } from './data/RealDemoMediaRepository.js';
import { buildDryRunCommandPlans } from './orchestration/DemoDryRunCommandPlanner.js';
import { renderScreen } from './ui/renderScreen.js';
import { qStoryboardStepIds } from './scenarios/qGeocodeStoryboard.js';

const layout = readTerminalLayout();
const args = new Set(process.argv.slice(2));
const runtimeConfig = readTerminalRuntimeConfig(process.argv.slice(2));
const adapter = createAdapter(runtimeConfig);
if (args.has('--batch-size=5')) {
  await adapter.handleKey('W');
}

function createAdapter(config: ReturnType<typeof readTerminalRuntimeConfig>): DemoRuntimeAdapter {
  if (config.adapterMode === 'real-demo') {
    return new RealDemoRuntimeAdapterPlaceholder(config.boundary);
  }
  return new MockDemoRuntimeAdapter();
}

function printFrame(output: string): void {
  console.log(output);
}

function clearAndPrint(output: string): void {
  process.stdout.write('\x1Bc');
  process.stdout.write(`${output}\n`);
}

if (args.has('--real-demo-smoke')) {
  const config = readTerminalRuntimeConfig(['--adapter=real-demo']);
  const realAdapter = new RealDemoRuntimeAdapterPlaceholder(config.boundary);
  printFrame(renderScreen(realAdapter.getState(), layout));
  process.exit(0);
}


if (args.has('--real-demo-command-plan-smoke')) {
  const config = readTerminalRuntimeConfig(['--adapter=real-demo']);
  const rows = new RealDemoMediaRepository({
    repoRoot: config.boundary.repoRoot,
    dbPath: config.boundary.dbPath,
    downloadDir: config.boundary.downloadDir,
    workerTruthDir: config.boundary.workerTruthDir,
    schedulerDir: config.boundary.schedulerDir,
    logDir: config.boundary.logDir,
    runtimeOutputDir: config.boundary.runtimeOutputDir,
    queueOutputPath: config.boundary.queueOutputPath
  }).listDemoMediaRows().rows;
  printFrame(JSON.stringify(buildDryRunCommandPlans(config.boundary, rows), null, 2));
  process.exit(0);
}

if (args.has('--runtime-config-smoke')) {
  printFrame(JSON.stringify(runtimeConfig.boundary, null, 2));
  process.exit(0);
}


if (args.has('--w-toggle-smoke')) {
  const frames = await adapter.handleKey('W');
  printFrame(renderScreen(frames[0] ?? adapter.getState(), layout));
  process.exit(0);
}

if (args.has('--q-smoke')) {
  const frames = await adapter.runQStoryboard();
  printFrame(renderScreen(frames[frames.length - 1] ?? adapter.getState(), layout));
  process.exit(0);
}

if (args.has('--p-smoke') || args.has('--db-image-playback-button-smoke')) {
  const frames = await adapter.handleKey('P');
  printFrame(renderScreen(frames[0] ?? adapter.getState(), layout));
  process.exit(0);
}

if (args.has('--q-storyboard-smoke')) {
  const frames = await adapter.runQStoryboard();
  frames.forEach((frame, index) => {
    printFrame(`\n===== Q STORYBOARD FRAME ${index + 1}/${frames.length} =====`);
    printFrame(renderScreen(frame, layout));
  });
  process.exit(0);
}

if (args.has('--manual-smoke')) {
  const rightFrames = Array.from({ length: qStoryboardStepIds.length }, () => adapter.stepQStoryboard('right'));
  const leftFrame = adapter.stepQStoryboard('left');
  [...rightFrames, leftFrame].forEach((frame, index) => {
    printFrame(`\n===== MANUAL STORYBOARD FRAME ${index + 1}/${rightFrames.length + 1} =====`);
    printFrame(renderScreen(frame, layout));
  });
  process.exit(0);
}

if (args.has('--smoke') || !process.stdin.isTTY) {
  printFrame(renderScreen(adapter.getState(), layout));
  process.exit(0);
}

clearAndPrint(renderScreen(adapter.getState(), layout));
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', async (chunk) => {
  const key = String(chunk);
  if (key === '\u0003' || key.toUpperCase() === 'X') {
    process.stdin.setRawMode(false);
    process.stdin.pause();
    process.stdout.write(`\nExiting ${adapter.modeName} terminal.\n`);
    process.exit(0);
  }

  if (key.toUpperCase() === 'Q') {
    const frames = await adapter.handleKey('Q');
    for (const frame of frames) {
      clearAndPrint(renderScreen(frame, layout));
      await delay(1000);
    }
    return;
  }

  const arrowKey = normalizeArrowKey(key);
  if (arrowKey) {
    const frames = await adapter.handleKey(arrowKey);
    clearAndPrint(renderScreen(frames[0] ?? adapter.getState(), layout));
    return;
  }

  if (key.toUpperCase() === 'W' || key.toUpperCase() === 'P') {
    const frames = await adapter.handleKey(key.toUpperCase());
    clearAndPrint(renderScreen(frames[0] ?? adapter.getState(), layout));
    return;
  }

  if (key.toUpperCase() === 'R') {
    const frames = await adapter.handleKey('R');
    clearAndPrint(renderScreen(frames[0] ?? adapter.getState(), layout));
  }
});

function normalizeArrowKey(key: string): 'ARROWRIGHT' | 'ARROWLEFT' | null {
  if (key === '\u001b[C' || key === '\u001bOC') return 'ARROWRIGHT';
  if (key === '\u001b[D' || key === '\u001bOD') return 'ARROWLEFT';
  return null;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
