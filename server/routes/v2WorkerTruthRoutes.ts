import type { RouteHandler } from '../index.ts';
import { createV2WorkerTruthService, normalizeV2WorkerTruthMode } from '../v2WorkerTruthService.ts';

export interface V2WorkerTruthRouteDependencies {
  repoRoot: string;
  createHttpError: (statusCode: number, code: string, message: string, details?: unknown) => Error;
}

export function createV2WorkerTruthRoutes(dependencies: V2WorkerTruthRouteDependencies): Record<string, RouteHandler> {
  const getWorkerTruthHandler: RouteHandler = async ({ url, context }) => {
    const mode = normalizeV2WorkerTruthMode(url.searchParams.get('mode') ?? context.runtimeMode);
    const service = createV2WorkerTruthService({ repoRoot: dependencies.repoRoot, envValues: context.baseEnvValues });
    return {
      statusCode: 200,
      payload: await service.readCombined(mode),
    };
  };

  const appendWorkerTruthEventHandler: RouteHandler = async ({ body, context }) => {
    const mode = normalizeV2WorkerTruthMode(body?.mode ?? context.runtimeMode);
    const event = body?.event;
    if (!event || typeof event !== 'object' || Array.isArray(event)) {
      throw dependencies.createHttpError(400, 'invalid_worker_truth_event', 'event must be a JSON object.');
    }
    const service = createV2WorkerTruthService({ repoRoot: dependencies.repoRoot, envValues: context.baseEnvValues });
    const written = await service.appendEvent(mode, event as Record<string, unknown>);
    return {
      statusCode: 200,
      payload: {
        status: 'ok',
        schemaVersion: 1,
        mode,
        event: written,
        writtenAt: new Date().toISOString(),
      },
    };
  };

  return {
    'GET /api/v2/worker-truth': getWorkerTruthHandler,
    'POST /api/v2/worker-truth/event': appendWorkerTruthEventHandler,
  };
}
