/*
 * Owns runtime screen-simulation HTTP handlers and state.
 * This route module is simulation-only and never touches real display hardware.
 * The server index wires these handlers into the existing route table.
 */
import type { RouteHandler } from '../index.ts';

export interface ScreenSimulationConfig {
  pirEnabled: boolean;
  mouseEnabled: boolean;
  keyboardEnabled: boolean;
  simulateAllEnabled: boolean;
  inactivityTimeoutSeconds: number;
}

export interface ScreenSimulationState {
  status: 'ok';
  simulationOnly: true;
  simulation: ScreenSimulationConfig;
  screen: {
    screenState: 'ON' | 'OFF';
    lastActivitySource: string;
    inactivityTimeoutSeconds: number;
    playbackStatus: string;
    lastCheckpoint: string;
    updatedAt: string;
  };
  messages: string[];
  schemaVersion: number;
}

export interface ScreenSimulationRouteDependencies {
  createBadRequestError: (code: string, message: string, details: unknown) => Error;
  isJsonObject: (value: unknown) => value is Record<string, unknown>;
}

// Creates the GET/POST runtime screen-simulation route handlers with private module state.
export function createScreenSimulationRoutes(dependencies: ScreenSimulationRouteDependencies): Record<string, RouteHandler> {
  let screenSimulationState: ScreenSimulationState = buildScreenSimulationState(
    {
      pirEnabled: true,
      mouseEnabled: true,
      keyboardEnabled: true,
      simulateAllEnabled: true,
      inactivityTimeoutSeconds: 5,
    },
    'Initial backend-owned screen simulation state.',
  );

  // Returns the last configured simulation-only screen state.
  const runtimeScreenSimulationStateHandler: RouteHandler = () => ({
    statusCode: 200,
    payload: screenSimulationState,
  });

  // Validates and stores simulation-only screen input without touching hardware.
  const runtimeScreenSimulationConfigureHandler: RouteHandler = ({ body }) => {
    const config = normalizeScreenSimulationConfig(body?.simulation, dependencies);
    screenSimulationState = buildScreenSimulationState(config, 'Backend-owned screen simulation state updated.');
    return { statusCode: 200, payload: screenSimulationState };
  };

  return {
    'GET /api/runtime/screen-simulation/state': runtimeScreenSimulationStateHandler,
    'POST /api/runtime/screen-simulation/configure': runtimeScreenSimulationConfigureHandler,
  };
}

// Normalizes incoming simulation config and preserves existing validation errors.
export function normalizeScreenSimulationConfig(
  value: unknown,
  dependencies: ScreenSimulationRouteDependencies,
): ScreenSimulationConfig {
  if (!dependencies.isJsonObject(value)) {
    throw dependencies.createBadRequestError('invalid_screen_simulation_config', 'Screen simulation configure requires a simulation object.', {
      expected: {
        simulation: {
          pirEnabled: true,
          mouseEnabled: true,
          keyboardEnabled: true,
          simulateAllEnabled: true,
          inactivityTimeoutSeconds: 5,
        },
      },
    });
  }

  const timeout = Number(value.inactivityTimeoutSeconds);
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > 60) {
    throw dependencies.createBadRequestError(
      'invalid_screen_simulation_timeout',
      'Screen simulation inactivityTimeoutSeconds must be an integer from 1 to 60.',
      {
        received: value.inactivityTimeoutSeconds,
        minimum: 1,
        maximum: 60,
      },
    );
  }

  const config = {
    pirEnabled: Boolean(value.pirEnabled),
    mouseEnabled: Boolean(value.mouseEnabled),
    keyboardEnabled: Boolean(value.keyboardEnabled),
    simulateAllEnabled: Boolean(value.simulateAllEnabled),
    inactivityTimeoutSeconds: timeout,
  };

  if (config.simulateAllEnabled) {
    config.pirEnabled = true;
    config.mouseEnabled = true;
    config.keyboardEnabled = true;
  } else if (!config.pirEnabled || !config.mouseEnabled || !config.keyboardEnabled) {
    config.simulateAllEnabled = false;
  }

  return config;
}

// Builds the unchanged simulation-only response payload used by both screen routes.
export function buildScreenSimulationState(config: ScreenSimulationConfig, message: string): ScreenSimulationState {
  const anyEnabled = config.simulateAllEnabled || config.pirEnabled || config.mouseEnabled || config.keyboardEnabled;
  const screenState = anyEnabled ? 'ON' : 'OFF';
  const lastActivitySource = config.simulateAllEnabled
    ? 'All simulated activity sources enabled'
    : config.pirEnabled
      ? 'PIR sensor activity enabled'
      : config.mouseEnabled
        ? 'Mouse movement enabled'
        : config.keyboardEnabled
          ? 'Keyboard activity enabled'
          : 'No simulated activity sources enabled';
  const updatedAt = new Date().toISOString();

  return {
    status: 'ok',
    simulationOnly: true,
    simulation: structuredClone(config),
    screen: {
      screenState,
      lastActivitySource,
      inactivityTimeoutSeconds: config.inactivityTimeoutSeconds,
      playbackStatus: screenState === 'OFF' ? 'Paused by backend screen simulation' : 'Ready for backend playback selection',
      lastCheckpoint: screenState === 'OFF' ? `${updatedAt} backend screen-simulation checkpoint saved` : updatedAt,
      updatedAt,
    },
    messages: [
      message,
      'This endpoint stores simulation state only; it does not control or report real screen hardware.',
    ],
    schemaVersion: 1,
  };
}
