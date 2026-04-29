export const SCHEDULER_SUPPORT_LEVELS = Object.freeze({
  supported: 'supported',
  deferred: 'deferred',
  unsupported: 'unsupported',
});

export const SCHEDULER_OPERATION_SUPPORT = Object.freeze({
  install: 'install',
  status: 'status',
  print: 'print',
});

export type SchedulerSupportLevel =
  (typeof SCHEDULER_SUPPORT_LEVELS)[keyof typeof SCHEDULER_SUPPORT_LEVELS];

export type SchedulerOperation =
  (typeof SCHEDULER_OPERATION_SUPPORT)[keyof typeof SCHEDULER_OPERATION_SUPPORT];

export type SchedulerCapabilityInput = {
  runtimePlatform?: string | null;
  nodePlatform?: string | null;
  browserPlatform?: string | null;
  userAgent?: string | null;
  [key: string]: unknown;
};

export type SchedulerCapability = {
  runtimePlatform: string;
  routeCompatibility: string;
  profileId: string;
  profileLabel: string;
  platformFamily: string;
  schedulerTarget: string;
  schedulerMode: string;
  supportLevel: SchedulerSupportLevel;
  operationSupport: Record<string, SchedulerSupportLevel>;
  notes: string[];
};

type SchedulerCapabilityProfile = Omit<SchedulerCapability, 'runtimePlatform' | 'routeCompatibility'>;

const ROUTE_COMPATIBILITY = '/api/init/cron/*';

const CAPABILITY_PROFILES = Object.freeze({
  windows11: {
    profileId: 'windows11',
    profileLabel: 'Windows 11',
    platformFamily: 'windows',
    schedulerTarget: 'windows-task-scheduler',
    schedulerMode: 'bootstrap-host',
    supportLevel: SCHEDULER_SUPPORT_LEVELS.supported,
    operationSupport: {
      [SCHEDULER_OPERATION_SUPPORT.install]: SCHEDULER_SUPPORT_LEVELS.supported,
      [SCHEDULER_OPERATION_SUPPORT.status]: SCHEDULER_SUPPORT_LEVELS.supported,
      [SCHEDULER_OPERATION_SUPPORT.print]: SCHEDULER_SUPPORT_LEVELS.supported,
    },
    notes: [
      'Legacy /api/init/cron/* route names remain in place for frontend compatibility.',
      'Windows uses an AtLogOn Task Scheduler task that starts one repo-local scheduler host.',
      'The scheduler host, not Task Scheduler repetition, preserves the documented 5s/5s/5s/15s cadence.',
      'The host currently reports heartbeat/tick state only; runtime services remain future work.',
    ],
  },
  raspberryPiOs: {
    profileId: 'raspberry-pi-os',
    profileLabel: 'Raspberry Pi OS',
    platformFamily: 'linux',
    schedulerTarget: 'unix-cron',
    schedulerMode: 'native-cron',
    supportLevel: SCHEDULER_SUPPORT_LEVELS.deferred,
    operationSupport: {
      [SCHEDULER_OPERATION_SUPPORT.install]: SCHEDULER_SUPPORT_LEVELS.deferred,
      [SCHEDULER_OPERATION_SUPPORT.status]: SCHEDULER_SUPPORT_LEVELS.supported,
      [SCHEDULER_OPERATION_SUPPORT.print]: SCHEDULER_SUPPORT_LEVELS.supported,
    },
    notes: [
      'Legacy /api/init/cron/* route names remain in place for frontend compatibility.',
      'A Unix-style cron target is defined for Raspberry Pi OS alignment, but install wiring is not implemented yet in this repository.',
      'Scheduler support is intentionally deferred on this platform until a real install/status/print implementation is added.',
    ],
  },
  unsupported: {
    profileId: 'unsupported-platform',
    profileLabel: 'Unsupported platform',
    platformFamily: 'unknown',
    schedulerTarget: 'unsupported',
    schedulerMode: 'none',
    supportLevel: SCHEDULER_SUPPORT_LEVELS.unsupported,
    operationSupport: {
      [SCHEDULER_OPERATION_SUPPORT.install]: SCHEDULER_SUPPORT_LEVELS.unsupported,
      [SCHEDULER_OPERATION_SUPPORT.status]: SCHEDULER_SUPPORT_LEVELS.supported,
      [SCHEDULER_OPERATION_SUPPORT.print]: SCHEDULER_SUPPORT_LEVELS.supported,
    },
    notes: [
      'Legacy /api/init/cron/* route names remain in place for frontend compatibility.',
      'No scheduler implementation exists for this platform profile in the current repository.',
    ],
  },
});

export function createSchedulerCapability(input: SchedulerCapabilityInput = {}): SchedulerCapability {
  const runtimePlatform = normalizeRuntimePlatform(input);
  const profileTemplate = pickProfile(runtimePlatform);
  return {
    runtimePlatform,
    routeCompatibility: ROUTE_COMPATIBILITY,
    profileId: profileTemplate.profileId,
    profileLabel: profileTemplate.profileLabel,
    platformFamily: profileTemplate.platformFamily,
    schedulerTarget: profileTemplate.schedulerTarget,
    schedulerMode: profileTemplate.schedulerMode,
    supportLevel: profileTemplate.supportLevel,
    operationSupport: { ...profileTemplate.operationSupport },
    notes: [...profileTemplate.notes],
  };
}

export function getOperationSupportLevel(
  capability: SchedulerCapability | null | undefined,
  operation: SchedulerOperation | string | null | undefined,
): SchedulerSupportLevel {
  return (
    capability?.operationSupport?.[operation] ??
    SCHEDULER_SUPPORT_LEVELS.unsupported
  );
}

export function isOperationExecutable(
  capability: SchedulerCapability | null | undefined,
  operation: SchedulerOperation | string | null | undefined,
): boolean {
  return getOperationSupportLevel(capability, operation) === SCHEDULER_SUPPORT_LEVELS.supported;
}

function pickProfile(runtimePlatform: string): SchedulerCapabilityProfile {
  if (runtimePlatform === 'win32' || runtimePlatform === 'windows') {
    return CAPABILITY_PROFILES.windows11;
  }

  if (runtimePlatform === 'linux') {
    return CAPABILITY_PROFILES.raspberryPiOs;
  }

  return CAPABILITY_PROFILES.unsupported;
}

function normalizeRuntimePlatform(input: SchedulerCapabilityInput): string {
  if (typeof input.runtimePlatform === 'string' && input.runtimePlatform.trim()) {
    return input.runtimePlatform.trim().toLowerCase();
  }

  if (typeof input.nodePlatform === 'string' && input.nodePlatform.trim()) {
    return input.nodePlatform.trim().toLowerCase();
  }

  const browserPlatform = normalizeBrowserPlatform(input.browserPlatform);
  if (browserPlatform) {
    return browserPlatform;
  }

  const userAgentPlatform = normalizeUserAgent(input.userAgent);
  if (userAgentPlatform) {
    return userAgentPlatform;
  }

  return 'unknown';
}

function normalizeBrowserPlatform(platform: string | null | undefined): string | null {
  if (typeof platform !== 'string' || !platform.trim()) {
    return null;
  }

  const normalized = platform.trim().toLowerCase();
  if (normalized.includes('win')) {
    return 'windows';
  }
  if (normalized.includes('linux')) {
    return 'linux';
  }
  return null;
}

function normalizeUserAgent(userAgent: string | null | undefined): string | null {
  if (typeof userAgent !== 'string' || !userAgent.trim()) {
    return null;
  }

  const normalized = userAgent.toLowerCase();
  if (normalized.includes('windows')) {
    return 'windows';
  }
  if (normalized.includes('linux')) {
    return 'linux';
  }
  return null;
}
