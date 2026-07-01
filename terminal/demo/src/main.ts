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
import { mouseTrackingDisableSequence, mouseTrackingEnableSequence, parseSgrMouseEvent } from './ui/terminalMouse.js';

const layout = readTerminalLayout();
const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);
const viewShellArg = rawArgs.find((arg) => arg.startsWith('--view-shell-smoke='));
const viewZeroLinkArg = rawArgs.find((arg) => arg.startsWith('--view0-link-smoke='));
const view6FixtureButtonArg = rawArgs.find((arg) => arg.startsWith('--view6-fixture-button-smoke='));
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


if (args.has('--real-demo-state-json-smoke')) {
  const realConfig = readTerminalRuntimeConfig(['--adapter=real-demo']);
  const realAdapter = new RealDemoRuntimeAdapterPlaceholder(realConfig.boundary);
  printFrame(JSON.stringify(realAdapter.getState(), null, 2));
  process.exit(0);
}

if (args.has('--mouse-hitbox-state-json-smoke')) {
  const realConfig = readTerminalRuntimeConfig(['--adapter=real-demo']);
  const realAdapter = new RealDemoRuntimeAdapterPlaceholder(realConfig.boundary);
  realAdapter.handleMouse({ kind: 'click', x: 170, y: 24, button: 0 });
  realAdapter.handleMouse({ kind: 'click', x: 140, y: 18, button: 0 });
  realAdapter.handleMouse({ kind: 'click', x: 140, y: 18, button: 0 });
  realAdapter.handleMouse({ kind: 'wheel-up', x: 170, y: 24, button: 64 });
  printFrame(JSON.stringify(realAdapter.getState(), null, 2));
  process.exit(0);
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


if (args.has('--mouse-hitbox-smoke')) {
  const realConfig = readTerminalRuntimeConfig(['--adapter=real-demo']);
  const realAdapter = new RealDemoRuntimeAdapterPlaceholder(realConfig.boundary);
  realAdapter.handleMouse({ kind: 'click', x: 170, y: 24, button: 0 });
  realAdapter.handleMouse({ kind: 'click', x: 140, y: 18, button: 0 });
  realAdapter.handleMouse({ kind: 'click', x: 140, y: 18, button: 0 });
  realAdapter.handleMouse({ kind: 'wheel-up', x: 170, y: 24, button: 64 });
  printFrame(renderScreen(realAdapter.getState(), layout));
  process.exit(0);
}

if (args.has('--section-header-ids-smoke')) {
  await adapter.handleKey('H');
  printFrame(renderScreen(adapter.getState(), layout));
  process.exit(0);
}

if (args.has('--start-stage-modal-section-ids-smoke')) {
  await adapter.handleKey('H');
  await adapter.handleKey('S');
  printFrame(renderScreen(adapter.getState(), layout));
  process.exit(0);
}

if (viewShellArg) {
  const viewKey = viewShellArg.split('=')[1] ?? 'D';
  await adapter.handleKey(viewKey);
  printFrame(renderScreen(adapter.getState(), layout));
  process.exit(0);
}

if (viewZeroLinkArg) {
  const targetViewKey = viewZeroLinkArg.split('=')[1] ?? 'D';
  await adapter.handleKey('0');
  await adapter.handleKey(targetViewKey);
  printFrame(renderScreen(adapter.getState(), layout));
  process.exit(0);
}

if (args.has('--view0-default-test-route-smoke')) {
  await adapter.handleKey('0');
  await adapter.handleKey('ENTER');
  await adapter.handleKey('ENTER');
  await adapter.handleKey('ENTER');
  printFrame(renderScreen(adapter.getState(), layout));
  process.exit(0);
}

if (args.has('--view0-custom-test-route-smoke')) {
  for (const key of ['0', 'ENTER', '7', 'ENTER', 'D', 'ENTER']) await adapter.handleKey(key);
  printFrame(renderScreen(adapter.getState(), layout));
  process.exit(0);
}

if (view6FixtureButtonArg) {
  const key = view6FixtureButtonArg.split('=')[1] ?? '1';
  await adapter.handleKey('6');
  await adapter.handleKey(key);
  printFrame(renderScreen(adapter.getState(), layout));
  process.exit(0);
}

if (args.has('--empty-view-shells-smoke')) {
  const frames = [];
  for (const viewKey of ['0', 'D', 'L', 'I', '1', '2', '3', '4', '5', '6']) {
    frames.push(...await adapter.handleKey(viewKey));
  }
  printFrame(renderScreen(frames[frames.length - 1] ?? adapter.getState(), layout));
  process.exit(0);
}

if (args.has('--empty-view-modal-priority-smoke')) {
  await adapter.handleKey('S');
  await adapter.handleKey('2');
  printFrame(renderScreen(adapter.getState(), layout));
  process.exit(0);
}

if (args.has('--start-stage-modal-smoke')) {
  await adapter.handleKey('S');
  if (args.has('--start-stage-modal-key1-smoke')) await adapter.handleKey('1');
  if (args.has('--start-stage-modal-key2-smoke')) await adapter.handleKey('2');
  printFrame(renderScreen(adapter.getState(), layout));
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
process.stdout.write(mouseTrackingEnableSequence());
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', async (chunk) => {
  const key = String(chunk);
  const mouseEvent = parseSgrMouseEvent(key);
  if (mouseEvent && adapter.handleMouse) {
    const frames = await adapter.handleMouse(mouseEvent);
    clearAndPrint(renderScreen(frames[0] ?? adapter.getState(), layout));
    return;
  }

  if (key === '\u0003' || key.toUpperCase() === 'X') {
    process.stdout.write(mouseTrackingDisableSequence());
    process.stdin.setRawMode(false);
    process.stdin.pause();
    process.stdout.write(`\nExiting ${adapter.modeName} terminal.\n`);
    process.exit(0);
  }

  if (key === '\r' || key === '\n') {
    const frames = await adapter.handleKey('ENTER');
    clearAndPrint(renderScreen(frames[0] ?? adapter.getState(), layout));
    return;
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

  if (key.toUpperCase() === 'H' || key.toUpperCase() === 'W' || key.toUpperCase() === 'P' || key.toUpperCase() === 'S' || /^[0-9A-Z]$/i.test(key)) {
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
