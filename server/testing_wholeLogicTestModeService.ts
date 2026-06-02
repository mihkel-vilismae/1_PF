/*
 * Builds the guarded Test Mode whole-logic emulator start contract.
 * The service records scheduler/emulator cadence and item-limit intent without
 * killing processes or changing production authentication behavior.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  WHOLE_LOGIC_TEST_MODE_STAGE_LIMIT,
  buildWholeLogicTestModeConfig,
  buildWholeLogicWindowsCronEmulatorCrontabText,
} from '../shared/testModeWholeLogicContract.ts';

type RuntimeMode = 'test' | 'real' | string | undefined;

type WholeLogicStartOptions = {
  runtimeMode?: RuntimeMode;
  platform?: NodeJS.Platform | string;
  repoRoot?: string;
  configFilePath?: string;
  crontabFilePath?: string;
  now?: Date;
};

// Creates or reports the Test Mode whole-logic scheduler/emulator start boundary.
export async function buildWholeLogicTestModeStartResult(options: WholeLogicStartOptions = {}) {
  const nowIso = (options.now ?? new Date()).toISOString();
  const config = buildWholeLogicTestModeConfig(nowIso);
  const crontabText = buildWholeLogicWindowsCronEmulatorCrontabText();
  const runtimeMode = options.runtimeMode ?? 'unknown';

  if (runtimeMode !== 'test') {
    return {
      status: 'blocked',
      message: 'Whole-logic no-login emulator start is blocked outside Test Mode.',
      runtimeMode,
      destructiveActionAttempted: false,
      productionBehaviorChanged: false,
      schemaVersion: config.schemaVersion,
      generatedAt: nowIso,
    };
  }

  const writes = await writeWholeLogicRuntimeFiles({ ...options, config, crontabText });
  return {
    status: 'ok',
    message: 'Test Mode whole-logic emulator boundary is configured. Group 2 does not terminate processes; Group 3 will add owned-process controls.',
    runtimeMode,
    platform: options.platform ?? process.platform,
    destructiveActionAttempted: false,
    productionBehaviorChanged: false,
    loginRequired: false,
    schedulerTarget: 'windows-cron-emulator',
    emulator: {
      configured: true,
      crontabText,
      crontabFilePath: writes.crontabFilePath,
      configFilePath: writes.configFilePath,
      limitation: 'Current CronEmulator uses five-field minute cron rows; requested 30-second playback cadence is preserved in the Test Mode controller config and will need the Group 3 controller loop for sub-minute runtime execution.',
    },
    workerStageItemLimit: WHOLE_LOGIC_TEST_MODE_STAGE_LIMIT,
    config,
    schemaVersion: config.schemaVersion,
    generatedAt: nowIso,
  };
}

// Writes the runtime config/crontab files only when file paths are supplied by the route.
async function writeWholeLogicRuntimeFiles({ configFilePath, crontabFilePath, config, crontabText }: WholeLogicStartOptions & { config: unknown; crontabText: string }) {
  if (configFilePath) {
    await fs.mkdir(path.dirname(configFilePath), { recursive: true });
    await fs.writeFile(configFilePath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  }
  if (crontabFilePath) {
    await fs.mkdir(path.dirname(crontabFilePath), { recursive: true });
    await fs.writeFile(crontabFilePath, crontabText, 'utf8');
  }

  return {
    configFilePath: configFilePath ?? null,
    crontabFilePath: crontabFilePath ?? null,
  };
}
