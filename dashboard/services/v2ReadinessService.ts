/*
 * V2 readiness and runtime-mode service.
 *
 * The V2 Beeline requires three global readiness rings before autonomous
 * real playback can start: .env, database, and iCloudPD login/session.
 * Readiness is tracked per runtime mode so TEST and REAL cannot accidentally
 * share operator state.
 */

export type V2RuntimeMode = 'test' | 'real';
export type V2ReadinessKey = 'env' | 'db' | 'login';
export type V2ReadinessStatus = 'unknown' | 'running' | 'complete' | 'blocked' | 'error';

export type V2ReadinessGateDefinition = {
  key: V2ReadinessKey;
  ringLabel: string;
  title: string;
  proofCommand: string;
  proofLabel: string;
  proofRequirement: string;
  unknownReason: string;
  completeReason: string;
  requiresProofRunner: true;
  requiresLiveTarget: true;
  claimAllowedBeforeProof: false;
};

export type V2ReadinessGateViewModel = V2ReadinessGateDefinition & {
  mode: V2RuntimeMode;
  status: V2ReadinessStatus;
  displayStatus: 'blank' | 'running' | 'complete' | 'blocked' | 'error';
  stateLabel: string;
  reason: string;
};

export type V2ReadinessMatrix = Record<V2RuntimeMode, Record<V2ReadinessKey, V2ReadinessStatus>>;

const readiness: V2ReadinessMatrix = {
  test: { env: 'unknown', db: 'unknown', login: 'unknown' },
  real: { env: 'unknown', db: 'unknown', login: 'unknown' },
};


export const V2_READINESS_GATES: readonly V2ReadinessGateDefinition[] = Object.freeze([
  {
    key: 'env',
    ringLabel: '.env',
    title: '.env verified',
    proofCommand: 'proof:v2-real-machine-readiness',
    proofLabel: 'Real-machine readiness proof',
    proofRequirement: 'Required keys, TEST/REAL path separation, and configured runtime paths must be proven on the target machine.',
    unknownReason: '.env has not been verified by current proofrunner/live evidence, so the ring stays blank.',
    completeReason: '.env can only become complete after current target proof evidence passes.',
    requiresProofRunner: true,
    requiresLiveTarget: true,
    claimAllowedBeforeProof: false,
  },
  {
    key: 'db',
    ringLabel: 'DB',
    title: 'Database verified',
    proofCommand: 'proof:v2-real-machine-readiness',
    proofLabel: 'Real-machine readiness proof',
    proofRequirement: 'Database existence, schema, and exact table-count readiness must be proven on the target machine.',
    unknownReason: 'Database existence/schema/table-count evidence has not been verified, so the ring stays blank.',
    completeReason: 'Database readiness can only become complete after current target proof evidence passes.',
    requiresProofRunner: true,
    requiresLiveTarget: true,
    claimAllowedBeforeProof: false,
  },
  {
    key: 'login',
    ringLabel: 'Auth',
    title: 'iCloud/auth login verified',
    proofCommand: 'proof:real-icloudpd-readiness',
    proofLabel: 'iCloudPD readiness proof',
    proofRequirement: 'Usable, redacted iCloudPD/auth session evidence must be proven without exposing credentials or cookies.',
    unknownReason: 'iCloud/auth login has not been verified by current proof evidence, so the ring stays blank.',
    completeReason: 'Auth readiness can only become complete after current iCloudPD readiness evidence passes.',
    requiresProofRunner: true,
    requiresLiveTarget: true,
    claimAllowedBeforeProof: false,
  },
] satisfies readonly V2ReadinessGateDefinition[]);

export function getV2ReadinessGateDefinitions(): readonly V2ReadinessGateDefinition[] {
  return V2_READINESS_GATES;
}

export function getV2ReadinessGateDefinition(key: V2ReadinessKey): V2ReadinessGateDefinition {
  return V2_READINESS_GATES.find((gate) => gate.key === key) ?? V2_READINESS_GATES[0];
}

export function getV2ReadinessGateViewModel(
  key: V2ReadinessKey,
  mode: V2RuntimeMode = currentMode,
): V2ReadinessGateViewModel {
  const selectedMode = normalizeV2RuntimeMode(mode);
  const definition = getV2ReadinessGateDefinition(key);
  const status = getReadinessStatus(key, selectedMode);
  const displayStatus = status === 'unknown' ? 'blank' : status;
  const stateLabel = status === 'unknown'
    ? 'not proven'
    : status === 'complete'
      ? 'complete'
      : status;
  const reason = status === 'complete' ? definition.completeReason : definition.unknownReason;
  return {
    ...definition,
    mode: selectedMode,
    status,
    displayStatus,
    stateLabel,
    reason,
  };
}

export function getV2ReadinessChecklist(mode: V2RuntimeMode = currentMode): readonly V2ReadinessGateViewModel[] {
  const selectedMode = normalizeV2RuntimeMode(mode);
  return V2_READINESS_GATES.map((gate) => getV2ReadinessGateViewModel(gate.key, selectedMode));
}

let currentMode: V2RuntimeMode = 'test';

export function normalizeV2RuntimeMode(value: unknown): V2RuntimeMode {
  return value === 'real' ? 'real' : 'test';
}

export function getCurrentMode(): V2RuntimeMode {
  return currentMode;
}

export function setCurrentMode(mode: V2RuntimeMode): void {
  currentMode = normalizeV2RuntimeMode(mode);
}

export function getReadinessStatus(key: V2ReadinessKey, mode: V2RuntimeMode = currentMode): V2ReadinessStatus {
  return readiness[normalizeV2RuntimeMode(mode)][key] ?? 'unknown';
}

export function setReadinessStatus(
  key: V2ReadinessKey,
  status: V2ReadinessStatus,
  mode: V2RuntimeMode = currentMode,
): void {
  readiness[normalizeV2RuntimeMode(mode)][key] = status;
}

export function getReadinessSnapshot(): V2ReadinessMatrix {
  return {
    test: { ...readiness.test },
    real: { ...readiness.real },
  };
}

export function isModeReadyForAutonomousPlayback(mode: V2RuntimeMode = currentMode): boolean {
  const selected = readiness[normalizeV2RuntimeMode(mode)];
  return selected.env === 'complete' && selected.db === 'complete' && selected.login === 'complete';
}
