export type AuthRequiresTwoFactor = boolean | 'unknown';

export interface AuthErrorDetail {
  code?: string;
  message?: string;
  detailMessage?: string | null;
  missingRequiredKeys?: string[];
  checks?: AuthReadinessCheck[];
  [key: string]: unknown;
}

export interface AuthState {
  status: string;
  has_required_files: boolean;
  requires_2fa: AuthRequiresTwoFactor;
  two_factor_status: string;
  two_factor_method: string | null;
  next_action: string;
  attemptId: string | null;
  updatedAt: string | null;
  error: AuthErrorDetail | null;
  authenticatedUser: string | null;
  provider: string;
  internalAttempt?: unknown;
  providerSessionRef?: string | null;
  providerRawStatus?: Record<string, unknown> | null;
  lastProviderEvent?: string;
  [key: string]: unknown;
}

export type AuthStateOverrides = Partial<AuthState> & Record<string, unknown>;
export type PublicAuthState = AuthState;

export interface AuthReadinessCheck {
  key: string;
  label?: string;
  required?: boolean;
  present?: boolean;
  valid?: boolean;
  message?: string;
  severity?: string;
  details?: unknown;
  [key: string]: unknown;
}

export type AuthEnvValues = Record<string, string | number | boolean | null | undefined>;

export interface AuthPersistence {
  filePath?: string;
  load(): Promise<AuthState | null>;
  save(state: AuthState | AuthStateOverrides): Promise<AuthState>;
  clear(): Promise<void>;
}

export interface AuthProviderOutcome {
  outcome: string;
  code?: string;
  message?: string;
  detailMessage?: string | null;
  next_action?: string;
  two_factor_method?: string | null;
  method?: string | null;
  authenticatedUser?: string | null;
  providerSessionRef?: string | null;
  providerRawStatus?: Record<string, unknown> | null;
  internalAttempt?: unknown;
  missingRequiredKeys?: string[];
  [key: string]: unknown;
}

export interface AuthProviderContext {
  attemptId?: string | null;
  provider?: string;
  checks?: AuthReadinessCheck[];
  envValues?: AuthEnvValues;
  twoFactorCode?: string | null;
  providerSessionRef?: string | null;
  persistedAuthStatus?: string;
  downloadDirectory?: string | null;
  downloadDir?: string | null;
  config?: AuthEnvValues;
  [key: string]: unknown;
}

export interface AuthProviderReadiness {
  provider?: string;
  executable?: string;
  icloudpdAvailable?: boolean;
  hasRequiredConfig?: boolean;
  missingRequiredKeys?: string[];
  code?: string;
  message?: string;
  detailMessage?: string | null;
  next_action?: string;
  [key: string]: unknown;
}

export interface AuthProvider {
  name?: string;
  verifyPreflight?(context?: AuthProviderContext): Promise<AuthProviderReadiness>;
  startLogin?(context?: AuthProviderContext): Promise<AuthProviderOutcome>;
  submitTwoFactor?(context?: AuthProviderContext): Promise<AuthProviderOutcome>;
  resumeSession?(context?: AuthProviderContext): Promise<AuthProviderOutcome>;
  testLoginByDownloadingSingleFile?(context?: AuthProviderContext): Promise<AuthProviderOutcome>;
  logout?(context?: AuthProviderContext): Promise<AuthProviderOutcome>;
}

export interface AuthProviderRegistry {
  getProvider(providerName?: string): AuthProvider | null;
  hasProvider(providerName?: string): boolean;
  listProviders(): string[];
}

export interface AuthPreflightReadinessResult {
  status: 'ok' | 'error';
  provider: string;
  checkedAt: string;
  icloudpdAvailable: boolean;
  hasRequiredConfig: boolean;
  missingRequiredKeys: string[];
  executable: string;
  code: string;
  message: string;
  detailMessage: string | null;
  next_action: string;
  auth: PublicAuthState;
}

export interface SingleFileAuthTestSummary {
  downloadDirectory: string | null;
  requestedRecentCount: number;
  status: string;
  code: string | null;
  message: string | null;
  next_action: string | null;
}

export interface SingleFileAuthTestResult {
  auth: PublicAuthState;
  testDownload: SingleFileAuthTestSummary;
}

export interface AuthLogoutResult {
  providerLogoutPerformed: boolean;
  providerLogoutStatus: string;
  message: string;
  auth: PublicAuthState;
}

export interface IcloudpdConfig {
  username: string | null;
  password: string | null;
  cookieDir: string | null;
  downloadDir: string | null;
  domain: string | null;
  recentCount: string | number;
  timeoutMs: number;
  twoFactorCode?: string | null;
  sessionPath?: string | null;
  [key: string]: unknown;
}

export interface IcloudpdExecutableCheck {
  available: boolean;
  code?: string;
  message?: string;
  detailMessage?: string | null;
}

export interface IcloudpdCommandResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  sanitizedCombinedOutput: string;
  commandForDebug?: string[];
  timedOut?: boolean;
  unsupportedTwoFactor?: boolean;
}

export interface IcloudpdCleanupResult {
  localCleanupPerformed: boolean;
  message: string;
}

export interface IcloudpdProcessRunner {
  executable: string;
  checkExecutable(): Promise<IcloudpdExecutableCheck>;
  startAuth(args: { config: IcloudpdConfig }): Promise<IcloudpdCommandResult>;
  verifySession(args: { config: IcloudpdConfig }): Promise<IcloudpdCommandResult>;
  downloadSingleFile(args: { config: IcloudpdConfig }): Promise<IcloudpdCommandResult>;
  submitTwoFactor(args?: { config: IcloudpdConfig }): Promise<IcloudpdCommandResult>;
  cleanup(args: { config: IcloudpdConfig }): Promise<IcloudpdCleanupResult>;
}
