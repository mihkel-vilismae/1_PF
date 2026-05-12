/*
 * Defines inspection and metadata route-table entries.
 * The server index still owns the concrete handlers.
 * This module only preserves public route-key wiring.
 */
import type { RouteHandler } from '../index.ts';

export interface InspectionRouteHandlers {
  versionHandler: RouteHandler;
  verifyEnvHandler: RouteHandler;
}

// Builds the route-key map for version and environment inspection endpoints.
export function createInspectionRoutes(handlers: InspectionRouteHandlers): Record<string, RouteHandler> {
  return {
    'GET /api/version': handlers.versionHandler,
    'POST /api/init/verify-env': handlers.verifyEnvHandler,
  };
}
