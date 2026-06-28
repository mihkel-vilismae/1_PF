import type { RecoveryService, RecoveryServiceOptions } from './recoveryContract.ts';
import { createRecoveryEngine } from './recoveryEngineRegistry.ts';

export function createRecoveryService(options: RecoveryServiceOptions): RecoveryService {
  return createRecoveryEngine(options);
}
