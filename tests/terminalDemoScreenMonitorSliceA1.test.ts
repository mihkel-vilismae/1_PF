/*
 * Verifies the terminal screen-worker monitor slices.
 * This covers the F toggle, PIR/keyboard/mouse activity, and honest panel wording.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readTerminalRuntimeConfig } from '../terminal/demo/src/config/terminalRuntimeConfig.js';
import { isPirButtonHit } from '../terminal/demo/src/input/terminalScreenHitTesting.js';
import { parseTerminalMouseEvent } from '../terminal/demo/src/input/terminalMouseInput.js';
import { MockDemoRuntimeAdapter } from '../terminal/demo/src/runtime/MockDemoRuntimeAdapter.js';
import { RealDemoRuntimeAdapterPlaceholder } from '../terminal/demo/src/runtime/RealDemoRuntimeAdapter.placeholder.js';
import { stripAnsi } from '../terminal/demo/src/ui/ansi.js';
import { renderScreenOnOff } from '../terminal/demo/src/ui/renderScreenOnOff.js';
import { readTerminalLayout } from '../terminal/demo/src/layout/readTerminalLayout.js';
import { renderScreen } from '../terminal/demo/src/ui/renderScreen.js';

// Confirms the mock adapter toggles the local monitor on and off with F.
test('mock terminal F toggles the local screen-worker monitor', async () => {
  const adapter = new MockDemoRuntimeAdapter();

  const enabledState = (await adapter.handleKey('F'))[0];
  assert.equal(enabledState.screenOnOff.monitorEnabled, true);
  assert.match(enabledState.screenOnOff.info, /enabled/i);
  assert.equal(enabledState.actions.find((action) => action.key === 'F')?.label, 'Disable screen worker monitor');
  assert.match(enabledState.screenOnOff.activityLog.at(-1) ?? '', /SCREEN WORKER MONITOR ENABLED/);

  const disabledState = (await adapter.handleKey('F'))[0];
  assert.equal(disabledState.screenOnOff.monitorEnabled, false);
  assert.equal(disabledState.actions.find((action) => action.key === 'F')?.label, 'Enable screen worker monitor');
  assert.match(disabledState.screenOnOff.activityLog.at(-1) ?? '', /SCREEN WORKER MONITOR DISABLED/);
});

// Confirms the real-demo adapter preserves the same local monitor toggle contract.
test('real-demo terminal F toggles the local screen-worker monitor', async () => {
  const boundary = readTerminalRuntimeConfig(['--adapter=real-demo']).boundary;
  const adapter = new RealDemoRuntimeAdapterPlaceholder(boundary);

  const enabledState = (await adapter.handleKey('F'))[0];
  assert.equal(enabledState.screenOnOff.monitorEnabled, true);
  assert.equal(enabledState.actions.find((action) => action.key === 'F')?.label, 'Disable screen worker monitor');
  assert.match(enabledState.currentRun.lines.join('\n'), /F pressed: screen-worker monitor enabled/i);
});

// Confirms the panel wording lights up the enabled state without claiming real hardware control.
test('screen-worker panel render shows enabled monitor state honestly', async () => {
  const adapter = new MockDemoRuntimeAdapter();
  const enabledState = (await adapter.handleKey('F'))[0];
  const markup = renderScreenOnOff(enabledState, 'SCREEN ON/OFF WORKER');

  assert.match(markup, /Monitor: .*ENABLED/);
  assert.match(markup, /State: .*ACTIVE/);
  assert.match(markup, /\[ PIR \]/);
  assert.match(markup, /Simulation-only screen-worker monitor is enabled/i);
  assert.doesNotMatch(markup, /real hardware/i);
});

// Confirms the shared activity path records PIR, keyboard, and mouse inputs locally.
test('screen-worker activity path records PIR, keyboard, and mouse inputs', async () => {
  const adapter = new MockDemoRuntimeAdapter();
  await adapter.handleKey('F');

  const pirState = await adapter.handleScreenMonitorActivity({ source: 'pir', detail: 'PIR SENSOR INPUT', occurredAt: '2026-06-29T12:00:00.000Z' });
  assert.equal(pirState.screenOnOff.lastActivitySource, 'pir');
  assert.match(pirState.screenOnOff.activityLog.at(-1) ?? '', /PIR SENSOR INPUT/);

  const keyboardState = await adapter.handleScreenMonitorActivity({ source: 'keyboard', detail: 'KEYBOARD INPUT A', occurredAt: '2026-06-29T12:00:01.000Z' });
  assert.equal(keyboardState.screenOnOff.keyboardEnabled, true);
  assert.equal(keyboardState.screenOnOff.lastActivitySource, 'keyboard');

  const mouseState = await adapter.handleScreenMonitorActivity({ source: 'mouse', detail: 'MOUSE MOVEMENT x=20 y=8', occurredAt: '2026-06-29T12:00:02.000Z' });
  assert.equal(mouseState.screenOnOff.mouseEnabled, true);
  assert.equal(mouseState.screenOnOff.lastActivitySource, 'mouse');
});

// Confirms the real-demo adapter keeps screen-monitor activity local when the bridge is disabled.
test('real-demo activity path stays local when the bridge is disabled', async () => {
  const boundary = readTerminalRuntimeConfig(['--adapter=real-demo']).boundary;
  const adapter = new RealDemoRuntimeAdapterPlaceholder(boundary);
  await adapter.handleKey('F');

  const state = await adapter.handleScreenMonitorActivity({ source: 'pir', detail: 'PIR SENSOR INPUT', occurredAt: '2026-06-29T12:00:03.000Z' });
  assert.equal(state.screenOnOff.lastActivitySource, 'pir');
  assert.match(state.screenOnOff.info, /recorded locally/i);
});

// Confirms SGR mouse input parsing keeps button, kind, and coordinates intact.
test('terminal mouse parser reads SGR mouse events', () => {
  assert.deepEqual(parseTerminalMouseEvent('\u001b[<35;22;9M'), {
    button: 'unknown',
    kind: 'move',
    x: 22,
    y: 9,
  });
  assert.deepEqual(parseTerminalMouseEvent('\u001b[<0;18;12M'), {
    button: 'left',
    kind: 'press',
    x: 18,
    y: 12,
  });
});

// Confirms PIR button hit testing works against the already-rendered terminal screen.
test('rendered terminal output exposes a clickable PIR button region', async () => {
  const adapter = new MockDemoRuntimeAdapter();
  const layout = readTerminalLayout();
  const enabledState = (await adapter.handleKey('F'))[0];
  const output = renderScreen(enabledState, layout, 220);
  const lines = output.split('\n');
  const lineIndex = lines.findIndex((line) => line.includes('[ PIR ]'));
  const buttonStart = stripAnsi(lines[lineIndex] ?? '').indexOf('[ PIR ]');

  assert.ok(lineIndex >= 0);
  assert.ok(buttonStart >= 0);
  assert.equal(isPirButtonHit(output, buttonStart + 2, lineIndex + 1), true);
});
