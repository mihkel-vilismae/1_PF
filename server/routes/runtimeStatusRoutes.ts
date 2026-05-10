/*
 * Defines runtime status HTTP route-table entries.
 * The server index still owns the concrete status handlers.
 * This module only preserves public route-key wiring.
 */
import type { RouteHandler } from '../index.ts';

export interface RuntimeStatusRouteHandlers {
  runtimeOrchestrationCurrentHandler: RouteHandler;
  runtimeOrchestrationLastHandler: RouteHandler;
}

// Builds the route-key map for read-only orchestration status endpoints.
export function createRuntimeStatusRoutes(handlers: RuntimeStatusRouteHandlers): Record<string, RouteHandler> {
  return {
    'GET /api/runtime/orchestration/current': handlers.runtimeOrchestrationCurrentHandler,
    'GET /api/runtime/orchestration/last': handlers.runtimeOrchestrationLastHandler,
  };
}
