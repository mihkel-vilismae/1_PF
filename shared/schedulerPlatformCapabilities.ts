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

export const SCHEDULER_TARGETS = Object.freeze({
  windowsCronEmulator: 'windows-cron-emulator',
  raspberryRealCrontab: 'raspberry-real-crontab',
});

export type SchedulerSupportLevel =
  (typeof SCHEDULER_SUPPORT_LEVELS)[keyof typeof SCHEDULER_SUPPORT_LEVELS];

export type SchedulerOperation =
  (typeof SCHEDULER_OPERATION_SUPPORT)[keyof typeof SCHEDULER_OPERATION_SUPPORT];

export type SchedulerTarget =
  (typeof SCHEDULER_TARGETS)[keyof typeof SCHEDULER_TARGETS];

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
  schedulerTarget: SchedulerTarget | string;
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
    schedulerTarget: SCHEDULER_TARGETS.windowsCronEmulator,
    schedulerMode: 'cron-emulator-process',
    supportLevel: SCHEDULER_SUPPORT_LEVELS.supported,
    operationSupport: {
      [SCHEDULER_OPERATION_SUPPORT.install]: SCHEDULER_SUPPORT_LEVELS.supported,
      [SCHEDULER_OPERATION_SUPPORT.status]: SCHEDULER_SUPPORT_LEVELS.supported,
      [SCHEDULER_OPERATION_SUPPORT.print]: SCHEDULER_SUPPORT_LEVELS.supported,
    },
    notes: [
      'Legacy /api/init/cron/* route names remain in place for frontend compatibility.',
      'Windows uses the repo-local tools/CronEmulator project as the cron job runner.',
      'CronEmulator is launched as an external process; its source is not modified by this dashboard integration.',
      'Windows cron emulation is a development/operator target and must not be presented as Unix cron parity.',
    ],
  },
  raspberryPiOs: {
    profileId: 'raspberry-pi-os',
    profileLabel: 'Raspberry Pi OS',
    platformFamily: 'linux',
    schedulerTarget: SCHEDULER_TARGETS.raspberryRealCrontab,
    schedulerMode: 'native-cron',
    supportLevel: SCHEDULER_SUPPORT_LEVELS.supported,
    operationSupport: {
      [SCHEDULER_OPERATION_SUPPORT.install]: SCHEDULER_SUPPORT_LEVELS.supported,
      [SCHEDULER_OPERATION_SUPPORT.status]: SCHEDULER_SUPPORT_LEVELS.supported,
      [SCHEDULER_OPERATION_SUPPORT.print]: SCHEDULER_SUPPORT_LEVELS.supported,
    },
    notes: [
      'Legacy /api/init/cron/* route names remain in place for frontend compatibility.',
      'Raspberry Pi OS uses real user crontab entries managed inside a project-owned block.',
      'Crontab install must preserve unrelated user crontab entries.',
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

export function isSchedulerTarget(value: unknown): value is SchedulerTarget {
  return Object.values(SCHEDULER_TARGETS).includes(value as SchedulerTarget);
}

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
