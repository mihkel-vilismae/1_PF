// Bridges terminal screen-worker activity into the backend screen-simulation route.
// This bridge is opt-in and failures stay local to preserve demo-safe behavior.

import type { RuntimeBoundaryState } from '../config/runtimeTypes.js';
import type { ScreenMonitorActivityInput, ScreenMonitorBridgeStatus } from './terminalScreenMonitorState.js';

const DEFAULT_SCREEN_SIMULATION_BRIDGE_URL = 'http://127.0.0.1:4301/api/runtime/screen-simulation/activity';
const SCREEN_SIMULATION_BRIDGE_TIMEOUT_MS = 1200;

// Posts one local activity event to the backend screen-simulation route when the bridge is enabled.
export async function bridgeScreenMonitorActivity(
  boundary: RuntimeBoundaryState,
  input: ScreenMonitorActivityInput,
): Promise<ScreenMonitorBridgeStatus> {
  if (!screenSimulationBridgeEnabled()) {
    return { status: 'disabled', message: 'screen-simulation bridge disabled' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SCREEN_SIMULATION_BRIDGE_TIMEOUT_MS);
  const bridgeUrl = resolveScreenSimulationBridgeUrl();

  try {
    const response = await fetch(bridgeUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: input.source,
        action: 'wake',
        detail: input.detail,
        runtimeMode: boundary.runtimeMode,
      }),
    });
    clearTimeout(timeout);
    if (!response.ok) {
      return {
        status: 'failed',
        message: `screen-simulation bridge HTTP ${response.status} ${response.statusText || 'request failed'}`,
      };
    }
    return {
      status: 'passed',
      message: `screen-simulation bridge updated ${bridgeUrl}`,
    };
  } catch (error) {
    clearTimeout(timeout);
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: 'failed',
      message: `screen-simulation bridge failed: ${message}`,
    };
  }
}

// Resolves whether the opt-in screen-simulation bridge should be used.
function screenSimulationBridgeEnabled(): boolean {
  return process.env.PHOTOFRAME_TERMINAL_DEMO_SCREEN_BRIDGE === '1';
}

// Resolves the backend bridge URL while keeping a stable localhost default for Windows proofs.
function resolveScreenSimulationBridgeUrl(): string {
  return process.env.PHOTOFRAME_TERMINAL_DEMO_SCREEN_BRIDGE_URL?.trim() || DEFAULT_SCREEN_SIMULATION_BRIDGE_URL;
}
