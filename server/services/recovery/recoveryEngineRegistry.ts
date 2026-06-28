import type { RecoveryEngine, RecoveryEngineId, RecoveryServiceOptions } from './recoveryContract.ts';
import { createRecoveryV1FileEngine } from './engines/recoveryV1FileEngine.ts';
import { createRecoveryV2StubEngine } from './engines/recoveryV2StubEngine.ts';

export const DEFAULT_RECOVERY_ENGINE_ID: RecoveryEngineId = 'v1';
export const RECOVERY_ENGINE_ENV_NAME = 'PF_V2_RECOVERY_ENGINE';

export class RecoveryEngineSelectionError extends Error {
  readonly requestedEngineId: string;
  readonly availableEngineIds: RecoveryEngineId[];

  constructor(requestedEngineId: string, availableEngineIds: RecoveryEngineId[]) {
    super(`Unknown recovery engine: ${requestedEngineId}. Available engines: ${availableEngineIds.join(', ')}`);
    this.name = 'RecoveryEngineSelectionError';
    this.requestedEngineId = requestedEngineId;
    this.availableEngineIds = availableEngineIds;
  }
}

export function listRecoveryEngineIds(): RecoveryEngineId[] {
  return ['v1', 'v2-stub'];
}

export function normalizeRecoveryEngineId(value: unknown): RecoveryEngineId | null {
  const text = String(value ?? '').trim();
  if (!text) return DEFAULT_RECOVERY_ENGINE_ID;
  return text === 'v1' || text === 'v2-stub' ? text : null;
}

export function resolveRecoveryEngineId(options: Pick<RecoveryServiceOptions, 'engineId' | 'env'> = {}): RecoveryEngineId {
  const requested = options.engineId ?? options.env?.[RECOVERY_ENGINE_ENV_NAME] ?? process.env[RECOVERY_ENGINE_ENV_NAME] ?? DEFAULT_RECOVERY_ENGINE_ID;
  const normalized = normalizeRecoveryEngineId(requested);
  if (!normalized) {
    throw new RecoveryEngineSelectionError(String(requested), listRecoveryEngineIds());
  }
  return normalized;
}

export function createRecoveryEngine(options: RecoveryServiceOptions): RecoveryEngine {
  const engineId = resolveRecoveryEngineId(options);
  if (engineId === 'v1') {
    return createRecoveryV1FileEngine(options);
  }
  return createRecoveryV2StubEngine(options);
}
