/*
 * Defines the scheduler and cron emulator HTTP route table entries.
 * The handlers remain owned by server/index.ts to keep this slice mechanical.
 * This module only preserves route-key wiring for the scheduler route family.
 */
import type { RouteHandler } from '../index.ts';

export interface SchedulerRouteHandlers {
  cronTargetStatusHandler: RouteHandler;
  selectCronTargetHandler: RouteHandler;
  installCronHandler: RouteHandler;
  cronStatusHandler: RouteHandler;
  printCronHandler: RouteHandler;
  checkEmulatorSchedulerHandler: RouteHandler;
  runEmulatorHandler: RouteHandler;
  stopEmulatorHandler: RouteHandler;
  installEmulatorCrontabHandler: RouteHandler;
  activeEmulatorCrontabHandler: RouteHandler;
  schedulerRunLogHandler: RouteHandler;
}

// Builds the route-key map for View A scheduler and cron emulator endpoints.
export function createSchedulerRoutes(handlers: SchedulerRouteHandlers): Record<string, RouteHandler> {
  return {
    'GET /api/init/cron/target': handlers.cronTargetStatusHandler,
    'POST /api/init/cron/target': handlers.selectCronTargetHandler,
    'POST /api/init/cron/install': handlers.installCronHandler,
    'GET /api/init/cron/status': handlers.cronStatusHandler,
    'GET /api/init/cron/print': handlers.printCronHandler,
    'GET /api/init/cron/emulator/check': handlers.checkEmulatorSchedulerHandler,
    'POST /api/init/cron/emulator/run': handlers.runEmulatorHandler,
    'POST /api/init/cron/emulator/stop': handlers.stopEmulatorHandler,
    'POST /api/init/cron/emulator/crontab': handlers.installEmulatorCrontabHandler,
    'GET /api/init/cron/emulator/crontab': handlers.activeEmulatorCrontabHandler,
    'GET /api/init/cron/run-log': handlers.schedulerRunLogHandler,
  };
}
