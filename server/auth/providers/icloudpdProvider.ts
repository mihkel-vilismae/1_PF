import { createIcloudpdProcessRunner, normalizeProviderPath } from './icloudpdProcessRunner.ts';
import { redactedEmail, sanitizeIcloudpdText } from './icloudpdSanitizer.ts';
import type { AuthProvider, AuthProviderContext, AuthProviderOutcome, AuthProviderReadiness, IcloudpdConfig, IcloudpdProcessRunner, IcloudpdCommandResult } from '../authTypes.ts';

const PROVIDER_OUTCOMES = Object.freeze({
  PROVIDER_UNAVAILABLE: 'provider_unavailable',
  MISSING_CONFIG: 'missing_config',
  STARTED: 'started',
  REQUIRES_2FA: 'requires_2fa',
  AUTHENTICATED: 'authenticated',
  FAILED: 'failed',
});

const ICLOUDPD_REQUIRED_KEYS = ['user', 'pw', 'ICLOUDPD_COOKIE_DIR'];
const ICLOUDPD_SESSION_REQUIRED_KEYS = ['user', 'ICLOUDPD_COOKIE_DIR'];

interface CreateIcloudpdProviderOptions {
  runner?: IcloudpdProcessRunner;
  cwd?: string;
}

interface BuildIcloudpdConfigOptions {
  cwd?: string;
}

interface MapIcloudpdResultOptions {
  config: IcloudpdConfig;
  defaultSuccessMessage: string;
}

export function createIcloudpdProvider({
  runner = createIcloudpdProcessRunner(),
  cwd = process.cwd(),
}: CreateIcloudpdProviderOptions = {}): AuthProvider {
  return {
    name: 'icloud',
    async verifyPreflight(context: AuthProviderContext = {}): Promise<AuthProviderReadiness> {
      const config = buildIcloudpdConfig(context, { cwd });
      const missing = validateIcloudpdConfig(config);
      const executableCheck = await runner.checkExecutable();
      return {
        provider: 'icloud',
        executable: runner.executable || 'icloudpd',
        icloudpdAvailable: Boolean(executableCheck.available),
        hasRequiredConfig: missing.length === 0,
        missingRequiredKeys: missing,
        code: executableCheck.available ? 'icloudpd_executable_available' : executableCheck.code,
        message: executableCheck.available
          ? 'icloudpd executable is available and required auth configuration was checked.'
          : executableCheck.message,
        detailMessage: executableCheck.detailMessage || null,
        next_action: missing.length > 0
          ? 'fix_auth_configuration'
          : executableCheck.available
            ? 'check_login_or_login_using_env_values'
            : 'install_or_configure_icloudpd',
      };
    },
    async startLogin(context: AuthProviderContext = {}): Promise<AuthProviderOutcome> {
      const config = buildIcloudpdConfig(context, { cwd });
      const missing = validateIcloudpdConfig(config);
      if (missing.length > 0) {
        return missingConfigOutcome(missing);
      }

      const executableCheck = await runner.checkExecutable();
      if (!executableCheck.available) {
        return providerUnavailableOutcome(executableCheck.message, executableCheck.code, executableCheck.detailMessage);
      }

      const result = await runner.startAuth({ config });
      return mapIcloudpdResultToOutcome(result, {
        config,
        defaultSuccessMessage: 'icloudpd authenticated successfully and created or verified a local session.',
      });
    },
    async submitTwoFactor(context: AuthProviderContext = {}): Promise<AuthProviderOutcome> {
      const config = buildIcloudpdConfig(context, { cwd });
      config.twoFactorCode = typeof context.twoFactorCode === 'string' ? context.twoFactorCode : null;
      const missing = validateIcloudpdConfig(config);
      if (missing.length > 0) {
        return missingConfigOutcome(missing);
      }
      if (!context.twoFactorCode || typeof context.twoFactorCode !== 'string') {
        return {
          outcome: PROVIDER_OUTCOMES.FAILED,
          code: 'icloudpd_2fa_code_missing',
          message: 'icloudpd 2FA submission requires a non-empty code.',
        };
      }

      const executableCheck = await runner.checkExecutable();
      if (!executableCheck.available) {
        return providerUnavailableOutcome(executableCheck.message, executableCheck.code, executableCheck.detailMessage);
      }

      const result = await runner.submitTwoFactor({ config });
      if (result.unsupportedTwoFactor) {
        return {
          outcome: PROVIDER_OUTCOMES.PROVIDER_UNAVAILABLE,
          code: 'icloudpd_unsupported_2fa_flow',
          message: 'The installed icloudpd flow does not expose a safe non-interactive 2FA submission boundary for this backend endpoint. Complete the interactive icloudpd authentication manually or use a provider version/flow that supports backend-driven 2FA.',
          next_action: 'complete_icloudpd_2fa_manually',
          detailMessage: sanitizeIcloudpdText(result.sanitizedCombinedOutput, config),
        };
      }
      return mapIcloudpdResultToOutcome(result, {
        config,
        defaultSuccessMessage: 'icloudpd accepted the 2FA challenge and verified the session.',
      });
    },
    async resumeSession(context: AuthProviderContext = {}): Promise<AuthProviderOutcome> {
      const config = buildIcloudpdConfig(context, { cwd });
      const missing = validateIcloudpdSessionConfig(config);
      if (missing.length > 0) {
        return missingConfigOutcome(missing);
      }

      const executableCheck = await runner.checkExecutable();
      if (!executableCheck.available) {
        return providerUnavailableOutcome(executableCheck.message, executableCheck.code, executableCheck.detailMessage);
      }

      const result = await runner.verifySession({ config });
      return mapIcloudpdResultToOutcome(result, {
        config,
        defaultSuccessMessage: 'icloudpd verified the existing local session.',
      });
    },
    async testLoginByDownloadingSingleFile(context: AuthProviderContext = {}): Promise<AuthProviderOutcome> {
      const config = buildIcloudpdConfig({
        ...context,
        downloadDir: context.downloadDirectory || context.downloadDir,
      }, { cwd });
      const missing = validateIcloudpdConfig(config);
      if (missing.length > 0) {
        return missingConfigOutcome(missing);
      }

      const executableCheck = await runner.checkExecutable();
      if (!executableCheck.available) {
        return providerUnavailableOutcome(executableCheck.message, executableCheck.code, executableCheck.detailMessage);
      }

      const result = await runner.downloadSingleFile({ config });
      return mapIcloudpdResultToOutcome(result, {
        config,
        defaultSuccessMessage: 'icloudpd authenticated and downloaded one recent file into the auth test directory.',
      });
    },
    async logout(context: AuthProviderContext = {}): Promise<AuthProviderOutcome> {
      const config = buildIcloudpdConfig(context, { cwd });
      if (!config.cookieDir) {
        return {
          outcome: PROVIDER_OUTCOMES.PROVIDER_UNAVAILABLE,
          code: 'icloudpd_cookie_dir_missing',
          message: 'Local icloudpd cleanup could not run because ICLOUDPD_COOKIE_DIR is missing.',
          next_action: 'fix_auth_configuration',
        };
      }
      const cleanupResult = await runner.cleanup({ config });
      return {
        outcome: PROVIDER_OUTCOMES.STARTED,
        code: 'icloudpd_local_cleanup_complete',
        message: `${cleanupResult.message || 'Local icloudpd auth artifacts were cleared.'} Remote Apple logout was not claimed.`,
        next_action: 'run_auth_preflight',
      };
    },
  };
}

export function buildIcloudpdConfig(context: AuthProviderContext = {}, { cwd = process.cwd() }: BuildIcloudpdConfigOptions = {}): IcloudpdConfig {
  const envValues = context.envValues || context.config || {};
  const config: IcloudpdConfig = {
    username: (envValues.user as string | undefined) || process.env.user || process.env.APPLE_ID || null,
    password: (envValues.pw as string | undefined) || process.env.pw || process.env.APPLE_PASSWORD || null,
    cookieDir: normalizeProviderPath(envValues.ICLOUDPD_COOKIE_DIR || process.env.ICLOUDPD_COOKIE_DIR, { cwd }),
    downloadDir: normalizeProviderPath(context.downloadDir || context.downloadDirectory || envValues.DOWNLOAD_DIR || process.env.DOWNLOAD_DIR || envValues.TEST_DOWNLOAD_DIR, { cwd }),
    domain: (envValues.ICLOUDPD_DOMAIN as string | undefined) || process.env.ICLOUDPD_DOMAIN || null,
    recentCount: (envValues.DOWNLOAD_RECENT as string | number | undefined) || process.env.DOWNLOAD_RECENT || '1',
    timeoutMs: Number(envValues.ICLOUDPD_AUTH_TIMEOUT_MS || process.env.ICLOUDPD_AUTH_TIMEOUT_MS || 120_000),
  };
  return config;
}

export function validateIcloudpdConfig(config: IcloudpdConfig): string[] {
  const missing = validateIcloudpdSessionConfig(config);
  if (!config.password) missing.push('pw');
  return missing;
}

export function validateIcloudpdSessionConfig(config: IcloudpdConfig): string[] {
  const missing: string[] = [];
  if (!config.username) missing.push('user');
  if (!config.cookieDir) missing.push('ICLOUDPD_COOKIE_DIR');
  return missing;
}

export function mapIcloudpdResultToOutcome(result: IcloudpdCommandResult, { config, defaultSuccessMessage }: MapIcloudpdResultOptions): AuthProviderOutcome {
  const output = sanitizeIcloudpdText(result?.sanitizedCombinedOutput || `${result?.stdout || ''}\n${result?.stderr || ''}`, config);
  const lower = output.toLowerCase();

  if (indicatesTwoFactorRequired(lower)) {
    return {
      outcome: PROVIDER_OUTCOMES.REQUIRES_2FA,
      code: 'icloudpd_requires_2fa',
      message: 'icloudpd reported that a two-factor authentication challenge is required.',
      two_factor_method: inferTwoFactorMethod(lower),
      next_action: 'submit_two_factor_code',
      providerRawStatus: { sanitizedOutput: output },
    };
  }

  if (result?.timedOut) {
    return {
      outcome: PROVIDER_OUTCOMES.FAILED,
      code: 'icloudpd_timeout',
      message: 'icloudpd authentication timed out before a verifiable auth result was produced.',
      detailMessage: output,
    };
  }

  if (indicatesInvalidCredentials(lower)) {
    return {
      outcome: PROVIDER_OUTCOMES.FAILED,
      code: 'icloudpd_invalid_credentials',
      message: 'icloudpd reported invalid iCloud credentials.',
      detailMessage: output,
    };
  }

  if (Number(result?.exitCode) === 0 && indicatesAuthenticated(lower)) {
    return {
      outcome: PROVIDER_OUTCOMES.AUTHENTICATED,
      code: 'icloudpd_authenticated',
      message: defaultSuccessMessage,
      authenticatedUser: redactedEmail(config.username),
      providerSessionRef: 'icloudpd_cookie_directory_internal',
      providerRawStatus: { sanitizedOutput: output },
    };
  }

  if (Number(result?.exitCode) === 0) {
    return {
      outcome: PROVIDER_OUTCOMES.STARTED,
      code: 'icloudpd_started_unverified',
      message: 'icloudpd command completed, but the output did not prove an authenticated session. The backend did not promote auth to authenticated.',
      next_action: 'inspect_icloudpd_auth_output',
      providerRawStatus: { sanitizedOutput: output },
    };
  }

  return {
    outcome: PROVIDER_OUTCOMES.FAILED,
    code: 'icloudpd_failed',
    message: 'icloudpd authentication failed before a verifiable auth state was produced.',
    detailMessage: output,
  };
}

function missingConfigOutcome(missingKeys: string[]): AuthProviderOutcome {
  return {
    outcome: PROVIDER_OUTCOMES.MISSING_CONFIG,
    code: 'icloudpd_missing_config',
    message: `icloudpd auth is missing required configuration: ${missingKeys.join(', ')}.`,
    missingRequiredKeys: missingKeys.filter((key) => ICLOUDPD_REQUIRED_KEYS.includes(key)),
    next_action: 'fix_auth_configuration',
  };
}

function providerUnavailableOutcome(message?: string, code = 'icloudpd_provider_unavailable', detailMessage: string | null = null): AuthProviderOutcome {
  return {
    outcome: PROVIDER_OUTCOMES.PROVIDER_UNAVAILABLE,
    code,
    message: message || 'icloudpd provider execution is unavailable.',
    detailMessage,
    next_action: 'install_or_configure_icloudpd',
  };
}

function indicatesTwoFactorRequired(lower: string): boolean {
  return /two[-\s]?factor|2fa|two[-\s]?step|verification code|mfa|trusted device|trusted phone|enter code|security code/.test(lower);
}

function inferTwoFactorMethod(lower: string): string {
  if (/sms|phone/.test(lower)) return 'sms';
  if (/trusted device|device/.test(lower)) return 'trusted_device';
  return 'icloudpd_challenge';
}

function indicatesInvalidCredentials(lower: string): boolean {
  return /invalid.*(password|credential|email)|incorrect.*password|authentication error|failed to login|bad username|bad password/.test(lower);
}

function indicatesAuthenticated(lower: string): boolean {
  return /authenticated|authentication successful|valid session|cookie.*valid|auth.*successful|successfully authenticated|using existing session|download.*complete|dry run|auth-only/.test(lower) && !indicatesInvalidCredentials(lower);
}

export { ICLOUDPD_REQUIRED_KEYS, ICLOUDPD_SESSION_REQUIRED_KEYS };
